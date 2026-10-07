-- ==============================================================================
-- IQBAL FASHION TAILORING CRM - DATABASE SCHEMA
-- Production Schema for Supabase PostgreSQL
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. SEQUENCES
CREATE SEQUENCE IF NOT EXISTS order_no_seq START WITH 101 INCREMENT BY 1;

-- 3. TABLES DEFINITION

-- PROFILES TABLE (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_name_lower_trim ON public.customers (lower(trim(name)));
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (name gin_trgm_ops);

-- EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    roles TEXT[] NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_name_lower_trim ON public.employees (lower(trim(name)));
CREATE INDEX IF NOT EXISTS idx_employees_roles ON public.employees USING gin (roles);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees (is_active);

-- ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no TEXT UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    garment_type TEXT NOT NULL,
    cloth_material TEXT,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    notes TEXT,
    current_stage TEXT NOT NULL DEFAULT 'measurement' CHECK (
        current_stage IN ('measurement', 'washing', 'cutting', 'stitching', 'finishing', 'ready', 'delivered')
    ),
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (
        status IN ('in_progress', 'ready', 'delivered', 'cancelled')
    ),
    expected_delivery_date DATE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    delivered_at TIMESTAMPTZ,
    delivered_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON public.orders (order_no);
CREATE INDEX IF NOT EXISTS idx_orders_current_stage ON public.orders (current_stage);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_expected_delivery ON public.orders (expected_delivery_date);

-- ORDER STAGES TABLE
CREATE TABLE IF NOT EXISTS public.order_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (
        stage IN ('measurement', 'washing', 'cutting', 'stitching', 'finishing', 'ready', 'delivered')
    ),
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    employee_name_snapshot TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'done', 'skipped')
    ),
    estimated_date DATE,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_order_stage UNIQUE (order_id, stage)
);
CREATE INDEX IF NOT EXISTS idx_order_stages_order_id ON public.order_stages (order_id);
CREATE INDEX IF NOT EXISTS idx_order_stages_stage ON public.order_stages (stage);
CREATE INDEX IF NOT EXISTS idx_order_stages_employee_id ON public.order_stages (employee_id);
CREATE INDEX IF NOT EXISTS idx_order_stages_status ON public.order_stages (status);

-- ORDER HISTORY (AUDIT LOG) TABLE
CREATE TABLE IF NOT EXISTS public.order_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    stage TEXT,
    action TEXT NOT NULL,
    employee_name TEXT,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON public.order_history (order_id);
CREATE INDEX IF NOT EXISTS idx_order_history_created_at ON public.order_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_history_stage ON public.order_history (stage);

-- PUSH SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT UNIQUE NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    platform TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON public.push_subscriptions (user_id);

-- NOTIFICATIONS TABLE (In-app center + audit of pushed events)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means broadcast
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    stage TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON public.notifications (order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- APP SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Default Settings Seed
INSERT INTO public.app_settings (key, value)
VALUES 
    ('shop_info', jsonb_build_object(
        'name', 'Iqbal Fashion',
        'tagline', 'Bespoke Tailoring & Fine Fabrics',
        'address', 'Main Bazar Road, Tailoring Hub',
        'phone', '+91 98765 43210'
    )),
    ('garment_types', jsonb_build_array(
        'Shirt', 'Pant', 'Suit (2-Piece)', 'Suit (3-Piece)', 
        'Kurta', 'Pyjama', 'Sherwani', 'Safari Suit', 
        'Waistcoat / Sadri', 'Blouse', 'Pathani Suit', 'Other'
    )),
    ('notification_preferences', jsonb_build_object(
        'order_created', true,
        'stage_assigned', true,
        'stage_completed', true,
        'order_ready', true,
        'order_delivered', true,
        'overdue_alerts', true
    ))
ON CONFLICT (key) DO NOTHING;

-- 4. HELPER FUNCTIONS & ATOMIC RPCS

-- Trigger helper to auto-create profile row on user sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'role', 'manager'),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger helper to keep updated_at in orders current
CREATE OR REPLACE FUNCTION public.update_orders_timestamp()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.update_orders_timestamp();

-- Atomically get or create Customer (case-insensitive trimmed match)
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
        RETURNING id INTO v_customer_id;
    ELSE
        -- Update phone if provided and currently empty
        IF p_phone IS NOT NULL AND trim(p_phone) <> '' THEN
            UPDATE public.customers
            SET phone = trim(p_phone)
            WHERE id = v_customer_id AND (phone IS NULL OR phone = '');
        END IF;
    END IF;

    RETURN v_customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atomically get or create Employee (case-insensitive trimmed match)
CREATE OR REPLACE FUNCTION public.get_or_create_employee(
    p_name TEXT,
    p_role TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_clean_name TEXT;
    v_clean_role TEXT;
    v_employee_id UUID;
    v_existing_roles TEXT[];
BEGIN
    v_clean_name := trim(p_name);
    IF v_clean_name = '' THEN
        RAISE EXCEPTION 'Employee name cannot be empty';
    END IF;

    v_clean_role := lower(trim(COALESCE(p_role, 'other')));

    SELECT id, roles INTO v_employee_id, v_existing_roles
    FROM public.employees
    WHERE lower(trim(name)) = lower(v_clean_name)
    LIMIT 1;

    IF v_employee_id IS NULL THEN
        INSERT INTO public.employees (name, phone, roles, is_active)
        VALUES (
            v_clean_name,
            NULLIF(trim(p_phone), ''),
            ARRAY[v_clean_role],
            true
        )
        RETURNING id INTO v_employee_id;
    ELSE
        -- Ensure role is added to employee roles array if not present
        IF v_clean_role IS NOT NULL AND NOT (v_clean_role = ANY(v_existing_roles)) THEN
            UPDATE public.employees
            SET roles = array_append(roles, v_clean_role)
            WHERE id = v_employee_id;
        END IF;
    END IF;

    RETURN v_employee_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ATOMIC ORDER CREATION RPC
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

    -- 1. Resolve or create customer
    v_customer_id := public.get_or_create_customer(p_customer_name, p_customer_phone, v_user_id);

    -- 2. Resolve or create measurer
    v_measurer_snapshot := trim(p_measurer_name);
    v_measurer_id := public.get_or_create_employee(v_measurer_snapshot, 'measurement', p_measurer_phone);

    -- 3. Generate human-friendly order_no (IF-000101)
    v_next_num := nextval('order_no_seq');
    v_order_no := 'IF-' || LPAD(v_next_num::TEXT, 6, '0');

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
    -- Stage 1: Measurement (marked Done)
    INSERT INTO public.order_stages (
        order_id, stage, employee_id, employee_name_snapshot, status, started_at, completed_at, updated_by
    ) VALUES (
        v_order_id, 'measurement', v_measurer_id, v_measurer_snapshot, 'done', now(), now(), v_user_id
    );

    -- Stage 2: Washing (marked Pending - optional)
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'washing', 'pending');
    -- Stage 3: Cutting (Pending)
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'cutting', 'pending');
    -- Stage 4: Stitching (Pending)
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'stitching', 'pending');
    -- Stage 5: Finishing (Pending)
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'finishing', 'pending');
    -- Stage 6: Ready (Pending)
    INSERT INTO public.order_stages (order_id, stage, status) VALUES (v_order_id, 'ready', 'pending');
    -- Stage 7: Delivered (Pending)
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
        NULL, -- Broadcast
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

-- ATOMIC STAGE PROGRESSION & ASSIGNMENT RPC
CREATE OR REPLACE FUNCTION public.update_order_stage(
    p_order_id UUID,
    p_stage TEXT,
    p_action TEXT, -- 'assign_and_start', 'complete', 'skip', 'reassign'
    p_employee_name TEXT DEFAULT NULL,
    p_estimated_date DATE DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_user_name TEXT;
    v_order RECORD;
    v_employee_id UUID;
    v_emp_clean_name TEXT;
    v_next_stage TEXT;
    v_stage_status TEXT;
    v_completed_time TIMESTAMPTZ;
    v_started_time TIMESTAMPTZ;
BEGIN
    v_user_id := auth.uid();
    
    -- Verify User Profile & Role
    SELECT role, full_name INTO v_user_role, v_user_name
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_user_role IS NULL THEN
        v_user_role := 'manager';
        v_user_name := 'Staff';
    END IF;

    -- Fetch Current Order
    SELECT o.*, c.name as customer_name
    INTO v_order
    FROM public.orders o
    JOIN public.customers c ON o.customer_id = c.id
    WHERE o.id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- Security Enforcement: Only Admin or Manager can mark Delivered
    IF p_stage = 'delivered' AND v_user_role NOT IN ('admin', 'manager') THEN
        RAISE EXCEPTION 'Permission denied: Only admin and manager can mark an order delivered';
    END IF;

    -- Resolve Employee if provided
    IF p_employee_name IS NOT NULL AND trim(p_employee_name) <> '' THEN
        v_emp_clean_name := trim(p_employee_name);
        v_employee_id := public.get_or_create_employee(v_emp_clean_name, p_stage);
    ELSE
        SELECT employee_id, employee_name_snapshot INTO v_employee_id, v_emp_clean_name
        FROM public.order_stages
        WHERE order_id = p_order_id AND stage = p_stage;
    END IF;

    -- Process Action
    IF p_action = 'assign_and_start' THEN
        v_stage_status := 'in_progress';
        v_started_time := now();
        v_completed_time := NULL;

        UPDATE public.order_stages
        SET employee_id = v_employee_id,
            employee_name_snapshot = v_emp_clean_name,
            status = 'in_progress',
            estimated_date = COALESCE(p_estimated_date, estimated_date),
            started_at = COALESCE(started_at, now()),
            notes = COALESCE(p_notes, notes),
            updated_by = v_user_id,
            updated_at = now()
        WHERE order_id = p_order_id AND stage = p_stage;

        UPDATE public.orders
        SET current_stage = p_stage,
            status = 'in_progress',
            updated_at = now()
        WHERE id = p_order_id;

        INSERT INTO public.order_history (order_id, stage, action, employee_name, actor_id, actor_name, details)
        VALUES (
            p_order_id, p_stage, 'started', v_emp_clean_name, v_user_id, v_user_name,
            jsonb_build_object('estimated_date', p_estimated_date, 'notes', p_notes)
        );

        INSERT INTO public.notifications (order_id, title, body, stage)
        VALUES (
            p_order_id,
            initcap(p_stage) || ' started',
            'Order ' || v_order.order_no || ' (' || v_order.customer_name || ', ' || v_order.garment_type || ') is now with ' || COALESCE(v_emp_clean_name, 'staff') || ' for ' || p_stage || '.',
            p_stage
        );

    ELSIF p_action = 'complete' THEN
        UPDATE public.order_stages
        SET status = 'done',
            completed_at = now(),
            notes = COALESCE(p_notes, notes),
            updated_by = v_user_id,
            updated_at = now()
        WHERE order_id = p_order_id AND stage = p_stage;

        -- Determine Next Stage in Pipeline:
        -- measurement -> (washing if not skipped) -> cutting -> stitching -> finishing -> ready -> delivered
        IF p_stage = 'measurement' THEN
            v_next_stage := 'cutting'; -- washing is optional, checked if active
        ELSIF p_stage = 'washing' THEN
            v_next_stage := 'cutting';
        ELSIF p_stage = 'cutting' THEN
            v_next_stage := 'stitching';
        ELSIF p_stage = 'stitching' THEN
            v_next_stage := 'finishing';
        ELSIF p_stage = 'finishing' THEN
            v_next_stage := 'ready';
        ELSIF p_stage = 'ready' THEN
            v_next_stage := 'delivered';
        ELSE
            v_next_stage := 'delivered';
        END IF;

        IF p_stage = 'ready' THEN
            -- Mark stage ready as done
            UPDATE public.orders
            SET current_stage = 'ready',
                status = 'ready',
                updated_at = now()
            WHERE id = p_order_id;

            INSERT INTO public.notifications (order_id, title, body, stage)
            VALUES (
                p_order_id,
                'Order Ready for Delivery',
                'Order ' || v_order.order_no || ' (' || v_order.customer_name || ', ' || v_order.garment_type || ') is finished and ready for pickup!',
                'ready'
            );
        ELSIF p_stage = 'delivered' THEN
            UPDATE public.orders
            SET current_stage = 'delivered',
                status = 'delivered',
                delivered_at = now(),
                delivered_by = v_user_id,
                updated_at = now()
            WHERE id = p_order_id;

            INSERT INTO public.notifications (order_id, title, body, stage)
            VALUES (
                p_order_id,
                'Order Delivered',
                'Order ' || v_order.order_no || ' (' || v_order.customer_name || ') has been marked as delivered by ' || v_user_name || '.',
                'delivered'
            );
        ELSE
            -- Normal middle stage completion
            UPDATE public.orders
            SET current_stage = v_next_stage,
                updated_at = now()
            WHERE id = p_order_id;

            INSERT INTO public.notifications (order_id, title, body, stage)
            VALUES (
                p_order_id,
                initcap(p_stage) || ' completed',
                'Order ' || v_order.order_no || ' (' || v_order.customer_name || ') finished ' || p_stage || '. Next step: ' || initcap(v_next_stage) || '.',
                p_stage
            );
        END IF;

        INSERT INTO public.order_history (order_id, stage, action, employee_name, actor_id, actor_name, details)
        VALUES (
            p_order_id, p_stage, 'completed', v_emp_clean_name, v_user_id, v_user_name,
            jsonb_build_object('notes', p_notes)
        );

    ELSIF p_action = 'skip' THEN
        -- Specifically for washing stage
        UPDATE public.order_stages
        SET status = 'skipped',
            completed_at = now(),
            notes = COALESCE(p_notes, 'Washing skipped'),
            updated_by = v_user_id,
            updated_at = now()
        WHERE order_id = p_order_id AND stage = p_stage;

        UPDATE public.orders
        SET current_stage = 'cutting',
            updated_at = now()
        WHERE id = p_order_id;

        INSERT INTO public.order_history (order_id, stage, action, actor_id, actor_name, details)
        VALUES (
            p_order_id, p_stage, 'skipped', v_user_id, v_user_name,
            jsonb_build_object('notes', p_notes)
        );

        INSERT INTO public.notifications (order_id, title, body, stage)
        VALUES (
            p_order_id,
            'Washing Skipped',
            'Order ' || v_order.order_no || ' skipped washing stage and is ready for cutting.',
            'washing'
        );

    ELSIF p_action = 'reassign' THEN
        UPDATE public.order_stages
        SET employee_id = v_employee_id,
            employee_name_snapshot = v_emp_clean_name,
            estimated_date = COALESCE(p_estimated_date, estimated_date),
            updated_by = v_user_id,
            updated_at = now()
        WHERE order_id = p_order_id AND stage = p_stage;

        INSERT INTO public.order_history (order_id, stage, action, employee_name, actor_id, actor_name, details)
        VALUES (
            p_order_id, p_stage, 'reassigned', v_emp_clean_name, v_user_id, v_user_name,
            jsonb_build_object('new_employee', v_emp_clean_name, 'notes', p_notes)
        );

        INSERT INTO public.notifications (order_id, title, body, stage)
        VALUES (
            p_order_id,
            initcap(p_stage) || ' reassigned',
            'Order ' || v_order.order_no || ' ' || p_stage || ' reassigned to ' || v_emp_clean_name || '.',
            p_stage
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'stage', p_stage,
        'action', p_action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Active Authenticated users can view; Only admins can modify
CREATE POLICY "Profiles viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Profiles modifiable by admins or own profile"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        auth.uid() = id OR
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
    );

-- Customers: Authenticated users can select, insert, update. Only admin can delete.
CREATE POLICY "Customers viewable by authenticated users"
    ON public.customers FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Customers insertable by authenticated users"
    ON public.customers FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Customers updatable by authenticated users"
    ON public.customers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Customers deletable by admin only"
    ON public.customers FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
    );

-- Employees: Authenticated users can select, insert, update. Only admin can delete.
CREATE POLICY "Employees viewable by authenticated users"
    ON public.employees FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Employees insertable by authenticated users"
    ON public.employees FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Employees updatable by authenticated users"
    ON public.employees FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Employees deletable by admin only"
    ON public.employees FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
    );

-- Orders: Authenticated users can view, insert, update. Admin can delete.
CREATE POLICY "Orders viewable by authenticated users"
    ON public.orders FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Orders insertable by authenticated users"
    ON public.orders FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Orders updatable by authenticated users"
    ON public.orders FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Orders deletable by admin only"
    ON public.orders FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
    );

-- Order Stages: Authenticated users can view, insert, update.
CREATE POLICY "Order stages viewable by authenticated users"
    ON public.order_stages FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Order stages insertable by authenticated users"
    ON public.order_stages FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Order stages updatable by authenticated users"
    ON public.order_stages FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Order stages deletable by admin only"
    ON public.order_stages FOR DELETE
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
    );

-- Order History: Read-only for authenticated users. Insert via triggers/functions.
CREATE POLICY "Order history viewable by authenticated users"
    ON public.order_history FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Order history insertable by authenticated users"
    ON public.order_history FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Push Subscriptions: Users manage only their own subscriptions
CREATE POLICY "Push subscriptions viewable by owner"
    ON public.push_subscriptions FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Push subscriptions insertable by owner"
    ON public.push_subscriptions FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Push subscriptions updatable by owner"
    ON public.push_subscriptions FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Push subscriptions deletable by owner"
    ON public.push_subscriptions FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Notifications: Authenticated users can read and mark read
CREATE POLICY "Notifications viewable by authenticated users"
    ON public.notifications FOR SELECT
    TO authenticated
    USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Notifications updatable by authenticated users"
    ON public.notifications FOR UPDATE
    TO authenticated
    USING (user_id IS NULL OR user_id = auth.uid())
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Notifications insertable by authenticated users"
    ON public.notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- App Settings: Read for authenticated; modify by admin only
CREATE POLICY "App settings viewable by authenticated users"
    ON public.app_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "App settings modifiable by admins"
    ON public.app_settings FOR ALL
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true)
    );

-- 6. REALTIME REPLICATION SETUP
DO $$
BEGIN
    -- Configure replica identity to FULL for realtime payloads
    ALTER TABLE public.orders REPLICA IDENTITY FULL;
    ALTER TABLE public.order_stages REPLICA IDENTITY FULL;
    ALTER TABLE public.order_history REPLICA IDENTITY FULL;
    ALTER TABLE public.customers REPLICA IDENTITY FULL;
    ALTER TABLE public.employees REPLICA IDENTITY FULL;
    ALTER TABLE public.notifications REPLICA IDENTITY FULL;

    -- Add tables to supabase_realtime publication if not already added
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_stages;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.order_history;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
    EXCEPTION WHEN duplicate_object THEN END;

    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN END;
END $$;


-- 7. SEED & DEMO DATA
-- Clear existing demo records cleanly if needed, or insert idempotently.

-- 7.1 Seed Employees (6 employees across tailoring roles)
INSERT INTO public.employees (id, name, phone, roles, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Rashid Tailor', '+91 98201 11223', ARRAY['cutting', 'stitching'], true),
    ('11111111-1111-1111-1111-111111111102', 'Farhan Master', '+91 98202 22334', ARRAY['measurement', 'cutting'], true),
    ('11111111-1111-1111-1111-111111111103', 'Imran Ansari', '+91 98203 33445', ARRAY['stitching'], true),
    ('11111111-1111-1111-1111-111111111104', 'Suhail Ahmed', '+91 98204 44556', ARRAY['washing'], true),
    ('11111111-1111-1111-1111-111111111105', 'Tariq Khan', '+91 98205 55667', ARRAY['finishing'], true),
    ('11111111-1111-1111-1111-111111111106', 'Zubair Qureshi', '+91 98206 66778', ARRAY['measurement', 'finishing'], true)
ON CONFLICT (id) DO NOTHING;

-- 7.2 Seed Customers (5 customers)
INSERT INTO public.customers (id, name, phone, notes)
VALUES
    ('22222222-2222-2222-2222-222222222201', 'Mohammad Rizwan', '+91 99301 10001', 'Prefers slim collar on shirts'),
    ('22222222-2222-2222-2222-222222222202', 'Abdul Karim', '+91 99302 20002', 'Regular wedding client'),
    ('22222222-2222-2222-2222-222222222203', 'Salman Siddiqui', '+91 99303 30003', 'Loose fit kurta preference'),
    ('22222222-2222-2222-2222-222222222204', 'Faizan Sheikh', '+91 99304 40004', 'Double-cuffed formal shirts'),
    ('22222222-2222-2222-2222-222222222205', 'Arif Patel', '+91 99305 50005', 'Formal blazer fitting')
ON CONFLICT (id) DO NOTHING;

-- 7.3 Seed Orders (6 orders at different stages across the pipeline)

-- Order 1: Measurement just completed, waiting for cutting (Washing skipped)
INSERT INTO public.orders (
    id, order_no, customer_id, garment_type, cloth_material, quantity, notes,
    current_stage, status, expected_delivery_date, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333301', 'IF-000101', '22222222-2222-2222-2222-222222222201',
    'Shirt', 'Egyptian Giza Cotton (White)', 2, 'French cuffs, contrast mother-of-pearl buttons',
    'cutting', 'in_progress', CURRENT_DATE + INTERVAL '5 days',
    now() - INTERVAL '2 days', now() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_stages (order_id, stage, employee_id, employee_name_snapshot, status, started_at, completed_at)
VALUES
    ('33333333-3333-3333-3333-333333333301', 'measurement', '11111111-1111-1111-1111-111111111102', 'Farhan Master', 'done', now() - INTERVAL '2 days', now() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333301', 'washing', NULL, NULL, 'skipped', now() - INTERVAL '1 day', now() - INTERVAL '1 day'),
    ('33333333-3333-3333-3333-333333333301', 'cutting', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333301', 'stitching', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333301', 'finishing', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333301', 'ready', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333301', 'delivered', NULL, NULL, 'pending', NULL, NULL)
ON CONFLICT (order_id, stage) DO NOTHING;

-- Order 2: In Washing stage
INSERT INTO public.orders (
    id, order_no, customer_id, garment_type, cloth_material, quantity, notes,
    current_stage, status, expected_delivery_date, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333302', 'IF-000102', '22222222-2222-2222-2222-222222222202',
    'Kurta', 'Pure Linen (Sky Blue)', 1, 'Pre-wash required to prevent shrinking',
    'washing', 'in_progress', CURRENT_DATE + INTERVAL '6 days',
    now() - INTERVAL '1 day', now() - INTERVAL '4 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_stages (order_id, stage, employee_id, employee_name_snapshot, status, started_at, completed_at)
VALUES
    ('33333333-3333-3333-3333-333333333302', 'measurement', '11111111-1111-1111-1111-111111111106', 'Zubair Qureshi', 'done', now() - INTERVAL '1 day', now() - INTERVAL '1 day'),
    ('33333333-3333-3333-3333-333333333302', 'washing', '11111111-1111-1111-1111-111111111104', 'Suhail Ahmed', 'in_progress', now() - INTERVAL '4 hours', NULL),
    ('33333333-3333-3333-3333-333333333302', 'cutting', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333302', 'stitching', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333302', 'finishing', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333302', 'ready', NULL, NULL, 'pending', NULL, NULL),
    ('33333333-3333-3333-3333-333333333302', 'delivered', NULL, NULL, 'pending', NULL, NULL)
ON CONFLICT (order_id, stage) DO NOTHING;

-- Order 3: In Cutting stage with estimated date
INSERT INTO public.orders (
    id, order_no, customer_id, garment_type, cloth_material, quantity, notes,
    current_stage, status, expected_delivery_date, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333303', 'IF-000103', '22222222-2222-2222-2222-222222222203',
    'Suit (2-Piece)', 'Italian Merino Wool (Charcoal Grey)', 1, 'Double vent, peak lapel',
    'cutting', 'in_progress', CURRENT_DATE + INTERVAL '4 days',
    now() - INTERVAL '3 days', now() - INTERVAL '10 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_stages (order_id, stage, employee_id, employee_name_snapshot, status, estimated_date, started_at, completed_at)
VALUES
    ('33333333-3333-3333-3333-333333333303', 'measurement', '11111111-1111-1111-1111-111111111102', 'Farhan Master', 'done', NULL, now() - INTERVAL '3 days', now() - INTERVAL '3 days'),
    ('33333333-3333-3333-3333-333333333303', 'washing', NULL, NULL, 'skipped', NULL, now() - INTERVAL '2 days', now() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333303', 'cutting', '11111111-1111-1111-1111-111111111101', 'Rashid Tailor', 'in_progress', CURRENT_DATE + INTERVAL '1 day', now() - INTERVAL '10 hours', NULL),
    ('33333333-3333-3333-3333-333333333303', 'stitching', NULL, NULL, 'pending', NULL, NULL, NULL),
    ('33333333-3333-3333-3333-333333333303', 'finishing', NULL, NULL, 'pending', NULL, NULL, NULL),
    ('33333333-3333-3333-3333-333333333303', 'ready', NULL, NULL, 'pending', NULL, NULL, NULL),
    ('33333333-3333-3333-3333-333333333303', 'delivered', NULL, NULL, 'pending', NULL, NULL, NULL)
ON CONFLICT (order_id, stage) DO NOTHING;

-- Order 4: In Stitching stage
INSERT INTO public.orders (
    id, order_no, customer_id, garment_type, cloth_material, quantity, notes,
    current_stage, status, expected_delivery_date, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333304', 'IF-000104', '22222222-2222-2222-2222-222222222204',
    'Sherwani', 'Raw Silk with Zari Embroidery', 1, 'Royal wedding sherwani, hand embroidery collar',
    'stitching', 'in_progress', CURRENT_DATE + INTERVAL '3 days',
    now() - INTERVAL '5 days', now() - INTERVAL '6 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_stages (order_id, stage, employee_id, employee_name_snapshot, status, estimated_date, started_at, completed_at)
VALUES
    ('33333333-3333-3333-3333-333333333304', 'measurement', '11111111-1111-1111-1111-111111111102', 'Farhan Master', 'done', NULL, now() - INTERVAL '5 days', now() - INTERVAL '5 days'),
    ('33333333-3333-3333-3333-333333333304', 'washing', NULL, NULL, 'skipped', NULL, now() - INTERVAL '4 days', now() - INTERVAL '4 days'),
    ('33333333-3333-3333-3333-333333333304', 'cutting', '11111111-1111-1111-1111-111111111101', 'Rashid Tailor', 'done', CURRENT_DATE - INTERVAL '1 day', now() - INTERVAL '4 days', now() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333304', 'stitching', '11111111-1111-1111-1111-111111111103', 'Imran Ansari', 'in_progress', CURRENT_DATE + INTERVAL '2 days', now() - INTERVAL '2 days', NULL),
    ('33333333-3333-3333-3333-333333333304', 'finishing', NULL, NULL, 'pending', NULL, NULL, NULL),
    ('33333333-3333-3333-3333-333333333304', 'ready', NULL, NULL, 'pending', NULL, NULL, NULL),
    ('33333333-3333-3333-3333-333333333304', 'delivered', NULL, NULL, 'pending', NULL, NULL, NULL)
ON CONFLICT (order_id, stage) DO NOTHING;

-- Order 5: Ready for Delivery
INSERT INTO public.orders (
    id, order_no, customer_id, garment_type, cloth_material, quantity, notes,
    current_stage, status, expected_delivery_date, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333305', 'IF-000105', '22222222-2222-2222-2222-222222222205',
    'Pant', 'Raymond Poly-Viscose (Black)', 2, 'Formal trousers, hook bar fastener',
    'ready', 'ready', CURRENT_DATE,
    now() - INTERVAL '4 days', now() - INTERVAL '1 hour'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_stages (order_id, stage, employee_id, employee_name_snapshot, status, started_at, completed_at)
VALUES
    ('33333333-3333-3333-3333-333333333305', 'measurement', '11111111-1111-1111-1111-111111111106', 'Zubair Qureshi', 'done', now() - INTERVAL '4 days', now() - INTERVAL '4 days'),
    ('33333333-3333-3333-3333-333333333305', 'washing', NULL, NULL, 'skipped', now() - INTERVAL '3 days', now() - INTERVAL '3 days'),
    ('33333333-3333-3333-3333-333333333305', 'cutting', '11111111-1111-1111-1111-111111111102', 'Farhan Master', 'done', now() - INTERVAL '3 days', now() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333305', 'stitching', '11111111-1111-1111-1111-111111111101', 'Rashid Tailor', 'done', now() - INTERVAL '2 days', now() - INTERVAL '1 day'),
    ('33333333-3333-3333-3333-333333333305', 'finishing', '11111111-1111-1111-1111-111111111105', 'Tariq Khan', 'done', now() - INTERVAL '1 day', now() - INTERVAL '1 hour'),
    ('33333333-3333-3333-3333-333333333305', 'ready', NULL, NULL, 'done', now() - INTERVAL '1 hour', now() - INTERVAL '1 hour'),
    ('33333333-3333-3333-3333-333333333305', 'delivered', NULL, NULL, 'pending', NULL, NULL)
ON CONFLICT (order_id, stage) DO NOTHING;

-- Order 6: Delivered
INSERT INTO public.orders (
    id, order_no, customer_id, garment_type, cloth_material, quantity, notes,
    current_stage, status, expected_delivery_date, delivered_at, created_at, updated_at
) VALUES (
    '33333333-3333-3333-3333-333333333306', 'IF-000106', '22222222-2222-2222-2222-222222222201',
    'Safari Suit', 'Tropical Khaki Blend', 1, 'Pocket flaps, side vents',
    'delivered', 'delivered', CURRENT_DATE - INTERVAL '1 day', now() - INTERVAL '3 hours',
    now() - INTERVAL '7 days', now() - INTERVAL '3 hours'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.order_stages (order_id, stage, employee_id, employee_name_snapshot, status, started_at, completed_at)
VALUES
    ('33333333-3333-3333-3333-333333333306', 'measurement', '11111111-1111-1111-1111-111111111102', 'Farhan Master', 'done', now() - INTERVAL '7 days', now() - INTERVAL '7 days'),
    ('33333333-3333-3333-3333-333333333306', 'washing', NULL, NULL, 'skipped', now() - INTERVAL '6 days', now() - INTERVAL '6 days'),
    ('33333333-3333-3333-3333-333333333306', 'cutting', '11111111-1111-1111-1111-111111111101', 'Rashid Tailor', 'done', now() - INTERVAL '6 days', now() - INTERVAL '5 days'),
    ('33333333-3333-3333-3333-333333333306', 'stitching', '11111111-1111-1111-1111-111111111103', 'Imran Ansari', 'done', now() - INTERVAL '5 days', now() - INTERVAL '2 days'),
    ('33333333-3333-3333-3333-333333333306', 'finishing', '11111111-1111-1111-1111-111111111105', 'Tariq Khan', 'done', now() - INTERVAL '2 days', now() - INTERVAL '1 day'),
    ('33333333-3333-3333-3333-333333333306', 'ready', NULL, NULL, 'done', now() - INTERVAL '1 day', now() - INTERVAL '1 day'),
    ('33333333-3333-3333-3333-333333333306', 'delivered', NULL, NULL, 'done', now() - INTERVAL '3 hours', now() - INTERVAL '3 hours')
ON CONFLICT (order_id, stage) DO NOTHING;

-- Seed Sample Notifications
INSERT INTO public.notifications (order_id, title, body, stage, is_read, created_at)
VALUES
    ('33333333-3333-3333-3333-333333333305', 'Order Ready for Delivery', 'Order IF-000105 (Arif Patel, Pant) is finished and ready for pickup!', 'ready', false, now() - INTERVAL '1 hour'),
    ('33333333-3333-3333-3333-333333333306', 'Order Delivered', 'Order IF-000106 (Mohammad Rizwan) has been delivered.', 'delivered', true, now() - INTERVAL '3 hours'),
    ('33333333-3333-3333-3333-333333333304', 'Stitching started', 'Order IF-000104 (Faizan Sheikh, Sherwani) is now with Imran Ansari for stitching.', 'stitching', false, now() - INTERVAL '6 hours')
ON CONFLICT DO NOTHING;

-- Seed Sample History
INSERT INTO public.order_history (order_id, stage, action, employee_name, actor_name, details, created_at)
VALUES
    ('33333333-3333-3333-3333-333333333305', 'finishing', 'completed', 'Tariq Khan', 'Admin', '{"notes": "Pressed and quality checked"}'::jsonb, now() - INTERVAL '1 hour'),
    ('33333333-3333-3333-3333-333333333305', 'ready', 'completed', NULL, 'Admin', '{"status": "ready"}'::jsonb, now() - INTERVAL '1 hour'),
    ('33333333-3333-3333-3333-333333333306', 'delivered', 'completed', NULL, 'Admin', '{"delivered_to": "Customer pickup"}'::jsonb, now() - INTERVAL '3 hours'),
    ('33333333-3333-3333-3333-333333333304', 'stitching', 'started', 'Imran Ansari', 'Admin', '{"estimated_date": "In 2 days"}'::jsonb, now() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- 8. INITIAL ADMIN SETUP INSTRUCTIONS (FOR SUPABASE SQL EDITOR)
/*
To designate the first admin user after signing up via login.html or Supabase Auth:

1. Sign up a user in Supabase Auth or through login.html.
2. In Supabase SQL Editor, run:

UPDATE public.profiles
SET role = 'admin',
    full_name = 'Iqbal Admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ctgroupteam@gmail.com');

3. Verify:
SELECT * FROM public.profiles WHERE role = 'admin';
*/
