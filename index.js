const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const ytdl = require('ytdl-core');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);

if (!fs.existsSync('./downloads')) fs.mkdirSync('./downloads');

const client = new Client({
    authStrategy: new LocalAuth(), // QR pairing saved automatically
    puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    }
});

// QR CODE DISPLAY
client.on('qr', qr => {
    console.log("\n💠 SCAN THIS QR TO LOGIN WHATSAPP 💠\n");
    qrcode.generate(qr, { small: true });
});

// READY
client.on('ready', () => {
    console.log('📛 SATHANIC DOWNLOADER BOT IS READY 📛');
});

// Progress function
async function sendProgress(chat, text, percent) {
    let bar = "";
    let filled = Math.round(percent / 10);
    bar = "▓".repeat(filled) + "░".repeat(10 - filled);

    chat.sendMessage(`${text}\n[${bar}] ${percent.toFixed(0)}%`);
}

// YouTube download
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

// Instagram Reel download
async function downloadIG(chat, url) {
    try {
        chat.sendMessage("📥 Fetching Instagram Reel...");

        const html = await fetch(url).then(r => r.text());
        const $ = cheerio.load(html);

        let videoUrl = $('meta[property="og:video"]').attr("content");

        if (!videoUrl) {
            chat.sendMessage("❌ Could not find reel (may be private).");
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

// Command listener
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
