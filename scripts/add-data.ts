import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const sm = await prisma.user.findFirst({ where: { email: 'rahul@realtyos.ai' } });
  const se = await prisma.user.findFirst({ where: { email: 'sneha@realtyos.ai' } });
  if (!workspace || !admin || !sm || !se) { console.log('Run seed first'); return; }

  console.log('Adding data in batch...');

  // Batch create leads
  const sources = ['WEBSITE','WHATSAPP','FACEBOOK','INSTAGRAM','GOOGLE_ADS','REFERRAL','WALK_IN','COLD_CALL'] as const;
  const statuses = ['NEW','CONTACTED','QUALIFIED','NEGOTIATION','WON','LOST'] as const;
  const types = ['FLAT','VILLA','PLOT','COMMERCIAL','PENTHOUSE','DUPLEX'] as const;
  const cities = ['Mumbai','Pune','Bangalore','Hyderabad','Chennai'];
  const names = ['Aarav Mehta','Ishita Desai','Karan Thakur','Pooja Nair','Rohan Kapoor','Ananya Iyer','Siddharth Jain','Divya Saxena','Arjun Malhotra','Meera Bhatia','Varun Choudhary','Nisha Agarwal','Aditya Pandey','Shruti Kulkarni','Raj Singhania','Tanya Oberoi','Manish Tiwari','Deepika Rao','Harsh Vardhan','Sunita Menon'];

  await prisma.lead.createMany({
    data: names.map((name, i) => ({
      workspaceId: workspace.id,
      createdById: admin.id,
      assignedToId: i % 2 === 0 ? sm.id : se.id,
      name,
      phone: '9' + String(100000000 + i * 11111111),
      email: name.toLowerCase().replace(' ', '.') + '@gmail.com',
      source: sources[i % sources.length],
      status: statuses[i % statuses.length],
      budget: (i + 1) * 1500000,
      score: 30 + i * 3,
      preferredPropertyType: types[i % types.length],
      preferredLocation: cities[i % cities.length],
      tags: ['2024', 'demo'],
    })),
    skipDuplicates: true,
  });
  console.log('✅ 20 leads created');

  // Batch customers
  await prisma.customer.createMany({
    data: ['Priya Sharma','Amit Patel','Vikram Singh','Neha Gupta','Rajesh Kumar'].map((name, i) => ({
      workspaceId: workspace.id,
      name,
      phone: '9' + String(200000000 + i * 22222222),
      email: name.toLowerCase().replace(' ', '.') + '@email.com',
      city: cities[i % cities.length],
      state: 'Maharashtra',
      occupation: ['Business','IT','Doctor','Lawyer','Teacher'][i],
    })),
    skipDuplicates: true,
  });
  console.log('✅ 5 customers created');

  // Properties
  const project = await prisma.project.findFirst({ where: { workspaceId: workspace.id } });
  await prisma.property.createMany({
    data: [
      { title: '3BHK Sea View - Tower A', type: 'FLAT' as const, price: 18500000, area: 1650, bedrooms: 3, bathrooms: 3, city: 'Mumbai' },
      { title: '4BHK Penthouse Skyline', type: 'PENTHOUSE' as const, price: 45000000, area: 4200, bedrooms: 4, bathrooms: 5, city: 'Mumbai' },
      { title: '2BHK Smart Home Phase 3', type: 'FLAT' as const, price: 6800000, area: 1050, bedrooms: 2, bathrooms: 2, city: 'Pune' },
      { title: 'Luxury Duplex Hill View', type: 'DUPLEX' as const, price: 32000000, area: 3500, bedrooms: 4, bathrooms: 4, city: 'Bangalore' },
      { title: 'Commercial Office IT Park', type: 'COMMERCIAL' as const, price: 15000000, area: 2000, bedrooms: 0, bathrooms: 2, city: 'Hyderabad' },
      { title: '1BHK Studio Metro Walk', type: 'FLAT' as const, price: 3500000, area: 550, bedrooms: 1, bathrooms: 1, city: 'Pune' },
      { title: 'Villa Lake View 3BHK', type: 'VILLA' as const, price: 22000000, area: 2800, bedrooms: 3, bathrooms: 3, city: 'Bangalore' },
    ].map((p, i) => ({
      workspaceId: workspace.id,
      projectId: project?.id,
      title: p.title,
      slug: 'p-' + Date.now().toString(36) + i,
      type: p.type,
      status: (['AVAILABLE','AVAILABLE','RESERVED','AVAILABLE','SOLD','AVAILABLE','AVAILABLE'] as const)[i],
      price: p.price,
      area: p.area,
      carpetArea: Math.floor(p.area * 0.75),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      city: p.city,
      state: 'Maharashtra',
      amenities: ['Parking','Security','Gym','Pool'],
      features: ['Modular Kitchen','Balcony'],
      description: `Premium ${p.type.toLowerCase()} in ${p.city}`,
    })),
    skipDuplicates: true,
  });
  console.log('✅ 7 properties created');

  // Notifications
  await prisma.notification.createMany({
    data: [
      'New lead assigned: Aarav Mehta',
      'Payment ₹5L received for BK-001',
      'Site visit tomorrow at 10 AM',
      'Follow-up reminder: Karan Thakur',
      'Booking confirmed - Tower A Flat',
      'Monthly target 80% achieved',
      'New website inquiry received',
      'WhatsApp: 3 unread messages',
      'Loan approved for Vikram Singh',
      'Commission ₹75K credited',
    ].map((title, i) => ({
      workspaceId: workspace.id,
      userId: [admin.id, sm.id, se.id][i % 3],
      type: 'IN_APP' as const,
      title,
      body: 'Click to view details.',
      isRead: i > 5,
      sentAt: new Date(Date.now() - i * 3600000),
    })),
  });
  console.log('✅ 10 notifications created');

  // Tasks
  await prisma.task.createMany({
    data: ['Follow up with Aarav', 'Send quotation to Ishita', 'Schedule visit for Karan', 'Prepare agreement for Pooja', 'Collect docs from Rohan', 'Call Ananya for feedback', 'Share plans with Siddharth', 'Update CRM for Divya'].map((title, i) => ({
      assigneeId: i % 2 === 0 ? sm.id : se.id,
      creatorId: admin.id,
      title,
      description: 'Pending task for CRM workflow',
      priority: (['MEDIUM','HIGH','LOW','URGENT'] as const)[i % 4],
      status: (['PENDING','IN_PROGRESS','COMPLETED','PENDING'] as const)[i % 4],
      dueDate: new Date(Date.now() + (i + 1) * 86400000),
    })),
  });
  console.log('✅ 8 tasks created');

  // Print summary
  const counts = {
    leads: await prisma.lead.count({ where: { workspaceId: workspace.id } }),
    properties: await prisma.property.count({ where: { workspaceId: workspace.id } }),
    customers: await prisma.customer.count({ where: { workspaceId: workspace.id } }),
    notifications: await prisma.notification.count(),
    tasks: await prisma.task.count(),
  };
  console.log('\n🎉 Done! Database summary:');
  console.log(counts);
}

main().catch(console.error).finally(() => prisma.$disconnect());
