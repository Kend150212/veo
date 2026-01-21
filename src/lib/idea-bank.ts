// Idea Bank - Story Elements Library
// Contains diverse settings, characters, conflicts, themes for variety in story generation

// Story Archetypes - Classic narrative structures
export const STORY_ARCHETYPES = [
    { id: 'hero-journey', name: 'Hero\'s Journey', description: 'Character faces challenges, transforms, returns changed', examples: ['Leaving home', 'Mentor guidance', 'Ultimate test'] },
    { id: 'rags-to-riches', name: 'Rags to Riches', description: 'From humble beginnings to success', examples: ['Unexpected opportunity', 'Hard work', 'Achievement'] },
    { id: 'quest', name: 'Quest', description: 'Mission to find/achieve something important', examples: ['Clear goal', 'Obstacles', 'Triumph'] },
    { id: 'voyage-return', name: 'Voyage and Return', description: 'Journey to strange place, then return home wiser', examples: ['Discovery', 'Adventures', 'Homecoming'] },
    { id: 'comedy', name: 'Comedy', description: 'Light-hearted mishaps leading to happy resolution', examples: ['Misunderstandings', 'Confusion', 'Happy ending'] },
    { id: 'tragedy-redemption', name: 'Tragedy to Redemption', description: 'Downfall followed by recovery and growth', examples: ['Fall from grace', 'Recognition', 'Rise again'] },
    { id: 'overcoming-monster', name: 'Overcoming the Monster', description: 'Facing and defeating a threatening force', examples: ['Enemy appears', 'Battle', 'Victory'] },
    { id: 'rebirth', name: 'Rebirth', description: 'Transformation and renewal of character', examples: ['Old ways fail', 'Crisis', 'New beginning'] },
    { id: 'discovery', name: 'Discovery', description: 'Uncovering hidden truth or mystery', examples: ['Clues', 'Investigation', 'Revelation'] },
    { id: 'underdog', name: 'Underdog', description: 'Against all odds, the unlikely hero wins', examples: ['Doubted', 'Determination', 'Surprise victory'] }
]

// Settings - Diverse locations and time periods
export const STORY_SETTINGS = [
    // Modern Urban
    { id: 'modern-city', name: 'Modern Metropolis', keywords: 'bustling city streets, skyscrapers, urban life, neon signs' },
    { id: 'small-town', name: 'Small Town', keywords: 'quiet main street, local shops, community, neighbors' },
    { id: 'suburban', name: 'Suburban Neighborhood', keywords: 'tree-lined streets, family homes, backyards, local park' },
    { id: 'cafe-restaurant', name: 'Cozy Café', keywords: 'warm lighting, coffee aroma, friendly atmosphere' },
    { id: 'office', name: 'Modern Office', keywords: 'glass walls, open workspace, meeting rooms' },
    { id: 'university', name: 'University Campus', keywords: 'lecture halls, library, campus grounds, students' },
    { id: 'hospital', name: 'Hospital', keywords: 'medical equipment, corridors, waiting rooms' },

    // Nature
    { id: 'forest', name: 'Mystical Forest', keywords: 'ancient trees, dappled sunlight, hidden paths' },
    { id: 'beach', name: 'Coastal Beach', keywords: 'ocean waves, sandy shore, sunset views' },
    { id: 'mountain', name: 'Mountain Peak', keywords: 'snowy summit, hiking trails, breathtaking views' },
    { id: 'countryside', name: 'Countryside', keywords: 'rolling hills, farmland, windmills, open sky' },
    { id: 'desert', name: 'Desert Landscape', keywords: 'vast dunes, starry nights, oasis' },
    { id: 'tropical', name: 'Tropical Paradise', keywords: 'palm trees, turquoise water, exotic wildlife' },

    // Historical/Period
    { id: 'medieval', name: 'Medieval Castle', keywords: 'stone walls, torches, knights, throne room' },
    { id: '1920s', name: '1920s Jazz Age', keywords: 'speakeasy, art deco, jazz music, elegant fashion' },
    { id: '1950s', name: '1950s Americana', keywords: 'diners, jukeboxes, vintage cars, suburban dreams' },
    { id: '1980s', name: '1980s Retro', keywords: 'neon colors, arcade games, boomboxes, synthesizers' },
    { id: 'victorian', name: 'Victorian Era', keywords: 'gas lamps, cobblestones, horse carriages, formal attire' },

    // Fantasy/Sci-Fi
    { id: 'space-station', name: 'Space Station', keywords: 'zero gravity, control panels, stars outside windows' },
    { id: 'alien-planet', name: 'Alien Planet', keywords: 'strange flora, multiple moons, exotic landscapes' },
    { id: 'underwater', name: 'Underwater Kingdom', keywords: 'coral reefs, bioluminescence, ocean creatures' },
    { id: 'magical-realm', name: 'Magical Realm', keywords: 'floating islands, enchanted forests, mystical creatures' },
    { id: 'steampunk', name: 'Steampunk City', keywords: 'brass gears, steam engines, airships, clockwork' },
    { id: 'cyberpunk', name: 'Cyberpunk Metropolis', keywords: 'holographic ads, rain-slicked streets, high-tech low-life' },

    // Cultural
    { id: 'tokyo', name: 'Tokyo Streets', keywords: 'Shibuya crossing, cherry blossoms, ramen shops, temples' },
    { id: 'paris', name: 'Parisian Streets', keywords: 'Eiffel Tower, cafes, boulangeries, romantic bridges' },
    { id: 'new-york', name: 'New York City', keywords: 'Times Square, Central Park, brownstones, subway' },
    { id: 'venice', name: 'Venice Canals', keywords: 'gondolas, bridges, Renaissance architecture' },
    { id: 'marrakech', name: 'Moroccan Medina', keywords: 'colorful souks, riads, spices, mosaic tiles' }
]

// Character Types - Diverse protagonists
export const CHARACTER_TYPES = [
    // Professionals
    { id: 'chef', name: 'Passionate Chef', traits: ['creative', 'perfectionist', 'food-loving'], background: 'pursuing culinary dreams' },
    { id: 'scientist', name: 'Brilliant Scientist', traits: ['curious', 'analytical', 'dedicated'], background: 'researching breakthrough discovery' },
    { id: 'artist', name: 'Struggling Artist', traits: ['creative', 'sensitive', 'visionary'], background: 'seeking artistic recognition' },
    { id: 'teacher', name: 'Inspiring Teacher', traits: ['patient', 'caring', 'wise'], background: 'changing lives through education' },
    { id: 'doctor', name: 'Dedicated Doctor', traits: ['compassionate', 'skilled', 'selfless'], background: 'saving lives' },
    { id: 'entrepreneur', name: 'Ambitious Entrepreneur', traits: ['innovative', 'driven', 'risk-taker'], background: 'building their dream' },
    { id: 'athlete', name: 'Determined Athlete', traits: ['disciplined', 'competitive', 'resilient'], background: 'training for championship' },
    { id: 'musician', name: 'Talented Musician', traits: ['passionate', 'expressive', 'dedicated'], background: 'pursuing musical dreams' },
    { id: 'writer', name: 'Aspiring Writer', traits: ['imaginative', 'observant', 'introspective'], background: 'crafting their masterpiece' },
    { id: 'detective', name: 'Sharp Detective', traits: ['observant', 'logical', 'persistent'], background: 'solving mysteries' },

    // Life Stages
    { id: 'young-adult', name: 'Young Adult (18-25)', traits: ['ambitious', 'idealistic', 'adventurous'], background: 'finding their path' },
    { id: 'professional', name: 'Working Professional (25-40)', traits: ['experienced', 'balanced', 'responsible'], background: 'managing work and life' },
    { id: 'senior', name: 'Wise Senior (60+)', traits: ['experienced', 'reflective', 'generous'], background: 'sharing wisdom' },
    { id: 'parent', name: 'Devoted Parent', traits: ['nurturing', 'protective', 'sacrificing'], background: 'raising family' },
    { id: 'retiree', name: 'Active Retiree', traits: ['adventurous', 'curious', 'fulfilled'], background: 'embracing new chapter' },

    // Unique Backgrounds
    { id: 'immigrant', name: 'Immigrant Dreamer', traits: ['resilient', 'hopeful', 'hardworking'], background: 'building new life' },
    { id: 'veteran', name: 'Military Veteran', traits: ['disciplined', 'honorable', 'adaptable'], background: 'transitioning to civilian life' },
    { id: 'small-business', name: 'Small Business Owner', traits: ['resourceful', 'community-focused', 'hardworking'], background: 'keeping dream alive' },
    { id: 'volunteer', name: 'Dedicated Volunteer', traits: ['selfless', 'compassionate', 'motivated'], background: 'making a difference' },
    { id: 'inventor', name: 'Eccentric Inventor', traits: ['creative', 'persistent', 'unconventional'], background: 'creating something new' }
]

// Conflict/Challenge Types
export const CONFLICT_TYPES = [
    // Personal
    { id: 'self-doubt', name: 'Overcoming Self-Doubt', description: 'Character must believe in themselves' },
    { id: 'past-mistakes', name: 'Making Amends', description: 'Correcting past errors' },
    { id: 'identity', name: 'Finding Identity', description: 'Discovering who they really are' },
    { id: 'fear', name: 'Facing Fears', description: 'Confronting what terrifies them' },
    { id: 'grief', name: 'Processing Loss', description: 'Healing from loss' },

    // Relational
    { id: 'family', name: 'Family Tension', description: 'Resolving family conflicts' },
    { id: 'friendship', name: 'Friendship Test', description: 'Tested bonds of friendship' },
    { id: 'love', name: 'Love Challenges', description: 'Navigating romantic relationships' },
    { id: 'trust', name: 'Trust Issues', description: 'Learning to trust again' },
    { id: 'forgiveness', name: 'Seeking Forgiveness', description: 'Asking for or granting forgiveness' },

    // External
    { id: 'competition', name: 'Competition', description: 'Competing for something important' },
    { id: 'injustice', name: 'Fighting Injustice', description: 'Standing up for what is right' },
    { id: 'deadline', name: 'Race Against Time', description: 'Must complete task before deadline' },
    { id: 'nature', name: 'Against Nature', description: 'Surviving natural challenges' },
    { id: 'mystery', name: 'Solving Mystery', description: 'Uncovering the truth' },

    // Growth
    { id: 'new-skill', name: 'Learning New Skill', description: 'Mastering something difficult' },
    { id: 'career-change', name: 'Career Pivot', description: 'Starting over professionally' },
    { id: 'culture-shock', name: 'Cultural Adaptation', description: 'Adjusting to new environment' },
    { id: 'health', name: 'Health Journey', description: 'Overcoming health challenges' },
    { id: 'financial', name: 'Financial Struggles', description: 'Overcoming money problems' }
]

// Themes - Core messages
export const STORY_THEMES = [
    { id: 'perseverance', name: 'Perseverance', message: 'Never give up, even when it\'s hard' },
    { id: 'family', name: 'Family Bonds', message: 'Family is everything' },
    { id: 'friendship', name: 'True Friendship', message: 'Friends are the family we choose' },
    { id: 'love', name: 'Power of Love', message: 'Love conquers all' },
    { id: 'courage', name: 'Courage', message: 'Bravery in the face of fear' },
    { id: 'kindness', name: 'Kindness', message: 'Small acts of kindness change the world' },
    { id: 'second-chance', name: 'Second Chances', message: 'It\'s never too late to start over' },
    { id: 'following-dreams', name: 'Following Dreams', message: 'Chase your dreams relentlessly' },
    { id: 'self-acceptance', name: 'Self-Acceptance', message: 'Embrace who you are' },
    { id: 'forgiveness', name: 'Forgiveness', message: 'Letting go sets you free' },
    { id: 'growth', name: 'Personal Growth', message: 'We all have the power to change' },
    { id: 'community', name: 'Community', message: 'Together we are stronger' },
    { id: 'hope', name: 'Hope', message: 'There is always light in darkness' },
    { id: 'truth', name: 'Truth', message: 'The truth will set you free' },
    { id: 'sacrifice', name: 'Sacrifice', message: 'Some things are worth sacrificing for' }
]

// Emotional Tones
export const EMOTIONAL_TONES = [
    { id: 'heartwarming', name: 'Heartwarming', description: 'Touching, feel-good, uplifting' },
    { id: 'comedic', name: 'Comedic', description: 'Funny, lighthearted, humorous' },
    { id: 'dramatic', name: 'Dramatic', description: 'Intense, emotional, powerful' },
    { id: 'inspirational', name: 'Inspirational', description: 'Motivating, empowering, moving' },
    { id: 'romantic', name: 'Romantic', description: 'Tender, loving, passionate' },
    { id: 'nostalgic', name: 'Nostalgic', description: 'Reminiscent, sentimental, bittersweet' },
    { id: 'adventurous', name: 'Adventurous', description: 'Exciting, thrilling, exploratory' },
    { id: 'mysterious', name: 'Mysterious', description: 'Intriguing, suspenseful, enigmatic' },
    { id: 'whimsical', name: 'Whimsical', description: 'Playful, fantastical, imaginative' },
    { id: 'contemplative', name: 'Contemplative', description: 'Thoughtful, reflective, philosophical' }
]

// Hook Types - Opening strategies
export const OPENING_HOOKS = [
    { id: 'in-media-res', name: 'In Media Res', description: 'Start in the middle of action' },
    { id: 'mystery', name: 'Mystery Opening', description: 'Start with intriguing question' },
    { id: 'conflict', name: 'Immediate Conflict', description: 'Start with problem/challenge' },
    { id: 'dialogue', name: 'Compelling Dialogue', description: 'Start with interesting conversation' },
    { id: 'visual', name: 'Stunning Visual', description: 'Start with breathtaking scene' },
    { id: 'contrast', name: 'Before/After Contrast', description: 'Show dramatic change' },
    { id: 'voice', name: 'Character Voice', description: 'Start with narrator/character speaking' },
    { id: 'question', name: 'Provocative Question', description: 'Ask question that demands answer' },
    { id: 'flashforward', name: 'Flash Forward', description: 'Show glimpse of future' },
    { id: 'worldbuilding', name: 'World Introduction', description: 'Establish unique setting' }
]

// Time Periods for stories
export const TIME_CONTEXTS = [
    { id: 'present', name: 'Present Day', description: 'Contemporary modern setting' },
    { id: 'near-future', name: 'Near Future (2030-2050)', description: 'Advanced but recognizable technology' },
    { id: 'far-future', name: 'Far Future', description: 'Sci-fi advanced civilization' },
    { id: 'historical-1900s', name: 'Early 1900s', description: 'Industrial age, early film era' },
    { id: 'historical-1950s', name: '1950s', description: 'Post-war era, Americana' },
    { id: 'historical-1980s', name: '1980s', description: 'Retro tech, neon aesthetic' },
    { id: 'medieval', name: 'Medieval Era', description: 'Castles, knights, kingdoms' },
    { id: 'ancient', name: 'Ancient Civilization', description: 'Egypt, Rome, Greece, etc.' },
    { id: 'fantasy', name: 'Fantasy Timeless', description: 'Magical realm outside time' }
]

// Helper function to get random elements
export function getRandomElements<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
}

// Generate unique story combination
export function generateStoryCombination() {
    return {
        archetype: STORY_ARCHETYPES[Math.floor(Math.random() * STORY_ARCHETYPES.length)],
        setting: STORY_SETTINGS[Math.floor(Math.random() * STORY_SETTINGS.length)],
        character: CHARACTER_TYPES[Math.floor(Math.random() * CHARACTER_TYPES.length)],
        conflict: CONFLICT_TYPES[Math.floor(Math.random() * CONFLICT_TYPES.length)],
        theme: STORY_THEMES[Math.floor(Math.random() * STORY_THEMES.length)],
        tone: EMOTIONAL_TONES[Math.floor(Math.random() * EMOTIONAL_TONES.length)],
        hook: OPENING_HOOKS[Math.floor(Math.random() * OPENING_HOOKS.length)],
        timeContext: TIME_CONTEXTS[Math.floor(Math.random() * TIME_CONTEXTS.length)]
    }
}

// Calculate total unique combinations possible
export const TOTAL_COMBINATIONS =
    STORY_ARCHETYPES.length *
    STORY_SETTINGS.length *
    CHARACTER_TYPES.length *
    CONFLICT_TYPES.length *
    STORY_THEMES.length *
    EMOTIONAL_TONES.length *
    OPENING_HOOKS.length *
    TIME_CONTEXTS.length
// = 10 * 30 * 20 * 20 * 15 * 10 * 10 * 9 = 810,000,000+ combinations!
