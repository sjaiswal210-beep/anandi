import { Controller, Get, Post, Put, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @RequirePermissions('finance:view')
  @ApiOperation({ summary: 'Get financial summary' })
  async getSummary(@WorkspaceId() workspaceId: string) {
    return this.financeService.getSummary(workspaceId);
  }

  @Get('transactions')
  @RequirePermissions('finance:view')
  @ApiOperation({ summary: 'Get all transactions' })
  async getTransactions(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.financeService.getTransactions(workspaceId, { page, limit, type, status, dateFrom, dateTo });
  }

  @Get('overdue')
  @RequirePermissions('finance:view')
  @ApiOperation({ summary: 'Get overdue payments' })
  async getOverduePayments(@WorkspaceId() workspaceId: string) {
    return this.financeService.getOverduePayments(workspaceId);
  }

  @Get('commissions')
  @RequirePermissions('finance:view')
  @ApiOperation({ summary: 'Get commissions' })
  async getCommissions(
    @WorkspaceId() workspaceId: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.financeService.getCommissions(workspaceId, { userId, status });
  }

  @Post('commissions')
  @RequirePermissions('finance:manage')
  @ApiOperation({ summary: 'Create commission entry' })
  async createCommission(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { userId: string; bookingId?: string; amount: number; percentage?: number; type: string },
  ) {
    return this.financeService.createCommission(workspaceId, dto);
  }

  @Put('commissions/:id/pay')
  @RequirePermissions('finance:manage')
  @ApiOperation({ summary: 'Mark commission as paid' })
  async payCommission(@Param('id') id: string) {
    return this.financeService.payCommission(id);
  }

  @Get('revenue-by-month')
  @RequirePermissions('finance:reports')
  @ApiOperation({ summary: 'Get revenue by month for a year' })
  async getRevenueByMonth(
    @WorkspaceId() workspaceId: string,
    @Query('year') year?: number,
  ) {
    return this.financeService.getRevenueByMonth(workspaceId, year || new Date().getFullYear());
  }
}
