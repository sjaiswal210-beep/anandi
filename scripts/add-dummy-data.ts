import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const salesManager = await prisma.user.findFirst({ where: { email: 'rahul@realtyos.ai' } });
  const salesExec = await prisma.user.findFirst({ where: { email: 'sneha@realtyos.ai' } });

  if (!workspace || !admin || !salesManager || !salesExec) {
    console.error('Run seed first');
    return;
  }

  console.log('Adding dummy data...\n');

  // 45 More Leads
  const leadNames = [
    'Aarav Mehta','Ishita Desai','Karan Thakur','Pooja Nair','Rohan Kapoor',
    'Ananya Iyer','Siddharth Jain','Divya Saxena','Arjun Malhotra','Meera Bhatia',
    'Varun Choudhary','Nisha Agarwal','Aditya Pandey','Shruti Kulkarni','Raj Singhania',
    'Tanya Oberoi','Manish Tiwari','Deepika Rao','Harsh Vardhan','Sunita Menon',
    'Gaurav Chopra','Pallavi Shetty','Nikhil Bansal','Ritu Sharma','Vishal Goyal',
    'Swati Mishra','Pranav Khanna','Kavitha Reddy','Mohit Arora','Lavanya Pillai',
    'Saurabh Gupta','Anjali Verma','Rahul Deshpande','Preeti Chauhan','Akash Mittal',
    'Snehal Patil','Vivek Srivastava','Riya Ghosh','Abhishek Dubey','Komal Bhatt',
    'Yash Tandon','Megha Rawat','Sameer Hussain','Nandini Rajan','Dhruv Mathur',
  ];

  const sources = ['WEBSITE','WHATSAPP','FACEBOOK','INSTAGRAM','GOOGLE_ADS','REFERRAL','WALK_IN','COLD_CALL'] as const;
  const statuses = ['NEW','CONTACTED','QUALIFIED','NEGOTIATION','WON','LOST'] as const;
  const types = ['FLAT','VILLA','PLOT','COMMERCIAL','PENTHOUSE','DUPLEX'] as const;
  const cities = ['Mumbai','Pune','Bangalore','Hyderabad','Chennai','Delhi','Noida','Gurgaon'];

  for (let i = 0; i < leadNames.length; i++) {
    const name = leadNames[i];
    const phone = '9' + String(100000000 + Math.floor(Math.random() * 899999999));
    await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        createdById: admin.id,
        assignedToId: Math.random() > 0.5 ? salesManager.id : salesExec.id,
        name,
        phone,
        email: name.toLowerCase().replace(' ', '.') + '@gmail.com',
        source: sources[Math.floor(Math.random() * sources.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        budget: Math.floor(Math.random() * 30000000) + 2000000,
        score: Math.floor(Math.random() * 70) + 20,
        preferredPropertyType: types[Math.floor(Math.random() * types.length)],
        preferredLocation: cities[Math.floor(Math.random() * cities.length)],
        tags: ['2024', 'hot-lead'],
      },
    });
  }
  console.log('✅ 45 more leads created');

  // 10 More Properties
  const properties = [
    { title: '3 BHK Sea View Flat - Tower A', type: 'FLAT' as const, price: 18500000, area: 1650, bed: 3, bath: 3, city: 'Mumbai' },
    { title: '4 BHK Penthouse - Skyline Residences', type: 'PENTHOUSE' as const, price: 45000000, area: 4200, bed: 4, bath: 5, city: 'Mumbai' },
    { title: '2 BHK Smart Home - Green Valley Phase 3', type: 'FLAT' as const, price: 6800000, area: 1050, bed: 2, bath: 2, city: 'Pune' },
    { title: 'Luxury Duplex - Hill View Estate', type: 'DUPLEX' as const, price: 32000000, area: 3500, bed: 4, bath: 4, city: 'Bangalore' },
    { title: 'Commercial Office Space - IT Park', type: 'COMMERCIAL' as const, price: 15000000, area: 2000, bed: 0, bath: 2, city: 'Hyderabad' },
    { title: 'Farm House Plot - 5 Acre Organic', type: 'FARM_LAND' as const, price: 8000000, area: 21780, bed: 0, bath: 0, city: 'Pune' },
    { title: '1 BHK Studio Apartment - Metro Walk', type: 'FLAT' as const, price: 3500000, area: 550, bed: 1, bath: 1, city: 'Noida' },
    { title: 'Row House - Garden City Township', type: 'ROW_HOUSE' as const, price: 12000000, area: 2200, bed: 3, bath: 3, city: 'Pune' },
    { title: '3 BHK Villa - Lake View Residency', type: 'VILLA' as const, price: 22000000, area: 2800, bed: 3, bath: 3, city: 'Bangalore' },
    { title: 'Retail Shop - Main Road Corner', type: 'STORE' as const, price: 9500000, area: 800, bed: 0, bath: 1, city: 'Chennai' },
  ];

  const project = await prisma.project.findFirst({ where: { workspaceId: workspace.id } });
  const propStatuses = ['AVAILABLE','AVAILABLE','AVAILABLE','RESERVED','SOLD'] as const;

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    await prisma.property.create({
      data: {
        workspaceId: workspace.id,
        projectId: project?.id,
        title: p.title,
        slug: 'prop-' + Date.now().toString(36) + '-' + i,
        type: p.type,
        status: propStatuses[Math.floor(Math.random() * propStatuses.length)],
        price: p.price,
        pricePerSqFt: Math.round(p.price / p.area),
        area: p.area,
        carpetArea: Math.floor(p.area * 0.75),
        bedrooms: p.bed,
        bathrooms: p.bath,
        city: p.city,
        state: 'Maharashtra',
        amenities: ['Parking', 'Security', 'Power Backup', 'Gym', 'Swimming Pool'],
        features: ['Modular Kitchen', 'Balcony', 'Garden View', 'Smart Home'],
        description: `Premium ${p.type.toLowerCase()} in prime location of ${p.city} with world-class amenities.`,
      },
    });
  }
  console.log('✅ 10 more properties created');

  // 8 Customers
  const customers = [];
  const custNames = ['Priya Sharma','Amit Patel','Vikram Singh','Neha Gupta','Rajesh Kumar','Ananya Reddy','Suresh Mehta','Kavita Joshi'];
  for (const name of custNames) {
    const c = await prisma.customer.create({
      data: {
        workspaceId: workspace.id,
        name,
        phone: '9' + String(200000000 + Math.floor(Math.random() * 799999999)),
        email: name.toLowerCase().replace(' ', '.') + '@email.com',
        city: cities[Math.floor(Math.random() * cities.length)],
        state: 'Maharashtra',
        occupation: ['Business', 'IT Professional', 'Doctor', 'Lawyer', 'Teacher'][Math.floor(Math.random() * 5)],
        annualIncome: Math.floor(Math.random() * 5000000) + 1000000,
      },
    });
    customers.push(c);
  }
  console.log('✅ 8 customers created');

  // 5 Bookings
  const allProps = await prisma.property.findMany({ where: { workspaceId: workspace.id, status: 'AVAILABLE' }, take: 5 });
  const bookingStatuses = ['INITIATED','AGREEMENT','LOAN_APPLIED','LOAN_APPROVED','REGISTERED'] as const;
  for (let i = 0; i < Math.min(5, allProps.length, customers.length); i++) {
    const prop = allProps[i];
    const cust = customers[i];
    const total = Number(prop.price);
    await prisma.booking.create({
      data: {
        workspaceId: workspace.id,
        customerId: cust.id,
        propertyId: prop.id,
        bookingNumber: 'BK-' + Date.now().toString(36).toUpperCase() + '-' + i,
        status: bookingStatuses[i],
        bookingAmount: Math.floor(total * 0.1),
        totalAmount: total,
        paidAmount: Math.floor(total * 0.3),
        pendingAmount: Math.floor(total * 0.7),
        loanRequired: Math.random() > 0.4,
        loanBank: ['SBI', 'HDFC', 'ICICI', 'Axis Bank', 'Kotak'][i],
      },
    });
  }
  console.log('✅ 5 bookings created');

  // 10 Site Visits
  const allLeads = await prisma.lead.findMany({ where: { workspaceId: workspace.id }, take: 20 });
  const visitStatuses = ['SCHEDULED','CONFIRMED','COMPLETED','COMPLETED','CANCELLED','NO_SHOW'] as const;
  for (let i = 0; i < 10; i++) {
    const daysOffset = Math.floor(Math.random() * 14) - 3;
    await prisma.siteVisit.create({
      data: {
        workspaceId: workspace.id,
        leadId: allLeads[i % allLeads.length].id,
        agentId: Math.random() > 0.5 ? salesManager.id : salesExec.id,
        propertyId: allProps[Math.floor(Math.random() * allProps.length)]?.id,
        scheduledAt: new Date(Date.now() + daysOffset * 86400000),
        status: visitStatuses[Math.floor(Math.random() * visitStatuses.length)],
        driverName: ['Raju', 'Sunil', 'Mohan', 'Kiran', 'Ajay'][Math.floor(Math.random() * 5)],
        driverPhone: '9' + String(300000000 + Math.floor(Math.random() * 699999999)),
        feedback: i < 5 ? 'Customer showed good interest. Wants to revisit with family.' : undefined,
        rating: i < 5 ? Math.floor(Math.random() * 3) + 3 : undefined,
        completedAt: i < 5 ? new Date() : undefined,
      },
    });
  }
  console.log('✅ 10 site visits created');

  // 20 Activities
  const actTypes = ['CALL_MADE', 'EMAIL_SENT', 'WHATSAPP_SENT', 'NOTE_ADDED', 'STATUS_CHANGED', 'VISIT_SCHEDULED'];
  const actTitles = ['Called customer - interested', 'Sent property brochure via email', 'WhatsApp follow-up done', 'Added meeting notes from site visit', 'Lead status updated after discussion', 'Scheduled site visit for next week'];
  for (let i = 0; i < 20; i++) {
    await prisma.activity.create({
      data: {
        userId: Math.random() > 0.5 ? salesManager.id : salesExec.id,
        leadId: allLeads[i % allLeads.length]?.id,
        type: actTypes[Math.floor(Math.random() * actTypes.length)],
        title: actTitles[Math.floor(Math.random() * actTitles.length)],
        description: 'Logged automatically by the system.',
      },
    });
  }
  console.log('✅ 20 activities created');

  // 10 Tasks
  const taskTitles = ['Follow up with client', 'Send price quotation', 'Schedule site visit', 'Prepare agreement draft', 'Collect KYC documents', 'Call for feedback', 'Share floor plans', 'Update CRM notes', 'Check loan status', 'Confirm booking amount'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
  const taskStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PENDING'] as const;
  for (let i = 0; i < 10; i++) {
    await prisma.task.create({
      data: {
        assigneeId: Math.random() > 0.5 ? salesManager.id : salesExec.id,
        creatorId: admin.id,
        leadId: allLeads[i % allLeads.length]?.id,
        title: taskTitles[i],
        description: 'Task for lead management workflow.',
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        status: taskStatuses[Math.floor(Math.random() * taskStatuses.length)],
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 7) * 86400000),
      },
    });
  }
  console.log('✅ 10 tasks created');

  // 15 Notifications
  const notifTitles = ['New lead assigned to you', 'Payment of ₹5L received', 'Site visit scheduled tomorrow', 'Follow-up reminder: Aarav Mehta', 'Booking confirmed - BK-001', 'Lead converted to customer', 'Document uploaded: Agreement', 'Marketing campaign launched', 'Weekly agent report ready', 'Monthly target achieved 🎉', 'New inquiry from website', 'WhatsApp message received', 'Loan approved for Priya', 'Commission credited ₹50K', 'Visit feedback received'];
  for (let i = 0; i < 15; i++) {
    await prisma.notification.create({
      data: {
        workspaceId: workspace.id,
        userId: [admin.id, salesManager.id, salesExec.id][Math.floor(Math.random() * 3)],
        type: 'IN_APP',
        title: notifTitles[i],
        body: 'Click to view details and take action.',
        isRead: Math.random() > 0.6,
        sentAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000),
      },
    });
  }
  console.log('✅ 15 notifications created');

  // Payments for bookings
  const bookings = await prisma.booking.findMany({ where: { workspaceId: workspace.id } });
  for (const booking of bookings) {
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        amount: Math.floor(Number(booking.bookingAmount)),
        type: 'BOOKING_AMOUNT',
        status: 'COMPLETED',
        method: ['UPI', 'NEFT', 'Cheque', 'Cash'][Math.floor(Math.random() * 4)],
        paidAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
      },
    });
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        customerId: booking.customerId,
        amount: Math.floor(Number(booking.totalAmount) * 0.2),
        type: 'INSTALLMENT',
        status: (['COMPLETED', 'PENDING', 'OVERDUE'] as const)[Math.floor(Math.random() * 3)],
        method: 'NEFT',
        dueDate: new Date(Date.now() + Math.floor(Math.random() * 60) * 86400000),
        paidAt: Math.random() > 0.5 ? new Date() : undefined,
      },
    });
  }
  console.log('✅ Payments created for all bookings');

  // Commissions
  for (const agent of [salesManager, salesExec]) {
    for (let i = 0; i < 3; i++) {
      await prisma.commission.create({
        data: {
          workspaceId: workspace.id,
          userId: agent.id,
          amount: Math.floor(Math.random() * 500000) + 50000,
          percentage: 2.5,
          type: 'BOOKING',
          status: Math.random() > 0.5 ? 'paid' : 'pending',
          paidAt: Math.random() > 0.5 ? new Date() : undefined,
        },
      });
    }
  }
  console.log('✅ 6 commissions created');

  // Notes
  for (let i = 0; i < 10; i++) {
    await prisma.note.create({
      data: {
        userId: Math.random() > 0.5 ? salesManager.id : salesExec.id,
        leadId: allLeads[i % allLeads.length]?.id,
        content: [
          'Client is very interested in 3BHK flats. Budget around 1 Cr. Prefers Baner area.',
          'Discussed loan options. Client has pre-approval from SBI.',
          'Family visit scheduled for this weekend. Need to arrange transport.',
          'Client comparing with competitor projects. Need to highlight USPs.',
          'Follow up after 3 days. Currently travelling.',
          'Very hot lead - ready to book this month if pricing is right.',
          'Needs vastu-compliant flat. East/North facing only.',
          'Investor profile - looking for rental yield properties.',
          'NRI client - communication via WhatsApp only. IST evening hours.',
          'Wants possession-ready. Not interested in under-construction.',
        ][i],
        isPinned: Math.random() > 0.7,
      },
    });
  }
  console.log('✅ 10 notes created');

  // Print totals
  console.log('\n🎉 All dummy data added successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Total Leads:', await prisma.lead.count({ where: { workspaceId: workspace.id } }));
  console.log('Total Properties:', await prisma.property.count({ where: { workspaceId: workspace.id } }));
  console.log('Total Customers:', await prisma.customer.count({ where: { workspaceId: workspace.id } }));
  console.log('Total Bookings:', await prisma.booking.count({ where: { workspaceId: workspace.id } }));
  console.log('Total Site Visits:', await prisma.siteVisit.count({ where: { workspaceId: workspace.id } }));
  console.log('Total Payments:', await prisma.payment.count());
  console.log('Total Activities:', await prisma.activity.count());
  console.log('Total Tasks:', await prisma.task.count());
  console.log('Total Notifications:', await prisma.notification.count());
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
