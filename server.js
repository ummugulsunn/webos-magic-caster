const express = require('express');
const lgtv = require('lgtv2');
const path = require('path');

const app = express();
const PORT = 3333;
const TV_IP = process.env.TV_IP || '192.168.1.148';

let tvConnection = null;
let isConnected = false;
let tvInfo = {};
let currentVolume = 0;
let isMuted = false;
let currentChannel = '';
let currentApp = '';
let pairingKey = null;

// ─── TV Connection ───────────────────────────────────────────
function connectTV() {
  if (tvConnection) {
    try { tvConnection.disconnect(); } catch(e) {}
  }

  console.log(`📺 TV'ye bağlanılıyor: ${TV_IP}...`);

  tvConnection = lgtv({
    url: `ws://${TV_IP}:3000`,
    timeout: 10000,
    reconnect: 3000,
    keyFile: path.join(__dirname, 'tv-key.json')
  });

  tvConnection.on('connect', () => {
    isConnected = true;
    console.log('✅ TV bağlantısı kuruldu!');

    // Subscribe to volume changes
    tvConnection.subscribe('ssap://audio/getVolume', (err, res) => {
      if (!err && res) {
        currentVolume = res.volume || 0;
        isMuted = res.muted || false;
      }
    });

    // Get current foreground app
    tvConnection.subscribe('ssap://com.webos.applicationManager/getForegroundAppInfo', (err, res) => {
      if (!err && res) {
        currentApp = res.appId || '';
      }
    });

    // Get TV info
    tvConnection.request('ssap://system/getSystemInfo', (err, res) => {
      if (!err && res) {
        tvInfo = res;
      }
    });
  });

  tvConnection.on('close', () => {
    isConnected = false;
    console.log('❌ TV bağlantısı kesildi');
  });

  tvConnection.on('error', (err) => {
    console.log('⚠️ TV bağlantı hatası:', err.message || err);
  });

  tvConnection.on('prompt', () => {
    console.log('🔑 TV ekranında eşleştirme isteği gösterildi — TV\'de KABUL ET\'e basın!');
  });
}

// ─── API Routes ──────────────────────────────────────────────
app.use(express.json());

app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    tvIP: TV_IP,
    volume: currentVolume,
    muted: isMuted,
    currentApp,
    tvInfo
  });
});

app.post('/api/connect', (req, res) => {
  connectTV();
  res.json({ ok: true, message: 'Bağlantı başlatıldı...' });
});

// Volume
app.post('/api/volume/up', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://audio/volumeUp', (err, r) => {
    res.json({ ok: !err, volume: currentVolume });
  });
});

app.post('/api/volume/down', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://audio/volumeDown', (err, r) => {
    res.json({ ok: !err, volume: currentVolume });
  });
});

app.post('/api/volume/set', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  const vol = parseInt(req.body.volume) || 0;
  tvConnection.request('ssap://audio/setVolume', { volume: vol }, (err, r) => {
    res.json({ ok: !err });
  });
});

app.post('/api/mute', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://audio/setMute', { mute: !isMuted }, (err, r) => {
    isMuted = !isMuted;
    res.json({ ok: !err, muted: isMuted });
  });
});

// Power
app.post('/api/power/off', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://system/turnOff', (err, r) => {
    res.json({ ok: !err });
  });
});

// Channel
app.post('/api/channel/up', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://tv/channelUp', (err, r) => {
    res.json({ ok: !err });
  });
});

app.post('/api/channel/down', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://tv/channelDown', (err, r) => {
    res.json({ ok: !err });
  });
});

// Navigation (pointer/input socket)
let inputSocket = null;

function getInputSocket(cb) {
  if (inputSocket) return cb(null, inputSocket);
  tvConnection.request('ssap://com.webos.service.networkinput/getPointerInputSocket', (err, r) => {
    if (err) return cb(err);
    const WebSocket = require('ws');
    const ws = new WebSocket(r.socketPath);
    ws.on('open', () => {
      inputSocket = ws;
      cb(null, ws);
    });
    ws.on('close', () => { inputSocket = null; });
    ws.on('error', () => { inputSocket = null; });
  });
}

function sendButton(name, res) {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  getInputSocket((err, sock) => {
    if (err) return res.status(500).json({ error: err.message });
    sock.send(`type:button\nname:${name}\n\n`);
    res.json({ ok: true });
  });
}

// D-Pad & navigation buttons
app.post('/api/button/up', (req, res) => sendButton('UP', res));
app.post('/api/button/down', (req, res) => sendButton('DOWN', res));
app.post('/api/button/left', (req, res) => sendButton('LEFT', res));
app.post('/api/button/right', (req, res) => sendButton('RIGHT', res));
app.post('/api/button/enter', (req, res) => sendButton('ENTER', res));
app.post('/api/button/back', (req, res) => sendButton('BACK', res));
app.post('/api/button/home', (req, res) => sendButton('HOME', res));
app.post('/api/button/exit', (req, res) => sendButton('EXIT', res));

// Media controls
app.post('/api/button/play', (req, res) => sendButton('PLAY', res));
app.post('/api/button/pause', (req, res) => sendButton('PAUSE', res));
app.post('/api/button/stop', (req, res) => sendButton('STOP', res));
app.post('/api/button/rewind', (req, res) => sendButton('REWIND', res));
app.post('/api/button/fastforward', (req, res) => sendButton('FASTFORWARD', res));

// Number pad
for (let i = 0; i <= 9; i++) {
  app.post(`/api/button/${i}`, (req, res) => sendButton(`${i}`, res));
}

// Color buttons
app.post('/api/button/red', (req, res) => sendButton('RED', res));
app.post('/api/button/green', (req, res) => sendButton('GREEN', res));
app.post('/api/button/yellow', (req, res) => sendButton('YELLOW', res));
app.post('/api/button/blue', (req, res) => sendButton('BLUE', res));

// Extra
app.post('/api/button/info', (req, res) => sendButton('INFO', res));
app.post('/api/button/menu', (req, res) => sendButton('MENU', res));

// App launcher
app.post('/api/launch', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  const { appId, params } = req.body;
  tvConnection.request('ssap://system.launcher/launch', { id: appId, params: params || {} }, (err, r) => {
    res.json({ ok: !err, response: r });
  });
});

// Open browser URL on TV
app.post('/api/browser', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  const { url } = req.body;
  tvConnection.request('ssap://system.launcher/open', { target: url }, (err, r) => {
    res.json({ ok: !err, response: r });
  });
});

// List apps
app.get('/api/apps', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://com.webos.applicationManager/listApps', (err, r) => {
    if (err) return res.status(500).json({ error: err.message });
    const apps = (r.apps || []).map(a => ({ id: a.id, title: a.title, icon: a.icon }));
    apps.sort((a, b) => a.title.localeCompare(b.title));
    res.json(apps);
  });
});

// Toast notification
app.post('/api/toast', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  tvConnection.request('ssap://system.notifications/createToast', { message: req.body.message || 'Merhaba!' }, (err, r) => {
    res.json({ ok: !err });
  });
});

// Screenshot
app.post('/api/input/text', (req, res) => {
  if (!isConnected) return res.status(503).json({ error: 'TV bağlı değil' });
  const { text } = req.body;
  tvConnection.request('ssap://com.webos.service.ime/insertText', { text, replace: 0 }, (err, r) => {
    res.json({ ok: !err });
  });
});

// ─── Frontend ────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send(getHTML());
});

// ─── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎮 TV Kumanda: http://localhost:${PORT}`);
  console.log(`📺 TV IP: ${TV_IP}\n`);
  connectTV();
});

// ─── HTML UI ─────────────────────────────────────────────────
function getHTML() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<title>LG TV Kumanda</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0a0a0f;
    --card: #14141f;
    --card-border: rgba(255,255,255,0.06);
    --surface: #1a1a2e;
    --accent: #e21a70;
    --accent-glow: rgba(226, 26, 112, 0.4);
    --green: #00d68f;
    --green-glow: rgba(0, 214, 143, 0.3);
    --blue: #3b82f6;
    --yellow: #f59e0b;
    --red: #ef4444;
    --text: #e8e8f0;
    --text-dim: #6b6b8a;
    --radius: 14px;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
  }

  .container {
    max-width: 420px;
    margin: 0 auto;
    padding: 20px 16px 40px;
  }

  /* Header */
  .header {
    text-align: center;
    padding: 16px 0 20px;
  }
  .header h1 {
    font-size: 20px;
    font-weight: 600;
    background: linear-gradient(135deg, var(--accent), #ff6b9d);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.3px;
  }
  .status-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    padding: 5px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--card-border);
    transition: all 0.3s;
  }
  .status-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--red);
    transition: all 0.3s;
  }
  .status-badge.connected .status-dot {
    background: var(--green);
    box-shadow: 0 0 8px var(--green-glow);
  }
  .status-badge.connected {
    border-color: rgba(0,214,143,0.2);
  }

  /* Section */
  .section {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 12px;
  }
  .section-title {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--text-dim);
    margin-bottom: 12px;
  }

  /* Buttons */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-weight: 500;
    transition: all 0.15s ease;
    -webkit-tap-highlight-color: transparent;
    position: relative;
    overflow: hidden;
  }
  .btn:active {
    transform: scale(0.92);
  }

  /* D-Pad */
  .dpad {
    display: grid;
    grid-template-columns: 64px 64px 64px;
    grid-template-rows: 64px 64px 64px;
    gap: 4px;
    justify-content: center;
    margin: 0 auto;
  }
  .dpad .btn {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background: var(--surface);
    color: var(--text);
    font-size: 22px;
  }
  .dpad .btn:hover {
    background: rgba(255,255,255,0.08);
  }
  .dpad .btn-ok {
    background: var(--accent);
    color: white;
    font-size: 13px;
    font-weight: 700;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    margin: 2px;
    box-shadow: 0 0 20px var(--accent-glow);
  }
  .dpad .btn-ok:hover {
    background: #ff2080;
  }
  .dpad .empty { visibility: hidden; }

  /* Nav row */
  .nav-row {
    display: flex;
    gap: 8px;
    justify-content: center;
    margin-top: 12px;
  }
  .nav-btn {
    flex: 1;
    max-width: 120px;
    height: 44px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
  }
  .nav-btn:hover { background: rgba(255,255,255,0.08); }

  /* Volume */
  .vol-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .vol-btn {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--surface);
    color: var(--text);
    font-size: 20px;
    flex-shrink: 0;
  }
  .vol-btn:hover { background: rgba(255,255,255,0.08); }
  .vol-slider-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .vol-slider {
    flex: 1;
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    background: var(--surface);
    outline: none;
  }
  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: 0 0 10px var(--accent-glow);
  }
  .vol-value {
    font-size: 16px;
    font-weight: 600;
    min-width: 28px;
    text-align: center;
    color: var(--accent);
  }
  .mute-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    font-size: 18px;
    flex-shrink: 0;
  }
  .mute-btn.muted {
    background: var(--red);
    color: white;
  }

  /* Channel */
  .ch-row {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .ch-btn {
    flex: 1;
    height: 48px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    font-weight: 500;
  }
  .ch-btn:hover { background: rgba(255,255,255,0.08); }

  /* Media */
  .media-row {
    display: flex;
    gap: 6px;
    justify-content: center;
  }
  .media-btn {
    flex: 1;
    height: 46px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    font-size: 18px;
  }
  .media-btn:hover { background: rgba(255,255,255,0.08); }

  /* Color buttons */
  .color-row {
    display: flex;
    gap: 6px;
    justify-content: center;
  }
  .color-btn {
    flex: 1;
    height: 14px;
    border-radius: 7px;
    border: none;
    cursor: pointer;
  }
  .color-btn:active { opacity: 0.7; }
  .color-red { background: #ef4444; }
  .color-green { background: #22c55e; }
  .color-yellow { background: #eab308; }
  .color-blue { background: #3b82f6; }

  /* Number pad */
  .numpad {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
  .num-btn {
    height: 48px;
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    font-size: 18px;
    font-weight: 500;
  }
  .num-btn:hover { background: rgba(255,255,255,0.08); }

  /* Power */
  .power-row {
    display: flex;
    gap: 8px;
    justify-content: center;
  }
  .power-btn {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    color: var(--red);
    font-size: 13px;
    font-weight: 500;
  }
  .power-btn:hover {
    background: rgba(239, 68, 68, 0.2);
  }

  /* URL Input */
  .url-group {
    display: flex;
    gap: 8px;
  }
  .url-input {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    border: 1px solid var(--card-border);
    background: var(--surface);
    color: var(--text);
    padding: 0 14px;
    font-family: inherit;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .url-input:focus {
    border-color: var(--accent);
  }
  .url-input::placeholder {
    color: var(--text-dim);
  }
  .url-send-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--accent);
    color: white;
    font-size: 16px;
    flex-shrink: 0;
  }

  /* Text Input */
  .text-group {
    display: flex;
    gap: 8px;
    margin-top: 8px;
  }
  .text-input {
    flex: 1;
    height: 44px;
    border-radius: 10px;
    border: 1px solid var(--card-border);
    background: var(--surface);
    color: var(--text);
    padding: 0 14px;
    font-family: inherit;
    font-size: 13px;
    outline: none;
  }
  .text-input:focus { border-color: var(--blue); }
  .text-input::placeholder { color: var(--text-dim); }
  .text-send-btn {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--blue);
    color: white;
    font-size: 14px;
    flex-shrink: 0;
  }

  /* Quick bookmarks */
  .bookmarks {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }
  .bookmark-btn {
    padding: 6px 12px;
    border-radius: 8px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.15);
    color: var(--blue);
    font-size: 11px;
    font-weight: 500;
    white-space: nowrap;
  }
  .bookmark-btn:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 30px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    padding: 10px 24px;
    border-radius: 10px;
    background: rgba(20,20,30,0.95);
    border: 1px solid var(--card-border);
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    backdrop-filter: blur(20px);
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 100;
    pointer-events: none;
  }
  .toast.show {
    transform: translateX(-50%) translateY(0);
  }

  /* Ripple */
  @keyframes ripple {
    to { transform: scale(3); opacity: 0; }
  }

  /* Apps modal */
  .modal-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    z-index: 50;
    align-items: flex-end;
    justify-content: center;
  }
  .modal-overlay.open { display: flex; }
  .modal {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 20px 20px 0 0;
    width: 100%;
    max-width: 420px;
    max-height: 70vh;
    overflow-y: auto;
    padding: 20px 16px;
    animation: slideUp 0.3s ease;
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
  .modal h3 {
    font-size: 16px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .modal-close {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--surface);
    color: var(--text-dim);
    font-size: 16px;
    border: none;
    cursor: pointer;
  }
  .app-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
  .app-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 6px;
    border-radius: 12px;
    background: var(--surface);
    cursor: pointer;
    transition: all 0.15s;
    border: none;
    color: var(--text);
    font-family: inherit;
  }
  .app-item:hover { background: rgba(255,255,255,0.08); }
  .app-item:active { transform: scale(0.95); }
  .app-item span {
    font-size: 10px;
    text-align: center;
    line-height: 1.2;
    max-height: 24px;
    overflow: hidden;
  }
  .connect-btn-wrap { text-align: center; margin-top: 10px; }
  .connect-btn {
    padding: 10px 28px;
    border-radius: 10px;
    background: var(--green);
    color: #000;
    font-size: 14px;
    font-weight: 600;
    border: none;
    cursor: pointer;
  }
  .connect-btn:hover { opacity: 0.9; }
</style>
</head>
<body>
<div class="container">

  <!-- Header -->
  <div class="header">
    <h1>📺 LG TV Kumanda</h1>
    <div class="status-badge" id="statusBadge">
      <span class="status-dot"></span>
      <span id="statusText">Bağlantı yok</span>
    </div>
    <div class="connect-btn-wrap" id="connectWrap" style="display:none">
      <button class="btn connect-btn" onclick="apiPost('/api/connect')">🔌 Bağlan</button>
    </div>
  </div>

  <!-- Power & Source -->
  <div class="section">
    <div class="power-row">
      <button class="btn power-btn" onclick="apiPost('/api/power/off')">⏻ Kapat</button>
      <button class="btn power-btn" style="color:var(--blue);background:rgba(59,130,246,0.1);border-color:rgba(59,130,246,0.2)" onclick="showApps()">📱 Uygulamalar</button>
      <button class="btn power-btn" style="color:var(--green);background:rgba(0,214,143,0.1);border-color:rgba(0,214,143,0.2)" onclick="apiPost('/api/button/info')">ℹ️ Info</button>
    </div>
  </div>

  <!-- D-Pad -->
  <div class="section">
    <div class="section-title">Yön Tuşları</div>
    <div class="dpad">
      <div class="empty"></div>
      <button class="btn" onclick="apiPost('/api/button/up')">▲</button>
      <div class="empty"></div>
      <button class="btn" onclick="apiPost('/api/button/left')">◀</button>
      <button class="btn btn-ok" onclick="apiPost('/api/button/enter')">OK</button>
      <button class="btn" onclick="apiPost('/api/button/right')">▶</button>
      <div class="empty"></div>
      <button class="btn" onclick="apiPost('/api/button/down')">▼</button>
      <div class="empty"></div>
    </div>
    <div class="nav-row">
      <button class="btn nav-btn" onclick="apiPost('/api/button/back')">↩ Geri</button>
      <button class="btn nav-btn" onclick="apiPost('/api/button/home')">🏠 Ana</button>
      <button class="btn nav-btn" onclick="apiPost('/api/button/exit')">✕ Çık</button>
    </div>
  </div>

  <!-- Volume -->
  <div class="section">
    <div class="section-title">Ses</div>
    <div class="vol-row">
      <button class="btn vol-btn" onclick="apiPost('/api/volume/down')">−</button>
      <div class="vol-slider-wrap">
        <input type="range" class="vol-slider" id="volSlider" min="0" max="100" value="0"
               oninput="setVolume(this.value)">
        <span class="vol-value" id="volValue">0</span>
      </div>
      <button class="btn vol-btn" onclick="apiPost('/api/volume/up')">+</button>
      <button class="btn mute-btn" id="muteBtn" onclick="apiPost('/api/mute')">🔇</button>
    </div>
  </div>

  <!-- Channel -->
  <div class="section">
    <div class="section-title">Kanal</div>
    <div class="ch-row">
      <button class="btn ch-btn" onclick="apiPost('/api/channel/down')">◀ CH −</button>
      <button class="btn ch-btn" onclick="apiPost('/api/channel/up')">CH + ▶</button>
    </div>
  </div>

  <!-- Media -->
  <div class="section">
    <div class="section-title">Medya Kontrol</div>
    <div class="media-row">
      <button class="btn media-btn" onclick="apiPost('/api/button/rewind')">⏪</button>
      <button class="btn media-btn" onclick="apiPost('/api/button/play')">▶️</button>
      <button class="btn media-btn" onclick="apiPost('/api/button/pause')">⏸</button>
      <button class="btn media-btn" onclick="apiPost('/api/button/stop')">⏹</button>
      <button class="btn media-btn" onclick="apiPost('/api/button/fastforward')">⏩</button>
    </div>
  </div>

  <!-- Color Buttons -->
  <div class="section">
    <div class="color-row">
      <button class="btn color-btn color-red" onclick="apiPost('/api/button/red')"></button>
      <button class="btn color-btn color-green" onclick="apiPost('/api/button/green')"></button>
      <button class="btn color-btn color-yellow" onclick="apiPost('/api/button/yellow')"></button>
      <button class="btn color-btn color-blue" onclick="apiPost('/api/button/blue')"></button>
    </div>
  </div>

  <!-- Number Pad -->
  <div class="section">
    <div class="section-title">Numara Tuşları</div>
    <div class="numpad">
      <button class="btn num-btn" onclick="apiPost('/api/button/1')">1</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/2')">2</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/3')">3</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/4')">4</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/5')">5</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/6')">6</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/7')">7</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/8')">8</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/9')">9</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/menu')">☰</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/0')">0</button>
      <button class="btn num-btn" onclick="apiPost('/api/button/back')">⌫</button>
    </div>
  </div>

  <!-- Browser URL -->
  <div class="section">
    <div class="section-title">TV Tarayıcısı</div>
    <div class="url-group">
      <input type="url" class="url-input" id="urlInput" placeholder="URL girin..."
             onkeydown="if(event.key==='Enter')openURL()">
      <button class="btn url-send-btn" onclick="openURL()">→</button>
    </div>
    <div class="bookmarks">
      <button class="btn bookmark-btn" onclick="quickURL('https://dizibox.live')">dizibox.live</button>
      <button class="btn bookmark-btn" onclick="quickURL('https://hdfilmcehennemi.nl')">hdfilmcehennemi</button>
      <button class="btn bookmark-btn" onclick="quickURL('http://192.168.1.140:8090')">TorrServer</button>
      <button class="btn bookmark-btn" onclick="quickURL('http://192.168.1.140:8080')">http-server</button>
    </div>
  </div>

  <!-- Text Input -->
  <div class="section">
    <div class="section-title">Metin Gönder (Klavye)</div>
    <div class="text-group">
      <input type="text" class="text-input" id="textInput" placeholder="TV'ye metin yaz..."
             onkeydown="if(event.key==='Enter')sendText()">
      <button class="btn text-send-btn" onclick="sendText()">⌨</button>
    </div>
  </div>

</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<!-- Apps Modal -->
<div class="modal-overlay" id="appsModal" onclick="if(event.target===this)closeApps()">
  <div class="modal">
    <h3>
      📱 Uygulamalar
      <button class="modal-close" onclick="closeApps()">✕</button>
    </h3>
    <div class="app-list" id="appList">
      <div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:30px">
        Yükleniyor...
      </div>
    </div>
  </div>
</div>

<script>
  // ─── API Helpers ──────────────────────────────────────
  function apiPost(url, body) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : '{}'
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) showToast('⚠️ ' + data.error);
      return data;
    })
    .catch(function(e) {
      showToast('❌ Bağlantı hatası');
    });
  }

  function apiGet(url) {
    return fetch(url).then(function(r) { return r.json(); });
  }

  // ─── Status Polling ───────────────────────────────────
  function pollStatus() {
    apiGet('/api/status').then(function(data) {
      var badge = document.getElementById('statusBadge');
      var text = document.getElementById('statusText');
      var wrap = document.getElementById('connectWrap');

      if (data.connected) {
        badge.className = 'status-badge connected';
        text.textContent = 'Bağlı — ' + data.tvIP;
        wrap.style.display = 'none';

        document.getElementById('volSlider').value = data.volume;
        document.getElementById('volValue').textContent = data.volume;

        var muteBtn = document.getElementById('muteBtn');
        if (data.muted) {
          muteBtn.className = 'btn mute-btn muted';
          muteBtn.textContent = '🔇';
        } else {
          muteBtn.className = 'btn mute-btn';
          muteBtn.textContent = '🔈';
        }
      } else {
        badge.className = 'status-badge';
        text.textContent = 'Bağlantı yok';
        wrap.style.display = 'block';
      }
    }).catch(function() {});
  }

  setInterval(pollStatus, 2000);
  pollStatus();

  // ─── Volume ───────────────────────────────────────────
  var volTimeout;
  function setVolume(val) {
    document.getElementById('volValue').textContent = val;
    clearTimeout(volTimeout);
    volTimeout = setTimeout(function() {
      apiPost('/api/volume/set', { volume: parseInt(val) });
    }, 200);
  }

  // ─── URL & Text ───────────────────────────────────────
  function openURL() {
    var url = document.getElementById('urlInput').value.trim();
    if (!url) return;
    if (url.indexOf('://') === -1) url = 'http://' + url;
    apiPost('/api/browser', { url: url }).then(function() {
      showToast('🌐 URL gönderildi');
    });
  }

  function quickURL(url) {
    document.getElementById('urlInput').value = url;
    apiPost('/api/browser', { url: url }).then(function() {
      showToast('🌐 ' + url);
    });
  }

  function sendText() {
    var text = document.getElementById('textInput').value;
    if (!text) return;
    apiPost('/api/input/text', { text: text }).then(function() {
      document.getElementById('textInput').value = '';
      showToast('⌨️ Metin gönderildi');
    });
  }

  // ─── Apps ─────────────────────────────────────────────
  function showApps() {
    document.getElementById('appsModal').className = 'modal-overlay open';
    apiGet('/api/apps').then(function(apps) {
      var html = '';
      apps.forEach(function(app) {
        html += '<button class="app-item" onclick="launchApp(\\'' + app.id + '\\')">' +
          '<span style="font-size:24px">📦</span>' +
          '<span>' + app.title + '</span></button>';
      });
      document.getElementById('appList').innerHTML = html || '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:30px">Uygulama bulunamadı</div>';
    }).catch(function() {
      document.getElementById('appList').innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--text-dim);padding:30px">TV bağlı değil</div>';
    });
  }

  function closeApps() {
    document.getElementById('appsModal').className = 'modal-overlay';
  }

  function launchApp(id) {
    apiPost('/api/launch', { appId: id }).then(function() {
      showToast('🚀 Uygulama başlatıldı');
      closeApps();
    });
  }

  // ─── Toast ────────────────────────────────────────────
  var toastTimer;
  function showToast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.className = 'toast show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      el.className = 'toast';
    }, 2000);
  }

  // ─── Keyboard shortcuts ───────────────────────────────
  document.addEventListener('keydown', function(e) {
    if (document.activeElement.tagName === 'INPUT') return;
    switch(e.key) {
      case 'ArrowUp': apiPost('/api/button/up'); e.preventDefault(); break;
      case 'ArrowDown': apiPost('/api/button/down'); e.preventDefault(); break;
      case 'ArrowLeft': apiPost('/api/button/left'); e.preventDefault(); break;
      case 'ArrowRight': apiPost('/api/button/right'); e.preventDefault(); break;
      case 'Enter': apiPost('/api/button/enter'); e.preventDefault(); break;
      case 'Backspace': apiPost('/api/button/back'); e.preventDefault(); break;
      case 'Escape': apiPost('/api/button/exit'); e.preventDefault(); break;
      case '+': apiPost('/api/volume/up'); break;
      case '-': apiPost('/api/volume/down'); break;
      case 'm': apiPost('/api/mute'); break;
      case ' ': apiPost('/api/button/play'); e.preventDefault(); break;
    }
  });
</script>
</body>
</html>`;
}
