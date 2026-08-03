import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.error('No workspace found. Run the seed first.');
    return;
  }

  const existing = await prisma.website.findFirst({ where: { workspaceId: workspace.id } });

  const data = {
    name: 'Anandi Park',
    subdomain: 'anandi-park',
    template: 'modern',
    isPublished: true,
    publishedAt: new Date(),
    config: {
      theme: 'dark-gold',
      colors: { primary: '#f59e0b', secondary: '#0f172a', accent: '#fbbf24' },
      contactInfo: {
        phone: '+91 99990 00001',
        email: 'sales@anandipark.in',
        address: 'Pune, Maharashtra',
      },
      builder: 'Yuraj & Rajan Developers',
    },
    seoConfig: {
      title: 'Anandi Park | Premium NA Plots by Yuraj & Rajan Developers, Pune',
      description: 'Premium NA plots from 1000 to 5000 sq.ft. RERA registered. Starting at Rs 15 Lac.',
      keywords: ['NA plots Pune', 'Anandi Park', 'Yuraj Rajan Developers'],
    },
    pages: [
      { id: 'home', name: 'Home', path: '/project', published: true },
      { id: 'plans', name: 'Floor Plans', path: '/project#plans', published: true },
      { id: 'amenities', name: 'Amenities', path: '/project#amenities', published: true },
      { id: 'gallery', name: 'Gallery', path: '/project#gallery', published: true },
      { id: 'location', name: 'Location', path: '/project#location', published: true },
      { id: 'contact', name: 'Contact', path: '/project#contact', published: true },
    ],
  };

  if (existing) {
    await prisma.website.update({ where: { id: existing.id }, data: data as never });
    console.log('Website record updated and published.');
  } else {
    await prisma.website.create({
      data: { ...(data as never), workspace: { connect: { id: workspace.id } } },
    });
    console.log('Website record created and published.');
  }

  console.log('Public URL: http://localhost:3000/project');
  console.log('Inquiry endpoint: /api/v1/website/public/skyline-heights/inquiry');
}

main().catch(console.error).finally(() => prisma.$disconnect());
