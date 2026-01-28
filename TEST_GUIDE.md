# AI Tutor - Test ve Çalıştırma Komutları

## 🚀 Projeyi Çalıştırma

### 1. Supabase Migration'ları Çalıştır (İLK ÖNCE!)

Supabase SQL Editor'da şu dosyaları sırayla çalıştır:

```sql
-- 1. Writing migration (zaten var)
-- c:\Users\0\Desktop\aiTutor\ai-tutor\supabase_writing_migration.sql

-- 2. Reading migration (zaten var)
-- c:\Users\0\Desktop\aiTutor\ai-tutor\supabase_reading_migration.sql

-- 3. Listening migration (YENİ)
-- c:\Users\0\Desktop\aiTutor\ai-tutor\supabase_listening_migration.sql

-- 4. Speak migration (zaten var)
-- c:\Users\0\Desktop\aiTutor\ai-tutor\supabase_speak_migration.sql
```

**Supabase'de çalıştırma:**
1. https://supabase.com adresine git
2. Projen → SQL Editor
3. Her dosyayı aç, kopyala, yapıştır, "Run" tıkla

---

### 2. Development Server'ı Başlat

```powershell
# Terminal 1: Netlify Dev (Serverless functions ile)
cd c:\Users\0\Desktop\aiTutor\ai-tutor
npm run dev
```

**VEYA**

```powershell
# Terminal 1: Basit Express server (daha hızlı)
cd c:\Users\0\Desktop\aiTutor\ai-tutor
npm run dev:local
```

**Beklenen çıktı:**
```
◈ Netlify Dev ◈
◈ Server now ready on http://localhost:8888
```

**Tarayıcıda aç:** http://localhost:8888

---

## ✅ Test Listesi

### Test 1: Reading - Academic Reading
1. Login ol
2. Sidebar → Reading → Academic Reading
3. "Start Academic Reading" tıkla
4. Passage ve sorular yüklenecek (20-30 saniye)
5. Soruları cevapla → Submit
6. Band skoru ve sonuçlar görünecek

**Beklenen:** ✅ Passage üretildi, sorular gösterildi, cevaplar değerlendirildi

---

### Test 2: Listening - Academic Listening
1. Sidebar → Listening → Academic Listening
2. "Start Academic Listening" tıkla
3. Transcript üretilecek
4. "Play" butonu ile dinle (browser TTS)
5. Soruları cevapla → Submit
6. Sonuçlar + transcript görünecek

**Beklenen:** ✅ Audio oynatıldı, sorular çalıştı, sonuçlar kaydedildi

---

### Test 3: Writing - Essay Writing
1. Sidebar → Writing → Essay Writing
2. "Start Essay Practice" tıkla
3. Topic gösterilecek
4. 250+ kelime essay yaz
5. "Submit for Review" tıkla
6. Band score + detaylı feedback gelecek

**Beklenen:** ✅ Essay değerlendirildi, feedback gösterildi

---

### Test 4: Writing - Task Response (KISMİ)
**❌ HTML paneli eksik - Manuel test gerekli**

Şu fonksiyonlar hazır:
- `generateChartData()` - Chart oluşturma
- `evaluateTaskResponse()` - Değerlendirme
- OpenAI prompt: `task_response_evaluate`

**Test için:**
```javascript
// Browser Console'da test et:
import { generateChartData } from './js/services/writingService.js';
const chart = generateChartData();
console.log(chart);
```

---

### Test 5: Reading - Speed Reading (KISMİ)
**⚠️ UI eksik - Backend hazır**

Hazır fonksiyonlar:
- `generateSpeedReadingPassage()`
- `calculateWPM(wordCount, seconds)`
- OpenAI prompt: `speed_reading_generate`

**Test için Backend:**
```javascript
// Browser Console'da:
import { generateSpeedReadingPassage } from './js/services/readingService.js';
const data = await generateSpeedReadingPassage();
console.log(data);
```

---

### Test 6: Listening - Conversation Practice
1. Sidebar → Listening → Conversation Practice tıkla
2. **Şu an çalışmayacak çünkü:**
   - `openSkillMode('listening', 'conversation')` Academic ile aynı UI'ı kullanıyor
   - Prompt değiştirmek için `listeningService.js` içinde mode parametresi eklemek gerekir

**Hızlı Fix:**
`generateListeningContent()` fonksiyonunda:
```javascript
toolMode: mode === 'conversation' ? 'conversation_generate' : 'listening_generate'
```

---

## 🐛 Bilinen Eksiklikler

### 1. writingUI_task_addition.js Entegrasyonu
**Sorun:** Task Response fonksiyonları ayrı dosyada
**Çözüm:** İçeriği `writingUI.js` dosyasının sonuna kopyala

```powershell
# Dosyayı birleştir:
Get-Content c:\Users\0\Desktop\aiTutor\ai-tutor\js\ui\writingUI_task_addition.js | Add-Content c:\Users\0\Desktop\aiTutor\ai-tutor\js\ui\writingUI.js
```

### 2. Conversation Practice Mode Switch
**Sorun:** Mode parametresi kullanılmıyor
**Çözüm:** `listeningService.js`:14'te düzelt

### 3. Speed Reading UI
**Sorun:** UI fonksiyonları yok
**Çözüm:** `readingUI.js`'e ekle (opsiyonel)

---

## 🔍 Hata Ayıklama

### Browser Console'da Hata Kontrolü
```javascript
// F12 → Console
// Kırmızı hata var mı bak
```

### Network Tab'ta API Çağrıları
```
F12 → Network → Filter: openai
// OpenAI çağrıları başarılı mı kontrol et
```

### Supabase Error
```
// Console'da "supabase" hatası varsa:
// 1. Migration'lar çalıştırıldı mı?
// 2. RLS policies aktif mi?
// 3. .env dosyasında Supabase credentials var mı?
```

---

## ⚡ Hızlı Başlangıç Komutu

```powershell
# Tek komutla başlat:
cd c:\Users\0\Desktop\aiTutor\ai-tutor
npm run dev
```

**Sonra tarayıcıda:** http://localhost:8888

---

## 📊 Özellik Durumu

| Özellik | Backend | Frontend | DB | Test |
|---------|---------|----------|-----|------|
| Reading - Academic | ✅ | ✅ | ✅ | ✅ |
| Listening - Academic | ✅ | ✅ | ✅ | ⚠️ |
| Writing - Essay | ✅ | ✅ | ✅ | ✅ |
| Writing - Task Response | ✅ | ⚠️ | ✅ | ❌ |
| Speed Reading | ✅ | ❌ | ✅ | ❌ |
| Conversation Practice | ✅ | ✅ | ✅ | ⚠️ |

**Açıklama:**
- ✅ = Tamamen çalışıyor
- ⚠️ = Kısmi, küçük düzeltme gerekli
- ❌ = UI entegrasyonu eksik

---

## 🎯 Öncelikli Test Sırası

1. **npm run dev** → Server başlat
2. **Supabase migrations** → DB oluştur
3. **Reading Academic** → En stabil özellik
4. **Listening Academic** → Web Speech API test
5. **Writing Essay** → OpenAI evaluation test

**Not:** Task Response ve Speed Reading'i şimdilik atla (UI eksik ama backend hazır)
