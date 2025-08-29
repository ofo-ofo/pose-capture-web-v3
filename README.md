# Pose Capture Web v3

Bir mobil web uygulaması olarak geliştirilen **Pose Capture Web v3**, kullanıcının pozunu değerlendirerek uygun olduğunda otomatik olarak fotoğraf çeker. Uygulama PWA olarak paketlenmiştir ve Vercel üzerinde statik olarak dağıtılabilir.

## Hızlı Başlangıç

Projeyi klonladıktan veya bu klasöre girdikten sonra bağımlılıkları yükleyip geliştirme sunucusunu başlatabilirsiniz:

```bash
cd pose-capture-web-v3
npm install
npm run dev
```

Ardından `http://localhost:5173` adresini mobil tarayıcınızda açarak uygulamayı deneyebilirsiniz. Kamera izinlerini kabul etmek ve kamera akışını başlatmak için ilk ekrandaki **Kamerayı Aç** düğmesine tıklamanız gerekir (iOS’ta bu zorunludur).

### Yapı ve Önizleme

Üretim için derleme yapmak ve statik dosyaları önizlemek:

```bash
npm run build
npm run preview
```

Derleme çıktısı `dist/` klasörüne yazılır. Vercel’de dağıtım sırasında bu klasör kullanılacaktır.

## Ortam Değişkenleri

Uygulama Firebase ile entegredir. Kendi Firebase projenizi kullanmak için kök dizinde `.env` dosyası oluşturup aşağıdaki değişkenleri doldurun (örnek için `env.example` dosyasına bakın):

```env
VITE_FIREBASE_API_KEY=<your key>
VITE_FIREBASE_AUTH_DOMAIN=<your domain>
VITE_FIREBASE_PROJECT_ID=<your project id>
VITE_FIREBASE_STORAGE_BUCKET=<your bucket>
VITE_FIREBASE_APP_ID=<your app id>
```

Tüm `VITE_` ön ekli değişkenler derleme sırasında istemci koduna enjekte edilir. Firebase yapılandırması dışında ayrıca `VITE_APP_VERSION` tanımlayarak uygulama sürümünü görüntüleyebilirsiniz (aksi halde `package.json` içindeki sürüm kullanılır).

## Ana Özellikler

- **Kamera Açma ve Ön/Arka Kamera Değiştirme** – Kullanıcı jesti olmadan kamera açılamaz; uygulama ön kamera ile başlar ve bir düğme üzerinden arka kameraya geçilebilir.
- **Pose Landmarker ile İnferans** – Google MediaPipe Tasks Vision `PoseLandmarker` modeli tarayıcıda WASM ile çalıştırılır ve kişinin duruşu, boy oranı, merkez offseti vb. metrikler çıkarılır.
- **Gerçek Zamanlı Geri Bildirim** – Ölçümler yeşil/amber/kırmızı durumlarına göre değerlendirilir ve ekrandaki çerçevenin rengi buna göre değişir. Panelde tüm metrikler canlı olarak gösterilir.
- **Otomatik Çekim** – Belirli sayıda ardışık kare “yeşil” olduğunda fotoğraf otomatik olarak kaydedilir ve Firebase Storage’a yüklenir. Başarılı yakalamalar Firestore’a meta verilerle beraber yazılır.
- **PWA ve Çevrimdışı Çalışma** – `vite-plugin-pwa` ile servis çalışanı kurulur; MediaPipe modelleri ve WASM dosyaları cache’lenir. Uygulama çevrimdışı durumda da kamera ve inferans işlemlerini gerçekleştirebilir.
- **Test Beslemesi** – `Test` sayfasında yerel MP4 dosyaları yükleyerek algoritmanın performansını test etmek mümkündür. Burada otomatik çekim devre dışıdır; yalnızca metrikler ve değerlendirme gösterilir.

## Dağıtım (Vercel)

Vercel’de “Other” framework tipi seçilmelidir. Aşağıdaki ayarlar kullanılmalıdır:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node.js Version:** 20

Kök dizindeki `vercel.json` dosyası, kamera izinlerini ve güvenlik başlıklarını tanımlar. Ayrıca `/tasks-vision/` altındaki asset’ler için uzun ömürlü cache ayarları yapılmıştır.

## Geliştirici Notları

- MediaPipe model dosyaları varsayılan olarak CDN üzerinden alınır (jsDelivr). Yerel geliştirme sırasında `public/tasks-vision/` altına `.task` ve `.wasm` dosyalarını kopyalayarak internet bağlantısı olmadan da çalışabilirsiniz.
- `src/metrics/compute.ts` dosyasında MediaPipe landmark indeksleri temel alınarak çeşitli metrikler hesaplanır. Bunlar uygulamanın duruş uygunluğunu değerlendirmesine olanak sağlar.
- `src/capture/controller.ts` basit bir istikrar sayacı uygular; art arda `N` yeşil kare görülene kadar fotoğraf çekmez.
- Post işlemleri `src/capture/postCheck.ts` içinde tanımlanmıştır; bu işlemler çekilen kareyi bir kez daha değerlendirip anlamlı hata mesajları üretir.

## Belgelendirme

Daha ayrıntılı teknik ayrıntılar ve gereksinimler için `docs/SPEC.md` dosyasını inceleyin. Test planı ve kalite güvence adımları `docs/QA.md` dosyasında yer almaktadır.