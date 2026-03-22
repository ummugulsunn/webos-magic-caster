# 🪄 WebOS Magic Caster & Remote

<p align="center">
  <b>A powerful, zero-crash Node.js remote control & video caster for LG WebOS Smart TVs.</b><br>
  <i>Perfectly bypasses WebOS 3.x (Chrome 38) browser memory limits and crashes by casting raw video links and SRT/VTT subtitles directly to the TV's native hardware player and an ultra-light custom HTML5 proxy!</i>
</p>

---

## 🌟 Features

- **📺 Native Direct-Play Casting:** Send `.mp4`, `.m3u8` (HLS), or `TorrServer` streams directly to the WebOS hardware-accelerated media player. Zero browser crashes, 100% performance.
- **🍿 "Foolproof" Subtitle Proxy Player:** A custom zero-js HTML5 proxy player that seamlessly merges raw video streams with external `.srt`/`.vtt` subtitles on the fly. It even automatically fixes raw GitHub UI links!
- **🖱 Magic Touchpad:** Control the TV cursor smoothly from your phone/Mac with drag-to-move, tap-to-click, and two-finger scrolling.
- **⌨️ Remote Keyboard & Text Input:** Send text directly to TV input fields (YouTube, Browser) instantly from your computer/phone keyboard.
- **📦 App Launcher:** Lists all installed WebOS apps natively and launches them with a click.
- **📱 Responsive UI:** Designed to feel like a high-end physical remote control on mobile browsers.

## 🚀 Why this exists?
Older LG Smart TVs (WebOS 3.x) suffer from severe RAM limitations and an outdated Chrome 38 browser engine. Watching modern streaming sites (like Stremio Web or pop-up heavy movie sites) crashes the TV with "Out of Memory" errors. This project solves that completely: **You find the stream on your computer/phone, paste the link into this app, and it plays flawlessly on the TV.**

---

## 🛠 Setup & Installation

### 1. Prerequisites
- **Node.js** installed on your computer/server.
- Your LG TV and computer must be on the **same Wi-Fi network**.
- **LG Connect Apps** must be enabled in your TV's Network settings.

### 2. Install & Run
```bash
git clone https://github.com/ummugulsunn/webos-tv.git
cd webos-tv
npm install
node server.js
```

### 3. How to Connect
1. Open the UI in your browser: `http://localhost:3333` (or your computer's local IP on your phone, e.g., `http://192.168.1.X:3333`).
2. Enter your TV's local IP address into the interface (or it will auto connect if configured in code).
3. A pairing prompt will appear on your TV screen. Grab your physical TV remote and click **Accept**.
4. You're connected! The pairing key is saved locally in `tv-key.json`.

---

## 🍿 The "Stremio / TorrServer" Workflow (How to watch anything)

1. Open **Stremio** or **TorrServer** on your Mac/PC and start a movie.
2. Right-click the playing video and copy the direct stream URL (e.g. `http://.../stream.mp4`).
3. Open this Remote App (`http://localhost:3333`), scroll down to **"📺 Direkt Film Oynat"**.
4. Paste the video URL.
5. (Optional) Find any Turkish/English `.srt` subtitle file on the internet, copy the link, and paste it into the Subtitle URL box.
6. Click **Play (Oynat)**.
7. *Magic!* The movie plays directly on the TV flawlessly with subtitles.

---

## 🇹🇷 Türkçe Açıklama

Bu proje, eski LG TV'lerin (özellikle WebOS 3.x) Chrome 38 tarayıcısındaki "yetersiz bellek" çökmelerini ve reklamlı sitelerin donmalarını tamamen aşmak için geliştirilmiştir. 

**Nasıl Çalışır?** Filmi bilgisayarınızda (Stremio veya TorrServer) bulursunuz, video yayın linkini (m3u8/mp4) ve internetten bulduğunuz bir altyazı linkini (.srt/.vtt) bu kumanda uygulamasına yapıştırırsınız. Uygulama, TV'nin kasan tarayıcısını atlayarak, filmi doğrudan TV'nin donanımsal yürütücüsünde veya sıfır-kasmaya özel HTML5 oynatıcısında sinema kalitesinde açar.

Ayrıca eksiksiz bir D-Pad, Mouse (Touchpad), Klavye ve Uygulama başlatıcı özelliklerine sahiptir.

---
*Created with ❤️ for frustrated smart TV owners!*
