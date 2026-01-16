-- ============================================================================
-- SUPABASE GROUP CHAT SYSTEM - COMPLETE SQL SCRIPT
-- ============================================================================
-- Bu script Supabase SQL Editor'a yapıştırılarak çalıştırılabilir.
-- Tüm tablolar, indexler, helper fonksiyonlar, RLS politikaları ve RPC'ler dahil.
-- ============================================================================

-- ============================================================================
-- A) TABLOLAR
-- ============================================================================

-- 1) GROUPS tablosu
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ DEFAULT NULL -- soft delete
);

-- 2) GROUP_MEMBERS tablosu
CREATE TABLE IF NOT EXISTS public.group_members (
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    removed_at TIMESTAMPTZ DEFAULT NULL, -- soft delete for membership
    PRIMARY KEY (group_id, user_id)
);

-- 3) GROUP_MESSAGES tablosu
CREATE TABLE IF NOT EXISTS public.group_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- B) INDEX'LER
-- ============================================================================

-- Üyelik sorguları için
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_active ON public.group_members(group_id, user_id) 
    WHERE removed_at IS NULL;

-- Mesaj sorguları için
CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON public.group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON public.group_messages(group_id, created_at DESC);

-- Soft delete filtresi için
CREATE INDEX IF NOT EXISTS idx_groups_active ON public.groups(id) WHERE deleted_at IS NULL;

-- ============================================================================
-- C) HELPER FUNCTION: is_group_member
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.group_members gm
        INNER JOIN public.groups g ON g.id = gm.group_id
        WHERE gm.group_id = p_group_id
          AND gm.user_id = p_user_id
          AND gm.removed_at IS NULL
          AND g.deleted_at IS NULL
    );
$$;

-- Helper: Kullanıcı owner veya admin mi?
CREATE OR REPLACE FUNCTION public.is_group_admin(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.group_members gm
        INNER JOIN public.groups g ON g.id = gm.group_id
        WHERE gm.group_id = p_group_id
          AND gm.user_id = p_user_id
          AND gm.role IN ('owner', 'admin')
          AND gm.removed_at IS NULL
          AND g.deleted_at IS NULL
    );
$$;

-- ============================================================================
-- D) RLS POLİCY'LER
-- ============================================================================

-- Önce RLS'i etkinleştir
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Mevcut policy'leri temizle (idempotent)
DROP POLICY IF EXISTS "groups_select_members_only" ON public.groups;
DROP POLICY IF EXISTS "groups_insert_self" ON public.groups;
DROP POLICY IF EXISTS "groups_update_admin_only" ON public.groups;
DROP POLICY IF EXISTS "group_members_select_members_only" ON public.group_members;
DROP POLICY IF EXISTS "group_members_insert_admin_only" ON public.group_members;
DROP POLICY IF EXISTS "group_members_update_admin_only" ON public.group_members;
DROP POLICY IF EXISTS "group_messages_select_members_only" ON public.group_messages;
DROP POLICY IF EXISTS "group_messages_insert_members_only" ON public.group_messages;

-- =========================
-- GROUPS POLICIES
-- =========================

-- SELECT: Sadece üyeler görebilir + deleted_at NULL
CREATE POLICY "groups_select_members_only" ON public.groups
    FOR SELECT
    USING (
        deleted_at IS NULL
        AND public.is_group_member(id, auth.uid())
    );

-- INSERT: Sadece kendi oluşturduğu (created_by = auth.uid())
-- Not: RPC üzerinden yapılacak, ama direkt insert için de policy
CREATE POLICY "groups_insert_self" ON public.groups
    FOR INSERT
    WITH CHECK (created_by = auth.uid());

-- UPDATE: Sadece owner/admin (soft delete için)
CREATE POLICY "groups_update_admin_only" ON public.groups
    FOR UPDATE
    USING (public.is_group_admin(id, auth.uid()))
    WITH CHECK (public.is_group_admin(id, auth.uid()));

-- =========================
-- GROUP_MEMBERS POLICIES
-- =========================

-- SELECT: Sadece aynı grubun üyeleri görebilir
CREATE POLICY "group_members_select_members_only" ON public.group_members
    FOR SELECT
    USING (
        removed_at IS NULL
        AND public.is_group_member(group_id, auth.uid())
    );

-- INSERT: Sadece owner/admin ekleyebilir
CREATE POLICY "group_members_insert_admin_only" ON public.group_members
    FOR INSERT
    WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- UPDATE: Sadece owner/admin güncelleyebilir (removed_at set etmek için)
CREATE POLICY "group_members_update_admin_only" ON public.group_members
    FOR UPDATE
    USING (public.is_group_admin(group_id, auth.uid()))
    WITH CHECK (public.is_group_admin(group_id, auth.uid()));

-- =========================
-- GROUP_MESSAGES POLICIES
-- =========================

-- SELECT: Sadece üyeler okuyabilir
CREATE POLICY "group_messages_select_members_only" ON public.group_messages
    FOR SELECT
    USING (public.is_group_member(group_id, auth.uid()));

-- INSERT: Sadece üyeler yazabilir ve sadece kendi adına
CREATE POLICY "group_messages_insert_members_only" ON public.group_messages
    FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND public.is_group_member(group_id, auth.uid())
    );

-- ============================================================================
-- E) RPC FONKSİYONLARI
-- ============================================================================

-- 1) CREATE_GROUP: Yeni grup oluştur
CREATE OR REPLACE FUNCTION public.create_group(p_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_group_id UUID;
BEGIN
    -- Auth kontrolü
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Grup oluştur
    INSERT INTO public.groups (name, created_by)
    VALUES (p_name, v_user_id)
    RETURNING id INTO v_group_id;
    
    -- Oluşturanı owner olarak ekle
    INSERT INTO public.group_members (group_id, user_id, role)
    VALUES (v_group_id, v_user_id, 'owner');
    
    RETURN v_group_id;
END;
$$;

-- 2) ADD_MEMBER: Gruba üye ekle
CREATE OR REPLACE FUNCTION public.add_member(
    p_group_id UUID,
    p_new_user_id UUID,
    p_role TEXT DEFAULT 'member'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Auth kontrolü
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Admin/owner kontrolü
    IF NOT public.is_group_admin(p_group_id, v_user_id) THEN
        RAISE EXCEPTION 'Only owner or admin can add members';
    END IF;
    
    -- Role validasyonu
    IF p_role NOT IN ('admin', 'member') THEN
        RAISE EXCEPTION 'Invalid role. Use admin or member';
    END IF;
    
    -- Upsert: Eğer daha önce çıkarılmışsa tekrar ekle
    INSERT INTO public.group_members (group_id, user_id, role, joined_at, removed_at)
    VALUES (p_group_id, p_new_user_id, p_role, now(), NULL)
    ON CONFLICT (group_id, user_id) 
    DO UPDATE SET 
        role = EXCLUDED.role,
        removed_at = NULL,
        joined_at = now();
END;
$$;

-- 3) REMOVE_MEMBER: Üyeyi gruptan çıkar (soft delete)
CREATE OR REPLACE FUNCTION public.remove_member(
    p_group_id UUID,
    p_target_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_target_role TEXT;
BEGIN
    -- Auth kontrolü
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Admin/owner kontrolü
    IF NOT public.is_group_admin(p_group_id, v_user_id) THEN
        RAISE EXCEPTION 'Only owner or admin can remove members';
    END IF;
    
    -- Owner kendini çıkaramaz (grup silmeli)
    SELECT role INTO v_target_role
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_target_user_id AND removed_at IS NULL;
    
    IF v_target_role = 'owner' THEN
        RAISE EXCEPTION 'Cannot remove owner. Delete the group instead.';
    END IF;
    
    -- Soft delete
    UPDATE public.group_members
    SET removed_at = now()
    WHERE group_id = p_group_id 
      AND user_id = p_target_user_id 
      AND removed_at IS NULL;
END;
$$;

-- 4) DELETE_GROUP: Grubu sil (soft delete)
CREATE OR REPLACE FUNCTION public.delete_group(p_group_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Auth kontrolü
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Admin/owner kontrolü
    IF NOT public.is_group_admin(p_group_id, v_user_id) THEN
        RAISE EXCEPTION 'Only owner or admin can delete group';
    END IF;
    
    -- Grup soft delete
    UPDATE public.groups
    SET deleted_at = now()
    WHERE id = p_group_id AND deleted_at IS NULL;
    
    -- Tüm üyelikleri soft delete
    UPDATE public.group_members
    SET removed_at = now()
    WHERE group_id = p_group_id AND removed_at IS NULL;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Authenticated kullanıcılar için izinler
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.groups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.group_members TO authenticated;
GRANT SELECT, INSERT ON public.group_messages TO authenticated;

-- RPC fonksiyonları için izinler
GRANT EXECUTE ON FUNCTION public.create_group(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_member(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_group(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_group_admin(UUID, UUID) TO authenticated;

-- ============================================================================
-- TAMAMLANDI!
-- ============================================================================
-- Bu script çalıştırıldıktan sonra:
-- 1) Gruplar sadece üyelere görünür
-- 2) Mesajlar sadece üyelere görünür ve yazılabilir
-- 3) Üye ekleme/çıkarma sadece owner/admin yapabilir
-- 4) Silinen gruplar ve üyelikler geri gelmez (soft delete)
-- ============================================================================
