import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) { console.log('No workspace'); return; }

  // Update project details
  const project = await prisma.project.findFirst({ where: { workspaceId: workspace.id } });
  if (!project) { console.log('No project'); return; }

  await prisma.project.update({
    where: { id: project.id },
    data: {
      name: 'Anandi Park',
      description: 'Premium NA Plots at GAT No. 279, Village Bakori, Taluka Haveli, Dist Pune. On Wagholi-Bakori Wide Road. 30 feet wide roads on two sides, 20 feet internal roads.',
      address: 'GAT No. 279, Village Bakori',
      city: 'Pune',
      state: 'Maharashtra',
      pincode: '412207',
      reraNumber: 'P52100030523',
      totalUnits: 84,
      amenities: ['30 Feet Wide Road', '20 Feet Internal Roads', 'Compound Wall', 'Landscaped Entry', 'Water Supply', 'Electricity', 'Drainage', 'Street Lights', 'Garden', 'Children Play Area'],
    },
  });

  // Delete old plot data
  await prisma.plotInventory.deleteMany({ where: { projectId: project.id } });

  console.log('Seeding 84 real plots from Anandi Park layout...');

  // Extracted from the layout plan image
  // Format: plotNumber, area (sqft), dimensions, facing, row, col, roadFacing, corner
  const plots: Array<{
    num: number; area: number; dims: string; facing: string;
    row: number; col: number; road: boolean; corner: boolean;
  }> = [
    // Row 1 (Top row - along boundary) - Plots 10,9,8,7,6,5,4,3,2,1
    { num: 10, area: 1150, dims: "42\'6\" x 27\'", facing: 'North', row: 1, col: 1, road: true, corner: true },
    { num: 9, area: 1800, dims: "45\' x 40\'", facing: 'North', row: 1, col: 2, road: true, corner: false },
    { num: 8, area: 1800, dims: "45\' x 40\'", facing: 'North', row: 1, col: 3, road: true, corner: false },
    { num: 7, area: 2000, dims: "45\'11\" x 43\'7\"", facing: 'North', row: 1, col: 4, road: true, corner: false },
    { num: 6, area: 1500, dims: "38\' x 39\'5\"", facing: 'West', row: 1, col: 5, road: true, corner: false },
    { num: 5, area: 2000, dims: "52\'10\" x 38\'", facing: 'West', row: 1, col: 6, road: true, corner: false },
    { num: 4, area: 2000, dims: "51\'6\" x 39\'", facing: 'West', row: 1, col: 7, road: true, corner: false },
    { num: 3, area: 2000, dims: "72\'8\" x 27\'6\"", facing: 'West', row: 1, col: 8, road: true, corner: false },
    { num: 2, area: 4510, dims: "72\'5\" x 62\'3\"", facing: 'South-West', row: 1, col: 9, road: true, corner: true },
    { num: 1, area: 4440, dims: "72\'3\" x 61\'5\"", facing: 'South-West', row: 1, col: 10, road: true, corner: true },

    // Row 2 - Plots 11-20
    { num: 11, area: 1800, dims: "45\' x 40\'", facing: 'East', row: 2, col: 1, road: false, corner: false },
    { num: 12, area: 1550, dims: "40\' x 38\'9\"", facing: 'East', row: 2, col: 2, road: false, corner: false },
    { num: 13, area: 1500, dims: "38\' x 39\'5\"", facing: 'South', row: 2, col: 3, road: false, corner: false },
    { num: 14, area: 1500, dims: "38\' x 39\'5\"", facing: 'South', row: 2, col: 4, road: false, corner: false },
    { num: 15, area: 1350, dims: "35\' x 38\'7\"", facing: 'South', row: 2, col: 5, road: false, corner: false },
    { num: 16, area: 1500, dims: "38\' x 39\'5\"", facing: 'South', row: 2, col: 6, road: false, corner: false },
    { num: 17, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 2, col: 7, road: false, corner: false },
    { num: 18, area: 1500, dims: "38\' x 39\'5\"", facing: 'South', row: 2, col: 8, road: false, corner: false },
    { num: 19, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 2, col: 9, road: false, corner: false },
    { num: 20, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 2, col: 10, road: false, corner: false },

    // Row 3 - Plots 21-30
    { num: 21, area: 1800, dims: "45\' x 40\'", facing: 'North', row: 3, col: 1, road: false, corner: false },
    { num: 22, area: 1500, dims: "38\' x 39\'5\"", facing: 'North', row: 3, col: 2, road: false, corner: false },
    { num: 23, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 3, col: 3, road: false, corner: false },
    { num: 24, area: 1400, dims: "36\' x 38\'9\"", facing: 'North', row: 3, col: 4, road: false, corner: false },
    { num: 25, area: 1500, dims: "38\' x 39\'5\"", facing: 'North', row: 3, col: 5, road: false, corner: false },
    { num: 26, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 3, col: 6, road: false, corner: false },
    { num: 27, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 3, col: 7, road: false, corner: false },
    { num: 28, area: 1650, dims: "40\' x 41\'3\"", facing: 'East', row: 3, col: 8, road: false, corner: false },
    { num: 29, area: 1800, dims: "45\' x 40\'", facing: 'East', row: 3, col: 9, road: false, corner: false },
    { num: 30, area: 1982, dims: "45\' x 44\'", facing: 'North-East', row: 3, col: 10, road: true, corner: true },

    // Row 4 - Plots 31-40
    { num: 31, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 4, col: 1, road: false, corner: false },
    { num: 32, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 4, col: 2, road: false, corner: false },
    { num: 33, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 4, col: 3, road: false, corner: false },
    { num: 34, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 4, col: 4, road: false, corner: false },
    { num: 35, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 4, col: 5, road: false, corner: false },
    { num: 36, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 4, col: 6, road: false, corner: false },
    { num: 37, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 4, col: 7, road: false, corner: false },
    { num: 38, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 4, col: 8, road: false, corner: false },
    { num: 39, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 4, col: 9, road: false, corner: false },
    { num: 40, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 4, col: 10, road: false, corner: false },

    // Row 5 - Plots 41-50
    { num: 41, area: 1162, dims: "35\' x 33\'2\"", facing: 'North', row: 5, col: 1, road: false, corner: false },
    { num: 42, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 5, col: 2, road: false, corner: false },
    { num: 43, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 5, col: 3, road: false, corner: false },
    { num: 44, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 5, col: 4, road: false, corner: false },
    { num: 45, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 5, col: 5, road: false, corner: false },
    { num: 46, area: 1000, dims: "30\' x 33\'4\"", facing: 'West', row: 5, col: 6, road: false, corner: false },
    { num: 47, area: 1000, dims: "30\' x 33\'4\"", facing: 'West', row: 5, col: 7, road: false, corner: false },
    { num: 48, area: 1000, dims: "30\' x 33\'4\"", facing: 'West', row: 5, col: 8, road: false, corner: false },
    { num: 49, area: 1000, dims: "30\' x 33\'4\"", facing: 'West', row: 5, col: 9, road: false, corner: false },
    { num: 50, area: 1000, dims: "30\' x 33\'4\"", facing: 'West', row: 5, col: 10, road: false, corner: false },

    // Row 6 - Plots 51-60
    { num: 51, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 6, col: 1, road: false, corner: false },
    { num: 52, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 6, col: 2, road: false, corner: false },
    { num: 53, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 6, col: 3, road: false, corner: false },
    { num: 54, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 6, col: 4, road: false, corner: false },
    { num: 55, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 6, col: 5, road: false, corner: false },
    { num: 56, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 6, col: 6, road: false, corner: false },
    { num: 57, area: 1500, dims: "38\' x 39\'5\"", facing: 'South', row: 6, col: 7, road: false, corner: false },
    { num: 58, area: 2000, dims: "42\'5\" x 47\'", facing: 'South', row: 6, col: 8, road: false, corner: false },
    { num: 59, area: 2000, dims: "42\'5\" x 47\'", facing: 'South-East', row: 6, col: 9, road: true, corner: false },
    { num: 60, area: 3000, dims: "42\'5\" x 70\'6\"", facing: 'South-East', row: 6, col: 10, road: true, corner: true },

    // Row 7 (along 20' internal road) - Plots 61-70
    { num: 61, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 7, col: 1, road: true, corner: false },
    { num: 62, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 7, col: 2, road: true, corner: false },
    { num: 63, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 7, col: 3, road: true, corner: false },
    { num: 64, area: 1019, dims: "30\'3\" x 33\'8\"", facing: 'North', row: 7, col: 4, road: true, corner: false },
    { num: 65, area: 1019, dims: "30\'3\" x 33\'8\"", facing: 'North', row: 7, col: 5, road: true, corner: false },
    { num: 66, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 7, col: 6, road: true, corner: false },
    { num: 67, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 7, col: 7, road: true, corner: false },
    { num: 68, area: 1000, dims: "30\' x 33\'4\"", facing: 'North', row: 7, col: 8, road: true, corner: false },
    { num: 69, area: 1000, dims: "30\' x 33\'4\"", facing: 'North-East', row: 7, col: 9, road: true, corner: false },
    { num: 70, area: 1000, dims: "30\' x 33\'4\"", facing: 'East', row: 7, col: 10, road: true, corner: false },

    // Row 8 (Bottom row - along Wagholi-Bakori road) - Plots 71-84
    { num: 71, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 1, road: true, corner: false },
    { num: 72, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 2, road: true, corner: false },
    { num: 73, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 3, road: true, corner: false },
    { num: 74, area: 1019, dims: "30\'3\" x 33\'8\"", facing: 'South', row: 8, col: 4, road: true, corner: false },
    { num: 75, area: 1019, dims: "30\'3\" x 33\'8\"", facing: 'South', row: 8, col: 5, road: true, corner: false },
    { num: 76, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 6, road: true, corner: false },
    { num: 77, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 7, road: true, corner: false },
    { num: 78, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 8, road: true, corner: false },
    { num: 79, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 9, road: true, corner: false },
    { num: 80, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 10, road: true, corner: false },
    { num: 81, area: 1000, dims: "30\' x 33\'4\"", facing: 'South', row: 8, col: 11, road: true, corner: false },
    { num: 82, area: 3000, dims: "42\'5\" x 70\'6\"", facing: 'South-East', row: 8, col: 12, road: true, corner: true },
    { num: 83, area: 1919, dims: "38\'3\" x 50\'2\"", facing: 'South', row: 8, col: 13, road: true, corner: false },
    { num: 84, area: 3000, dims: "42\'5\" x 70\'6\"", facing: 'South-East', row: 8, col: 14, road: true, corner: true },
  ];

  // Pricing: ₹1500/sqft base, +₹200 corner, +₹150 road-facing
  const baseRate = 1500;

  const plotData = plots.map((p) => {
    const premium = (p.corner ? 200 : 0) + (p.road ? 150 : 0);
    const rate = baseRate + premium;
    return {
      projectId: project.id,
      plotNumber: `P-${p.num}`,
      area: p.area,
      price: p.area * rate,
      pricePerSqFt: rate,
      dimensions: p.dims,
      facing: p.facing,
      roadFacing: p.road,
      corner: p.corner,
      row: p.row,
      col: p.col,
      status: 'AVAILABLE' as const,
    };
  });

  await prisma.plotInventory.createMany({ data: plotData, skipDuplicates: true });

  console.log(`✅ ${plotData.length} real plots seeded for Anandi Park`);
  console.log(`Location: GAT No. 279, Village Bakori, Taluka Haveli, Pune`);
  console.log(`Road: Wagholi - Bakori Wide Road`);
  console.log(`Developers: Yuvraj Gade & Rajan Kute Developers`);

  const stats = {
    total: plotData.length,
    minArea: Math.min(...plotData.map(p => p.area)),
    maxArea: Math.max(...plotData.map(p => p.area)),
    minPrice: Math.min(...plotData.map(p => p.price)),
    maxPrice: Math.max(...plotData.map(p => p.price)),
    cornerPlots: plotData.filter(p => p.corner).length,
    roadFacing: plotData.filter(p => p.roadFacing).length,
  };
  console.log('\nStats:', stats);
}

main().catch(console.error).finally(() => prisma.$disconnect());
