const scannerResultElement = document.getElementById('scanner-result');
const qrDataInput = document.getElementById('qr-data-input');
const qrcodeContainer = document.getElementById('qrcode-container');
const downloadQrBtn = document.getElementById('download-qr-btn');
const startScannerBtn = document.getElementById('start-scanner-btn');
const stopScannerBtn = document.getElementById('stop-scanner-btn');

let html5QrCode; // Okuyucu nesnesini burada tanımlıyoruz
let isScannerRunning = false;

// --- Sekme Yönetimi ---
function openTab(tabId) {
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-button[onclick="openTab('${tabId}')"]`).classList.add('active');

    // Sekme değiştiğinde okuyucuyu durdur veya başlat
    if (tabId === 'scanner') {
        if (!isScannerRunning) {
            startScanner(); // Okuyucu sekmesine geçince otomatik başlat
        }
    } else {
        stopScanner(); // Diğer sekmeye geçince durdur
    }
}

// --- QR Kod Okuyucu Fonksiyonları ---
function onScanSuccess(decodedText, decodedResult) {
    scannerResultElement.innerText = decodedText;
    console.log(`QR Kodu okundu: ${decodedText}`, decodedResult);
    // İsteğe bağlı: Başarılı bir okumadan sonra tarayıcıyı otomatik durdur.
    // stopScanner(); 
}

function onScanError(errorMessage) {
    // console.warn(`QR Tarayıcı Hatası: ${errorMessage}`);
    // Hata mesajını kullanıcıya göstermek isterseniz burayı düzenleyebilirsiniz
}

function startScanner() {
    if (isScannerRunning) return; // Zaten çalışıyorsa tekrar başlatma

    html5QrCode = new Html5Qrcode("reader"); // "reader" div ID'si
    html5QrCode.start(
        { facingMode: "environment" }, // Arka kamerayı tercih et
        {
            fps: 10, // Saniyedeki kare sayısı
            qrbox: { width: 250, height: 250 } // Tarayıcı kutusu boyutu
        },
        onScanSuccess,
        onScanError
    )
    .then(() => {
        isScannerRunning = true;
        startScannerBtn.disabled = true;
        stopScannerBtn.disabled = false;
        scannerResultElement.innerText = "Kamera başlatıldı, kod bekleniyor...";
        console.log("QR Tarayıcı başlatıldı.");
    })
    .catch((err) => {
        isScannerRunning = false;
        startScannerBtn.disabled = false;
        stopScannerBtn.disabled = true;
        scannerResultElement.innerText = 'Kamera başlatılamadı! Lütfen kamera izinlerini kontrol edin. Hata: ' + err.message;
        console.error("Kamera başlatma hatası: ", err);
    });
}

async function stopScanner() {
    if (!isScannerRunning || !html5QrCode) return;

    try {
        await html5QrCode.stop();
        html5QrCode.clear(); // html5-qrcode'ın kaynaklarını temizler
        isScannerRunning = false;
        startScannerBtn.disabled = false;
        stopScannerBtn.disabled = true;
        scannerResultElement.innerText = "Tarayıcı durduruldu.";
        console.log("QR Tarayıcı durduruldu.");
    } catch (err) {
        console.error("Tarayıcı durdurulurken hata oluştu: ", err);
    }
}

// --- QR Kod Üretici Fonksiyonları ---
let currentQrCode = null; // Mevcut QR kodu nesnesini tutmak için

function generateQrCode() {
    const data = qrDataInput.value;
    qrcodeContainer.innerHTML = ''; // Önceki QR kodu temizlenir
    downloadQrBtn.style.display = 'none'; // İndir butonunu gizle

    if (data.trim() === '') {
        qrcodeContainer.innerHTML = '<p>QR kod oluşturmak için metin veya URL girin.</p>';
        return;
    }

    // `qrcode.js` kütüphanesini kullanarak QR kodu oluşturma
    // Bu kütüphane canvas üzerinde QR kodu çizer
    currentQrCode = new QRCode(qrcodeContainer, {
        text: data,
        width: 256,
        height: 256,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H // Hata düzeltme seviyesi (yüksek)
    });

    // Canvas'tan PNG olarak indirilebilir hale getirme
    setTimeout(() => { // QR kodu oluşana kadar kısa bir bekleme
        const qrCanvas = qrcodeContainer.querySelector('canvas');
        if (qrCanvas) {
            downloadQrBtn.href = qrCanvas.toDataURL('image/png');
            downloadQrBtn.style.display = 'block';
        }
    }, 100);
}

// --- Olay Dinleyicileri ---
startScannerBtn.addEventListener('click', startScanner);
stopScannerBtn.addEventListener('click', stopScanner);

// Sayfa yüklendiğinde varsayılan olarak okuyucu sekmesini aç
document.addEventListener('DOMContentLoaded', () => {
    openTab('scanner'); // Okuyucu sekmesiyle başla
    generateQrCode(); // Üretici sekmesi için başlangıç QR'ını oluştur
});