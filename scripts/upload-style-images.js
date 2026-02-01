#!/usr/bin/env node
/**
 * Script to upload style preview images to ShareMyImage
 * Run with: node scripts/upload-style-images.js
 */

const fs = require('fs');
const path = require('path');

const SHAREMYIMAGE_API_URL = 'https://www.sharemyimage.com/api/1/upload';
const SHAREMYIMAGE_API_KEY = 'chv_tTtr_3ba9a40634500cbe035ce6c17e7ff8815ea8f545884d6d141164d8a04d48f3941ee09104af1cd6d3447a215338efae3c0d298fd4c319b8c31dfd72256e4e03fd';

// Map of file names to style IDs
const STYLE_FILES = {
    'style_doodle': 'doodle',
    'style_digital_illustration': 'digital-illustration',
    'style_infographic': 'infographic',
    'style_storybook': 'storybook',
    'style_cartoon_2d': 'cartoon-2d',
    'style_anime': 'anime',
    'style_3d_pixar': '3d-pixar',
    'style_chibi': 'chibi',
    'style_cinematic_realistic': 'cinematic-realistic',
    'style_photorealistic': 'photorealistic',
    'style_hyperrealistic': 'hyperrealistic',
    'style_comic': 'comic-book',
    'style_watercolor': 'watercolor',
    'style_oil_painting': 'oil-painting',
    'style_pop_art': 'pop-art',
    'style_surrealist': 'surrealist',
};

async function uploadImage(imagePath, title) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64 = imageBuffer.toString('base64');

    const formData = new FormData();
    formData.append('source', base64);
    formData.append('title', title);
    formData.append('format', 'json');

    const response = await fetch(SHAREMYIMAGE_API_URL, {
        method: 'POST',
        headers: {
            'X-API-Key': SHAREMYIMAGE_API_KEY
        },
        body: formData
    });

    const data = await response.json();

    if (data.status_code !== 200 || !data.image) {
        throw new Error(data.error?.message || 'Upload failed');
    }

    return {
        url: data.image.url,
        thumbUrl: data.image.thumb?.url,
    };
}

async function main() {
    const imagesDir = '/Users/nhila/.gemini/antigravity/brain/e123c745-f2b0-43cb-9447-5541e7e65b80';
    const results = {};

    console.log('Starting upload of style preview images...\n');

    for (const [filePrefix, styleId] of Object.entries(STYLE_FILES)) {
        // Find the file (includes timestamp)
        const files = fs.readdirSync(imagesDir);
        const imageFile = files.find(f => f.startsWith(filePrefix) && f.endsWith('.png'));

        if (!imageFile) {
            console.log(`❌ Not found: ${filePrefix}`);
            continue;
        }

        const imagePath = path.join(imagesDir, imageFile);
        console.log(`📤 Uploading: ${styleId}...`);

        try {
            const result = await uploadImage(imagePath, `Style Preview: ${styleId}`);
            results[styleId] = result.url;
            console.log(`   ✅ ${result.url}`);
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        // Small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n\n=== RESULTS ===\n');
    console.log('Add these to channel-styles.ts:\n');

    for (const [styleId, url] of Object.entries(results)) {
        console.log(`'${styleId}': '${url}',`);
    }
}

main().catch(console.error);
