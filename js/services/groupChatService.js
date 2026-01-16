import { supabase } from "../config/supabaseClient.js";

// ============================================================================
// F) FRONTEND SUPABASE JS SORGULARI
// ============================================================================

/**
 * 1) GRUP LİSTESİ: Kullanıcının üye olduğu ve silinmemiş gruplar
 * RLS otomatik olarak sadece üye olunan grupları döndürür
 */
async function getMyGroups() {
    const { data, error } = await supabase
        .from('groups')
        .select(`
      id,
      name,
      created_at,
      created_by,
      group_members!inner (
        role,
        joined_at
      )
    `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching groups:', error);
        return [];
    }

    return data;
}

/**
 * 2) MESAJ LİSTELEME: Bir gruptaki mesajlar (sadece üye görür)
 * RLS otomatik olarak üye değilse hata döndürür
 */
async function getGroupMessages(groupId, limit = 50) {
    const { data, error } = await supabase
        .from('group_messages')
        .select(`
      id,
      body,
      created_at,
      sender_id,
      sender:auth.users!sender_id (
        email,
        raw_user_meta_data
      )
    `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data;
}

/**
 * 3) MESAJ GÖNDERME: Gruba mesaj at (sadece üye yazabilir)
 */
async function sendMessage(groupId, messageBody) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
        .from('group_messages')
        .insert({
            group_id: groupId,
            sender_id: user.id,
            body: messageBody
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        throw error;
    }

    return data;
}

/**
 * 4) GRUP OLUŞTURMA: RPC ile yeni grup oluştur
 */
async function createGroup(groupName) {
    const { data, error } = await supabase
        .rpc('create_group', { p_name: groupName });

    if (error) {
        console.error('Error creating group:', error);
        throw error;
    }

    // data = yeni grubun UUID'si
    return data;
}

/**
 * 5) ÜYE EKLEME: RPC ile gruba üye ekle (sadece owner/admin)
 */
async function addMember(groupId, newUserId, role = 'member') {
    const { error } = await supabase
        .rpc('add_member', {
            p_group_id: groupId,
            p_new_user_id: newUserId,
            p_role: role
        });

    if (error) {
        console.error('Error adding member:', error);
        throw error;
    }

    return true;
}

/**
 * 6) ÜYE ÇIKARMA: RPC ile üyeyi gruptan çıkar (sadece owner/admin)
 */
async function removeMember(groupId, targetUserId) {
    const { error } = await supabase
        .rpc('remove_member', {
            p_group_id: groupId,
            p_target_user_id: targetUserId
        });

    if (error) {
        console.error('Error removing member:', error);
        throw error;
    }

    return true;
}

/**
 * 7) GRUP SİLME: RPC ile grubu sil (sadece owner/admin)
 */
async function deleteGroup(groupId) {
    const { error } = await supabase
        .rpc('delete_group', { p_group_id: groupId });

    if (error) {
        console.error('Error deleting group:', error);
        throw error;
    }

    return true;
}

/**
 * 8) GRUP ÜYELERİNİ LİSTELE: Bir grubun üyelerini getir
 */
async function getGroupMembers(groupId) {
    const { data, error } = await supabase
        .from('group_members')
        .select(`
      user_id,
      role,
      joined_at
    `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

    if (error) {
        console.error('Error fetching members:', error);
        return [];
    }

    return data;
}

/**
 * 9) REALTIME: Mesajları dinle (subscription)
 */
function subscribeToMessages(groupId, onNewMessage) {
    const channel = supabase
        .channel(`group-messages-${groupId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'group_messages',
                filter: `group_id=eq.${groupId}`
            },
            (payload) => {
                onNewMessage(payload.new);
            }
        )
        .subscribe();

    // Unsubscribe fonksiyonu döndür
    return () => {
        supabase.removeChannel(channel);
    };
}

/**
 * 10) KULLANICI ARAMA: E-posta ile kullanıcı bul (davet için)
 * Not: Bu için ayrı bir view veya RPC gerekebilir
 */
async function searchUserByEmail(email) {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .ilike('email', `%${email}%`)
        .limit(5);

    if (error) {
        console.error('Error searching users:', error);
        return [];
    }

    return data;
}

// ============================================================================
// KULLANIM ÖRNEKLERİ
// ============================================================================

/*
// 1) Grup oluştur
const newGroupId = await createGroup('Matematik Çalışma Grubu');
console.log('Yeni grup ID:', newGroupId);

// 2) Üye ekle
await addMember(newGroupId, 'user-uuid-here', 'member');

// 3) Gruplarımı listele
const myGroups = await getMyGroups();
console.log('Gruplarım:', myGroups);

// 4) Mesaj gönder
await sendMessage(newGroupId, 'Merhaba arkadaşlar!');

// 5) Mesajları oku
const messages = await getGroupMessages(newGroupId);
console.log('Mesajlar:', messages);

// 6) Realtime dinle
const unsubscribe = subscribeToMessages(newGroupId, (msg) => {
  console.log('Yeni mesaj:', msg);
});

// 7) Üye çıkar
await removeMember(newGroupId, 'user-uuid-here');

// 8) Grup sil
await deleteGroup(newGroupId);
*/

export {
    getMyGroups,
    getGroupMessages,
    sendMessage,
    createGroup,
    addMember,
    removeMember,
    deleteGroup,
    getGroupMembers,
    subscribeToMessages,
    searchUserByEmail
};
