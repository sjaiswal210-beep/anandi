import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.warn('🌱 Starting database seed...');

  // Create Super Admin
  const adminPassword = await bcrypt.hash('Admin@123!', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@realtyos.ai' },
    update: {},
    create: {
      email: 'admin@realtyos.ai',
      name: 'Super Admin',
      phone: '9999999999',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      emailVerified: new Date(),
    },
  });
  console.warn('✅ Super Admin created');

  // Create Demo Workspace
  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-builders' },
    update: {},
    create: {
      name: 'Demo Builders Pvt Ltd',
      slug: 'demo-builders',
      description: 'Demo workspace for RealtyOS AI',
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        dateFormat: 'DD/MM/YYYY',
        language: 'en',
      },
      features: {
        crm: true,
        properties: true,
        bookings: true,
        visits: true,
        documents: true,
        aiAgents: true,
        whatsapp: true,
        website: true,
        reports: true,
      },
    },
  });
  console.warn('✅ Demo Workspace created');

  // Add admin as workspace member
  await prisma.workspaceMember.upsert({
    where: { workspaceId_userId: { workspaceId: workspace.id, userId: admin.id } },
    update: {},
    create: {
      workspaceId: workspace.id,
      userId: admin.id,
      role: 'SUPER_ADMIN',
    },
  });

  // Create Demo Users
  const salesPassword = await bcrypt.hash('Sales@123!', 12);
  const salesManager = await prisma.user.upsert({
    where: { email: 'rahul@realtyos.ai' },
    update: {},
    create: {
      email: 'rahul@realtyos.ai',
      name: 'Rahul Verma',
      phone: '9876543210',
      passwordHash: salesPassword,
      role: 'SALES_MANAGER',
      emailVerified: new Date(),
    },
  });

  const salesExec = await prisma.user.upsert({
    where: { email: 'sneha@realtyos.ai' },
    update: {},
    create: {
      email: 'sneha@realtyos.ai',
      name: 'Sneha Patel',
      phone: '9876543211',
      passwordHash: salesPassword,
      role: 'SALES_EXECUTIVE',
      emailVerified: new Date(),
    },
  });

  // Add them to workspace
  for (const user of [salesManager, salesExec]) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      update: {},
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: user.role,
      },
    });
  }
  console.warn('✅ Demo Users created');

  // Create Subscription
  await prisma.subscription.upsert({
    where: { workspaceId: workspace.id },
    update: {},
    create: {
      workspaceId: workspace.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      usageLimits: {
        leads: 5000,
        properties: 500,
        users: 25,
        storage: 10240,
        aiCredits: 5000,
      },
    },
  });
  console.warn('✅ Subscription created');

  // Create Demo Project
  const project = await prisma.project.upsert({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: 'skyline-heights' } },
    update: {},
    create: {
      workspaceId: workspace.id,
      name: 'Skyline Heights',
      slug: 'skyline-heights',
      description: 'Premium residential towers with world-class amenities in the heart of the city.',
      address: 'Baner Road',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '411045',
      reraNumber: 'P52100030523',
      totalUnits: 200,
      availableUnits: 142,
      amenities: ['Swimming Pool', 'Gym', 'Club House', 'Children Play Area', 'Garden', 'Parking', 'Security'],
      status: 'active',
    },
  });
  console.warn('✅ Demo Project created');

  // Create Demo Properties
  const properties = [
    { title: '2 BHK Premium Flat - A Wing', type: 'FLAT', price: 7500000, area: 950, bedrooms: 2, bathrooms: 2 },
    { title: '3 BHK Luxury Flat - B Wing', type: 'FLAT', price: 12000000, area: 1450, bedrooms: 3, bathrooms: 3 },
    { title: 'Premium Villa - Phase 2', type: 'VILLA', price: 25000000, area: 3200, bedrooms: 4, bathrooms: 4 },
    { title: 'Commercial Shop - Ground Floor', type: 'COMMERCIAL', price: 8500000, area: 500, bedrooms: 0, bathrooms: 1 },
    { title: 'NA Plot - 2000 sqft', type: 'PLOT', price: 4000000, area: 2000, bedrooms: 0, bathrooms: 0 },
  ];

  for (let i = 0; i < properties.length; i++) {
    const prop = properties[i];
    await prisma.property.upsert({
      where: { workspaceId_slug: { workspaceId: workspace.id, slug: `property-${i + 1}` } },
      update: {},
      create: {
        workspaceId: workspace.id,
        projectId: project.id,
        title: prop.title,
        slug: `property-${i + 1}`,
        type: prop.type as never,
        status: 'AVAILABLE',
        price: prop.price,
        area: prop.area,
        carpetArea: Math.floor(prop.area * 0.75),
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        city: 'Pune',
        state: 'Maharashtra',
        amenities: ['Parking', 'Security', 'Power Backup'],
      },
    });
  }
  console.warn('✅ Demo Properties created');

  // Create Demo Leads
  const leads = [
    { name: 'Priya Sharma', phone: '9123456001', email: 'priya@gmail.com', source: 'WEBSITE', budget: 8000000, status: 'NEW' },
    { name: 'Amit Patel', phone: '9123456002', email: 'amit.p@gmail.com', source: 'WHATSAPP', budget: 15000000, status: 'QUALIFIED' },
    { name: 'Vikram Singh', phone: '9123456003', email: 'vikram.s@outlook.com', source: 'GOOGLE_ADS', budget: 7500000, status: 'CONTACTED' },
    { name: 'Neha Gupta', phone: '9123456004', email: 'neha.g@yahoo.com', source: 'REFERRAL', budget: 25000000, status: 'NEGOTIATION' },
    { name: 'Rajesh Kumar', phone: '9123456005', email: 'rajesh.k@gmail.com', source: 'FACEBOOK', budget: 5000000, status: 'NEW' },
    { name: 'Ananya Reddy', phone: '9123456006', source: 'INSTAGRAM', budget: 12000000, status: 'CONTACTED' },
    { name: 'Suresh Mehta', phone: '9123456007', email: 'suresh@company.com', source: 'WALK_IN', budget: 30000000, status: 'QUALIFIED' },
    { name: 'Kavita Joshi', phone: '9123456008', source: 'COLD_CALL', budget: 6000000, status: 'NEW' },
  ];

  for (const lead of leads) {
    await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        createdById: admin.id,
        assignedToId: Math.random() > 0.5 ? salesManager.id : salesExec.id,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        source: lead.source as never,
        status: lead.status as never,
        budget: lead.budget,
        score: Math.floor(Math.random() * 60) + 30,
        preferredPropertyType: 'FLAT',
        preferredLocation: 'Pune',
        tags: ['hot-lead'],
      },
    });
  }
  console.warn('✅ Demo Leads created');

  // Initialize AI Agents
  const agentTypes = [
    { type: 'SALES', name: 'Sales Agent' },
    { type: 'MARKETING', name: 'Marketing Agent' },
    { type: 'ADVERTISEMENT', name: 'Advertisement Agent' },
    { type: 'FOLLOW_UP', name: 'Follow-up Agent' },
    { type: 'LEAD_QUALIFICATION', name: 'Lead Qualification Agent' },
    { type: 'CALLING', name: 'Calling Agent' },
    { type: 'SEO', name: 'SEO Agent' },
    { type: 'SOCIAL_MEDIA', name: 'Social Media Agent' },
    { type: 'CEO', name: 'CEO Agent' },
    { type: 'ANALYTICS', name: 'Analytics Agent' },
  ];

  for (const agent of agentTypes) {
    await prisma.aIAgent.upsert({
      where: { workspaceId_type: { workspaceId: workspace.id, type: agent.type as never } },
      update: {},
      create: {
        workspaceId: workspace.id,
        type: agent.type as never,
        name: agent.name,
        isActive: agent.type !== 'CALLING',
        totalRuns: Math.floor(Math.random() * 500) + 50,
      },
    });
  }
  console.warn('✅ AI Agents initialized');

  console.warn('\n🚀 Seed completed successfully!');
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.warn('Admin Login: admin@realtyos.ai / Admin@123!');
  console.warn('Sales Manager: rahul@realtyos.ai / Sales@123!');
  console.warn('Sales Exec: sneha@realtyos.ai / Sales@123!');
  console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
