# WebOS Magic Caster & Remote

<p align="center">
  <b>A powerful, zero-crash Node.js remote control & video caster for LG WebOS Smart TVs.</b><br>
  <i>Perfectly bypasses WebOS 3.x (Chrome 38) browser memory limits and crashes by casting raw video links and SRT/VTT subtitles directly to the TV's native hardware player and a custom HTML5 proxy.</i>
</p>

<p align="center">
  <img src="assets/remote-ui.png" alt="LG TV Remote Web Interface UI" width="600">
</p>

## Overview

Older LG Smart TVs typically suffer from severe RAM limitations and an outdated Chrome 38 browser engine. Watching modern streaming sites (like Stremio Web or pop-up heavy movie sites) often crashes the TV with "Out of Memory" errors. 

This project completely mitigates this issue by creating a lightweight Node.js Server on your Mac/PC that acts as a robust control hub. You simply find the movie stream on your device, paste the URL into the app, and it plays flawlessly on the TV's native player—completely ad-free and crash-free.

## Features

- **Native Direct-Play Casting:** Send `.mp4`, `.m3u8` (HLS), or `TorrServer` streams directly to the WebOS hardware-accelerated media player. 
- **Foolproof Subtitle Proxy Player:** A custom zero-js HTML5 proxy player that seamlessly merges raw video streams with external `.srt`/`.vtt` subtitles on the fly. Automatically converts SRT timestamps and handles GitHub raw links instantly.
- **Magic Touchpad:** Control the TV cursor smoothly from your phone or computer with drag-to-move, tap-to-click, and two-finger scrolling interactions.
- **Remote Keyboard & Text Input:** Send text directly to TV input fields (YouTube, Browser) instantly from your device's keyboard.
- **App Launcher:** View and launch all installed WebOS apps natively.
- **Bilingual Interface:** Supports English and Turkish seamlessly.

## Setup & Installation

### 1. Prerequisites
- **Node.js** installed on your hosting computer/server.
- Your LG TV and the computer must be on the **same Wi-Fi network**.
- **LG Connect Apps** must be enabled in your TV's Network settings.

### 2. Install & Run
```bash
git clone https://github.com/ummugulsunn/webos-magic-caster.git
cd webos-magic-caster
npm install
node server.js
```
*Note: The server will automatically detect your local network IP and configure itself.*

### 3. How to Connect
1. Open the UI in an external browser, e.g., `http://192.168.1.X:3333`.
2. Enter your TV's local IP address into the interface (or it auto-connects if preconfigured).
3. A pairing prompt will appear on your TV screen. Grab your physical LG TV remote and click **Accept**.
4. The pairing key is securely saved locally in `tv-key.json` for future automatic connections.

---

## The "Stremio / TorrServer" Workflow

This is how you can use this app to stream movies beautifully relying solely on the TV's hardware capabilities.

1. Open **Stremio** or **TorrServer** on your Mac/PC and start any movie.
2. Right-click the playing video and copy the direct stream URL (e.g. `http://.../stream.mp4`).
3. Open this Remote App interface, scroll down to the **Direct Movie Play (w/ Subtitles)** sector.
4. Paste the video URL.
5. (Optional) If you have a subtitle, find any `.srt` or `.vtt` file on the internet, copy the link, and paste it into the Subtitle URL box.
6. Click **Play Movie**.
7. The movie will immediately launch on the TV natively.

---

## Türkçe Açıklama

Bu proje, eski LG TV'lerin (özellikle WebOS 3.x) Chrome 38 tarayıcısındaki "yetersiz bellek" çökmelerini ve reklamlı sitelerin donmalarını tamamen aşmak için geliştirilmiştir. 

**Nasıl Çalışır?** 
Filmi bilgisayarınızda (Stremio veya TorrServer içerisinde) bulursunuz, video yayın linkini (m3u8/mp4) ve internetten bulduğunuz herhangi bir altyazı linkini (.srt/.vtt) bu kumanda uygulamasına yapıştırırsınız. Uygulama, TV'nin yetersiz tarayıcısını atlayarak, filmi doğrudan TV'nin donanımsal yürütücüsünde veya "sıfır-kasmaya" özel inşa edilmiş HTML5 proxy oynatıcısında sinema kalitesinde açar.

Ayrıca cihazınız üzerinden Smart TV'yi yönetebileceğiniz eksiksiz bir D-Pad, Mouse (Touchpad), Klavye ve Uygulama Başlatıcı özelliklerine sahiptir.

---
*Created as an open-source solution for frustrated smart TV users.*
