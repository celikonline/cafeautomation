# BOA Pay / Bahçe Kafe

BOA bileşenleriyle geliştirilmiş yönetim paneli ve masaya bağlı müşteri deneyimi. Yerel sunucuda çalışır; gerçek POS tahsilatı veya mali fiş üretimi yapmaz.

Vercel dağıtımı da desteklenir: [Vercel kurulum rehberi](../../VERCEL.md). Aşağıdaki yerel dosya ve localhost erişim bilgileri `npm run cafe` için geçerlidir; bulutta Redis ve parola korumalı yönetim kullanılır.

## Çalıştırma

```powershell
npm run cafe
```

- Yönetim: http://127.0.0.1:3000/
- Yazdırılabilir masa QR kartları: http://127.0.0.1:3000/qr
- Sadakat ve ikram yönetimi: http://127.0.0.1:3000/loyalty
- Video yayın takvimi ve yönetici önizlemesi: http://127.0.0.1:3000/videos
- Müşteri paneli: `/guest`; QR kartındaki bağlantı masayı ve imzalı erişim kodunu taşır.

QR sayfasındaki “Bu masayı bilgisayarda dene” bağlantıları masa bağlı müşteri panelini açar. `/guest` bağlantısı QR olmadan menü ve eğlenceyi gösterir; sipariş için geçerli masa kodu gerekir.

Sunucu `0.0.0.0:3000` üzerinde dinler. QR kodları etkin özel ağın adresini kullanır; telefon bilgisayarla aynı Wi-Fi ağında olmalıdır. Windows güvenlik duvarı bağlantıyı engelliyorsa 3000 portuna özel ağ erişimi verilmelidir. Yönetim API'si ve QR/sadakat yönetim sayfaları sadece localhost'tan erişilebilir. Telefon erişimi bir gerçek cihazdan ayrıca denenmelidir; yerel ağ HTTP isteği doğrulanmıştır.

QR adresini açıkça ayarlamak için:

```powershell
$env:CAFE_PUBLIC_URL='http://192.168.1.24:3000'
npm run cafe
```

`npm run payment` aynı uygulamayı açar. Storybook 6006 portunda bağımsız çalışabilir. Mevcut Node.js üzerinde Webpack 4 için gereken OpenSSL uyumluluk seçeneği başlatma komutunda bulunur.

İlk kurulum:

```powershell
$env:PUPPETEER_SKIP_CHROMIUM_DOWNLOAD='true'
npx --yes yarn@1.22.22 install --frozen-lockfile --ignore-engines --non-interactive
npm run cafe
```

## Müşteri deneyimi

- **Keşfet:** 130 farklı gerçek video, önceden hazırlanmış tarihli yayın planı; dikey kaydırma, görünür videoyu oynatma, duraklatma, ses kontrolü, beğenme, kaydetme ve masa bağlantısını paylaşma. Videodaki ürün doğrudan sepete eklenebilir. Azaltılmış hareket tercihi etkinse video otomatik başlamaz. Yalnızca etkin videonun çevresindeki dosyalar yüklenir.
- **Menü:** fotoğraflı 12 ürün, kategori ve arama; adet ve not içeren sepet. Kahve yanına tatlı/kruvasan, diğer ürünlerin yanına kahve gibi sepete göre öneriler gösterilir. Öneriler otomatik eklenmez.
- **QR siparişi:** sunucu masa imzasını, ürünleri ve adetleri doğrular; fiyatı katalogdan hesaplar. Sipariş yönetim panelindeki ilgili masaya eklenir. Tekrar gönderme anahtarı aynı siparişin iki kez yazılmasını önler.
- **Paket tercihi:** sepette “Masaya servis” veya “Paket istiyorum” seçilir. Tercih her siparişte kalıcı tutulur; yönetimde masa adisyonunda ve mutfakta ürünleriyle birlikte gösterilir. Paket siparişi de QR ile bağlı masanın adisyonuna eklenir; adrese teslim akışı yoktur.
- **Masam:** bu tarayıcıya ait mevcut masadaki açık siparişler ve önceki siparişler ayrı listelenir. Ürünler, tarih, masa, servis tercihi, toplam ve güncel mutfak durumu gösterilir. Eski sipariş güncel fiyatlarla sepete alınabilir; gönderim ayrıca yapılır. Dolu sepeti değiştirmeden önce kullanıcıya seçim sunulur. Durumlar dört saniyede bir yenilenir; diğer müşterilerin siparişleri gösterilmez.
- **Kahve Falı:** isteğe bağlı kamera/galeri seçimiyle yerel fotoğraf önizlemesi ve rastgele, eğlencelik sembol hikâyesi. Fotoğraf sadece React belleğindedir; sunucuya veya bir görsel analiz hizmetine gönderilmez. Gerçek fotoğraf analizi ya da gelecek tahmini yoktur.
- **Minik Barista:** 8 seviyeli eşleştirme oyunu. Çift sayısı sırasıyla 4, 5, 6, 8, 10, 12, 12, 12; süreler 100, 95, 90, 85, 80, 75, 65, 55 saniyedir. Yanlış çiftlerin gösterim süresi de kısalır. İlk kart süreyi başlatır; başka bölüme geçmek, pencere açmak veya sekmeyi gizlemek süreyi duraklatır. Tamamlanan seviyeler sıradakini açar; süre dolunca aynı seviye tekrar denenebilir. Açılan seviyeler ve rekor aynı tarayıcıda korunur. Puanlar satın alma veya sadakat hakkı vermez.
- **Kahve Kartım:** sipariş durumu, ödenmiş kahve damgaları, kullanılabilir ikram kodu ve kaydedilen videolar.

## Üyeliksiz sadakat

Sunucu tarayıcıya bir yıl geçerli, imzalı ve anonim `boa_guest` çerezi verir. Çerez `HttpOnly` ve `SameSite=Lax` taşır; HTTPS kullanılıyorsa `Secure` eklenir. İsim, telefon veya cihaz parmak izi gerekmez.

Her ödenmiş kahve bir damga kazandırır. Beş damgada bir Americano ikram hakkı oluşur. Damgalar yalnızca yönetici adisyonu kapattığında eklenir; sipariş göndererek puan üretilmez. Menüdeki kahve ürünleri ve Iced Latte bu kurala dahildir. İkram kodu müşteri kartında gösterilir; servis ekibi `/loyalty` ekranından hakkı bir kez kullanıma alır ve ikramı sunar.

Tanıma aynı tarayıcı ve sunucu adresine bağlıdır. Çerezleri silmek veya farklı cihaz/adres kullanmak anonim kart erişimini değiştirir. Hesap kurtarma ve cihazlar arası üyelik birleştirme yoktur.

## Yönetim ve kalıcı veri

12 masa, rezervasyonlar, ürün/miktar düzenleme, sipariş notu, mutfak durumları, demo tahsilat, adisyon indirme ve CSV raporları vardır. Müşteri siparişleri yönetim ekranına otomatik eşitlenir. Mutfak durumu adisyonun tamamı için takip edilir.

- Etkin giriş: `index.js`; yönetim: `cafe.js` / `cafe.css`; müşteri: `guest.js` / `guest.css`.
- Ortak ürün ve fiyat kataloğu: `catalog.json`.
- Sunucu: `server.js`, iş kuralları ve QR: `guest-api.cjs`, başlangıç verisi: `seed.cjs`.
- Kalıcı masalar, satışlar, anonim kartlar ve siparişler: repo kökündeki `tmp/cafe-runtime/state.json`.
- QR ve çerez imzalama anahtarı: aynı klasördeki `qr-secret`. Bu klasör Git tarafından yok sayılır; uygulama yeniden başlatıldığında korunur.
- Önceki yerel yönetim verileri ilk başlangıçta sunucuya aktarılır. Sonraki yazmalar sürüm kontrolü kullanır; çakışma varsa eski verilerle yeni siparişin üstüne yazılmaz.
- Sepet, beğeni ve kayıtlar localStorage'da; fal fotoğrafı sadece bellekte kalır.

Bu dosya temelli sunucu yerel demo içindir. Gerçek ödeme, kullanıcı yetkileriyle çok şubeli işletim, üretim veritabanı ve internete yayınlama kapsam dahilinde değildir.

## Fotoğraflar ve videolar

12 ürün fotoğrafı `assets/products/` içinde yerel JPEG dosyalarıdır. Fotoğrafçı, kaynak ve lisans bilgileri `sources.json` içinde, yönetimde “Fotoğraf kaynakları” ve müşteri panelinde “Bu deneyim hakkında” altında bulunur. Orijinal JPEG'ler korunur; kadraj CSS ile uygulanır.

130 video `assets/videos/` içinde yerel MP4 dosyalarıdır. Kaynaklar, dosya adresleri ve yeni içeriklerin lisans bilgileri yanlarındaki `sources.json` dosyasındadır. Müşteri paneli yalnızca yayınlanmış videoların kaynaklarını gösterir. Mixkit'in koleksiyon sayfalarında Free License ile işaretlenen içerikler kullanılır. Ürünler ve videolar örnek kafe içeriğidir.

### Tarihli video yayınları

`video-catalog.json` sabit yayın planıdır. 19 Ekim 2026 başlangıcında 50 video görünür. Kalan 80 video 20 Ekim – 4 Kasım 2026 arasında her gün 5 yeni video olarak açılır. Türkiye saati (`Europe/Istanbul`) sunucuda hesaplanır; 00.00'da o güne ait içerikler otomatik görünür. Önceki içerikler arşivde kalır ve yeni yayınlar en üste gelir. 17 günlük plan sonunda 130 videonun tamamı görünür; bunun ötesinde otomatik yeni içerik üretilmez.

Sunucunun yeniden başlaması tarihleri kaydırmaz. Müşteri tarihi veya URL parametresi yayın saatini değiştiremez; gelecekteki MP4'ler doğrudan adreslerinden de 404 döner. `/videos` sadece localhost'ta açılan aylık takvimi ve korumalı yönetici önizlemesini sunar. Tarih değiştirmek için katalogdaki `publishOn` alanını düzenleyip sunucuyu yeniden başlatın. `build-video-calendar.cjs` mevcut planı yeniden üretir; bilinçli çalıştırılmalıdır. `prepare-video-library.cjs` dosyaları kaynaktan tekrar hazırlamak için isteğe bağlı araçtır; uygulamanın açılması internetten indirme yapmaz.

### PWA

Müşteri uygulaması manifest, 192/512 piksel uygulama simgeleri, maskelenebilir simge, iOS ana ekran meta verileri ve `/guest` kapsamlı service worker içerir. Kahve Kartım veya alt bilgideki “Uygulamayı yükle” seçeneği desteklenen tarayıcıda yükleme penceresi açar; diğerlerinde cihazına göre yönergeler gösterir. Ana ekran başlangıcı `/guest`tir; sipariş için masanın QR kodu okutulur. Menü ve siparişler için uygulama kısayolları vardır.

Kurulum ve service worker güvenli bağlam gerektirir: bilgisayarda localhost, telefonda HTTPS. `http://192.168...` üzerinden telefon kurulumu desteklenmez; menü ve QR siparişi tarayıcıdan kullanılabilir. Gerçek telefona kurulum ayrıca doğrulanmalıdır.

Çevrimdışı açılışta bağlantı ekranı gösterilir. Çevrimdışı sipariş kuyruğu yoktur. Service worker müşteri verilerini, API yanıtlarını, sipariş POST isteklerini veya video dosyalarını önbelleklemez; yalnızca çevrimdışı ekranı ve simgeleri saklar. Açık uygulama bağlantı durumunu gösterir; yeni worker sürümü kullanıcı “Şimdi güncelle”ye bastığında etkinleşir. İkonlar `build-pwa-icons.cjs` ile koddan çizilir.

BOA AppProvider, getTheme, Input ve Button yerel paketlerden kullanılır. DM Sans ve Playfair Display yüklenemezse sistem yazı tiplerine dönülür.

## Doğrulama

```powershell
npm run test:cafe
```

Test; anonim çerez kimliği, imzalı masa doğrulaması, geçersiz ürün/adet reddi, katalog fiyatlandırması, sipariş idempotansı, sürüm çakışması, tahsilat, sadakat ve tek kullanımlı ikram hakkı, QR PNG üretimi ve erişim ayrımını kontrol eder.

Tarayıcıda gerçek video oynatma/kaydırma, QR siparişinin masaya ulaşması, yönetimden mutfağa gönderme ve ödeme, sayfa yenilemesi sonrası kartın korunması, 5 ödenmiş kahvede ikram kodu, oyun tamamlama ve yerel fotoğrafla fal hikâyesi doğrulanmıştır. 390 piksel müşteri görünümü ve yerel ağdaki müşteri erişimi kontrol edilmiştir.
