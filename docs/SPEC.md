# Teknik Şartname

Bu belgedeki gereksinimler, mobil web üzerinde çalışan pose/landmark tabanlı otomatik fotoğraf çekimi uygulamasının işlevsel ve teknik şartlarını açıklar. Uygulama **Vite + React + TypeScript** kullanılarak geliştirilir ve bir **PWA** olarak paketlenir. Aşağıdaki başlıklar, mimari tasarım, algoritma, kullanıcı deneyimi ve dağıtım konularını kapsar.

## Platform ve Kısıtlar

- **Hedef Platformlar**: iOS Safari 15+ ve Android Chrome 10+. Uygulama web tabanlıdır; native uygulama yoktur.
- **HTTPS**: Kamera erişimi için HTTPS zorunludur (localhost hariç).
- **Kullanıcı Jesti**: iOS’ta kamera sadece kullanıcı etkileşimi ile açılabilir; otomatik olarak açılamaz.
- **Selfie Modu**: Ön kamera kullanılırken video aynalanır ve landmark koordinatları doğru yansıtılır (selfieMode).
- **Performans**: Orta seviye cihazlarda en az 15 FPS inferans.
- **Gizlilik**: Kullanıcıdan açık onay alınmalı; yüklemeler şeffaf biçimde bildirilmelidir. Yükleme boyutu 5 MB ile sınırlıdır.

## Depolama ve Backend

- **Firebase**: Görseller Firebase Storage’a yüklenir. Meta veriler Firestore’a yazılır. Yalnızca `image/jpeg` kabul edilir.
- **Env Değişkenleri**: Firebase yapılandırması Vite ortam değişkenleri (`VITE_FIREBASE_*`) ile sağlanır.

## MediaPipe Modeli

- **Pose Landmarker**: `@mediapipe/tasks-vision` paketinden alınır. Varsayılan olarak CDN (`jsDelivr`) üzerinden `.task` ve `.wasm` dosyaları yüklenir. İlk kullanımda servis çalışanı tarafından cache’lenir.
- **Model Seçimi**: `lite` ve `full` seçenekleri desteklenir; varsayılan `lite` dir.
- **SIMD**: Tarayıcı SIMD desteklemiyorsa WASM otomatik olarak fallback yapar.

## Algoritma ve Metrikler

Her karede (maks. 20 FPS) şu adımlar uygulanır:

1. **Pose Landmarker** ile vücut noktaları çıkarılır.
2. **Metrik Hesaplama** (`src/metrics/compute.ts`):
   - *Düzlük (rollDeg)*: Omuz hattının yataydan sapması.
   - *Merkez Sapması (center)*: Gövde merkezinin video merkezinden uzaklığı.
   - *Boy Oranı (height)*: Baş ile ayak arasındaki mesafe.
   - *Üst/Alt Boşluk* (top/bottom): Baş ve ayak mesafeleri.
   - *Luma*: Kare parlaklığı.
3. **Yumuşatma**: EMA (`src/metrics/smooth.ts`) ile jitter azaltılır.
4. **Eşik Değerlendirme** (`src/metrics/thresholds.ts`): Metrikler eşiklerle karşılaştırılır ve *yeşil*, *amber* veya *kırmızı* seviye belirlenir.
5. **Stabilite Kontrolü** (`src/capture/controller.ts`): Ardışık yeşil kareler sayılır; belirli sayıya ulaşınca auto‑capture tetiklenir.
6. **Post-Check** (`src/capture/postCheck.ts`): Çekim sonrası tek kare tekrar kontrol edilerek kullanıcıya anlamlı geri bildirim verilir.

## Kullanıcı Arayüzü

- **Overlay**: Video üzerine dört kenarlı çerçeve ve dikey merkez çizgisi çizilir. Renk duruma göre yeşil, amber veya kırmızı olur.
- **Panel**: Canlı metrikler ve durum görüntülenir. Kullanıcı feedback alır.
- **Kontroller**: Kamera açma, ön/arka kamera değiştirme ve manuel çekim butonları. `Settings` sayfasında eşikler ayarlanabilir. `Test` sayfasında MP4 dosya yüklenerek algoritma denenebilir.

## PWA ve Servis Çalışanı

- **vite-plugin-pwa**: Manifest ve servis çalışanı otomatik olarak oluşturulur. `registerType: 'autoUpdate'` ile güncellemeler uygulanır.
- **Runtime Caching**: CDN’den çekilen `.wasm` ve `.task` dosyaları `CacheFirst` stratejisiyle saklanır. Böylece internet bağlantısı olmasa bile model çalışabilir.

## Vercel Konfigürasyonu

- `vercel.json` dosyasında Permissions-Policy ve Content-Security-Policy başlıkları tanımlanır. `/tasks-vision/` altındaki dosyalar için bir yıllık cache ayarlanır.
- Build komutu `npm run build`, çıktı klasörü `dist`, Node sürümü 20’dir.

## Dosya Yapısı

Aşağıdaki dizin yapısı uygulamanın ana bileşenlerini özetler. Ayrıntılı açıklamalar dosya içi yorumlarda bulunabilir.

```
pose-capture-web-v3/
├── public/           # Statik dosyalar ve PWA meta
│   ├── tasks-vision/ # MediaPipe görev dosyaları (opsiyonel yerel kopya)
│   ├── icons/        # PWA ikonları
│   ├── test/         # Test videoları (boş bırakılabilir)
│   └── index.html    # Uygulama HTML iskeleti
├── src/
│   ├── app/          # Sayfalar ve düzen bileşenleri
│   ├── camera/       # Kamera açma ve değiştirme yardımcıları
│   ├── mediapipe/    # Pose Landmarker sarmalayıcı ve WASM ayarları
│   ├── metrics/      # Metrik hesaplama, yumuşatma ve eşik değerlendirme
│   ├── capture/      # Otomatik çekim kontrolü ve post-check
│   ├── firebase/     # Firebase yapılandırması ve yükleyici
│   ├── pwa/          # Servis çalışanı kayıt yardımcıları
│   ├── utils/        # Genel yardımcı fonksiyonlar
│   ├── i18n/         # Yerelleştirme dosyaları
│   ├── main.tsx      # Uygulama giriş noktası
│   └── App.tsx       # Router ve kabuk
├── vite.config.ts    # Vite ve PWA eklentisi konfigürasyonu
├── vercel.json       # Vercel başlık ve cache ayarları
├── env.example       # Ortam değişkenleri örneği
├── README.md         # Hızlı başlangıç ve açıklamalar
└── docs/
    ├── SPEC.md      # Bu belge
    └── QA.md        # Test planı
```