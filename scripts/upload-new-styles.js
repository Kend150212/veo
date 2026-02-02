const fs = require('fs');
const path = require('path');

const SHAREMYIMAGE_API_KEY = 'chv_tTtr_3ba9a40634500cbe035ce6c17e7ff8815ea8f545884d6d141164d8a04d48f3941ee09104af1cd6d3447a215338efae3c0d298fd4c319b8c31dfd72256e4e03fd';

// Map of local file names to style IDs
const styleMapping = {
    'style_retro_vintage': 'retro-vintage',
    'style_neon_cyberpunk': 'neon-cyberpunk',
    'style_vaporwave': 'vaporwave',
    'style_flat_design': 'flat-design',
    'style_line_art': 'line-art',
    'style_abstract': 'abstract',
    'style_silhouette': 'silhouette',
    'style_isometric': 'isometric',
    'style_paper_craft': 'paper-craft',
    'style_edutainment': 'edutainment-hybrid',
    'style_kurzgesagt': 'kurzgesagt',
    'style_medical_3d': 'medical-3d',
    'style_ted_ed': 'ted-ed',
    'style_iphone': 'iphone-realistic',
    'style_fashion_influencer': 'fashion-influencer',
    'style_mirror_selfie': 'mirror-selfie',
    'style_aesthetic_lifestyle': 'aesthetic-lifestyle',
    'style_surrealist': 'surrealist',
    'style_storybook': 'storybook',
    'style_photorealistic': 'photorealistic',
    'style_hyperrealistic': 'hyper-realistic',
    'style_infographic': 'infographic',
    'style_comic': 'comic',
    'style_cinematic_realistic': 'cinematic-realistic',
    'style_oil_painting': 'oil-painting',
    'style_pop_art': 'pop-art',
    'style_digital_illustration': 'digital-illustration',
    'style_doodle': 'doodle',
    // Batch 2 - new styles
    'style_3d_pixar': '3d-pixar',
    'style_anime': 'anime',
    'style_cartoon_2d': 'cartoon-2d',
    'style_chibi': 'chibi',
    'style_jellytoon': 'jellytoon',
    'style_south_park': 'south-park',
    'style_streetwear': 'streetwear-urban',
    'style_studio_ecommerce': 'studio-ecommerce',
    'style_korean_soft': 'korean-soft',
    'style_tiktok_viral': 'tiktok-viral',
    'style_health_warning': 'health-warning-hybrid',
    'style_watercolor': 'watercolor',
    // Final batch - remaining styles
    'style_historical_3d': 'historical-3d-illustrated',
    'style_documentary': 'documentary',
    'style_stock_footage': 'stock-footage',
    'style_nature_doc': 'nature-doc'
};

async function uploadImage(filePath) {
    const { Blob } = await import('buffer');
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);

    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('source', blob, fileName);
    formData.append('key', SHAREMYIMAGE_API_KEY);
    formData.append('format', 'json');

    const response = await fetch('https://sharemyimage.com/api/1/upload', {
        method: 'POST',
        body: formData
    });

    const data = await response.json();
    if (data.image && data.image.url) {
        return data.image.url;
    }
    throw new Error(data.error?.message || 'Upload failed');
}

async function main() {
    const artifactDir = '/Users/nhila/.gemini/antigravity/brain/e123c745-f2b0-43cb-9447-5541e7e65b80';
    const files = fs.readdirSync(artifactDir).filter(f => f.startsWith('style_') && f.endsWith('.png'));

    const results = {};

    for (const file of files) {
        const baseName = file.replace(/_\d+\.png$/, '');
        const styleId = styleMapping[baseName];

        if (!styleId) {
            console.log(`Skipping ${file} - no mapping found`);
            continue;
        }

        // Skip if already have this style mapped
        if (results[styleId]) {
            console.log(`Skipping ${file} - already have ${styleId}`);
            continue;
        }

        const filePath = path.join(artifactDir, file);
        console.log(`Uploading ${file} as ${styleId}...`);

        try {
            const url = await uploadImage(filePath);
            results[styleId] = url;
            console.log(`  ✓ ${styleId}: ${url}`);
        } catch (error) {
            console.error(`  ✗ Failed: ${error.message}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log('\n\nResults:');
    console.log(JSON.stringify(results, null, 2));

    // Write results to file
    fs.writeFileSync(
        path.join(artifactDir, 'uploaded_styles.json'),
        JSON.stringify(results, null, 2)
    );
    console.log('\nSaved to uploaded_styles.json');
}

main().catch(console.error);
