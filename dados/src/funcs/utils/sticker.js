const fs = require('fs').promises;
const fs2 = require('fs');
const path = require("path");
const webp = require("node-webpmux");
const axios = require('axios');

const generateTempFileName = (extension) => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    if (!fs2.existsSync(__dirname + '/../../../database/tmp')) fs2.mkdirSync(__dirname + '/../../../database/tmp', { recursive: true });
    return path.join(__dirname, '/../../../database/tmp', `${timestamp}_${random}.${extension}`);
};

async function getBuffer(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
}

async function convertToWebp(media, isVideo = false, forceSquare = false) {
    const tmpFileOut = generateTempFileName('webp');
    const tmpFileIn = generateTempFileName(isVideo ? 'mp4' : 'jpg');

    await fs.writeFile(tmpFileIn, media);

    let scaleOption;
    if (forceSquare) {
        scaleOption = "scale=320:320,fps=15";
    } else {
        scaleOption = "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0";
    }

    await new Promise((resolve, reject) => {
        const ff = require('fluent-ffmpeg')(tmpFileIn)
            .on("error", (err) => {
                console.error("Erro ao converter mídia:", err);
                fs.unlink(tmpFileIn).catch(e => console.error("Erro ao excluir tmpFileIn após erro de conversão:", e));
                fs.unlink(tmpFileOut).catch(e => console.error("Erro ao excluir tmpFileOut após erro de conversão:", e));
                reject(err);
            })
            .on("end", () => {
                resolve(true);
            })
            .addOutputOptions([
                "-vcodec", "libwebp",
                "-vf", `${scaleOption}, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse`
            ])
            .toFormat("webp")
            .save(tmpFileOut);
    });

    const buff = await fs.readFile(tmpFileOut);
    await fs.unlink(tmpFileOut).catch(err => console.error("Erro ao excluir arquivo temporário de saída:", err));
    await fs.unlink(tmpFileIn).catch(err => console.error("Erro ao excluir arquivo temporário de entrada:", err));
    return buff;
}

async function writeExif(media, metadata, isVideo = false, rename = false, forceSquare = false) {
    const wMedia = rename ? media : await convertToWebp(media, isVideo, forceSquare);
    const tmpFileIn = generateTempFileName('webp');
    const tmpFileOut = generateTempFileName('webp');

    await fs.writeFile(tmpFileIn, wMedia);

    try {
        if (metadata.packname || metadata.author) {
            const img = new webp.Image();
            const json = {
                "sticker-pack-id": `https://github.com/hiudyy`,
                "sticker-pack-name": metadata.packname,
                "sticker-pack-publisher": metadata.author,
                "emojis": ["NazuninhaBot"]
            };
            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
            const exif = Buffer.concat([exifAttr, jsonBuff]);
            exif.writeUIntLE(jsonBuff.length, 14, 4);

            await img.load(tmpFileIn);
            img.exif = exif;
            await img.save(tmpFileOut);
        }
    } catch (err) {
        console.error("Erro ao processar EXIF:", err);
    } finally {
        const buff = await fs.readFile(tmpFileOut);
        
        try {
            await fs.unlink(tmpFileIn);
        } catch (err) {
            console.error("Erro ao excluir arquivo temporário de entrada:", err);
        }

        try {
            await fs.unlink(tmpFileOut);
        } catch (err) {
            console.error("Erro ao excluir arquivo temporário de saída:", err);
        }
        
        return buff;
    }
    
}

const sendSticker = async (nazu, jid, { sticker: path, type = 'image', packname = '', author = '', rename = false, forceSquare = false }, { quoted } = {}) => {
    if (!type || !['image', 'video'].includes(type)) {
        throw new Error('O tipo de mídia deve ser "image" ou "video".');
    }

    let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : fs2.existsSync(path) ? await fs2.readFileSync(path) : path.url ? await getBuffer(path.url) : Buffer.alloc(0);

    let buffer;
    if (packname || author) {
        buffer = await writeExif(buff, { packname, author }, type === 'video', rename, forceSquare);
    } else {
        buffer = await convertToWebp(buff, type === 'video', forceSquare);
    }

    await nazu.sendMessage(jid, { sticker: buffer, ...(packname || author ? { packname, author } : {}) }, { quoted });
    return buffer;
};

module.exports = {
    sendSticker
};