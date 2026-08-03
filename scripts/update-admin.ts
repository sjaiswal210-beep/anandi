import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('Kalpdev@1234', 12);
  await prisma.user.update({
    where: { email: 'Kalpdev' },
    data: { email: 'Kalpdev@outlook.com', name: 'Kalpdev Admin', passwordHash: hash },
  });
  console.log('✅ Admin updated!');
  console.log('Username: Kalpdev');
  console.log('Password: Kalpdev@1234');
}

main().catch(console.error).finally(() => prisma.$disconnect());
