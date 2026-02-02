const fs = require('fs');

// New URLs from uploaded_styles.json
const newUrls = {
    "3d-pixar": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_3d_pixar_1769921868450.jpeg",
    "abstract": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_abstract_1769926029217.jpeg",
    "aesthetic-lifestyle": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_aesthetic_lifestyle_1769926244674.jpeg",
    "anime": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_anime_1769921843736.jpeg",
    "cartoon-2d": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_cartoon_2d_1769921829083.jpeg",
    "chibi": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_chibi_1769921882355.jpeg",
    "cinematic-realistic": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_cinematic_realistic_1769921913320.jpeg",
    "comic": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_comic_1769921972298.jpeg",
    "digital-illustration": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_digital_illustration_1769921776817.jpeg",
    "doodle": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_doodle_1769921761065.jpeg",
    "edutainment-hybrid": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_edutainment_1769926109210.jpeg",
    "fashion-influencer": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_fashion_influencer_1769926195150.jpeg",
    "flat-design": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_flat_design_1769925990519.jpeg",
    "health-warning-hybrid": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_health_warning_1769985661946.jpeg",
    "hyper-realistic": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_hyperrealistic_1769921944631.jpeg",
    "infographic": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_infographic_1769921792701.jpeg",
    "iphone-realistic": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_iphone_1769926181422.jpeg",
    "isometric": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_isometric_1769926056742.jpeg",
    "jellytoon": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_jellytoon_1769985561670.jpeg",
    "korean-soft": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_korean_soft_1769985630570.jpeg",
    "kurzgesagt": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_kurzgesagt_1769926123637.jpeg",
    "line-art": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_line_art_1769926014281.jpeg",
    "medical-3d": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_medical_3d_1769926136695.jpeg",
    "mirror-selfie": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_mirror_selfie_1769926208833.jpeg",
    "neon-cyberpunk": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_neon_cyberpunk_1769925963131.jpeg",
    "oil-painting": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_oil_painting_1769921999608.jpeg",
    "paper-craft": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_paper_craft_1769926091161.jpeg",
    "photorealistic": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_photorealistic_1769921930112.jpeg",
    "pop-art": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_pop_art_1769922013297.jpeg",
    "retro-vintage": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_retro_vintage_1769925947773.jpeg",
    "silhouette": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_silhouette_1769926042051.jpeg",
    "south-park": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_south_park_1769985575407.jpeg",
    "storybook": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_storybook_1769921809815.jpeg",
    "streetwear-urban": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_streetwear_1769985589329.jpeg",
    "studio-ecommerce": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_studio_ecommerce_1769985602217.jpeg",
    "surrealist": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_surrealist_1769922027381.jpeg",
    "ted-ed": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_ted_ed_1769926167138.jpeg",
    "tiktok-viral": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_tiktok_viral_1769985644285.jpeg",
    "vaporwave": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_vaporwave_1769925977517.jpeg",
    "watercolor": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_watercolor_1769921986143.jpeg",
    "historical-3d-illustrated": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_historical_3d_1769987778387.jpeg",
    "documentary": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_documentary_1769987791265.jpeg",
    "stock-footage": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_stock_footage_1769987805652.jpeg",
    "nature-doc": "https://cdn1.sharemyimage.com/smi/2026/02/02/style_nature_doc_1769987819410.jpeg"
};

const filePath = '/Users/nhila/Desktop/CUSOR/Auto Video Prompt/app/src/lib/channel-styles.ts';
let content = fs.readFileSync(filePath, 'utf-8');

let updatedCount = 0;

for (const [styleId, url] of Object.entries(newUrls)) {
    // Match pattern: id: 'styleId', and add previewImage if not exists or update if exists
    const idPattern = new RegExp(`(id: '${styleId}',\\n[\\s\\S]*?category: '[^']+')`, 'g');

    content = content.replace(idPattern, (match) => {
        // Check if previewImage already exists
        if (match.includes('previewImage:')) {
            // Update existing previewImage
            const updated = match.replace(/previewImage: '[^']+',/, `previewImage: '${url}',`);
            updatedCount++;
            console.log(`Updated existing: ${styleId}`);
            return updated;
        } else {
            // Add previewImage before category
            const updated = match.replace(
                /(suggestedCharCount: \d+,?)/,
                `$1\n        previewImage: '${url}',`
            );
            if (updated !== match) {
                updatedCount++;
                console.log(`Added new: ${styleId}`);
                return updated;
            }
            // Try alternative pattern
            const alt = match.replace(
                /(category: '[^']+')/,
                `previewImage: '${url}',\n        $1`
            );
            if (alt !== match) {
                updatedCount++;
                console.log(`Added new (alt): ${styleId}`);
                return alt;
            }
            console.log(`Failed to add: ${styleId}`);
            return match;
        }
    });
}

fs.writeFileSync(filePath, content);
console.log(`\nTotal updated/added: ${updatedCount} styles`);
