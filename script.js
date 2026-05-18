/* ==========================================================================
   1. VERİ MODELİ VE LOCALSTORAGE YÖNETİMİ
   ========================================================================== */

// Uygulama ilk açıldığında boş kalmasın diye varsayılan bir veri seti oluşturuyoruz
const varsayilanVeri = {
    listeler: [
        {
            id: "liste-1",
            ad: "İngilizce B1 Kelimeler",
            dil: "İngilizce",
            kategori: "dil",
            renk: "#2563eb",
            emoji: "🇬🇧",
            kartlar: [
                { id: "kart-1", onYuz: "Book", arkaYuz: "Kitap", ornek: "I am reading a book.", durum: "yeni", dogru: 0, yanlis: 0 },
                { id: "kart-2", onYuz: "Apple", arkaYuz: "Elma", ornek: "An apple a day.", durum: "yeni", dogru: 0, yanlis: 0 },
                { id: "kart-3", onYuz: "Pencil", arkaYuz: "Kurşun Kalem", ornek: "", durum: "yeni", dogru: 0, yanlis: 0 }
            ]
        }
    ],
    istatistikler: {
        seriGunu: 0,
        gunlukHedef: 20,
        bugunCalisilan: 0,
        sonCalismaTarihi: null
    }
};

// Tarayıcıdan verileri çeken fonksiyon
function verileriGetir() {
    const kayitliVeri = localStorage.getItem('flashcardVerileri');
    if (kayitliVeri) {
        return JSON.parse(kayitliVeri); // String'i tekrar JS nesnesine çevirir
    } else {
        // Kullanıcı siteye ilk kez giriyorsa varsayılan veriyi kaydet ve döndür
        localStorage.setItem('flashcardVerileri', JSON.stringify(varsayilanVeri));
        return varsayilanVeri;
    }
}

// Verilerde değişiklik yapıldığında tarayıcıya geri kaydeden fonksiyon
function verileriKaydet(veri) {
    localStorage.setItem('flashcardVerileri', JSON.stringify(veri));
}

// Uygulama verisini global bir değişkene alıyoruz ki her yerden erişebilelim
let appVeri = verileriGetir();

// DOM (Belge Nesne Modeli) Yüklendiğinde Çalışacak Kodlar
document.addEventListener('DOMContentLoaded', () => {

/* ==========================================================================
   2. LİSTELERİM SAYFASI (Dinamik Render ve CRUD)
   ========================================================================== */
const listelerKonteyner = document.getElementById('listeler-konteyner');
const yeniListeFormu = document.getElementById('yeni-liste-formu');

// Sayfa yüklendiğinde sadece "Listelerim" sayfasındaysak bu kodlar çalışsın
if (listelerKonteyner) {
    // Arama ve Filtreleme Elementleri
    const listeAramaInput = document.getElementById('liste-arama');
    const kategoriFiltreSelect = document.getElementById('kategori-filtre');

    function listeleriEkranaBas() {
        listelerKonteyner.innerHTML = ''; // Önce konteyneri temizle
        
        // Kullanıcının yazdığı arama kelimesini ve seçtiği kategoriyi al
        const aramaMetni = listeAramaInput ? listeAramaInput.value.toLowerCase() : '';
        const seciliKategori = kategoriFiltreSelect ? kategoriFiltreSelect.value : 'hepsi';

        // Listeleri bu kriterlere göre filtrele
        const filtrelenmisListeler = appVeri.listeler.filter(liste => {
            const aramaUyumu = liste.ad.toLowerCase().includes(aramaMetni) || liste.dil.toLowerCase().includes(aramaMetni);
            const kategoriUyumu = seciliKategori === 'hepsi' || liste.kategori === seciliKategori;
            return aramaUyumu && kategoriUyumu;
        });

        if (filtrelenmisListeler.length === 0) {
            listelerKonteyner.innerHTML = '<p class="bos-uyari">Bu arama veya filtre kriterine uygun liste bulunamadı.</p>';
            return;
        }

        // Filtrelenmiş listeleri ekrana bas
        filtrelenmisListeler.forEach(liste => {
            const toplamKart = liste.kartlar.length;
            const ogrenilenKart = liste.kartlar.filter(k => k.durum === 'öğrenildi').length;
            const yuzde = toplamKart === 0 ? 0 : Math.round((ogrenilenKart / toplamKart) * 100);

            const listeKarti = document.createElement('div');
            listeKarti.className = 'liste-karti';
            listeKarti.style.borderTop = `4px solid ${liste.renk}`;
            
            listeKarti.innerHTML = `
                <div class="liste-ust">
                    <span class="liste-ikonu" style="background-color: ${liste.renk}20;">${liste.emoji}</span>
                    <div class="liste-baslik">
                        <h4>${liste.ad}</h4>
                        <span class="liste-kategori">${liste.dil}</span>
                    </div>
                </div>
                <div class="liste-istatistik">
                    <p><strong>${toplamKart}</strong> Kart</p>
                    <div class="mini-progress-arka">
                        <div class="mini-progress-dolu" style="width: ${yuzde}%; background-color: ${liste.renk};"></div>
                    </div>
                    <p style="font-size: 0.8rem; color: var(--renk-metin-acik); margin-top: 5px;">%${yuzde} Öğrenildi</p>
                </div>
                <div class="liste-aksiyonlar">
                    <button class="btn-ikincil btn-kucuk" onclick="window.location.href='./kartlar.html?liste=${liste.id}'">Kartları Yönet</button>
                    <button class="btn-sil btn-kucuk" onclick="listeSil('${liste.id}')">Sil</button>
                </div>
            `;
            listelerKonteyner.appendChild(listeKarti);
        });
    }

    // Arama kutusuna yazıldıkça veya kategori değiştikçe ekranı anında güncelle
    if(listeAramaInput) listeAramaInput.addEventListener('input', listeleriEkranaBas);
    if(kategoriFiltreSelect) kategoriFiltreSelect.addEventListener('change', listeleriEkranaBas);

    // --- YENİ EKLENEN: Butonla Form Aç/Kapat Mantığı ---
    const btnYeniListeAc = document.getElementById('btn-yeni-liste-ac');
    const yeniListeFormAlani = document.getElementById('yeni-liste-form-alani');
    const btnFormIptal = document.getElementById('btn-form-iptal');
    const butonKapsayici = document.getElementById('yeni-liste-buton-kapsayici');

    if (btnYeniListeAc && yeniListeFormAlani) {
        btnYeniListeAc.addEventListener('click', () => {
            yeniListeFormAlani.style.display = 'block';
            butonKapsayici.style.display = 'none'; // Aç butonunu gizle
            yeniListeFormAlani.scrollIntoView({ behavior: 'smooth' }); // Form açılınca oraya kaydır
        });

        btnFormIptal.addEventListener('click', () => {
            yeniListeFormAlani.style.display = 'none';
            butonKapsayici.style.display = 'block'; // Aç butonunu geri getir
        });
    }

    // Yeni Liste Formu Gönderildiğinde
    if (yeniListeFormu) {
        yeniListeFormu.addEventListener('submit', (e) => {
            e.preventDefault(); // Sayfanın yenilenmesini engelle
            
            const yeniListe = {
                id: 'liste-' + Date.now(), // Benzersiz ID oluştur
                ad: document.getElementById('liste-adi').value,
                dil: document.getElementById('liste-dili').value,
                kategori: document.getElementById('liste-kategori').value,
                renk: document.getElementById('liste-renk').value,
                emoji: document.getElementById('liste-emoji').value,
                kartlar: [] // Yeni liste boş başlar
            };

            appVeri.listeler.push(yeniListe);
            verileriKaydet(appVeri); // LocalStorage'a kaydet
            listeleriEkranaBas(); // Ekranı güncelle
            yeniListeFormu.reset(); // Formu temizle
            
            // YENİ EKLENEN: Kaydettikten sonra formu kapat ve butonu geri getir
            if(yeniListeFormAlani) {
                yeniListeFormAlani.style.display = 'none';
                butonKapsayici.style.display = 'block';
            }
        });
    }

    // Sayfa açıldığında mevcut listeleri ekrana bas
    listeleriEkranaBas();
}

// Liste Silme Fonksiyonu (Her yerden erişilebilmesi için window nesnesine ekliyoruz)
window.listeSil = function(id) {
    if(confirm('Bu listeyi ve içindeki tüm kartları silmek istediğinize emin misiniz?')) {
        // Seçilen listeyi filtreleyerek çıkar
        appVeri.listeler = appVeri.listeler.filter(liste => liste.id !== id);
        verileriKaydet(appVeri); // Değişikliği kaydet
        if(listelerKonteyner) listeleriEkranaBas(); // Eğer Listeler sayfasındaysak ekranı güncelle
    }
};

    // --- YAN MENÜ AÇMA/KAPATMA İŞLEMİ ---
    const menuButon = document.getElementById('menu-buton');
    const yanMenu = document.getElementById('yan-menu');

    // Menü butonuna tıklandığında
    if (menuButon && yanMenu) {
        menuButon.addEventListener('click', (olay) => {
            yanMenu.classList.toggle('acik');
            olay.stopPropagation(); // Tıklama olayının belgeye yayılmasını engeller
        });
    }

    // Menü açıkken sayfanın boş bir yerine tıklanırsa menüyü şıkça kapat
    document.addEventListener('click', (olay) => {
        if (yanMenu && yanMenu.classList.contains('acik')) {
            if (!yanMenu.contains(olay.target) && !menuButon.contains(olay.target)) {
                yanMenu.classList.remove('acik');
            }
        }
    });

});

/* ==========================================================================
   3. KART YÖNETİMİ SAYFASI (Tekli, Toplu Ekleme ve Listeleme)
   ========================================================================== */
const listeSecici = document.getElementById('aktif-liste-secici');
const kartlarIzgara = document.getElementById('kartlar-listesi-izgara');
const yeniKartFormu = document.getElementById('yeni-kart-formu');
const btnTopluEkle = document.getElementById('btn-toplu-ekle');

// Eğer Kart Yönetimi sayfasındaysak bu kodlar çalışsın
if (listeSecici) {
    
    // 1. Sayfa açıldığında "Listeler" verisini Seçim Kutusuna (Select) Doldur
    function listeleriSeciciyeYukle() {
        listeSecici.innerHTML = '<option value="">-- Bir Liste Seçin --</option>';
        appVeri.listeler.forEach(liste => {
            const option = document.createElement('option');
            option.value = liste.id;
            option.textContent = `${liste.emoji} ${liste.ad}`;
            listeSecici.appendChild(option);
        });

        // "Listelerim" sayfasından "Kartları Yönet" butonuna basılarak gelindiyse listeyi otomatik seç
        const urlParams = new URLSearchParams(window.location.search);
        const urlListeId = urlParams.get('liste');
        if (urlListeId) {
            listeSecici.value = urlListeId;
            kartlariEkranaBas(); // Otomatik olarak o listenin kartlarını aşağıya getir
        }
    }

    // 2. Seçilen Listenin İçindeki Kartları Aşağıdaki Ekrana Bas
    function kartlariEkranaBas() {
        const seciliListeId = listeSecici.value;
        kartlarIzgara.innerHTML = '';

        if (!seciliListeId) {
            kartlarIzgara.innerHTML = '<p class="bos-uyari">Lütfen kartları görüntülemek için yukarıdan bir liste seçin.</p>';
            return;
        }

        const seciliListe = appVeri.listeler.find(l => l.id === seciliListeId);
        
        if (seciliListe.kartlar.length === 0) {
            kartlarIzgara.innerHTML = '<p class="bos-uyari">Bu listede henüz kart yok. Yukarıdaki formları kullanarak hemen kelime ekleyebilirsiniz.</p>';
            return;
        }

        // Kartları listele
        seciliListe.kartlar.forEach(kart => {
            const kartDiv = document.createElement('div');
            kartDiv.className = 'yonetim-karti';
            kartDiv.innerHTML = `
                <div class="kart-icerik-ust">
                    <div class="yuzler">
                        <p><strong>Ön:</strong> ${kart.onYuz}</p>
                        <p><strong>Arka:</strong> ${kart.arkaYuz}</p>
                    </div>
                    <span class="durum-etiket durum-${kart.durum}">${kart.durum.toUpperCase()}</span>
                </div>
                ${kart.ornek ? `<p class="ornek-metin"><em>Örnek:</em> ${kart.ornek}</p>` : ''}
                <div class="liste-aksiyonlar" style="margin-top:1rem; border-top: 1px solid #f1f5f9; padding-top: 1rem;">
                    <button class="btn-ikincil btn-kucuk">Düzenle</button> 
                    <button class="btn-sil btn-kucuk" onclick="kartSil('${seciliListeId}', '${kart.id}')">Sil</button>
                </div>
            `;
            kartlarIzgara.appendChild(kartDiv);
        });
    }

    // Select kutusunda başka bir liste seçilirse ekranı hemen güncelle
    listeSecici.addEventListener('change', kartlariEkranaBas);

    // 3. Tek Tek Form Üzerinden Kart Ekleme İşlemi
    if (yeniKartFormu) {
        yeniKartFormu.addEventListener('submit', (e) => {
            e.preventDefault();
            const seciliListeId = listeSecici.value;
            if (!seciliListeId) {
                alert("Lütfen kartı kaydetmeden önce yukarıdan bir liste seçin!");
                return;
            }

            const yeniKart = {
                id: 'kart-' + Date.now(),
                onYuz: document.getElementById('kart-on-yuz').value,
                arkaYuz: document.getElementById('kart-arka-yuz').value,
                ornek: document.getElementById('kart-ornek-cumle').value,
                durum: 'yeni', // Kılavuz kuralı: Tüm yeni kartlar 'yeni' statüsünde başlar
                dogru: 0,
                yanlis: 0
            };

            const seciliListe = appVeri.listeler.find(l => l.id === seciliListeId);
            seciliListe.kartlar.push(yeniKart);
            verileriKaydet(appVeri); // LocalStorage'a yaz
            kartlariEkranaBas();     // Ekranı güncelle
            yeniKartFormu.reset();   // Formu temizle
        });
    }

    // 4. KILAVUZ ZORUNLULUĞU: Toplu Metin Yapıştırarak Kart Ekleme 
    if (btnTopluEkle) {
        btnTopluEkle.addEventListener('click', () => {
            const seciliListeId = listeSecici.value;
            if (!seciliListeId) {
                alert("Lütfen toplu ekleme yapılacak listeyi yukarıdan seçin!");
                return;
            }

            const metinKutusu = document.getElementById('toplu-kart-metin');
            const metin = metinKutusu.value.trim();
            
            if (!metin) {
                alert("Lütfen önce metin kutusuna 'kelime; anlam' formatında kelimelerinizi yapıştırın.");
                return;
            }

            const satirlar = metin.split('\n'); // Her satırı ayır 
            let eklenenSayisi = 0;
            const seciliListe = appVeri.listeler.find(l => l.id === seciliListeId);

            satirlar.forEach((satir, index) => {
                const parcalar = satir.split(';'); // Noktalı virgüle göre ayır 
                if (parcalar.length >= 2) {
                    const yeniKart = {
                        id: 'kart-' + Date.now() + index, // Benzersiz ID
                        onYuz: parcalar[0].trim(),
                        arkaYuz: parcalar[1].trim(),
                        ornek: '',
                        durum: 'yeni',
                        dogru: 0,
                        yanlis: 0
                    };
                    seciliListe.kartlar.push(yeniKart);
                    eklenenSayisi++;
                }
            });

            if (eklenenSayisi > 0) {
                verileriKaydet(appVeri);
                kartlariEkranaBas();
                metinKutusu.value = ''; // Kutuyu temizle
                alert(`${eklenenSayisi} adet kart başarıyla oluşturuldu ve listeye eklendi!`);
            } else {
                alert("Uygun formatta kelime bulunamadı. Lütfen her satırın 'kelime; anlam' şeklinde olduğuna emin olun.");
            }
        });
    }

    // Sayfa ilk yüklendiğinde çalışacak başlangıç ayarları
    listeleriSeciciyeYukle();
}

// Kart Silme Fonksiyonu (Tüm dosyalardan erişilebilmesi için Window nesnesinde)
window.kartSil = function(listeId, kartId) {
    if(confirm('Bu kelime kartını silmek istediğinize emin misiniz?')) {
        const liste = appVeri.listeler.find(l => l.id === listeId);
        liste.kartlar = liste.kartlar.filter(k => k.id !== kartId); // Silinen kartı filtrele
        verileriKaydet(appVeri);
        // Eğer o an kartlar sayfasındaysak ekranı anında güncelle
        if(document.getElementById('kartlar-listesi-izgara')) {
            document.getElementById('aktif-liste-secici').dispatchEvent(new Event('change'));
        }
    }
};

/* ==========================================================================
   4. ÇALIŞMA MODU: 3D Kart Çevirme Dinamikleri
   ========================================================================== */
const aktifKartSahnesi = document.getElementById('aktif-kart');

if (aktifKartSahnesi) {
    // 1. Kılavuz Kuralı: Tıklama ile kartı çevir 
    aktifKartSahnesi.addEventListener('click', () => {
        aktifKartSahnesi.classList.toggle('dondur');
    });

    // 2. Kılavuz Kuralı: Klavye Kısayolu (Space tuşu) ile çevir 
    document.addEventListener('keydown', (e) => {
        // Kullanıcı bir input veya textarea içindeyse boşluk tuşu kartı çevirmesin
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        if (e.code === 'Space') {
            e.preventDefault(); // Boşluk tuşunun sayfayı aşağı kaydırmasını engeller
            aktifKartSahnesi.classList.toggle('dondur');
        }
    });
}

/* ==========================================================================
   5. ÇALIŞMA MODU: Öğrenme Algoritması ve Oyun Motoru
   ========================================================================== */
const calismaListeSecici = document.getElementById('calisma-liste-secici');
const modSecici = document.getElementById('mod-secici');
const btnDogru = document.getElementById('btn-dogru');
const btnYanlis = document.getElementById('btn-yanlis');
const ilerlemeCubugu = document.getElementById('ilerleme-cubugu');
const kartOnYuz = document.querySelector('.kart-on p');
const kartArkaYuz = document.querySelector('.kart-arka p');

let calisilacakKartlar = [];
let aktifKartIndex = 0;
let oturumDogru = 0;
let oturumYanlis = 0;

if (modSecici && btnDogru && calismaListeSecici) {

    // --- SÖZLÜ SAVUNMA İÇİN KRİTİK: FISHER-YATES ALGORİTMASI ---
    function fisherYatesKaristir(dizi) {
        let kopyaDizi = [...dizi]; 
        // Dizinin sonundan başlayıp geriye doğru sayar
        for (let i = kopyaDizi.length - 1; i > 0; i--) {
            // Rastgele bir indeks seçer
            const j = Math.floor(Math.random() * (i + 1));
            // Mevcut eleman ile rastgele seçilen elemanın yerini takas eder (Swap)
            [kopyaDizi[i], kopyaDizi[j]] = [kopyaDizi[j], kopyaDizi[i]]; 
        }
        return kopyaDizi;
    }

    // Çalışma oturumunu başlatan fonksiyon
    window.calismayiBaslat = function() {
        const seciliListeId = calismaListeSecici.value;
        if (!seciliListeId) return;

        const seciliListe = appVeri.listeler.find(l => l.id === seciliListeId);
        const mod = modSecici.value;

        // Kılavuz Modları
        if (mod === 'rastgele') {
            calisilacakKartlar = fisherYatesKaristir(seciliListe.kartlar);
        } else if (mod === 'yanlislar') {
            // 1. KONTROL: Bu liste daha önce hiç çözülmüş mü? 
            // (Tüm kartların doğru ve yanlış sayıları 0 ise bu liste hiç çözülmemiştir)
            const hicCozulmediMi = seciliListe.kartlar.every(k => k.dogru === 0 && k.yanlis === 0);
            
            if (hicCozulmediMi) {
                // Ekranı temizle ve uyarı mesajı bas
                kartOnYuz.innerHTML = `<span style="font-size: 1.5rem; color: var(--renk-hata);">⚠️ Uyarı</span>`;
                kartArkaYuz.innerHTML = `<span style="font-size: 1.2rem; color: var(--renk-metin); font-weight: 500;">Bu listeyi daha önce çözmediniz!</span>`;
                calisilacakKartlar = [];
                ilerlemeCubugu.style.width = '0%';
                return; // Fonksiyondan çık, oturumu başlatma
            }

            // 2. KONTROL: Çözülmüşse, sadece daha önce en az 1 kez yanlış yapılan kartları filtrele
            calisilacakKartlar = seciliListe.kartlar.filter(k => k.yanlis > 0);
            
            // Eğer liste daha önce çözülmüş ama kullanıcının hiç yanlışı yoksa (kusursuz başarı durumu)
            if (calisilacakKartlar.length === 0) {
                kartOnYuz.innerHTML = `<span style="font-size: 1.5rem; color: var(--renk-basari);">🎉 Tebrikler</span>`;
                kartArkaYuz.innerHTML = `<span style="font-size: 1.2rem; color: var(--renk-metin); font-weight: 500;">Bu listede hiç yanlışınız yok!</span>`;
                ilerlemeCubugu.style.width = '100%';
                return;
            }
        } else {
            calisilacakKartlar = [...seciliListe.kartlar]; // Sıralı Mod
        }

        if(calisilacakKartlar.length === 0) {
            kartOnYuz.textContent = "Kart Yok";
            kartArkaYuz.textContent = "Eklenecek kelime kalmadı.";
            return;
        }

        aktifKartIndex = 0;
        oturumDogru = 0;
        oturumYanlis = 0;
        kartGoster();
    };

    function kartGoster() {
        // Liste bittiyse özeti göster
        if (aktifKartIndex >= calisilacakKartlar.length) {
            oturumBitti();
            return;
        }

        // Kart o an arkaya dönükse, önce ön yüzüne çevir
        if (aktifKartSahnesi.classList.contains('dondur')) {
            aktifKartSahnesi.classList.remove('dondur');
        }

        const mevcutKart = calisilacakKartlar[aktifKartIndex];
        
        // Göz yormaması için 150ms gecikme ile yazıyı değiştiriyoruz
        setTimeout(() => {
            kartOnYuz.textContent = mevcutKart.onYuz;
            kartArkaYuz.textContent = mevcutKart.arkaYuz;
        }, 150);

        // İlerleme çubuğunu CSS ile genişlet
        const yuzde = (aktifKartIndex / calisilacakKartlar.length) * 100;
        ilerlemeCubugu.style.width = `${yuzde}%`;
    }

    function cevapVer(dogruMu) {
        if(calisilacakKartlar.length === 0 || aktifKartIndex >= calisilacakKartlar.length) return;

        const mevcutKart = calisilacakKartlar[aktifKartIndex];
        // Veritabanımızdaki asıl kartı buluyoruz ki durumunu kaydedelim
        const gercekListe = appVeri.listeler.find(l => l.id === calismaListeSecici.value);
        const gercekKart = gercekListe.kartlar.find(k => k.id === mevcutKart.id);

        if (dogruMu) {
            oturumDogru++;
            gercekKart.dogru++;
            // Kural: 3 Doğru cevapta kart "Öğrenildi" statüsüne geçer
            gercekKart.durum = gercekKart.dogru >= 3 ? 'öğrenildi' : 'öğreniliyor';
        } else {
            oturumYanlis++;
            gercekKart.yanlis++;
            gercekKart.durum = 'öğreniliyor';
            // Kural: Yanlış bilinen kart listeye tekrar eklenir
            calisilacakKartlar.push(mevcutKart); 
        }

        verileriKaydet(appVeri); // Değişikliği kalıcı yap
        aktifKartIndex++;
        kartGoster(); // Sıradaki kartı çağır
    }

    // Buton Tıklamaları
    btnDogru.addEventListener('click', () => cevapVer(true));
    btnYanlis.addEventListener('click', () => cevapVer(false));
    
    // Kılavuz Kuralı: Klavye Kısayolları Overlay
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // YENİ: Escape tuşuna basılırsa çalışma modundan çıkıp ana sayfaya döner
        if (e.key === 'Escape') window.location.href = './index.html'; 
        
        if (e.key === 'ArrowRight') cevapVer(true);
        if (e.key === 'ArrowLeft') cevapVer(false);
        if (e.key === 'r' || e.key === 'R') {
            modSecici.value = modSecici.value === 'sirali' ? 'rastgele' : 'sirali';
            calismayiBaslat();
        }
    });

    // Açılır kutular değiştiğinde çalışmayı yeniden başlat
    modSecici.addEventListener('change', calismayiBaslat);
    calismaListeSecici.addEventListener('change', calismayiBaslat);
    
  // Sayfa yüklendiğinde listeleri 'calismaListeSecici' kutusuna doldur
    appVeri.listeler.forEach(liste => {
        calismaListeSecici.innerHTML += `<option value="${liste.id}">${liste.emoji} ${liste.ad}</option>`;
    });
    
    // === İŞTE BURAYI EKLEDİK: URL'den gelen liste ID'sini okuyup seçme ===
    const urlParams = new URLSearchParams(window.location.search);
    const urlListeId = urlParams.get('liste');
    if (urlListeId) {
        calismaListeSecici.value = urlListeId;
    }
    
    // Ufak bir gecikmeyle ilk oturumu başlat
    setTimeout(calismayiBaslat, 100); 
}


function oturumBitti() {
    ilerlemeCubugu.style.width = '100%';
    const toplamSoru = oturumDogru + oturumYanlis;
    const yuzde = toplamSoru === 0 ? 0 : Math.round((oturumDogru / toplamSoru) * 100);
    
    // DÜZELTME 1: Eğer kart arkaya dönükse, özet ekranını görebilmemiz için otomatik olarak ÖN YÜZE çeviriyoruz
    if (aktifKartSahnesi && aktifKartSahnesi.classList.contains('dondur')) {
        aktifKartSahnesi.classList.remove('dondur');
    }
    
    // DÜZELTME 2: Geçersiz HTML yapısını (p içine div koymayı) önlemek için inline-block span elemanları kullanıyoruz
    kartOnYuz.innerHTML = `
        <span style="font-size: 1.4rem; display: block; margin-bottom: 0.8rem; font-weight: 700; color: var(--renk-ikincil);">🎉 Oturum Bitti!</span>
        <span style="font-size: 1.1rem; display: block; color: var(--renk-basari); font-weight: 600; margin-bottom: 0.2rem;">${oturumDogru} Doğru</span>
        <span style="font-size: 1.1rem; display: block; color: var(--renk-hata); font-weight: 600; margin-bottom: 0.5rem;">${oturumYanlis} Yanlış</span>
        <span style="font-size: 1.1rem; display: block; font-weight: bold; margin-bottom: 1.2rem; padding-top: 0.3rem; border-top: 1px dashed #cbd5e1;">Başarı Oranı: %${yuzde}</span>
        <button class="btn-ana btn-kucuk" style="margin: 0 auto; display: inline-flex;" onclick="window.calismayiBaslat()">Tekrar Çalış</button>
    `;
    
    if (kartArkaYuz) {
        kartArkaYuz.textContent = "Harika bir çalışma seansı bitti!";
    }
    
    // Her ihtimale karşı istatistik nesnesi boşsa güvenli kurulum yapıyoruz
    if (!appVeri.istatistikler) {
        appVeri.istatistikler = { seriGunu: 0, gunlukHedef: 20, bugunCalisilan: 0, sonCalismaTarihi: null };
    }
    
    // Streak (Seri) işlemleri için günlük kaydı tut
    const bugun = new Date().toLocaleDateString();
    if(appVeri.istatistikler.sonCalismaTarihi !== bugun) {
        appVeri.istatistikler.seriGunu++;
        appVeri.istatistikler.sonCalismaTarihi = bugun;
    }
    appVeri.istatistikler.bugunCalisilan += toplamSoru;
    verileriKaydet(appVeri);
}

/* ==========================================================================
   6. İLERLEME VE İSTATİSTİKLER SAYFASI VERİ MOTORU
   ========================================================================== */
const ilerlemeSayfasi = document.getElementById('ilerleme-sayfasi');

if (ilerlemeSayfasi) {
    function istatistikleriHesapla() {
        let toplamDogru = 0;
        let toplamYanlis = 0;
        let tamOgrenilen = 0;
        let tumKartlar = [];

        // 1. Tüm listelerdeki kart verilerini topla ve analiz et
        appVeri.listeler.forEach(liste => {
            liste.kartlar.forEach(kart => {
                toplamDogru += kart.dogru;
                toplamYanlis += kart.yanlis;
                if (kart.durum === 'öğrenildi') tamOgrenilen++;
                
                // Sadece en az 1 kez yanlış bilinenleri "En Zor Kartlar" listesi için topla
                if (kart.yanlis > 0) {
                    tumKartlar.push({ ...kart, listeAdi: liste.ad });
                }
            });
        });

        // 2. Üst Panel Güncellemeleri
        document.getElementById('stat-seri').textContent = `${appVeri.istatistikler.seriGunu} Gün`;
        document.getElementById('stat-ogrenilen').textContent = `${tamOgrenilen} Kart`;
        
        const toplamCevap = toplamDogru + toplamYanlis;
        const genelDogruluk = toplamCevap === 0 ? 0 : Math.round((toplamDogru / toplamCevap) * 100);
        document.getElementById('stat-dogruluk').textContent = `%${genelDogruluk}`;

        // 3. En Zorlandığın Kartlar (Yanlış sayısına göre büyükten küçüğe sırala)
        const zorKartlarListesi = document.getElementById('zor-kartlar-listesi');
        zorKartlarListesi.innerHTML = '';
        
        // En çok yanlış yapılan ilk 5 kartı bul
        const enZorlar = tumKartlar.sort((a, b) => b.yanlis - a.yanlis).slice(0, 5); 
        
        if (enZorlar.length === 0) {
            zorKartlarListesi.innerHTML = '<p class="bos-uyari" style="color:var(--renk-basari);">Harika! Henüz hiç zorlandığın kart yok.</p>';
        } else {
            enZorlar.forEach(kart => {
                zorKartlarListesi.innerHTML += `
                    <li>
                        <span class="zor-kelime">${kart.onYuz} <span style="font-size:0.8rem; font-weight:normal; color:var(--renk-metin-acik);">(${kart.listeAdi})</span></span>
                        <span class="zor-hata">${kart.yanlis} Kez Hatalı</span>
                    </li>
                `;
            });
        }

        // 4. Her Listenin Ayrı Öğrenilme Yüzdesi (Progress Bar)
        const listeIlerlemeleriAlani = document.getElementById('liste-ilerlemeleri-alani');
        listeIlerlemeleriAlani.innerHTML = '';
        
        appVeri.listeler.forEach(liste => {
            const tKart = liste.kartlar.length;
            const oKart = liste.kartlar.filter(k => k.durum === 'öğrenildi').length;
            const yuzde = tKart === 0 ? 0 : Math.round((oKart / tKart) * 100);

            listeIlerlemeleriAlani.innerHTML += `
                <div class="liste-ilerleme-satiri">
                    <div class="liste-ilerleme-baslik">
                        <span>${liste.emoji} ${liste.ad}</span>
                        <strong>%${yuzde}</strong>
                    </div>
                    <div class="mini-progress-arka">
                        <div class="mini-progress-dolu" style="width: ${yuzde}%; background-color: ${liste.renk};"></div>
                    </div>
                </div>
            `;
        });

        // 5. Mini CSS Grid Takvim (Son 7 Günlük Seri)
        const takvimGrid = document.getElementById('takvim-grid');
        takvimGrid.innerHTML = '';
        const gunler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
        
        const seri = appVeri.istatistikler.seriGunu;
        
        for (let i = 0; i < 7; i++) {
            // Sağdan sola doğru, kullanıcının serisi kadar kutuyu yeşil "aktif" yapar
            const aktifMi = i >= (7 - seri) ? 'aktif' : '';
            takvimGrid.innerHTML += `<div class="takvim-gun ${aktifMi}">${gunler[i]}</div>`;
        }
    }

    istatistikleriHesapla();
}

/* ==========================================================================
   7. ANA SAYFA (DASHBOARD) DİNAMİK YAPI VE BUTONLAR
   ========================================================================== */
const dashboardSonListeler = document.querySelector('.liste-kartlari-kucuk');
const anaSayfaBtnBasla = document.getElementById('btn-basla');

if (dashboardSonListeler && anaSayfaBtnBasla) {
    
    // 1. "Hemen Çalışmaya Başla" butonunu aktifleştir
    anaSayfaBtnBasla.addEventListener('click', () => {
        window.location.href = './calis.html';
    });

    // 2. Ana Sayfadaki İstatistikleri Gerçek Verilerle Güncelle
    const statSeri = document.querySelector('.ates-ikonu + .istatistik-bilgi .sayi');
    const statKelime = document.querySelector('.kelime-ikonu + .istatistik-bilgi .sayi');
    const statHedefBar = document.querySelector('.mini-progress-dolu');
    const statHedefYazi = document.querySelector('.hedef-ikonu + .istatistik-bilgi .sayi');

    if(statSeri && statKelime) {
        let tamOgrenilen = 0;
        appVeri.listeler.forEach(l => l.kartlar.forEach(k => { if(k.durum === 'öğrenildi') tamOgrenilen++; }));
        
        statSeri.textContent = `${appVeri.istatistikler.seriGunu} Gün`;
        statKelime.textContent = `${tamOgrenilen} Kart`;
        
        const hedefYuzdesi = Math.min(100, Math.round((appVeri.istatistikler.bugunCalisilan / appVeri.istatistikler.gunlukHedef) * 100));
        if(statHedefYazi) statHedefYazi.textContent = `%${hedefYuzdesi}`;
        if(statHedefBar) statHedefBar.style.width = `${hedefYuzdesi}%`;
    }

    // 3. Sahte listeleri silip, gerçek listelerini (Son 3 adet) Ana Sayfaya ekle
    dashboardSonListeler.innerHTML = '';
    
    if (appVeri.listeler.length === 0) {
        dashboardSonListeler.innerHTML = '<p style="color: var(--renk-metin-acik);">Henüz hiç listeniz yok. Kart Yönetimi sayfasından yeni listeler oluşturabilirsiniz.</p>';
    } else {
        // En son eklenen 3 listeyi ters çevirerek göster
        const sonListeler = appVeri.listeler.slice(-3).reverse();
        
        sonListeler.forEach(liste => {
            const toplamKart = liste.kartlar.length;
            const ogrenilen = liste.kartlar.filter(k => k.durum === 'öğrenildi').length;
            const yuzde = toplamKart === 0 ? 0 : Math.round((ogrenilen / toplamKart) * 100);

            dashboardSonListeler.innerHTML += `
                <div class="liste-satiri">
                    <span class="liste-ikonu" style="background-color: ${liste.renk}20;">${liste.emoji}</span>
                    <div class="liste-detay">
                        <h4>${liste.ad}</h4>
                        <p>${toplamKart} Kart • %${yuzde} Öğrenildi</p>
                    </div>
                    <button class="btn-ikincil btn-kucuk" onclick="window.location.href='./calis.html?liste=${liste.id}'">Devam Et</button>
                </div>
            `;
        });
    }
}