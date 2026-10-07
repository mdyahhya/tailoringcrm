-- ==============================================================================
-- IQBAL FASHION TAILORING CRM - NEW SQL MIGRATION
-- Admin Setup: No Email Confirmation, Direct Preset Password & Reset Helper
-- Credentials configured:
--   Email / ID: admin@iqbal.com (also supports login as 'admin@iqbal')
--   Password  : admin123
-- ==============================================================================

-- 1. Ensure required cryptographic extension is active
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create or Update the Administrator Account in Supabase Auth (Pre-Confirmed)
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@iqbal.com';
    v_password TEXT := 'admin123';
BEGIN
    -- Check if admin user already exists with this email or previous email
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE lower(email) IN ('admin@iqbal.com', 'admin@iqbal', 'ctgroupteam@gmail.com')
    LIMIT 1;

    IF v_user_id IS NULL THEN
        -- Generate new UUID for the admin user
        v_user_id := gen_random_uuid();

        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            confirmation_token,
            recovery_token,
            email_change_token_new,
            email_change
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'authenticated',
            'authenticated',
            v_email,
            crypt(v_password, gen_salt('bf')),
            now(), -- Pre-confirmed, bypasses email verification
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Iqbal Admin","role":"admin"}'::jsonb,
            false,
            now(),
            now(),
            '',
            '',
            '',
            ''
        );
    ELSE
        -- Update existing user with the new email and password
        UPDATE auth.users
        SET email = v_email,
            encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            raw_app_meta_data = '{"provider":"email","providers":["email"]}'::jsonb,
            raw_user_meta_data = '{"full_name":"Iqbal Admin","role":"admin"}'::jsonb,
            updated_at = now()
        WHERE id = v_user_id;
    END IF;

    -- Ensure matching profile exists with admin role
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (v_user_id, 'Iqbal Admin', 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        full_name = 'Iqbal Admin',
        is_active = true;

    RAISE NOTICE 'Admin user successfully configured with ID: % and email: %', v_user_id, v_email;
END $$;

-- 3. HELPER FUNCTION: Easily change Admin Email & Password directly from Supabase SQL anytime
-- Usage: SELECT public.set_admin_credentials('your_new_email@domain.com', 'your_new_password');
CREATE OR REPLACE FUNCTION public.set_admin_credentials(
    p_new_email TEXT,
    p_new_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_clean_email TEXT;
BEGIN
    v_clean_email := lower(trim(p_new_email));
    IF NOT (v_clean_email LIKE '%@%') THEN
        v_clean_email := v_clean_email || '@iqbal.com';
    END IF;

    -- Find the active admin user
    SELECT p.id INTO v_user_id
    FROM public.profiles p
    WHERE p.role = 'admin'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No user found in the database to update.';
    END IF;

    -- Update auth.users with the new credentials & pre-confirm email
    UPDATE auth.users
    SET email = v_clean_email,
        encrypted_password = crypt(p_new_password, gen_salt('bf')),
        email_confirmed_at = now(),
        updated_at = now()
    WHERE id = v_user_id;

    -- Update profile
    UPDATE public.profiles
    SET role = 'admin',
        is_active = true
    WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Admin credentials updated successfully without needing email confirmation.',
        'email', v_clean_email
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Automatically keep public.profiles synchronized whenever admin email is changed in Supabase Auth
CREATE OR REPLACE FUNCTION public.sync_admin_profile_role()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'Iqbal Admin'), 'admin', true)
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        is_active = true;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_admin_role ON auth.users;
CREATE TRIGGER trg_sync_admin_role
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.sync_admin_profile_role();
