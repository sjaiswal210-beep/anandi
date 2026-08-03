import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  if (!project) { console.log('No project found'); return; }

  console.log('Seeding plot inventory...');

  const plots = [];
  const facings = ['North', 'South', 'East', 'West', 'North-East', 'South-West'];
  const statuses = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'RESERVED', 'SOLD', 'HOLD'] as const;

  for (let row = 1; row <= 5; row++) {
    for (let col = 1; col <= 8; col++) {
      const plotNum = `P-${row}${String.fromCharCode(64 + col)}`;
      const area = 1000 + Math.floor(Math.random() * 3000);
      const isCorner = col === 1 || col === 8;
      const isRoadFacing = row === 1 || row === 5;
      const basePrice = 1500; // per sqft
      const premium = (isCorner ? 200 : 0) + (isRoadFacing ? 150 : 0);
      const price = area * (basePrice + premium);

      plots.push({
        projectId: project.id,
        plotNumber: plotNum,
        area,
        price,
        pricePerSqFt: basePrice + premium,
        dimensions: `${Math.round(Math.sqrt(area * 1.5))}' x ${Math.round(Math.sqrt(area / 1.5))}'`,
        facing: facings[Math.floor(Math.random() * facings.length)],
        roadFacing: isRoadFacing,
        corner: isCorner,
        row,
        col,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      });
    }
  }

  await prisma.plotInventory.createMany({ data: plots, skipDuplicates: true });
  console.log(`✅ ${plots.length} plots created`);

  const stats = {
    total: plots.length,
    available: plots.filter(p => p.status === 'AVAILABLE').length,
    reserved: plots.filter(p => p.status === 'RESERVED').length,
    sold: plots.filter(p => p.status === 'SOLD').length,
  };
  console.log('Stats:', stats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
