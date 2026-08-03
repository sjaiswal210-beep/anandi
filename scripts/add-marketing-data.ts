import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) { console.log('No workspace'); return; }

  console.log('Adding marketing & WhatsApp data...');

  // Campaigns
  await prisma.campaign.createMany({
    data: [
      { workspaceId: workspace.id, name: 'Skyline Heights Launch - Google', type: 'SEARCH', platform: 'google', status: 'ACTIVE', budget: 150000, spent: 87000, startDate: new Date('2026-07-01'), endDate: new Date('2026-08-31'), metrics: { impressions: 45000, clicks: 2100, leads: 34, ctr: 4.7, cpc: 41 }, content: { headline: '3BHK Flats from ₹75L in Pune', description: 'Book now and get ₹2L discount' } },
      { workspaceId: workspace.id, name: 'Premium Villa - Meta Ads', type: 'DISPLAY', platform: 'meta', status: 'ACTIVE', budget: 200000, spent: 124000, startDate: new Date('2026-07-10'), endDate: new Date('2026-08-30'), metrics: { impressions: 120000, clicks: 3400, leads: 56, ctr: 2.8, cpc: 36 }, content: { headline: 'Luxury Villas Starting ₹2.2 Cr', image: '/villa-ad.jpg' } },
      { workspaceId: workspace.id, name: 'Instagram Reels - Project Tour', type: 'VIDEO', platform: 'instagram', status: 'ACTIVE', budget: 50000, spent: 32000, startDate: new Date('2026-07-15'), metrics: { views: 89000, likes: 4500, shares: 890, saves: 1200, leads: 18 }, content: { type: 'reel', caption: 'Your dream home awaits! 🏠' } },
      { workspaceId: workspace.id, name: 'Facebook Lead Gen - 2BHK', type: 'LEAD_GEN', platform: 'facebook', status: 'ACTIVE', budget: 80000, spent: 56000, startDate: new Date('2026-07-05'), metrics: { impressions: 67000, clicks: 1800, leads: 42, ctr: 2.7, costPerLead: 1333 }, content: { headline: 'Affordable 2BHK in Baner', form: 'lead_gen_form_1' } },
      { workspaceId: workspace.id, name: 'Diwali Special Offer', type: 'SEASONAL', platform: 'meta', status: 'DRAFT', budget: 300000, spent: 0, metrics: {}, content: { headline: 'Diwali Dhamaka - 0% EMI for 24 months' } },
      { workspaceId: workspace.id, name: 'Google Display - Brand Awareness', type: 'DISPLAY', platform: 'google', status: 'COMPLETED', budget: 100000, spent: 98000, startDate: new Date('2026-06-01'), endDate: new Date('2026-06-30'), metrics: { impressions: 230000, clicks: 5600, ctr: 2.4 }, content: { headline: 'RealtyOS Builders - Trust Since 2015' } },
      { workspaceId: workspace.id, name: 'LinkedIn B2B - Commercial Spaces', type: 'SEARCH', platform: 'linkedin', status: 'ACTIVE', budget: 75000, spent: 41000, startDate: new Date('2026-07-20'), metrics: { impressions: 12000, clicks: 340, leads: 8, ctr: 2.8 }, content: { headline: 'Premium Office Spaces in IT Park' } },
      { workspaceId: workspace.id, name: 'Email Drip - Nurture Sequence', type: 'EMAIL', platform: 'email', status: 'ACTIVE', budget: 5000, spent: 2000, metrics: { sent: 2400, opened: 1080, clicked: 320, openRate: 45, clickRate: 13.3 }, content: { subject: 'Your Dream Home is Waiting', template: 'nurture_v2' } },
    ],
  });
  console.log('✅ 8 campaigns created');

  // WhatsApp Messages (realistic conversation threads)
  const conversations = [
    { phone: '919876543001', name: 'Priya Sharma', messages: [
      { dir: 'incoming', text: 'Hi, I saw your ad for 3BHK flats in Baner. What is the price?', time: -180 },
      { dir: 'outgoing', text: 'Hello Priya! Thank you for your interest. Our 3BHK flats in Skyline Heights start from ₹75 Lakhs. Would you like to know more?', time: -175 },
      { dir: 'incoming', text: 'Yes please. What is the carpet area and which floor is available?', time: -170 },
      { dir: 'outgoing', text: 'The carpet area is 950 sq.ft. We have units available on 5th, 8th, and 12th floor. 12th floor has a great city view! Shall I send you the floor plan?', time: -165 },
      { dir: 'incoming', text: 'Yes send floor plan. Also is there any offer going on?', time: -160 },
      { dir: 'outgoing', text: '📎 Floor_Plan_3BHK_TypeA.pdf\n\nYes! We have an early bird offer - ₹2 Lakh discount + free modular kitchen for bookings this month. Would you like to schedule a site visit?', time: -155 },
      { dir: 'incoming', text: 'Sounds good. Can I visit this Saturday?', time: -120 },
      { dir: 'outgoing', text: 'Perfect! I have scheduled your site visit for Saturday, 2nd Aug at 11:00 AM. Our executive Rahul will assist you. I will share the location link shortly. 📍', time: -115 },
      { dir: 'incoming', text: 'Thank you! One more thing - do you have home loan tie-ups?', time: -60 },
      { dir: 'outgoing', text: 'Yes! We have tie-ups with SBI, HDFC, ICICI & Axis Bank. Interest rates starting from 8.5%. We also assist with the entire loan process. See you Saturday! 😊', time: -55 },
    ]},
    { phone: '919876543002', name: 'Amit Patel', messages: [
      { dir: 'incoming', text: 'Hello, looking for 2BHK under 70 lakhs in Pune. Any options?', time: -300 },
      { dir: 'outgoing', text: 'Hi Amit! Yes, we have excellent 2BHK options. In which area are you looking? Baner, Hinjewadi, Wakad, or Kharadi?', time: -295 },
      { dir: 'incoming', text: 'Hinjewadi or Wakad preferred. I work in IT park', time: -290 },
      { dir: 'outgoing', text: 'Great choice! We have 2BHK in Green Valley Phase 3, Wakad at ₹68L (1050 sqft carpet). Just 10 mins from Hinjewadi IT Park. Ready to move in 6 months.', time: -285 },
      { dir: 'incoming', text: 'What amenities are included?', time: -240 },
      { dir: 'outgoing', text: 'Amenities include:\n🏊 Swimming Pool\n🏋️ Gym\n🌳 Garden\n👶 Kids Play Area\n🏸 Badminton Court\n🔒 24/7 Security\n🅿️ Covered Parking\n\nWould you like to visit?', time: -235 },
      { dir: 'incoming', text: 'Yes, any day after 6pm works for me', time: -200 },
      { dir: 'outgoing', text: 'I have booked a visit for you on Wednesday at 6:30 PM. Our team will be there to show you the sample flat. Shall I send you the Google Maps link?', time: -195 },
      { dir: 'incoming', text: '👍 Please share', time: -190 },
    ]},
    { phone: '919876543003', name: 'Vikram Singh', messages: [
      { dir: 'incoming', text: 'I am interested in villa projects. Budget 2-3 crore', time: -500 },
      { dir: 'outgoing', text: 'Hello Vikram! We have premium villas in Lake View Residency, Bangalore. 3BHK villas starting from ₹2.2 Cr with 2800 sqft built-up area. Gated community with club house.', time: -495 },
      { dir: 'incoming', text: 'How many units total? And how many sold?', time: -480 },
      { dir: 'outgoing', text: 'Total 48 villas in Phase 1. 32 are already sold. Only 16 remaining. The project has been very popular due to the lake-facing plots and premium specifications.', time: -475 },
      { dir: 'incoming', text: 'RERA registered?', time: -470 },
      { dir: 'outgoing', text: 'Yes, fully RERA registered. Number: P52100030523. You can verify on the RERA website. All legal clearances are in place. Would you like me to send the brochure?', time: -465 },
      { dir: 'incoming', text: 'Send brochure and price sheet', time: -460 },
      { dir: 'outgoing', text: '📎 LakeView_Villas_Brochure.pdf\n📎 Price_Sheet_Phase1.pdf\n\nHere you go! Let me know if you have any questions. I can also arrange a video call with our architect if you are interested.', time: -455 },
    ]},
    { phone: '919876543004', name: 'Neha Gupta', messages: [
      { dir: 'incoming', text: 'Hi is the 4BHK penthouse still available?', time: -50 },
      { dir: 'outgoing', text: 'Hello Neha! Yes, the 4BHK Penthouse in Skyline Residences is available. It is our flagship unit - 4200 sqft with a private terrace and infinity pool access.', time: -45 },
      { dir: 'incoming', text: 'Price?', time: -40 },
      { dir: 'outgoing', text: 'The penthouse is priced at ₹4.5 Crore (all inclusive). This includes 2 premium car parks, private elevator access, and Italian marble flooring throughout.', time: -35 },
      { dir: 'incoming', text: 'Can we negotiate? I am ready to book immediately if price is right', time: -30 },
      { dir: 'outgoing', text: 'I appreciate your interest! Let me check with the management on the best possible offer for an immediate booking. Can I call you in 30 minutes to discuss?', time: -25 },
      { dir: 'incoming', text: 'Yes call me', time: -20 },
    ]},
    { phone: '919876543005', name: 'Rajesh Kumar', messages: [
      { dir: 'incoming', text: 'What is the EMI for 3BHK 75 lakh?', time: -1000 },
      { dir: 'outgoing', text: 'Hi Rajesh! For ₹75L property:\n\n📊 With 20% down payment (₹15L):\nLoan: ₹60L\nEMI @ 8.5%: ~₹52,000/month (20 yrs)\nEMI @ 8.5%: ~₹46,000/month (25 yrs)\n\nWe can help you get pre-approved. Would that help?', time: -995 },
      { dir: 'incoming', text: 'I can pay 30% down. What will be EMI then?', time: -990 },
      { dir: 'outgoing', text: 'With 30% down (₹22.5L):\nLoan: ₹52.5L\nEMI @ 8.5%: ~₹45,500/month (20 yrs)\n\nMuch more comfortable! Plus with your higher down payment, banks may offer better rates. Shall I connect you with our loan advisor?', time: -985 },
      { dir: 'incoming', text: 'Yes please arrange that', time: -980 },
    ]},
  ];

  for (const conv of conversations) {
    for (const msg of conv.messages) {
      await prisma.whatsAppMessage.create({
        data: {
          workspaceId: workspace.id,
          from: msg.dir === 'incoming' ? conv.phone : '919999000001',
          to: msg.dir === 'incoming' ? '919999000001' : conv.phone,
          type: 'text',
          content: { text: { body: msg.text } },
          direction: msg.dir,
          status: msg.dir === 'outgoing' ? 'sent' : 'received',
          createdAt: new Date(Date.now() + msg.time * 60000),
        },
      });
    }
  }
  console.log('✅ 45+ WhatsApp messages created (5 conversations)');

  console.log('\n🎉 Marketing & WhatsApp data added!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
