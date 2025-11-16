const express = require("express");
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const QRCode = require("qrcode");
const qrcodeTerminal = require('qrcode-terminal');
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads');

const app = express();
let qrCodeData = null;

// ---------------- WEB SERVER ----------------
app.get("/", (req, res) => {
  res.send("WhatsApp Bot Running. Go to /qr to scan.");
});

app.get("/qr", async (req, res) => {
  if (!qrCodeData) {
    return res.send("QR not generated yet. Wait 5 seconds.");
  }

  try {
    const qrImage = await QRCode.toDataURL(qrCodeData);
    res.send(`
      <html>
        <body>
          <center>
            <h2>📱 Scan QR to connect WhatsApp</h2>
            <img src="${qrImage}" width="300"/>
          </center>
        </body>
      </html>
    `);
  } catch (err) {
    res.send("Error loading QR.");
  }
});

// ---------------- WHATSAPP BOT ----------------

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

// QR on terminal + save for webpage
client.on('qr', qr => {
    qrCodeData = qr;
    console.log("\n💠 SCAN THIS QR TO LOGIN WHATSAPP 💠\n");
    qrcodeTerminal.generate(qr, { small: true });
});

// READY
client.on('ready', () => {
    console.log('📛 SATHANIC DOWNLOADER BOT IS READY 📛');
});

// Progress bar
async function sendProgress(chat, text, percent) {
    let filled = Math.round(percent / 10);
    let bar = "▓".repeat(filled) + "░".repeat(10 - filled);
    chat.sendMessage(`${text}\n[${bar}] ${percent.toFixed(0)}%`);
}

// ---------------- YOUTUBE DOWNLOAD ----------------
async function downloadYT(chat, url) {
    try {
        chat.sendMessage("📥 Starting YouTube Download...");

        const info = await ytdl.getInfo(url);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').substring(0, 40);
        const output = `./downloads/${title}.mp4`;

        const stream = ytdl(url, { quality: "highestvideo" });

        let total = 0;
        let downloaded = 0;

        stream.on("response", res => {
            total = parseInt(res.headers["content-length"]);
        });

        stream.on("data", chunk => {
            downloaded += chunk.length;
            if (total) {
                let percent = (downloaded / total) * 100;
                if (percent % 5 < 1) sendProgress(chat, "📥 Downloading YouTube", percent);
            }
        });

        await new Promise((resolve, reject) => {
            stream.pipe(fs.createWriteStream(output))
                .on("finish", resolve)
                .on("error", reject);
        });

        const media = MessageMedia.fromFilePath(output);
        chat.sendMessage(media, { caption: "📛 SATHANIC DOWNLOADER 📛" });

    } catch (err) {
        chat.sendMessage("❌ YouTube Download Failed.");
    }
}

// ---------------- INSTAGRAM REEL ----------------
async function downloadIG(chat, url) {
    try {
        chat.sendMessage("📥 Fetching Instagram Reel...");

        const html = await fetch(url).then(r => r.text());
        const $ = cheerio.load(html);

        let videoUrl = $('meta[property="og:video"]').attr("content");

        if (!videoUrl) {
            chat.sendMessage("❌ Could not find reel (maybe private).");
            return;
        }

        const output = `./downloads/ig_${Date.now()}.mp4`;

        const res = await fetch(videoUrl);
        let total = parseInt(res.headers.get("content-length"));
        let downloaded = 0;

        res.body.on("data", chunk => {
            downloaded += chunk.length;
            let percent = (downloaded / total) * 100;
            if (percent % 5 < 1)
                sendProgress(chat, "📥 Downloading Instagram Reel", percent);
        });

        await new Promise((resolve, reject) => {
            res.body.pipe(fs.createWriteStream(output))
                .on("finish", resolve)
                .on("error", reject);
        });

        const media = MessageMedia.fromFilePath(output);
        chat.sendMessage(media, { caption: "📛 SATHANIC DOWNLOADER 📛" });

    } catch (err) {
        chat.sendMessage("❌ Instagram Download Failed.");
    }
}

// ---------------- COMMANDS ----------------
client.on('message', async msg => {
    const chat = await msg.getChat();
    const text = msg.body.trim();

    if (text.startsWith("!yt ")) {
        downloadYT(chat, text.slice(4));
    }

    if (text.startsWith("!ig ")) {
        downloadIG(chat, text.slice(4));
    }

    if (text === "!help") {
        chat.sendMessage("📛 SATHANIC DOWNLOADER 📛\nCommands:\n!yt <url>\n!ig <url>");
    }
});

client.initialize();

// START SERVER
app.listen(3000, () => console.log("Server running on port 3000"));
