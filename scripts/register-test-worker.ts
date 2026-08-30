import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst({
    where: { slug: 'anandi-park' },
  });
  
  if (!workspace) {
    console.error('Error: Workspace with slug "anandi-park" not found.');
    return;
  }
  
  console.log(`Found Workspace: ${workspace.name} (${workspace.id})`);
  
  const phone = '7350785606';
  const name = 'Shubham Jaiswal';
  
  const employee = await prisma.employee.upsert({
    where: { phone },
    update: {
      name,
      status: 'ACTIVE',
      department: 'Admin',
      designation: 'Test Member',
      joiningDate: new Date('2026-08-30'),
    },
    create: {
      workspaceId: workspace.id,
      phone,
      name,
      status: 'ACTIVE',
      department: 'Admin',
      designation: 'Test Member',
      joiningDate: new Date('2026-08-30'),
      salaryType: 'MONTHLY',
      baseSalary: 0.00,
    },
  });

  console.log('✅ Employee successfully registered:', employee);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
