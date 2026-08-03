import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { generateSlug } from '@realtyos/shared';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async create(workspaceId: string, dto: {
    title: string;
    projectId?: string;
    type: string;
    price: number;
    area?: number;
    carpetArea?: number;
    builtUpArea?: number;
    bedrooms?: number;
    bathrooms?: number;
    balconies?: number;
    parking?: number;
    floor?: number;
    totalFloors?: number;
    facing?: string;
    furnishing?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number;
    longitude?: number;
    amenities?: string[];
    features?: string[];
    description?: string;
  }) {
    const slug = generateSlug(dto.title) + '-' + Date.now().toString(36);
    const pricePerSqFt = dto.area && dto.price ? dto.price / dto.area : undefined;

    const property = await this.prisma.property.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        ...(dto.projectId && { project: { connect: { id: dto.projectId } } }),
        title: dto.title,
        slug,
        type: dto.type as never,
        status: 'AVAILABLE',
        price: dto.price,
        pricePerSqFt,
        area: dto.area,
        carpetArea: dto.carpetArea,
        builtUpArea: dto.builtUpArea,
        bedrooms: dto.bedrooms,
        bathrooms: dto.bathrooms,
        balconies: dto.balconies,
        parking: dto.parking,
        floor: dto.floor,
        totalFloors: dto.totalFloors,
        facing: dto.facing,
        furnishing: dto.furnishing,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        amenities: dto.amenities || [],
        features: dto.features || [],
        description: dto.description,
      },
      include: { project: { select: { name: true } } },
    });

    await this.redisService.flushByPattern(`properties:${workspaceId}:*`);
    return property;
  }

  async findAll(workspaceId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    city?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    projectId?: string;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const { page = 1, limit = 20, search, type, status, city, minPrice, maxPrice, bedrooms, projectId, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const where: Record<string, unknown> = { workspaceId };
    if (type) where.type = type;
    if (status) where.status = status;
    if (city) where.city = { contains: city, mode: 'insensitive' };
    if (projectId) where.projectId = projectId;
    if (bedrooms) where.bedrooms = bedrooms;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, unknown>).gte = minPrice;
      if (maxPrice) (where.price as Record<string, unknown>).lte = maxPrice;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          project: { select: { name: true } },
          media: { take: 1, orderBy: { sortOrder: 'asc' } },
          _count: { select: { bookings: true, visits: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async findById(id: string, workspaceId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, workspaceId },
      include: {
        project: true,
        media: { orderBy: { sortOrder: 'asc' } },
        bookings: { include: { customer: { select: { name: true } } }, take: 5 },
        visits: { include: { lead: { select: { name: true } } }, take: 5, orderBy: { scheduledAt: 'desc' } },
      },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, workspaceId: string, dto: Record<string, unknown>) {
    const property = await this.prisma.property.findFirst({ where: { id, workspaceId } });
    if (!property) throw new NotFoundException('Property not found');

    // Recalculate price per sqft
    if (dto.price || dto.area) {
      const area = (dto.area as number) || Number(property.area);
      const price = (dto.price as number) || Number(property.price);
      if (area > 0) dto.pricePerSqFt = price / area;
    }

    // Track price history
    if (dto.price && Number(dto.price) !== Number(property.price)) {
      const history = (property.priceHistory as unknown[]) || [];
      history.push({
        price: Number(property.price),
        date: new Date().toISOString(),
      });
      dto.priceHistory = history;
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data: dto as never,
    });

    await this.redisService.flushByPattern(`properties:${workspaceId}:*`);
    return updated;
  }

  async delete(id: string, workspaceId: string) {
    const property = await this.prisma.property.findFirst({ where: { id, workspaceId } });
    if (!property) throw new NotFoundException('Property not found');

    await this.prisma.property.delete({ where: { id } });
    await this.redisService.flushByPattern(`properties:${workspaceId}:*`);
    return { message: 'Property deleted' };
  }

  async getInventory(workspaceId: string, projectId: string) {
    const towers = await this.prisma.tower.findMany({
      where: { projectId },
      include: {
        units: {
          orderBy: [{ floorNumber: 'asc' }, { unitNumber: 'asc' }],
        },
      },
    });

    return towers;
  }

  async updateUnitStatus(unitId: string, status: string) {
    return this.prisma.unit.update({
      where: { id: unitId },
      data: { status: status as never },
    });
  }

  async getProjects(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { properties: true, towers: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createProject(workspaceId: string, dto: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    reraNumber?: string;
    totalUnits?: number;
    amenities?: string[];
  }) {
    const slug = generateSlug(dto.name);

    return this.prisma.project.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        name: dto.name,
        slug,
        description: dto.description,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        pincode: dto.pincode,
        reraNumber: dto.reraNumber,
        totalUnits: dto.totalUnits || 0,
        amenities: dto.amenities || [],
      },
    });
  }
}
