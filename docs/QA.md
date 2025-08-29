# Test Plan

Bu doküman, Pose Capture Web v3 uygulamasının fonksiyonel ve performans açısından doğrulanması için izlenecek adımları açıklar. Testler hem otomatik hem de manuel olarak gerçekleştirilebilir.

## 1. Fonksiyonel Testler

### 1.1 Kamera Açma ve İzinler
1. Uygulama mobil tarayıcıda açılır.
2. “Kamerayı Aç” düğmesine tıklanır.
3. Tarayıcı izin penceresi görünür; “İzin Ver” seçilir.
4. Video akışı başlamalıdır. Eğer izin verilmezse ekranda hata mesajı gösterilmelidir.

### 1.2 Ön/Arka Kamera Değiştirme
1. Kamera açıkken “Kamerayı Değiştir” düğmesine tıklanır.
2. Akış karşı kameraya geçmelidir. Düğmeye tekrar basıldığında eski kameraya dönülmelidir.
3. Ön kameradayken görüntü aynalanmalı ve değerlendirme doğru çalışmalıdır.

### 1.3 Otomatik Çekim
1. Kullanıcı kamera karşısında belirtilen eşiklere uygun poz alır (düz durur, kadrajda tamamen görünür, yeterli ışık sağlar).
2. Panelde tüm metriklerin yeşil olması gerekir. Yeşil durum ardışık `stabilityFrames` kare boyunca sürerse fotoğraf otomatik olarak çekilmeli, “Fotoğraf kaydediliyor…” mesajı görülmeli ve yükleme tamamlandığında başarı mesajı gelmelidir.
3. Eşiklerden biri bozulduğunda (ör. yan eğilme) durum kırmızıya döner ve sayaç sıfırlanır.

### 1.4 Manuel Çekim
1. Kamera açıkken “Manuel Çek” düğmesine basılır.
2. Güncel poz metrikleri post‑check ile doğrulanır. Uygun değilse anlamlı hata mesajı gösterilir (örn. “Ayaklar kadrajda değil”). Uygunsa yükleme gerçekleştirilir.

### 1.5 Test Beslemesi
1. `Test` sayfasına gidilir.
2. MP4 formatında bir video dosyası seçilir.
3. Video oynatılırken overlay ve metrik paneli güncellenir. Otomatik çekim yapılmaz.

### 1.6 Ayarlar
1. `Ayarlar` sayfasında her bir eşik değeri düzenlenir.
2. Değişiklikler yalnızca geçerli oturumu etkiler; sayfa yenilendiğinde varsayılanlar geri gelir.

## 2. Performans Testleri

### 2.1 İnferans FPS
1. Orta seviye bir cihazda (örneğin 2020 model bir iPhone SE veya orta segment Android) uygulama çalıştırılır.
2. Paneldeki metriklerin ve overlay’in akıcı olup olmadığı gözlemlenir. Hedef en az 15 FPS’dir.

### 2.2 Yükleme Boyutu
1. Yakalanan JPEG dosyalarının boyutu kontrol edilir. Dosyalar 5 MB’yi geçmemeli ve kalite kabul edilebilir seviyede olmalıdır (0.92 kalite parametresi kullanılır).

## 3. Güvenlik ve Gizlilik

### 3.1 HTTPS
Uygulama HTTPS üzerinden servis edilmelidir; aksi halde kamera API’leri çalışmayacaktır. Localhost geliştirme haricinde HTTP’ye izin verilmez.

### 3.2 İzin İhlalleri
Kullanıcı izin vermediğinde veya tarayıcı kamera donanımına erişemediğinde, uygulama açık ve anlaşılır bir hata mesajı göstermelidir.

### 3.3 Firebase Kuralları
Storage ve Firestore kuralları yalnızca JPEG yüklemeye ve 5 MB sınırına izin vermelidir. Anonim kullanıcılar için okuma/yazma kısıtlamaları örnek kurallarda belirtilmelidir.

## 4. Çapraz Tarayıcı Testleri

Uygulama aşağıdaki kombinasyonlarda denenmelidir:

- iOS 15+ Safari
- Android 10+ Chrome
- Modern masaüstü tarayıcıları (Chrome/Edge/Firefox) – mobil uyumluluk ve PWA kurulum davranışı

Her kombinasyonda kameranın açılabildiği, overlay ve metrik panelinin düzgün işlendiği ve otomatik çekimin beklendiği gibi çalıştığı doğrulanmalıdır.