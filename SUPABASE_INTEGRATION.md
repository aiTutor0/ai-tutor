# 🚀 Supabase Entegrasyon Kılavuzu

Bu dosya, AI Tutor uygulamanızda Supabase servislerini nasıl kullanacağınızı gösterir.

## 📦 Mevcut Servisler

### 1. `chatService.js` - Chat ve Mesaj Yönetimi

```javascript
import * as chatService from './js/services/chatService.js';

// Chat oturumu oluştur
const { data: session, error } = await chatService.createChatSession(
    'İngilizce Pratik',
    'chat'
);

// Tüm oturumları listele
const { data: sessions } = await chatService.getChatSessions();

// Mesaj ekle
await chatService.addMessage(
    sessionId,
    'user',
    'Hello, how are you?'
);

// Mesajları getir
const { data: messages } = await chatService.getMessages(sessionId);

// Seviye testi kaydet
await chatService.saveLevelTestResult('B2', 'Upper Intermediate', 8, answers);

// Planlı ders oluştur
await chatService.createScheduledSession(
    'Grammar Lesson',
    '2026-01-20T10:00:00Z',
    'Focus on past tense'
);
```

### 2. `userService.js` - Kullanıcı Yönetimi

```javascript
import * as userService from './js/services/userService.js';

// Mevcut kullanıcı profilini al
const { data: profile } = await userService.getCurrentUserProfile();

// Profil güncelle
await userService.updateUserProfile({
    full_name: 'Yeni İsim',
    avatar_url: 'https://...'
});

// Tüm kullanıcıları listele (admin)
const { data: users } = await userService.getAllUsers();

// Kullanıcı ara
const { data: results } = await userService.searchUsers('john');

// Kullanıcı rolünü kontrol et
const role = await userService.getCurrentUserRole();
```

### 3. `roomService.js` - Grup Chat Yönetimi

```javascript
import * as roomService from './js/services/roomService.js';

// Oda oluştur
const { data: room } = await roomService.createRoom(
    'İngilizce Kulübü',
    'Günlük İngilizce pratik odası'
);

// Kullanıcının odalarını listele
const { data: rooms } = await roomService.getUserRooms();

// Oda mesajlarını getir
const { data: messages } = await roomService.getRoomMessages(roomId);

// Mesaj gönder
await roomService.sendRoomMessage(roomId, 'Hello everyone!');

// Davet gönder
await roomService.inviteToRoom(roomId, 'friend@example.com');

// Real-time mesajları dinle
const unsubscribe = roomService.subscribeToRoomMessages(roomId, (message) => {
    console.log('Yeni mesaj:', message);
});

// Dinlemeyi durdur
unsubscribe();
```

### 4. `authService.js` - Kimlik Doğrulama

```javascript
import * as authService from './js/services/authService.js';

// Email/şifre ile giriş
const { data, error } = await authService.loginUser(email, password);

// Kayıt ol
await authService.registerUser({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'SecurePass123',
    role: 'student'
});

// Google ile giriş
await authService.loginWithGoogle();

// Çıkış yap
await authService.logoutUser();

// Oturum kontrolü
const session = await authService.getSession();

// Auth değişikliklerini dinle
const unsubscribe = authService.onAuthChange((session) => {
    if (session) {
        console.log('Kullanıcı giriş yaptı:', session.user.email);
    } else {
        console.log('Kullanıcı çıkış yaptı');
    }
});
```

## 🔄 LocalStorage'dan Supabase'e Geçiş

### Önce (LocalStorage):
```javascript
// Eski yöntem
const history = JSON.parse(localStorage.getItem('chat_history') || '[]');
history.push({ role: 'user', content: 'Hello' });
localStorage.setItem('chat_history', JSON.stringify(history));
```

### Sonra (Supabase):
```javascript
// Yeni yöntem
import * as chatService from './js/services/chatService.js';

// Oturum oluştur (bir kez)
const { data: session } = await chatService.createChatSession('My Chat', 'chat');

// Mesaj ekle
await chatService.addMessage(session.id, 'user', 'Hello');

// Mesajları getir
const { data: messages } = await chatService.getMessages(session.id);
```

## 🎯 Örnek Kullanım Senaryoları

### Senaryo 1: Yeni Chat Başlatma

```javascript
import * as chatService from './js/services/chatService.js';

async function startNewChat() {
    // 1. Yeni oturum oluştur
    const { data: session, error } = await chatService.createChatSession(
        'English Practice',
        'chat'
    );
    
    if (error) {
        console.error('Oturum oluşturulamadı:', error);
        return;
    }
    
    // 2. İlk mesajı ekle
    await chatService.addMessage(
        session.id,
        'user',
        'I want to practice English'
    );
    
    // 3. AI yanıtını ekle
    await chatService.addMessage(
        session.id,
        'ai',
        'Great! Let\'s start practicing. What topic interests you?'
    );
    
    return session.id;
}
```

### Senaryo 2: Chat Geçmişini Yükleme

```javascript
async function loadChatHistory() {
    // 1. Tüm oturumları getir
    const { data: sessions } = await chatService.getChatSessions();
    
    // 2. Her oturum için mesajları yükle
    for (const session of sessions) {
        const { data: messages } = await chatService.getMessages(session.id);
        console.log(`${session.title}:`, messages);
    }
}
```

### Senaryo 3: Grup Chat Oluşturma ve Kullanma

```javascript
import * as roomService from './js/services/roomService.js';

async function createAndUseGroupChat() {
    // 1. Oda oluştur
    const { data: room } = await roomService.createRoom(
        'Beginner English',
        'For A1-A2 level students'
    );
    
    // 2. Arkadaşları davet et
    await roomService.inviteToRoom(room.id, 'friend1@example.com');
    await roomService.inviteToRoom(room.id, 'friend2@example.com');
    
    // 3. Mesaj gönder
    await roomService.sendRoomMessage(room.id, 'Welcome everyone!');
    
    // 4. Real-time mesajları dinle
    const unsubscribe = roomService.subscribeToRoomMessages(room.id, (msg) => {
        console.log(`${msg.users.full_name}: ${msg.content}`);
    });
}
```

## 🧪 Test Etme

1. **Test Sayfasını Açın:**
   ```
   http://localhost:3000/database-test.html
   ```

2. **Bağlantıyı Kontrol Edin:**
   - Sayfa açıldığında otomatik olarak bağlantı kontrolü yapılır
   - Yeşil mesaj görürseniz her şey hazır!

3. **İşlemleri Test Edin:**
   - Her bölümde butonlara tıklayarak işlemleri test edebilirsiniz
   - Sonuçlar anında gösterilir

## ⚠️ Önemli Notlar

### Hata Yönetimi

Tüm servis fonksiyonları `{ data, error }` formatında döner:

```javascript
const { data, error } = await chatService.createChatSession('Test', 'chat');

if (error) {
    console.error('Hata:', error.message);
    // Kullanıcıya hata mesajı göster
    return;
}

// Başarılı, data'yı kullan
console.log('Oluşturulan oturum:', data);
```

### Authentication Kontrolü

Veritabanı işlemleri yapmadan önce kullanıcının giriş yapmış olduğundan emin olun:

```javascript
import { supabase } from './js/config/supabaseClient.js';

const { data: { user } } = await supabase.auth.getUser();

if (!user) {
    // Kullanıcıyı login sayfasına yönlendir
    window.location.href = '/';
    return;
}

// Kullanıcı giriş yapmış, devam et
```

### Real-time Subscriptions

Real-time dinleyicileri kullanırken mutlaka temizleyin:

```javascript
// Component mount
const unsubscribe = roomService.subscribeToRoomMessages(roomId, handleMessage);

// Component unmount
unsubscribe();
```

## 🔧 Sorun Giderme

### "Supabase bağlı değil (demo)" Hatası

**Çözüm:** `js/config/env.js` dosyasını kontrol edin:
```javascript
export const SUPABASE_URL = "https://your-project.supabase.co";
export const SUPABASE_ANON_KEY = "your-anon-key";
```

### "Not authenticated" Hatası

**Çözüm:** Kullanıcı giriş yapmamış. Önce login olun:
```javascript
await authService.loginUser(email, password);
```

### "Row Level Security" Hatası

**Çözüm:** `txt.sql` dosyasını Supabase'de çalıştırdığınızdan emin olun.

## 📚 Daha Fazla Bilgi

- [Supabase Dokümantasyonu](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Başarılar! 🎉** Artık Supabase servislerini kullanmaya hazırsınız.
