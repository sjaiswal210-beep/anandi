import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AttendanceStatus, LeaveType, LeaveStatus, PayrollStatus, EmployeeStatus, SalaryType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  // EMPLOYEE CRUD
  // =========================================================================

  async createEmployee(workspaceId: string, dto: {
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
  }) {
    // Check if phone number is unique
    const existing = await this.prisma.employee.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new BadRequestException('An employee with this phone number already exists.');
    }

    return this.prisma.employee.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        department: dto.department,
        designation: dto.designation,
        salaryType: dto.salaryType,
        baseSalary: dto.baseSalary,
        dailyRate: dto.dailyRate,
        hourlyRate: dto.hourlyRate,
        panNumber: dto.panNumber,
        bankName: dto.bankName,
        bankAccountNumber: dto.bankAccountNumber,
        bankIfscCode: dto.bankIfscCode,
        joiningDate: new Date(dto.joiningDate),
      },
    });
  }

  async findAllEmployees(workspaceId: string, query: { department?: string; status?: EmployeeStatus }) {
    const where: any = { workspaceId };
    if (query.department) where.department = query.department;
    if (query.status) where.status = query.status;

    return this.prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findEmployeeById(id: string, workspaceId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, workspaceId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async updateEmployee(id: string, workspaceId: string, dto: {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    designation?: string;
    status?: EmployeeStatus;
    salaryType?: SalaryType;
    baseSalary?: number;
    dailyRate?: number;
    hourlyRate?: number;
    panNumber?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    joiningDate?: string;
    exitDate?: string;
  }) {
    const employee = await this.findEmployeeById(id, workspaceId);

    // If phone is changing, check uniqueness
    if (dto.phone && dto.phone !== employee.phone) {
      const existing = await this.prisma.employee.findUnique({
        where: { phone: dto.phone },
      });
      if (existing) {
        throw new BadRequestException('An employee with this phone number already exists.');
      }
    }

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.joiningDate ? { joiningDate: new Date(dto.joiningDate) } : {}),
        ...(dto.exitDate ? { exitDate: new Date(dto.exitDate) } : {}),
      } as any,
    });
  }

  // =========================================================================
  // ATTENDANCE QR ENGINE & GEO-FENCING
  // =========================================================================

  async generateQrToken() {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 20 * 1000); // Token expires in 20 seconds

    await this.prisma.attendanceToken.create({
      data: { token, expiresAt },
    });

    return { token, expiresAt };
  }

  async scanQrToken(workspaceId: string, dto: {
    token: string;
    phone: string;
    latitude?: number;
    longitude?: number;
    ip?: string;
    photo?: string;
  }) {
    // 1. Verify rolling token
    const tokenRecord = await this.prisma.attendanceToken.findUnique({
      where: { token: dto.token },
    });
    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('This QR code is expired. Please scan the current code on the tablet terminal.');
    }

    // Delete token once scanned to prevent reuse (one-time-use safety)
    try {
      await this.prisma.attendanceToken.delete({ where: { id: tokenRecord.id } });
    } catch {}

    // 2. Look up active employee
    const employee = await this.prisma.employee.findFirst({
      where: { phone: dto.phone, workspaceId, status: 'ACTIVE' },
    });
    if (!employee) {
      throw new NotFoundException('No active employee found with this phone number.');
    }

    // 3. Geofencing check (Anandi Park Site Center)
    const siteLat = 18.595755;
    const siteLng = 74.042230;
    const maxRadiusMeters = 200; // 200 meters accuracy radius allowance

    if (dto.latitude !== undefined && dto.longitude !== undefined) {
      const distance = this.getHaversineDistance(dto.latitude, dto.longitude, siteLat, siteLng);
      if (distance > maxRadiusMeters) {
        throw new BadRequestException(
          `Out of bounds! You are physically too far from the Anandi Park site (${Math.round(distance)}m away). You must be on-site (within 200m) to register attendance.`
        );
      }
    } else {
      // Latitude and Longitude are strictly required to ensure anti-cheating
      throw new BadRequestException('GPS location coordinates are required for site verification.');
    }

    // 4. Punch In or Punch Out logic
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day

    // Get today's attendance log for this employee
    const existingLog = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: employee.id,
          date: today,
        },
      },
    });

    const checkInTime = new Date();
    const locationString = `${dto.latitude},${dto.longitude}`;

    if (!existingLog) {
      // First scan of the day -> Check In
      // Check if they are late (e.g. past 10:00 AM)
      const isLate = checkInTime.getHours() >= 10;
      const status: AttendanceStatus = isLate ? 'LATE' : 'PRESENT';

      await this.prisma.attendance.create({
        data: {
          workspace: { connect: { id: workspaceId } },
          employee: { connect: { id: employee.id } },
          date: today,
          checkIn: checkInTime,
          status,
          checkInLocation: locationString,
          checkInIp: dto.ip || '0.0.0.0',
          photoIn: dto.photo,
        },
      });

      return {
        action: 'check-in',
        employeeName: employee.name,
        time: checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status,
        distanceMeters: Math.round(this.getHaversineDistance(dto.latitude, dto.longitude, siteLat, siteLng)),
      };
    } else {
      // Second scan of the day -> Check Out
      if (existingLog.checkOut) {
        throw new BadRequestException('You have already completed check-in and check-out for today!');
      }

      await this.prisma.attendance.update({
        where: { id: existingLog.id },
        data: {
          checkOut: checkInTime,
          checkOutLocation: locationString,
          checkOutIp: dto.ip || '0.0.0.0',
          photoOut: dto.photo,
        },
      });

      return {
        action: 'check-out',
        employeeName: employee.name,
        time: checkInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: existingLog.status,
        distanceMeters: Math.round(this.getHaversineDistance(dto.latitude, dto.longitude, siteLat, siteLng)),
      };
    }
  }

  async getAttendanceLogs(workspaceId: string, query: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    department?: string;
  }) {
    const where: any = { workspaceId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.department) {
      where.employee = { department: query.department };
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) where.date.gte = new Date(query.startDate);
      if (query.endDate) where.date.lte = new Date(query.endDate);
    }

    return this.prisma.attendance.findMany({
      where,
      include: {
        employee: { select: { name: true, department: true, designation: true, phone: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  // =========================================================================
  // LEAVE REQUESTS
  // =========================================================================

  async requestLeave(workspaceId: string, dto: {
    employeeId: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, workspaceId },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    
    // Calculate difference in calendar days
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leave.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        employee: { connect: { id: dto.employeeId } },
        type: dto.type,
        startDate: start,
        endDate: end,
        days,
        reason: dto.reason,
        status: 'PENDING',
      },
    });
  }

  async getLeaves(workspaceId: string, query: { employeeId?: string; status?: LeaveStatus }) {
    const where: any = { workspaceId };
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.status) where.status = query.status;

    return this.prisma.leave.findMany({
      where,
      include: {
        employee: { select: { name: true, department: true, designation: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async approveLeave(id: string, workspaceId: string, approvedById: string, status: LeaveStatus) {
    const leave = await this.prisma.leave.findFirst({
      where: { id, workspaceId },
    });
    if (!leave) throw new NotFoundException('Leave request not found');

    const updatedLeave = await this.prisma.leave.update({
      where: { id },
      data: {
        status,
        approvedBy: { connect: { id: approvedById } },
      },
      include: {
        employee: true,
      },
    });

    // If approved, retroactively update attendance logs as LEAVE inside that range!
    if (status === 'APPROVED') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const currentDate = new Date(d);
        currentDate.setHours(0, 0, 0, 0);

        await this.prisma.attendance.upsert({
          where: {
            employeeId_date: {
              employeeId: leave.employeeId,
              date: currentDate,
            },
          },
          update: { status: 'LEAVE', notes: `Leave approved: ${leave.reason}` },
          create: {
            workspaceId,
            employeeId: leave.employeeId,
            date: currentDate,
            status: 'LEAVE',
            notes: `Leave approved: ${leave.reason}`,
          },
        });
      }
    }

    return updatedLeave;
  }

  // =========================================================================
  // PAYROLL CALCULATOR
  // =========================================================================

  async calculateMonthlyPayroll(workspaceId: string, month: number, year: number) {
    // Get date boundaries of target month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    const totalDays = endDate.getDate();

    // Fetch all active employees
    const employees = await this.prisma.employee.findMany({
      where: { workspaceId, status: 'ACTIVE' },
    });

    const payrollSheets = [];

    for (const emp of employees) {
      // 1. Get attendance logs for employee in this range
      const attendanceLogs = await this.prisma.attendance.findMany({
        where: {
          employeeId: emp.id,
          date: { gte: startDate, lte: endDate },
        },
      });

      // 2. Accumulate days
      let presentDays = 0;
      let halfDays = 0;
      let paidLeaves = 0;
      let unpaidLeaves = 0; // Loss Of Pay (LOP)
      let absentDays = 0;

      // Classify logs
      for (const log of attendanceLogs) {
        if (log.status === 'PRESENT' || log.status === 'LATE') presentDays++;
        else if (log.status === 'HALF_DAY') halfDays++;
        else if (log.status === 'LEAVE') {
          // Check what type of leave was approved
          const approvedLeave = await this.prisma.leave.findFirst({
            where: {
              employeeId: emp.id,
              status: 'APPROVED',
              startDate: { lte: log.date },
              endDate: { gte: log.date },
            },
          });
          if (approvedLeave && approvedLeave.type === 'LOP') {
            unpaidLeaves++;
          } else {
            paidLeaves++;
          }
        } else if (log.status === 'ABSENT') {
          absentDays++;
        }
      }

      // Calculate absent days (days where they didn't check in and there are no approved leaves or Sundays)
      let SundaysCount = 0;
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month - 1, day);
        if (d.getDay() === 0) SundaysCount++; // 0 = Sunday
      }

      // Absent Days are those calendar days with no attendance logs, no approved leaves, and are NOT Sundays
      const loggedDates = new Set(attendanceLogs.map(l => l.date.getDate()));
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month - 1, day);
        const isSunday = d.getDay() === 0;
        
        if (!isSunday && !loggedDates.has(day)) {
          absentDays++;
        }
      }

      // 3. Compute base payout metrics
      const baseSalary = Number(emp.baseSalary);
      const dailyRate = emp.dailyRate ? Number(emp.dailyRate) : baseSalary / totalDays;

      // Deductions formula: Absent Days + Unpaid Leaves + half-day losses
      const totalLossDays = absentDays + unpaidLeaves + (halfDays * 0.5);
      const deductions = totalLossDays * dailyRate;
      
      const allowances = 0.00;
      const netSalary = Math.max(0, baseSalary - deductions + allowances);

      // 4. Create or update Payroll draft in DB
      const payroll = await this.prisma.payroll.upsert({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month,
            year,
          },
        },
        update: {
          totalDays,
          presentDays,
          halfDays,
          absentDays,
          paidLeaves,
          unpaidLeaves,
          baseSalary,
          allowances,
          deductions,
          netSalary,
        },
        create: {
          workspace: { connect: { id: workspaceId } },
          employee: { connect: { id: emp.id } },
          month,
          year,
          totalDays,
          presentDays,
          halfDays,
          absentDays,
          paidLeaves,
          unpaidLeaves,
          baseSalary,
          allowances,
          deductions,
          netSalary,
          status: 'DRAFT',
        },
        include: {
          employee: { select: { name: true, department: true, designation: true } },
        },
      });

      payrollSheets.push(payroll);
    }

    return payrollSheets;
  }

  async getPayrollHistory(workspaceId: string, month: number, year: number) {
    return this.prisma.payroll.findMany({
      where: { workspaceId, month, year },
      include: {
        employee: { select: { name: true, department: true, designation: true, bankName: true, bankAccountNumber: true } },
      },
      orderBy: { employee: { name: 'asc' } },
    });
  }

  async markPayrollPaid(id: string, workspaceId: string, paymentReference?: string) {
    const payroll = await this.prisma.payroll.findFirst({
      where: { id, workspaceId },
    });
    if (!payroll) throw new NotFoundException('Payroll record not found');

    return this.prisma.payroll.update({
      where: { id },
      data: {
        status: 'PAID',
        paymentDate: new Date(),
        paymentReference: paymentReference || `TXN-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      },
    });
  }

  // =========================================================================
  // WORKER PORTAL SELF-SERVICE METHODS
  // =========================================================================

  async getWorkerPortalData(phone: string, device?: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { phone, status: 'ACTIVE' },
    });

    if (!employee) {
      throw new NotFoundException('Active employee profile not found for this phone number.');
    }

    if (device && employee.deviceInfo !== device) {
      await this.prisma.employee.update({
        where: { id: employee.id },
        data: { deviceInfo: device },
      });
      employee.deviceInfo = device;
    }

    const [attendance, leaves, payrolls] = await Promise.all([
      this.prisma.attendance.findMany({
        where: { employeeId: employee.id },
        orderBy: { date: 'desc' },
        take: 30,
      }),
      this.prisma.leave.findMany({
        where: { employeeId: employee.id },
        orderBy: { startDate: 'desc' },
        take: 20,
      }),
      this.prisma.payroll.findMany({
        where: { employeeId: employee.id },
        orderBy: { year: 'desc', month: 'desc' },
        take: 12,
      }),
    ]);

    return {
      employee,
      attendance,
      leaves,
      payrolls,
    };
  }

  async createWorkerLeaveRequest(phone: string, type: any, startDate: string, endDate: string, reason: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { phone, status: 'ACTIVE' },
    });

    if (!employee) {
      throw new NotFoundException('Active employee profile not found.');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return this.prisma.leave.create({
      data: {
        workspaceId: employee.workspaceId,
        employeeId: employee.id,
        type,
        startDate: start,
        endDate: end,
        days: diffDays,
        reason,
        status: 'PENDING',
      },
    });
  }

  // =========================================================================
  // UTILS
  // =========================================================================

  private getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // returns distance in meters
  }
}
