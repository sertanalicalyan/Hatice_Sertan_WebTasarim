// DOM (Belge Nesne Modeli) Yüklendiğinde Çalışacak Kodlar
document.addEventListener('DOMContentLoaded', () => {

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