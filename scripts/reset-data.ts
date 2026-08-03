/**
 * Reset demo/dummy data for Anandi Park.
 *
 * KEEPS:  workspace, admin user (Kalpdev@outlook.com), Anandi Park project,
 *         the 84 PlotInventory rows, AI-generated SocialPosts, website config.
 * DELETES: all leads, customers, bookings, payments, visits, tasks, notes,
 *          activities, notifications, dummy properties, demo staff users.
 *
 * Dry run (safe, read-only):
 *   npx tsx scripts/reset-data.ts
 * Actually delete:
 *   npx tsx scripts/reset-data.ts --confirm
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIRM = process.argv.includes('--confirm');
const KEEP_ADMIN_EMAIL = 'Kalpdev@outlook.com';

// Ordered children-first so foreign keys never block a delete.
const STEPS: { label: string; count: () => Promise<number>; del: () => Promise<{ count: number }> }[] = [
  { label: 'Payments', count: () => prisma.payment.count(), del: () => prisma.payment.deleteMany({}) },
  { label: 'Commissions', count: () => prisma.commission.count(), del: () => prisma.commission.deleteMany({}) },
  { label: 'Notes', count: () => prisma.note.count(), del: () => prisma.note.deleteMany({}) },
  { label: 'Tasks', count: () => prisma.task.count(), del: () => prisma.task.deleteMany({}) },
  { label: 'Activities', count: () => prisma.activity.count(), del: () => prisma.activity.deleteMany({}) },
  { label: 'Site visits', count: () => prisma.siteVisit.count(), del: () => prisma.siteVisit.deleteMany({}) },
  { label: 'Documents', count: () => prisma.document.count(), del: () => prisma.document.deleteMany({}) },
  { label: 'Bookings', count: () => prisma.booking.count(), del: () => prisma.booking.deleteMany({}) },
  { label: 'WhatsApp messages', count: () => prisma.whatsAppMessage.count(), del: () => prisma.whatsAppMessage.deleteMany({}) },
  { label: 'Notifications', count: () => prisma.notification.count(), del: () => prisma.notification.deleteMany({}) },
  { label: 'Agent conversations', count: () => prisma.agentConversation.count(), del: () => prisma.agentConversation.deleteMany({}) },
  { label: 'Agent executions', count: () => prisma.agentExecution.count(), del: () => prisma.agentExecution.deleteMany({}) },
  { label: 'Call records', count: () => prisma.callRecord.count(), del: () => prisma.callRecord.deleteMany({}) },
  { label: 'Customer imports', count: () => prisma.customerImport.count(), del: () => prisma.customerImport.deleteMany({}) },
  { label: 'Broadcast campaigns', count: () => prisma.broadcastCampaign.count(), del: () => prisma.broadcastCampaign.deleteMany({}) },
  { label: 'Campaigns', count: () => prisma.campaign.count(), del: () => prisma.campaign.deleteMany({}) },
  { label: 'Leads', count: () => prisma.lead.count(), del: () => prisma.lead.deleteMany({}) },
  { label: 'Customers', count: () => prisma.customer.count(), del: () => prisma.customer.deleteMany({}) },
  { label: 'Media (property images)', count: () => prisma.media.count({ where: { propertyId: { not: null } } }), del: () => prisma.media.deleteMany({ where: { propertyId: { not: null } } }) },
  { label: 'Properties (dummy listings)', count: () => prisma.property.count(), del: () => prisma.property.deleteMany({}) },
  { label: 'Audit logs', count: () => prisma.auditLog.count(), del: () => prisma.auditLog.deleteMany({}) },
];

async function main() {
  console.log(CONFIRM ? '\n⚠️  DELETING demo data\n' : '\n🔍 DRY RUN — nothing will be deleted\n');

  // Show what is being preserved, so mistakes are obvious before deleting.
  const [plots, posts, project, admin] = await Promise.all([
    prisma.plotInventory.count(),
    prisma.socialPost.count(),
    prisma.project.findFirst({ select: { name: true } }),
    prisma.user.findFirst({ where: { email: KEEP_ADMIN_EMAIL }, select: { email: true } }),
  ]);

  console.log('KEEPING:');
  console.log(`  Project        : ${project?.name ?? '(none found)'}`);
  console.log(`  Plots          : ${plots}`);
  console.log(`  Social posts   : ${posts}`);
  console.log(`  Admin user     : ${admin?.email ?? '⚠️  NOT FOUND — stopping'}`);
  console.log('');

  if (!admin) {
    console.error(`Admin ${KEEP_ADMIN_EMAIL} not found. Refusing to continue —`);
    console.error('deleting users without a surviving admin would lock you out.');
    process.exit(1);
  }

  if (plots === 0) {
    console.warn('⚠️  0 plots found. Expected 84. Re-seed with scripts/seed-real-plots.ts\n');
  }

  console.log('DELETING:');
  let total = 0;

  for (const step of STEPS) {
    try {
      const n = await step.count();
      total += n;
      if (n === 0) {
        console.log(`  ${step.label.padEnd(28)} 0 (nothing to do)`);
        continue;
      }
      if (CONFIRM) {
        const res = await step.del();
        console.log(`  ${step.label.padEnd(28)} ${res.count} deleted`);
      } else {
        console.log(`  ${step.label.padEnd(28)} ${n} would be deleted`);
      }
    } catch (e: any) {
      console.error(`  ${step.label.padEnd(28)} FAILED: ${e.message}`);
    }
  }

  // Demo staff accounts created by the old seed script.
  const demoUsers = await prisma.user.findMany({
    where: { email: { not: KEEP_ADMIN_EMAIL }, NOT: { email: { contains: 'Kalpdev' } } },
    select: { id: true, email: true },
  });

  if (demoUsers.length > 0) {
    console.log(`  ${'Demo staff users'.padEnd(28)} ${demoUsers.length} ${CONFIRM ? '' : 'would be '}removed`);
    demoUsers.forEach((u) => console.log(`      - ${u.email}`));
    if (CONFIRM) {
      const ids = demoUsers.map((u) => u.id);
      await prisma.workspaceMember.deleteMany({ where: { userId: { in: ids } } });
      await prisma.session.deleteMany({ where: { userId: { in: ids } } });
      await prisma.account.deleteMany({ where: { userId: { in: ids } } });
      await prisma.user.deleteMany({ where: { id: { in: ids } } });
    }
  }

  console.log('');
  if (CONFIRM) {
    console.log('✅ Reset complete. Database now holds only real Anandi Park data.');
    console.log('   Next: run the scraper to populate real leads.');
  } else {
    console.log(`Dry run only. ${total} rows would be deleted.`);
    console.log('Re-run with --confirm to apply:');
    console.log('   npx tsx scripts/reset-data.ts --confirm');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
