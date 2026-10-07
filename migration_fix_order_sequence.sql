-- ==============================================================================
-- IQBAL FASHION TAILORING CRM - SQL MIGRATION: FIX ORDER NUMBER SEQUENCE & CONSTRAINTS
-- 1. Resets order_no_seq to MAX(order_no) + 1 so new orders never collide with seed data.
-- 2. Makes create_order_with_stages collision-proof with a uniqueness check loop.
-- 3. Adds ON CONFLICT safety to get_or_create_customer & get_or_create_employee.
-- ==============================================================================

-- 1. Ensure sequence exists and synchronize it past any existing orders
CREATE SEQUENCE IF NOT EXISTS public.order_no_seq START WITH 101 INCREMENT BY 1;

DO $$
DECLARE
    v_max_num BIGINT;
BEGIN
    -- Extract the highest numerical part of any existing order_no (e.g. IF-000106 -> 106)
    SELECT COALESCE(MAX(NULLIF(regexp_replace(order_no, '[^0-9]', '', 'g'), '')::bigint), 100)
    INTO v_max_num
    FROM public.orders;

    -- Advance sequence past the highest number
    PERFORM setval('public.order_no_seq', GREATEST(v_max_num, 100) + 1, false);
    RAISE NOTICE 'order_no_seq synchronized to next value: %', GREATEST(v_max_num, 100) + 1;
END $$;

-- 2. Update get_or_create_customer to never crash on concurrency or duplicate keys
CREATE OR REPLACE FUNCTION public.get_or_create_customer(
    p_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_clean_name TEXT;
    v_customer_id UUID;
BEGIN
    v_clean_name := trim(p_name);
    IF v_clean_name = '' THEN
        RAISE EXCEPTION 'Customer name cannot be empty';
    END IF;

    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE lower(trim(name)) = lower(v_clean_name)
    LIMIT 1;

    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (name, phone, created_by)
        VALUES (v_clean_name, NULLIF(trim(p_phone), ''), p_user_id)
        ON CONFLICT (lower(trim(name))) DO UPDATE
        SET phone = COALESCE(NULLIF(trim(p_phone), ''), public.customers.phone)
        RETURNING id INTO v_customer_id;
    ELSE
        IF p_phone IS NOT NULL AND trim(p_phone) <> '' THEN
            UPDATE public.customers
            SET phone = trim(p_phone)
            WHERE id = v_customer_id AND (phone IS NULL OR phone = '');
        END IF;
    END IF;

    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update get_or_create_employee to never crash on duplicate keys
CREATE OR REPLACE FUNCTION public.get_or_create_employee(
    p_name TEXT,
    p_role TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_clean_name TEXT;
    v_employee_id UUID;
BEGIN
    v_clean_name := trim(p_name);
    IF v_clean_name = '' THEN
        v_clean_name := 'Master Tailor';
    END IF;

    SELECT id INTO v_employee_id
    FROM public.employees
    WHERE lower(trim(name)) = lower(v_clean_name)
    LIMIT 1;

    IF v_employee_id IS NULL THEN
        INSERT INTO public.employees (name, phone, roles, is_active)
        VALUES (
            v_clean_name,
            NULLIF(trim(p_phone), ''),
            CASE WHEN p_role IS NOT NULL THEN ARRAY[p_role] ELSE ARRAY['measurement']::text[] END,
            true
        )
        ON CONFLICT (lower(trim(name))) DO UPDATE
        SET is_active = true
        RETURNING id INTO v_employee_id;
    END IF;

    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Collision-Proof Atomic Order Creation RPC
CREATE OR REPLACE FUNCTION public.create_order_with_stages(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_garment_type TEXT,
    p_cloth_material TEXT,
    p_quantity INTEGER,
    p_notes TEXT,
    p_expected_delivery_date DATE,
    p_measurer_name TEXT,
    p_measurer_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_customer_id UUID;
    v_measurer_id UUID;
    v_order_id UUID;
    v_order_no TEXT;
    v_next_num BIGINT;
    v_measurer_snapshot TEXT;
BEGIN
    v_user_id := auth.uid();
    SELECT COALESCE(full_name, 'Staff') INTO v_user_name
    FROM public.profiles
    WHERE id = v_user_id;
    IF v_user_name IS NULL THEN v_user_name := 'Staff'; END IF;

    -- 1. Resolve or create customer safely
    v_customer_id := public.get_or_create_customer(p_customer_name, p_customer_phone, v_user_id);

    -- 2. Resolve or create measurer safely
    v_measurer_snapshot := trim(p_measurer_name);
    v_measurer_id := public.get_or_create_employee(v_measurer_snapshot, 'measurement', p_measurer_phone);

    -- 3. Collision-proof order_no generation (loops until guaranteed unused number found)
    LOOP
        v_next_num := nextval('public.order_no_seq');
        v_order_no := 'IF-' || LPAD(v_next_num::TEXT, 6, '0');
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.orders WHERE order_no = v_order_no);
    END LOOP;

    -- 4. Create Order
    INSERT INTO public.orders (
        order_no,
        customer_id,
        garment_type,
        cloth_material,
        quantity,
        notes,
        current_stage,
        status,
        expected_delivery_date,
        created_by
    ) VALUES (
        v_order_no,
        v_customer_id,
        trim(p_garment_type),
        NULLIF(trim(p_cloth_material), ''),
        COALESCE(p_quantity, 1),
        NULLIF(trim(p_notes), ''),
        'measurement',
        'in_progress',
        p_expected_delivery_date,
        v_user_id
    ) RETURNING id INTO v_order_id;

    -- 5. Auto-create all 7 stages in pipeline order
    INSERT INTO public.order_stages (
        order_id, stage, employee_id, employee_name_snapshot, status, started_at, completed_at, updated_by
    ) VALUES (
        v_order_id, 'measurement', v_measurer_id, v_measurer_snapshot, 'done', now(), now(), v_user_id
    );

    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'washing', 'pending');
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'cutting', 'pending');
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'stitching', 'pending');
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'finishing', 'pending');
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'ready', 'pending');
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'delivered', 'pending');

    -- 6. Log initial activities
    INSERT INTO public.order_history (order_id, stage, action, actor_id, actor_name, details)
    VALUES (
        v_order_id, 'measurement', 'created', v_user_id, v_user_name,
        jsonb_build_object(
            'order_no', v_order_no,
            'customer_name', trim(p_customer_name),
            'garment_type', trim(p_garment_type),
            'measured_by', v_measurer_snapshot
        )
    );

    INSERT INTO public.order_history (order_id, stage, action, employee_name, actor_id, actor_name, details)
    VALUES (
        v_order_id, 'measurement', 'completed', v_measurer_snapshot, v_user_id, v_user_name,
        jsonb_build_object('note', 'Measurement recorded upon order entry')
    );

    -- 7. Insert Notification
    INSERT INTO public.notifications (user_id, order_id, title, body, stage)
    VALUES (
        NULL,
        v_order_id,
        'New Order Created: ' || v_order_no,
        'Order ' || v_order_no || ' for ' || trim(p_customer_name) || ' (' || trim(p_garment_type) || ') measured by ' || v_measurer_snapshot || '.',
        'measurement'
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_no', v_order_no,
        'customer_id', v_customer_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
