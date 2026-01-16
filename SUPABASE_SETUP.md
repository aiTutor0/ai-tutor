# 🗄️ Supabase Database Kurulum Kılavuzu

Bu kılavuz, AI Tutor uygulamanızı Supabase veritabanına bağlamak için gereken tüm adımları içerir.

## 📋 İçindekiler

1. [Supabase Projesi Oluşturma](#1-supabase-projesi-oluşturma)
2. [Veritabanı Şemasını Yükleme](#2-veritabanı-şemasını-yükleme)
3. [Environment Değişkenlerini Yapılandırma](#3-environment-değişkenlerini-yapılandırma)
4. [Google OAuth Yapılandırması](#4-google-oauth-yapılandırması)
5. [Bağlantıyı Test Etme](#5-bağlantıyı-test-etme)
6. [Sorun Giderme](#6-sorun-giderme)

---

## 1. Supabase Projesi Oluşturma

### Adım 1.1: Supabase Hesabı Oluşturun

1. [https://supabase.com](https://supabase.com) adresine gidin
2. **Start your project** butonuna tıklayın
3. GitHub, Google veya email ile kayıt olun

### Adım 1.2: Yeni Proje Oluşturun

1. Dashboard'da **New Project** butonuna tıklayın
2. Proje bilgilerini doldurun:
   - **Name**: `ai-tutor` (veya istediğiniz bir isim)
   - **Database Password**: Güçlü bir şifre oluşturun (kaydedin!)
   - **Region**: Size en yakın bölgeyi seçin (örn: `Europe West (Ireland)`)
3. **Create new project** butonuna tıklayın
4. Projenin oluşturulmasını bekleyin (~2 dakika)

### Adım 1.3: API Bilgilerini Alın

1. Sol menüden **Settings** → **API** sekmesine gidin
2. Aşağıdaki bilgileri kopyalayın:
   - **Project URL** (örn: `https://haowbfhlmhgwjgpgbtyn.supabase.co`)
   - **anon public** key (uzun bir JWT token)

> [!WARNING]
> **service_role** key'i ASLA kullanmayın! Bu key tüm güvenlik kurallarını bypass eder.

---

## 2. Veritabanı Şemasını Yükleme

### Adım 2.1: SQL Editor'ü Açın

1. Supabase Dashboard'da sol menüden **SQL Editor** sekmesine gidin
2. **New query** butonuna tıklayın

### Adım 2.2: Schema SQL'ini Çalıştırın

1. Proje klasöründeki `txt.sql` dosyasını açın
2. Tüm içeriği kopyalayın (620 satır)
3. SQL Editor'e yapıştırın
4. Sağ alttaki **Run** butonuna tıklayın veya `Ctrl+Enter` tuşlarına basın

### Adım 2.3: Tabloları Doğrulayın

1. Sol menüden **Table Editor** sekmesine gidin
2. Aşağıdaki 11 tablonun oluşturulduğunu doğrulayın:
   - ✅ `users` - Kullanıcı profilleri
   - ✅ `chat_sessions` - Sohbet oturumları
   - ✅ `messages` - Mesajlar
   - ✅ `scheduled_sessions` - Planlanmış dersler
   - ✅ `level_test_results` - Seviye testi sonuçları
   - ✅ `group_rooms` - Grup sohbet odaları
   - ✅ `room_members` - Oda üyeleri
   - ✅ `room_messages` - Oda mesajları
   - ✅ `room_invitations` - Oda davetleri
   - ✅ `voice_recordings` - Ses kayıtları
   - ✅ `user_preferences` - Kullanıcı tercihleri

---

## 3. Environment Değişkenlerini Yapılandırma

### Seçenek A: env.js Dosyasını Güncelleme (Mevcut Yöntem)

Projenizde `js/config/env.js` dosyası zaten mevcut ve yapılandırılmış:

```javascript
// js/config/env.js
export const SUPABASE_URL = "https://haowbfhlmhgwjgpgbtyn.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

> [!NOTE]
> Bu dosya zaten doğru yapılandırılmış görünüyor. Eğer farklı bir Supabase projesi kullanmak istiyorsanız, bu değerleri güncelleyin.

### Seçenek B: .env Dosyası Kullanma (Önerilen - Güvenlik)

Daha güvenli bir yaklaşım için `.env` dosyası kullanabilirsiniz:

1. Proje kök dizininde `.env` dosyası oluşturun:

```bash
# .env
OPENAI_API_KEY=sk-your-api-key-here
OPENAI_MODEL=gpt-4o-mini
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

2. `js/config/env.js` dosyasını güncelleyin:

```javascript
// js/config/env.js
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://haowbfhlmhgwjgpgbtyn.supabase.co";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "your-default-key";
```

3. `.gitignore` dosyasına `.env` ekleyin (zaten ekli olmalı)

---

## 4. Google OAuth Yapılandırması

Google ile giriş özelliğini aktif etmek için:

### Adım 4.1: Google Cloud Console'da OAuth Ayarları

1. [Google Cloud Console](https://console.cloud.google.com/) gidin
2. Yeni bir proje oluşturun veya mevcut projeyi seçin
3. **APIs & Services** → **Credentials** sekmesine gidin
4. **Create Credentials** → **OAuth 2.0 Client ID** seçin
5. **Application type**: Web application
6. **Authorized redirect URIs** ekleyin:
   ```
   https://haowbfhlmhgwjgpgbtyn.supabase.co/auth/v1/callback
   ```
7. **Client ID** ve **Client Secret** bilgilerini kaydedin

### Adım 4.2: Supabase'de Google Provider'ı Aktif Etme

1. Supabase Dashboard → **Authentication** → **Providers** gidin
2. **Google** provider'ını bulun ve **Enable** yapın
3. Google Cloud Console'dan aldığınız bilgileri girin:
   - **Client ID**: `your-google-client-id`
   - **Client Secret**: `your-google-client-secret`
4. **Save** butonuna tıklayın

### Adım 4.3: Redirect URL'leri Yapılandırma

1. **Authentication** → **URL Configuration** gidin
2. **Site URL** ekleyin:
   ```
   http://localhost:3000
   ```
3. **Redirect URLs** ekleyin:
   ```
   http://localhost:3000
   http://localhost:3000/
   ```

---

## 5. Bağlantıyı Test Etme

### Adım 5.1: Uygulamayı Başlatın

```bash
npm run dev
```

### Adım 5.2: Console'u Kontrol Edin

Tarayıcı console'unda şu mesajı görmelisiniz:

```
✅ Supabase bağlandı.
```

Eğer şu mesajı görüyorsanız:

```
⚠️ Supabase anon key girilmemiş (demo mode).
```

Bu durumda `env.js` dosyanızdaki bilgileri kontrol edin.

### Adım 5.3: Kayıt Testi

1. Uygulamayı açın: `http://localhost:3000`
2. **Register** butonuna tıklayın
3. Yeni bir hesap oluşturun:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
   - Role: Student
4. **Register** butonuna tıklayın

### Adım 5.4: Veritabanını Kontrol Edin

1. Supabase Dashboard → **Table Editor** → **users** tablosuna gidin
2. Yeni oluşturduğunuz kullanıcının kaydını görmelisiniz

### Adım 5.5: Google Login Testi

1. **Continue with Google** butonuna tıklayın
2. Google hesabınızla giriş yapın
3. Dashboard'a yönlendirilmelisiniz

---

## 6. Sorun Giderme

### ❌ "Supabase bağlı değil (demo)" Hatası

**Sebep**: `env.js` dosyasında Supabase bilgileri eksik veya yanlış.

**Çözüm**:
1. `js/config/env.js` dosyasını açın
2. `SUPABASE_URL` ve `SUPABASE_ANON_KEY` değerlerini kontrol edin
3. Supabase Dashboard'dan doğru değerleri kopyalayın
4. Sayfayı yenileyin (`Ctrl+F5`)

### ❌ "Invalid API key" Hatası

**Sebep**: Yanlış API key kullanılıyor veya key süresi dolmuş.

**Çözüm**:
1. Supabase Dashboard → Settings → API
2. **anon public** key'i yeniden kopyalayın
3. `env.js` dosyasını güncelleyin

### ❌ "Row Level Security" Hatası

**Sebep**: RLS politikaları doğru yapılandırılmamış.

**Çözüm**:
1. `txt.sql` dosyasını tekrar çalıştırın
2. SQL Editor'de şu komutu çalıştırın:
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```
3. Tüm tablolarda `rowsecurity = true` olmalı

### ❌ Google Login Redirect Sorunu

**Sebep**: Redirect URL'leri yanlış yapılandırılmış.

**Çözüm**:
1. `js/services/authService.js` dosyasını kontrol edin
2. `redirectTo` parametresinin doğru olduğundan emin olun:
   ```javascript
   options: {
     redirectTo: window.location.origin + "/dashboard"
   }
   ```
3. Supabase Dashboard'da redirect URL'leri kontrol edin

### ❌ "Failed to fetch" Hatası

**Sebep**: CORS sorunu veya network hatası.

**Çözüm**:
1. Tarayıcı console'unda detaylı hatayı kontrol edin
2. Supabase Dashboard → Settings → API → CORS
3. `http://localhost:3000` adresini ekleyin

---

## 📊 Veritabanı Şeması Özeti

Projenizde aşağıdaki tablolar ve özellikleri bulunmaktadır:

### Temel Tablolar

| Tablo | Açıklama | Önemli Alanlar |
|-------|----------|----------------|
| `users` | Kullanıcı profilleri | email, full_name, role, avatar_url |
| `chat_sessions` | Sohbet oturumları | user_id, title, mode |
| `messages` | Mesajlar | chat_session_id, role, content |

### Eğitim Tabloları

| Tablo | Açıklama | Önemli Alanlar |
|-------|----------|----------------|
| `scheduled_sessions` | Planlanmış dersler | student_id, teacher_id, topic, scheduled_date |
| `level_test_results` | Seviye testleri | user_id, level, score, answers |

### Grup Chat Tabloları

| Tablo | Açıklama | Önemli Alanlar |
|-------|----------|----------------|
| `group_rooms` | Grup odaları | name, creator_id, description |
| `room_members` | Oda üyeleri | room_id, user_id |
| `room_messages` | Oda mesajları | room_id, user_id, content |
| `room_invitations` | Oda davetleri | room_id, from_user_id, to_email, status |

### Diğer Tablolar

| Tablo | Açıklama | Önemli Alanlar |
|-------|----------|----------------|
| `voice_recordings` | Ses kayıtları | user_id, transcription, audio_url |
| `user_preferences` | Kullanıcı tercihleri | theme, language, voice_enabled |

---

## 🔐 Güvenlik Notları

1. **Asla `service_role` key'i frontend'de kullanmayın**
2. **`.env` dosyasını Git'e commit etmeyin**
3. **Row Level Security (RLS) politikalarını devre dışı bırakmayın**
4. **Üretim ortamında environment variables kullanın**
5. **API key'leri düzenli olarak yenileyin**

---

## 🚀 Sonraki Adımlar

Veritabanı kurulumunu tamamladıktan sonra:

1. ✅ Kullanıcı kaydı ve girişi test edin
2. ✅ Chat özelliklerini test edin
3. ✅ Grup chat özelliklerini test edin
4. ✅ Level test özelliğini test edin
5. ✅ Öğretmen ve admin panellerini test edin

---

## 📞 Yardım

Sorun yaşıyorsanız:

1. [Supabase Documentation](https://supabase.com/docs)
2. [Supabase Discord](https://discord.supabase.com/)
3. Proje README.md dosyasını kontrol edin

---

**Başarılar! 🎉**

Artık AI Tutor uygulamanız Supabase veritabanına bağlı ve kullanıma hazır.
