import { Controller, Get, Post, Put, Body, Query, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { HrCronService } from './hr-cron.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { EmployeeStatus, LeaveType, LeaveStatus, SalaryType } from '@prisma/client';

@ApiTags('HR & Attendance')
@Controller('hr')
export class HrController {
  constructor(
    private readonly hrService: HrService,
    private readonly hrCronService: HrCronService,
  ) {}

  // =========================================================================
  // EMPLOYEE MANAGEMENT (SECURE)
  // =========================================================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('employees')
  @ApiOperation({ summary: 'Create a new employee profile' })
  async createEmployee(
    @WorkspaceId() workspaceId: string,
    @Body() dto: {
      name: string;
      email?: string;
      phone: string;
      department: string;
      designation: string;
      salaryType: SalaryType;
      baseSalary: number;
      dailyRate?: number;
      hourlyRate?: number;
      panNumber?: string;
      bankName?: string;
      bankAccountNumber?: string;
      bankIfscCode?: string;
      joiningDate: string;
    },
  ) {
    return this.hrService.createEmployee(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('employees')
  @ApiOperation({ summary: 'List all employee profiles' })
  async listEmployees(
    @WorkspaceId() workspaceId: string,
    @Query('department') department?: string,
    @Query('status') status?: EmployeeStatus,
  ) {
    return this.hrService.findAllEmployees(workspaceId, { department, status });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('employees/:id')
  @ApiOperation({ summary: 'Get single employee details' })
  async getEmployee(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.hrService.findEmployeeById(id, workspaceId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Put('employees/:id')
  @ApiOperation({ summary: 'Update employee details' })
  async updateEmployee(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.hrService.updateEmployee(id, workspaceId, dto);
  }

  // =========================================================================
  // ATTENDANCE & ROLLING QR SYSTEM
  // =========================================================================

  @Public() // Public so terminal screens can fetch dynamic rolling tokens
  @Get('attendance/qr')
  @ApiOperation({ summary: 'Generate secure rolling QR token' })
  async generateQr() {
    return this.hrService.generateQrToken();
  }

  @Public() // Public to allow on-site employee mobile scans without full CRM login accounts
  @Post('attendance/scan')
  @ApiOperation({ summary: 'Process mobile attendance QR scan' })
  async processScan(
    @Query('workspaceId') workspaceId: string, // passed from public URL parameter
    @Body() dto: {
      token: string;
      phone: string;
      latitude?: number;
      longitude?: number;
      ip?: string;
      photo?: string;
    },
  ) {
    const resolvedWorkspaceId = workspaceId || 'anandi-park'; // safe fallback
    return this.hrService.scanQrToken(resolvedWorkspaceId, dto);
  }

  @Public() // Public to allow manually triggered checks from managers or scripts
  @Post('attendance/trigger-checkin-report')
  @ApiOperation({ summary: 'Manually trigger and send the 11 AM check-in WhatsApp report' })
  async triggerCheckInReport() {
    return this.hrCronService.sendCheckInReport();
  }

  @Public() // Public to allow manually triggered checks from managers or scripts
  @Post('attendance/trigger-checkout-report')
  @ApiOperation({ summary: 'Manually trigger and send the 7 PM check-out WhatsApp report' })
  async triggerCheckOutReport() {
    return this.hrCronService.sendCheckOutReport();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('attendance/logs')
  @ApiOperation({ summary: 'Get daily presence logs' })
  async getLogs(
    @WorkspaceId() workspaceId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
  ) {
    return this.hrService.getAttendanceLogs(workspaceId, { startDate, endDate, employeeId, department });
  }

  // =========================================================================
  // LEAVE SYSTEMS (SECURE)
  // =========================================================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('leaves')
  @ApiOperation({ summary: 'Submit leave request for an employee' })
  async requestLeave(
    @WorkspaceId() workspaceId: string,
    @Body() dto: {
      employeeId: string;
      type: LeaveType;
      startDate: string;
      endDate: string;
      reason: string;
    },
  ) {
    return this.hrService.requestLeave(workspaceId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('leaves')
  @ApiOperation({ summary: 'Get leave records' })
  async getLeaves(
    @WorkspaceId() workspaceId: string,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: LeaveStatus,
  ) {
    return this.hrService.getLeaves(workspaceId, { employeeId, status });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Put('leaves/:id/approve')
  @ApiOperation({ summary: 'Approve or reject a leave request' })
  async approveLeave(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: { status: LeaveStatus; userId: string },
  ) {
    return this.hrService.approveLeave(id, workspaceId, dto.userId, dto.status);
  }

  // =========================================================================
  // PAYROLL & WAGES (SECURE)
  // =========================================================================

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Post('payroll/calculate')
  @ApiOperation({ summary: 'Calculate monthly payroll sheets' })
  async calculatePayroll(
    @WorkspaceId() workspaceId: string,
    @Body() dto: { month: number; year: number },
  ) {
    return this.hrService.calculateMonthlyPayroll(workspaceId, dto.month, dto.year);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Get('payroll')
  @ApiOperation({ summary: 'Get payroll records for target month/year' })
  async getPayroll(
    @WorkspaceId() workspaceId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.hrService.getPayrollHistory(workspaceId, parseInt(month, 10), parseInt(year, 10));
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, WorkspaceGuard)
  @Put('payroll/:id/pay')
  @ApiOperation({ summary: 'Mark payroll draft as PAID' })
  async payPayroll(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: { paymentReference?: string },
  ) {
    return this.hrService.markPayrollPaid(id, workspaceId, dto.paymentReference);
  }

  // =========================================================================
  // WORKER PORTAL PUBLIC SYSTEM
  // =========================================================================

  @Public()
  @Get('worker-portal')
  @ApiOperation({ summary: 'Get worker profile details and logs' })
  async getWorkerPortal(
    @Query('phone') phone: string,
    @Query('device') device?: string,
  ) {
    if (!phone) throw new BadRequestException('Phone number query parameter is required');
    return this.hrService.getWorkerPortalData(phone, device);
  }

  @Public()
  @Post('worker-portal/leave')
  @ApiOperation({ summary: 'Submit leave request directly from worker portal' })
  async submitWorkerLeave(
    @Body() dto: {
      phone: string;
      type: LeaveType;
      startDate: string;
      endDate: string;
      reason: string;
    },
  ) {
    if (!dto.phone) throw new BadRequestException('Phone number is required');
    return this.hrService.createWorkerLeaveRequest(
      dto.phone,
      dto.type,
      dto.startDate,
      dto.endDate,
      dto.reason,
    );
  }
}
