# Vercel üzerinde yayınlama

Bu depo hem yerel geliştirmeyi hem Vercel dağıtımını destekler. Vercel sürümü siparişleri, masaları ve anonim sadakat kartlarını **Upstash Redis** içinde saklar. Yönetim ekranı parola korumalıdır. Yerel `npm run cafe` mevcut dosya tabanlı verilerini kullanmaya devam eder.

## Kurulum

1. Vercel'de **Add New → Project** ile `celikonline/cafeautomation` deposunu içe aktarın. Dal: `master`; **Root Directory: repo kökü**; **Framework Preset: Other**. Alt klasörü kök olarak seçmeyin.
2. Vercel Marketplace üzerinden bir **Upstash Redis** veritabanı bağlayın veya mevcut Upstash veritabanınızı kullanın. Marketplace bağlantısının otomatik eklediği `KV_REST_API_URL` ve `KV_REST_API_TOKEN` doğrudan desteklenir; gizli değerleri açıp kopyalamak gerekmez. Doğrudan Upstash bağlantısında `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` çiftini kullanın.
3. Aşağıdaki ortam değişkenlerini **Deploy'a basmadan önce** tanımlayın. Önce bir proje kaydı oluşturmanız gerekirse değişkenleri girdikten sonra **Redeploy** yapın.
4. `vercel.json` kurulum, üretim derlemesi, API yönlendirmeleri, statik dosyalar ve Node.js 24 ayarlarını belirler. Build Command `npm run build:cafe`, Output Directory `build/cafe` olmalıdır. Dev sunucusunu veya Storybook komutunu build komutu olarak kullanmayın.
5. Yayın tamamlandığında `/` adresinde yönetici adı/parolasını girin. `/qr` üzerinden masa kartlarını yazdırın; müşteri girişi `/guest` adresindedir.

## Ortam değişkenleri

| Değişken | Zorunlu | Değer |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Evet | Upstash HTTPS REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Evet | Upstash yazma yetkili REST token |
| `CAFE_QR_SECRET` | Evet | Rastgele, en az 32 karakterlik kalıcı gizli anahtar |
| `CAFE_ADMIN_PASSWORD` | Evet | En az 12 karakterlik yönetici parolası |
| `CAFE_ADMIN_USER` | Hayır | Varsayılan `admin` |
| `CAFE_PUBLIC_URL` | Hayır | Kararlı HTTPS alan adı, ör. `https://kafeniz.vercel.app`. Girilmezse dağıtımın `VERCEL_URL` adresi kullanılır. |
| `CAFE_STORE_KEY` | Hayır | Veri alanı; varsayılan `bahce:production` veya Preview için `bahce:preview`. |

`.env.example` yalnızca değişken adlarını içerir. Gerçek parolaları, token'ı veya QR anahtarını Git'e yazmayın. Vercel değişkenlerini **Build ve Runtime** için, kullandığınız Production/Preview ortamlarında tanımlayın. Preview için ayrı veritabanı veya farklı `CAFE_STORE_KEY` kullanın; üretim siparişlerini test verileriyle karıştırmayın.

Anahtarı kendi terminalinizde oluşturmak için `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` çalıştırıp sonucu `CAFE_QR_SECRET` alanına girin. Anahtarı her yayında değiştirmeyin: QR imzaları, anonim çerezler ve video dosya adresleri bu anahtara bağlıdır. Anahtar değişirse yeniden derleme/yayın gerekir, eski masa QR kodları ve anonim kart erişimleri geçersizleşir. Alan adını değiştirmek de tarayıcı çerezlerinin tanınmasını etkiler.

## Çalışma biçimi

- `api/index.js` Express uygulamasını Vercel Function olarak dışa aktarır. Port dinlemez, Webpack dev middleware çalıştırmaz ve yerel kalıcı dosyaya yazmaz.
- Redis ortak durumu kalıcı tutar. Her istek kendi veri anlık görüntüsünü kullanır. Yazmalar sahiplik kontrollü, süreli Redis kilidiyle sıralanır; veri kaydedilmeden başarı yanıtı verilmez. Soğuk başlangıç ve farklı function örnekleri aynı veriyi okur. Redis bağlantısı kesilirse yazma başarıyla yapılmış gibi gösterilmez.
- İlk bulut kurulumu **12 boş masa ve sıfır satışla** başlar. Yerel demo kayıtları otomatik olarak buluta taşınmaz. Yönetim, QR, sadakat ve yayın takvimi HTTP Basic Authentication ile korunur; Vercel'in HTTPS adresi kullanılmalıdır.
- Yayın başlangıcında 50 video görünür. Kalanlar mevcut `video-catalog.json` takvimine göre Türkiye saatiyle açılır. Takvim 4 Kasım 2026'da 130 videoya ulaşır. Bu tarihten sonra yeni içerik otomatik üretilmez; katalog genişletilerek yeniden yayın yapılabilir.
- MP4 dosyaları derlemede Vercel'in statik sunumuna kopyalanır. `/media/...` API'si yayın tarihini kontrol eder ve yayınlanmış dosyayı CDN adresine yönlendirir. Böylece büyük MP4'ler function yanıtına dahil edilmez. Dosya adları gizli anahtarla türetilir; gelecekteki adresler müşteri kataloğunda açıklanmaz. Yönetici önizlemesi adresi açabilir. CDN dosyaları herkese açık varlıklardır: bir dosyanın tam adresini bilen kişi daha sonra da açabilir; bu mekanizma özel videolar için erişim kontrolü değildir.
- PWA, HTTPS yayında manifest, uygulama simgeleri ve çevrimdışı bilgilendirme ekranıyla çalışır. Çevrimdışı sipariş kuyruğu yoktur.
- `/api/health` yapılandırılmış API'nin açıldığını gösterir; Redis bağlantısını denemek için yönetimde `/api/admin/state` isteğinin başarılı olduğunu kontrol edin.

Redis'te tüm işletme durumu tek JSON kayıt olarak saklanır; bu sürüm küçük tek kafe işletimi içindir. Sipariş/satış arşivi büyüdüğünde kayıtları ayrı tablolara/anahtarlara taşıyan bir veri modeli kullanılmalıdır.

## Yayın öncesi doğrulama

```powershell
npm run test:cafe
# Kendi yerel oturumunuzda CAFE_QR_SECRET tanımlı olmalı:
npm run build:cafe
```

Üretim derlemesi `build/cafe` altında istemci paketini, ürün fotoğraflarını, PWA dosyalarını ve 130 statik videoyu hazırlar. Bu klasör ve yerel müşteri verileri Git'e eklenmez. Yerel önizleme için `npm run cafe` kullanılmaya devam edilir.

Testler; yerel akışa ek olarak farklı sunucu örneklerinde aynı siparişlerin görünmesini, eşzamanlı siparişlerin birbirini ezmemesini, müşteri ayrımını, başarısız kaydetmede hata yanıtını, yönetici korumasını, kilit sahipliğini ve tarih kontrollü CDN yönlendirmesini kontrol eder. Bulut testleri yalıtılmış Redis komut taklidi kullanır. Gerçek Vercel/Upstash bağlantısı ve telefona PWA kurulumu yayın sonrasında ayrıca denenmelidir.

Kaynaklar: [Vercel proje yapılandırması](https://vercel.com/docs/project-configuration/vercel-json), [Node.js sürümleri](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Function sınırları](https://vercel.com/docs/functions/limitations), [Upstash REST API](https://upstash.com/docs/redis/features/restapi).
