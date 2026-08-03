import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI('AIzaSyCqJLUhzTUzjwSXa6HXyBTdzJn_KJHOzIU');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const POSTS_TO_GENERATE = [
  { platform: 'instagram', topic: 'Project launch announcement', style: 'exciting, premium feel' },
  { platform: 'instagram', topic: 'Corner plot benefits and premium pricing', style: 'informative, persuasive' },
  { platform: 'instagram', topic: 'Road-facing plots advantage', style: 'aspirational' },
  { platform: 'instagram', topic: 'Investment opportunity - land appreciation', style: 'data-driven, convincing' },
  { platform: 'instagram', topic: 'Site visit invitation for weekend', style: 'casual, friendly' },
  { platform: 'facebook', topic: 'Full project details with pricing', style: 'detailed, professional' },
  { platform: 'facebook', topic: 'Customer testimonial / booking success', style: 'social proof, trust' },
  { platform: 'facebook', topic: 'Limited plots remaining - urgency', style: 'urgency, FOMO' },
  { platform: 'facebook', topic: 'EMI and loan options available', style: 'helpful, informative' },
  { platform: 'facebook', topic: 'Why Wagholi-Bakori is the next big area', style: 'market insight, educational' },
];

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) { console.log('No workspace'); return; }

  console.log('🎨 Generating 10 real social media posts with Gemini AI...\n');

  for (let i = 0; i < POSTS_TO_GENERATE.length; i++) {
    const post = POSTS_TO_GENERATE[i];
    console.log(`[${i + 1}/10] Generating ${post.platform} post: "${post.topic}"...`);

    const prompt = `Create a ${post.platform} post for a real estate plotting project.

PROJECT DETAILS:
- Name: Anandi Park
- Developer: Yuvraj Gade & Rajan Kute Developers  
- Location: GAT No. 279, Village Bakori, Taluka Haveli, Pune (on Wagholi-Bakori Wide Road)
- Product: 84 Premium NA Plots (1000 to 4500 sqft)
- Price: Starting ₹15 Lakh (₹1500/sqft base, corner/road-facing at premium)
- Roads: 30 feet wide on 2 sides, 20 feet internal roads
- Infrastructure: Compound wall, entry gate, water, electricity, drainage, street lights
- USP: RERA registered, clear title, ready for registration, near Wagholi IT hub
- Contact: +91 99990 00001

TOPIC: ${post.topic}
STYLE: ${post.style}
PLATFORM: ${post.platform}

RETURN EXACTLY THIS JSON FORMAT (nothing else):
{
  "caption": "The full post caption with emojis (${post.platform === 'instagram' ? '250-300 chars max' : '400-500 chars for Facebook'})",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10"],
  "bestTime": "Best posting time in IST",
  "imageDescription": "A description of what the image should look like (for AI image generation later)"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const content = JSON.parse(jsonMatch[0]);
        
        await prisma.socialPost.create({
          data: {
            workspaceId: workspace.id,
            platform: post.platform,
            content: content.caption,
            hashtags: content.hashtags || [],
            mediaUrls: [`https://picsum.photos/seed/anandi-${i}-${Date.now()}/1080/1080`],
            status: 'draft',
          },
        });
        
        console.log(`  ✅ Created: "${content.caption.slice(0, 60)}..."`);
        console.log(`  📷 Image idea: ${content.imageDescription?.slice(0, 80) || 'N/A'}`);
        console.log(`  ⏰ Best time: ${content.bestTime || 'N/A'}\n`);
      } else {
        console.log(`  ⚠️ Could not parse response, saving raw text`);
        await prisma.socialPost.create({
          data: {
            workspaceId: workspace.id,
            platform: post.platform,
            content: text.slice(0, 500),
            hashtags: ['#AnandiPark', '#NAPlots', '#PuneRealEstate', '#PlotForSale'],
            mediaUrls: [`https://picsum.photos/seed/anandi-${i}/1080/1080`],
            status: 'draft',
          },
        });
      }
    } catch (e: any) {
      console.log(`  ❌ Error: ${e.message}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 2000));
  }

  const total = await prisma.socialPost.count({ where: { workspaceId: workspace.id } });
  console.log(`\n🎉 Done! Total posts in database: ${total}`);
  console.log('View them at: http://localhost:3000/marketing (Social Content Generator tab)');
}

main().catch(console.error).finally(() => prisma.$disconnect());
