import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class PlotInventoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(projectId: string) {
    return this.prisma.plotInventory.findMany({
      where: { projectId },
      orderBy: [{ row: 'asc' }, { col: 'asc' }],
    });
  }

  async findFirstProject() {
    return this.prisma.project.findFirst({ orderBy: { createdAt: 'asc' } });
  }

  async findById(id: string) {
    const plot = await this.prisma.plotInventory.findUnique({ where: { id } });
    if (!plot) throw new NotFoundException('Plot not found');
    return plot;
  }

  async create(projectId: string, dto: {
    plotNumber: string; area: number; price: number; dimensions?: string;
    facing?: string; roadFacing?: boolean; corner?: boolean; row?: number; col?: number;
  }) {
    return this.prisma.plotInventory.create({
      data: {
        projectId,
        plotNumber: dto.plotNumber,
        area: dto.area,
        price: dto.price,
        pricePerSqFt: dto.area > 0 ? dto.price / dto.area : 0,
        dimensions: dto.dimensions,
        facing: dto.facing,
        roadFacing: dto.roadFacing || false,
        corner: dto.corner || false,
        row: dto.row || 1,
        col: dto.col || 1,
      },
    });
  }

  async updateStatus(id: string, status: string, bookedBy?: string) {
    return this.prisma.plotInventory.update({
      where: { id },
      data: {
        status: status as any,
        ...(bookedBy && { bookedBy, bookedAt: new Date() }),
      },
    });
  }

  async getStats(projectId: string) {
    const [total, available, reserved, sold] = await Promise.all([
      this.prisma.plotInventory.count({ where: { projectId } }),
      this.prisma.plotInventory.count({ where: { projectId, status: 'AVAILABLE' } }),
      this.prisma.plotInventory.count({ where: { projectId, status: 'RESERVED' } }),
      this.prisma.plotInventory.count({ where: { projectId, status: 'SOLD' } }),
    ]);
    return { total, available, reserved, sold };
  }
}
