const fs = require('fs');
let file = fs.readFileSync('server.js', 'utf8');

const dict = {
  "Bağlantı yok": "Not connected",
  "🔌 Bağlan": "🔌 Connect",
  "⏻ Kapat": "⏻ Power Off",
  "📱 Uygulamalar": "📱 Apps",
  "🖱 Sürükle: İmleç hareket<br>Dokun: Tıkla<br>İki parmak: Kaydır": "🖱 Drag: Move Cursor<br>Tap: Click<br>2 Fingers: Scroll",
  "🖱 Sol Tık": "🖱 Left Click",
  "↩ Geri": "↩ Back",
  "🏠 Ana": "🏠 Home",
  "✕ Çık": "✕ Exit",
  "Ses": "Volume",
  "Kanal": "Channel",
  "Medya Kontrol": "Media Control",
  "Numara Tuşları": "Number Pad",
  "TV Tarayıcısı": "TV Browser",
  "URL girin...": "Enter URL...",
  "Metin Gönder (Klavye)": "Send Text (Keyboard)",
  "TV'ye metin yaz...": "Type text to TV...",
  "📺 Direkt Film Oynat (Altyazı Destekli)": "📺 Direct Movie Play (w/ Subtitles)",
  "Video Linki: https://...mp4, .m3u8": "Video Link: https://...mp4, .m3u8",
  "Altyazı Linki (İsteğe Bağlı): https://...vtt veya .srt": "Subtitle Link (Optional): https://...vtt or .srt",
  "Filmi Oynat 🍿": "Play Movie ��",
  "Eski Yöntem (Sadece Video - Sıfır Tarayıcı)": "Legacy Mode (Video Only - Zero Browser)",
  "<strong>Nasıl Çalışır?</strong> \\\"Filmi Oynat\\\" tuşu, TV'nin tarayıcısında reklamsız, sapsade, çökme yapmayan özel bir oynatıcı sayfası açar (JavaScript şişkinliği yoktur). Altyazı URL'si eklersen otomatik entegre olur.": "<strong>How it works:</strong> Opens a zero-javascript, crash-free, ultra-light video player on the TV. Subtitles are natively injected.",
  "TV bağlı değil": "TV not connected",
  "Uygulama bulunamadı": "No apps found",
  "🚀 Uygulama başlatıldı": "🚀 App launched",
  "🌐 URL gönderildi": "🌐 URL sent",
  "🍿 Özel oynatıcı TV tarayıcısında açılıyor!": "🍿 Custom player is opening on TV browser!",
  "⚡ Doğrudan TV medya oynatıcısı başlatıldı!": "⚡ Native TV media player launched!",
  "⌨️ Metin gönderildi": "⌨️ Text sent",
  "Yükleniyor...": "Loading..."
};

// First, insert language toggle button in header
const headerMatch = '<div class="header">\n    <h1>📺 LG TV Kumanda</h1>';
file = file.replace(headerMatch, `<div class="header">
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <h1 style="margin:0; font-size:18px;">📺 <span data-tr="LG TV Kumanda">LG TV Remote</span></h1>
      <select id="langSelect" onchange="changeLang(this.value)" style="background:var(--surface); color:var(--text); border:1px solid var(--border); border-radius:6px; padding:4px; outline:none;">
        <option value="en">EN</option>
        <option value="tr">TR</option>
      </select>
    </div>`);

// Replace strings and set up data-tr tags for bilingual support
for (const [tr, en] of Object.entries(dict)) {
  // If it's an attribute like placeholder, just replace it directly without span for now, or handle specifically
  if (tr === "URL girin..." || tr === "TV'ye metin yaz..." || tr.includes("Video Linki:") || tr.includes("Altyazı Linki")) {
      file = file.split(`placeholder="${tr}"`).join(`placeholder="${en}" data-tr-placeholder="${tr}"`);
  } else if (tr.includes("Nasıl Çalışır") || tr.includes("Sürükle: İmleç")) {
      // raw HTML replacement
      file = file.split(tr).join(`<span class="i18n" data-tr='${tr}'>${en}</span>`);
  } else {
      // standard text replacement in tags or JS strings
      // for js strings
      file = file.split(`'${tr}'`).join(`'${en}'`);
      // for html
      file = file.split(`>${tr}<`).join(` class="i18n" data-tr="${tr}">${en}<`);
  }
}

// Ensure the i18n script is injected at the end of window.onload
const scriptInjection = `
  // I18N Logic
  function changeLang(lang) {
    localStorage.setItem('lang', lang);
    document.getElementById('langSelect').value = lang;
    document.querySelectorAll('.i18n').forEach(el => {
      if (lang === 'tr' && el.getAttribute('data-tr')) {
        // Save english to a temp attr if not exists
        if (!el.getAttribute('data-en')) el.setAttribute('data-en', el.innerHTML);
        el.innerHTML = el.getAttribute('data-tr');
      } else if (lang === 'en' && el.getAttribute('data-en')) {
        el.innerHTML = el.getAttribute('data-en');
      }
    });
    document.querySelectorAll('[data-tr-placeholder]').forEach(el => {
      if (!el.getAttribute('data-en-placeholder')) el.setAttribute('data-en-placeholder', el.getAttribute('placeholder'));
      el.setAttribute('placeholder', lang === 'tr' ? el.getAttribute('data-tr-placeholder') : el.getAttribute('data-en-placeholder'));
    });
  }
  
  // init lang
  document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('lang') || 'en';
    changeLang(savedLang);
  });
`;

file = file.replace('// ─── Control variables', scriptInjection + '\n  // ─── Control variables');

fs.writeFileSync('server.js', file);
console.log('Translation applied successfully.');
