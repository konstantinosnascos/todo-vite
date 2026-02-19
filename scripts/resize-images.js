//resize-images.js

// för att använda
//npm install --save-dev sharp
//Lägg till "type": "module" i package.json
//Lägg till script: "images": "node scripts/resize-images.js
//Skapa input-mappen (i denna blev det src/images/originals)
// detta i package.json -> "images": "node scripts/resize-images.js"
// sen kör npm run images

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Vite:    src/images/originals
// Next.js: public/images/originals
// Statisk: assets/originals
const INPUT_DIR = 'src/images/originals';
const OUTPUT_DIR = 'src/images';
const SIZES = [400, 800, 1200];

// Skapa output-mapp om den inte finns
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Skapa input-mapp om den inte finns
if (!fs.existsSync(INPUT_DIR)) {
    fs.mkdirSync(INPUT_DIR, { recursive: true });
    console.log('Skapade mapp: ' + INPUT_DIR);
    console.log('Lagg dina originalbilder dar och kor scriptet igen.');
    process.exit(0);
}

// Hitta alla bildfiler
const imageFiles = fs.readdirSync(INPUT_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
});

if (imageFiles.length === 0) {
    console.log('Inga bilder hittades i ' + INPUT_DIR);
    process.exit(0);
}

async function processImage(filename) {
    const inputPath = path.join(INPUT_DIR, filename);
    const nameWithoutExt = path.parse(filename).name;

    console.log('\nBearbetar: ' + filename);

    for (const width of SIZES) {
        const outputFilename = nameWithoutExt + '-' + width + '.webp';
        const outputPath = path.join(OUTPUT_DIR, outputFilename);

        try {
            const info = await sharp(inputPath)
                .resize(width)           // Ändra bredd, behåll proportion
                .webp({ quality: 80 })   // Konvertera till WebP
                .toFile(outputPath);

            const inputStats = fs.statSync(inputPath);
            const inputKB = Math.round(inputStats.size / 1024);
            const outputKB = Math.round(info.size / 1024);
            const saved = Math.round((1 - info.size / inputStats.size) * 100);

            console.log(
                '  -> ' + outputFilename +
                ' (' + info.width + 'x' + info.height + ')' +
                ' ' + inputKB + 'KB -> ' + outputKB + 'KB' +
                ' (sparade ' + saved + '%)'
            );
        } catch (error) {
            console.error('  Fel vid ' + width + 'px: ' + error.message);
        }
    }
}

async function run() {
    console.log('=== Bildoptimering ===');
    console.log('Input:   ' + INPUT_DIR);
    console.log('Output:  ' + OUTPUT_DIR);
    console.log('Storlekar: ' + SIZES.join(', ') + 'px');
    console.log('Format:  WebP (quality 80)');

    for (const file of imageFiles) {
        await processImage(file);
    }

    console.log('\nKlart!');
}

run();