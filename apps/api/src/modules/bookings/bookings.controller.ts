import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @RequirePermissions('bookings:create')
  @ApiOperation({ summary: 'Create a new booking' })
  async create(
    @WorkspaceId() workspaceId: string,
    @Body() dto: {
      leadId?: string;
      customerId: string;
      propertyId: string;
      bookingAmount: number;
      totalAmount: number;
      loanRequired?: boolean;
      loanAmount?: number;
      loanBank?: string;
      notes?: string;
    },
  ) {
    return this.bookingsService.create(workspaceId, dto);
  }

  @Get()
  @RequirePermissions('bookings:view')
  @ApiOperation({ summary: 'List all bookings' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.bookingsService.findAll(workspaceId, { page, limit, status, search });
  }

  @Get(':id')
  @RequirePermissions('bookings:view')
  @ApiOperation({ summary: 'Get booking details' })
  async findById(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.bookingsService.findById(id, workspaceId);
  }

  @Put(':id/status')
  @RequirePermissions('bookings:edit')
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { status: string },
  ) {
    return this.bookingsService.updateStatus(id, workspaceId, dto.status);
  }

  @Post(':id/payments')
  @RequirePermissions('bookings:edit')
  @ApiOperation({ summary: 'Add payment to booking' })
  async addPayment(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { amount: number; type: string; method?: string; transactionId?: string; dueDate?: string; notes?: string },
  ) {
    return this.bookingsService.addPayment(id, workspaceId, dto);
  }

  @Put('payments/:paymentId/record')
  @RequirePermissions('finance:manage')
  @ApiOperation({ summary: 'Record a payment as completed' })
  async recordPayment(
    @Param('paymentId') paymentId: string,
    @Body() dto: { method: string; transactionId?: string; receiptUrl?: string },
  ) {
    return this.bookingsService.recordPayment(paymentId, dto);
  }

  @Get(':id/payment-schedule')
  @RequirePermissions('bookings:view')
  @ApiOperation({ summary: 'Get payment schedule' })
  async getPaymentSchedule(@Param('id') id: string) {
    return this.bookingsService.getPaymentSchedule(id);
  }
}
