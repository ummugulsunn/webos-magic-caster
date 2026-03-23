# WebOS Magic Caster & Remote

<p align="center">
  <b>A powerful, zero-crash Node.js remote control & video caster for LG WebOS Smart TVs. 🚀</b><br>
  <i>Perfectly bypasses WebOS 3.x (Chrome 38) browser memory limits and crashes by casting raw video links and SRT/VTT subtitles directly to the TV's native hardware player and a custom HTML5 proxy.</i>
</p>

<p align="center">
  <img src="assets/remote-ui.png" alt="LG TV Remote Web Interface UI" width="600">
</p>

## Overview

Older LG sets often crash on heavy sites in the built-in browser. This app runs on your PC/Mac on the LAN: you paste a direct stream URL (and optional subtitle URL), and playback uses the TV hardware or the bundled proxy player.

## Features

- Direct play: `.mp4`, `.m3u8` (HLS), TorrServer-style URLs on the native WebOS player
- Subtitle proxy for external `.srt` / `.vtt`
- Touchpad, remote keyboard, D-pad, app launcher
- English and Turkish UI

## Install

**Requirements:** Node.js 18+, TV and PC on the same LAN, **LG Connect Apps** enabled on the TV.

```bash
git clone https://github.com/ummugulsunn/webos-magic-caster.git
cd webos-magic-caster
npm install
npm start
```

Open `http://<this-machine-ip>:3333` (check the terminal). Pair on the TV when prompted; pairing is saved in `tv-key.json` (gitignored—do not commit).

**Environment:** `TV_IP` (default `192.168.1.148`), `PORT` (default `3333`). Example: `TV_IP=192.168.1.50 npm start`.

## Stremio / TorrServer

1. Start playback in Stremio or TorrServer and copy the **direct** stream URL.
2. In this UI, use **Direct Movie Play (w/ Subtitles)**, paste video URL and optional subtitle URL, then **Play Movie**.

## Troubleshooting

- No connection: fix `TV_IP`, same subnet, firewall, **LG Connect Apps** on; accept pairing on the TV.
- Bad LAN IP in UI: VPNs or multiple interfaces—the server picks the first non-internal IPv4 address.

[CONTRIBUTING](./CONTRIBUTING.md) · [SECURITY](./SECURITY.md)

---

## Türkçe Açıklama

Bu proje, eski LG TV'lerin (özellikle WebOS 3.x) Chrome 38 tarayıcısındaki "yetersiz bellek" çökmelerini ve reklamlı sitelerin donmalarını tamamen aşmak için geliştirilmiş, güçlü bir uzaktan kumanda ve video aktarıcıdır! 🚀

İzlemek istediğiniz videoyu doğrudan bilgisayarınızda (Stremio vb.) bulup linkini bu kumandaya yapıştırırsınız; uygulama TV'nin tarayıcısını es geçip filmi doğrudan cihazın donanımsal yürütücüsünde **sıfır kasma** ile sinema kalitesinde açar. Ayrıca cihazınız üzerinden Smart TV'yi tam kontrollü yönetebileceğiniz eksiksiz bir D-Pad, Magic Touchpad, Klavye ve Uygulama Başlatıcı özelliklerine sahiptir.
