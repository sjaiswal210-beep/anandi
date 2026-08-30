import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

@Injectable()
export class HrCronService {
  private readonly logger = new Logger(HrCronService.name);
  private readonly recipientPhone = '7350785606';
  private readonly workspaceId = 'anandi-park';

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  // 1. Everyday at 11:00 AM IST (Asia/Kolkata) -> Check-In Report
  @Cron('0 11 * * *', {
    name: 'attendanceCheckInReport',
    timeZone: 'Asia/Kolkata',
  })
  async sendCheckInReport() {
    this.logger.log('Generating 11 AM daily check-in report...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active employees
      const employees = await this.prisma.employee.findMany({
        where: { workspaceId: this.workspaceId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });

      if (employees.length === 0) {
        this.logger.log('No active employees found. Skipping report.');
        return 'No active employees found';
      }

      // Get today's attendance logs
      const logs = await this.prisma.attendance.findMany({
        where: { workspaceId: this.workspaceId, date: today },
        include: { employee: true },
      });

      const loggedInList: string[] = [];
      const notLoggedInList: string[] = [];

      for (const emp of employees) {
        const log = logs.find((l) => l.employeeId === emp.id);
        if (log && log.checkIn) {
          const checkInTime = new Date(log.checkIn!).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          });
          loggedInList.push(`• *${emp.name}* - ${checkInTime} (${log.status})`);
        } else {
          notLoggedInList.push(`• *${emp.name}* (${emp.department || 'Staff'})`);
        }
      }

      const formattedDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });

      let message = `📋 *Anandi Park - Daily Check-In Report*\n`;
      message += `📅 Date: *${formattedDate}* (As of 11:00 AM)\n\n`;

      message += `✅ *Logged In (${loggedInList.length}):*\n`;
      if (loggedInList.length > 0) {
        message += loggedInList.join('\n') + '\n\n';
      } else {
        message += `_No employees logged in yet._\n\n`;
      }

      message += `❌ *Absent / Not Logged In (${notLoggedInList.length}):*\n`;
      if (notLoggedInList.length > 0) {
        message += notLoggedInList.join('\n') + '\n\n';
      } else {
        message += `_All employees are logged in._\n\n`;
      }

      message += `*Summary:* Total: ${employees.length} | Present: ${loggedInList.length} | Absent: ${notLoggedInList.length}`;

      this.logger.log(`Sending check-in report to ${this.recipientPhone}...`);
      await this.whatsappService.sendTextMessage(this.workspaceId, this.recipientPhone, message);
      this.logger.log('Daily check-in report WhatsApp message sent successfully.');
      return { success: true, message, type: 'check-in' };
    } catch (error) {
      this.logger.error('Failed to send daily check-in report:', error);
      throw error;
    }
  }

  // 2. Everyday at 7:00 PM IST (Asia/Kolkata) -> Check-Out Report
  @Cron('0 19 * * *', {
    name: 'attendanceCheckOutReport',
    timeZone: 'Asia/Kolkata',
  })
  async sendCheckOutReport() {
    this.logger.log('Generating 7 PM daily check-out report...');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all active employees
      const employees = await this.prisma.employee.findMany({
        where: { workspaceId: this.workspaceId, status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });

      if (employees.length === 0) {
        this.logger.log('No active employees found. Skipping report.');
        return 'No active employees found';
      }

      // Get today's logs
      const logs = await this.prisma.attendance.findMany({
        where: { workspaceId: this.workspaceId, date: today },
        include: { employee: true },
      });

      const loggedOutList: string[] = [];
      const stillInList: string[] = [];
      const absentList: string[] = [];

      for (const emp of employees) {
        const log = logs.find((l) => l.employeeId === emp.id);
        if (log) {
          if (log.checkOut) {
            const checkInTime = new Date(log.checkIn!).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            });
            const checkOutTime = new Date(log.checkOut!).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            });

            // Calculate duration
            const diffMs = new Date(log.checkOut!).getTime() - new Date(log.checkIn!).getTime();
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const durationStr = `${diffHrs}h ${diffMins}m`;

            loggedOutList.push(`• *${emp.name}* - In ${checkInTime} ➡️ Out ${checkOutTime} (Worked: *${durationStr}*)`);
          } else if (log.checkIn) {
            const checkInTime = new Date(log.checkIn!).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
              timeZone: 'Asia/Kolkata',
            });
            stillInList.push(`• *${emp.name}* (In at ${checkInTime})`);
          } else {
            absentList.push(`• *${emp.name}*`);
          }
        } else {
          absentList.push(`• *${emp.name}*`);
        }
      }

      const formattedDate = new Date().toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });

      let message = `📋 *Anandi Park - Daily Check-Out Report*\n`;
      message += `📅 Date: *${formattedDate}* (As of 7:00 PM)\n\n`;

      message += `🚪 *Logged Out (${loggedOutList.length}):*\n`;
      if (loggedOutList.length > 0) {
        message += loggedOutList.join('\n') + '\n\n';
      } else {
        message += `_No employees checked out yet._\n\n`;
      }

      message += `⚠️ *Still In-Office / Missing Check-Out (${stillInList.length}):*\n`;
      if (stillInList.length > 0) {
        message += stillInList.join('\n') + '\n\n';
      } else {
        message += `_No employees left in-office._\n\n`;
      }

      message += `❌ *Absent Today (${absentList.length}):*\n`;
      if (absentList.length > 0) {
        message += absentList.join('\n') + '\n\n';
      } else {
        message += `_No absentees today._\n\n`;
      }

      message += `*Summary:* Present: ${employees.length - absentList.length} | Completed: ${loggedOutList.length} | Pending Check-out: ${stillInList.length} | Absent: ${absentList.length}`;

      this.logger.log(`Sending check-out report to ${this.recipientPhone}...`);
      await this.whatsappService.sendTextMessage(this.workspaceId, this.recipientPhone, message);
      this.logger.log('Daily check-out report WhatsApp message sent successfully.');
      return { success: true, message, type: 'check-out' };
    } catch (error) {
      this.logger.error('Failed to send daily check-out report:', error);
      throw error;
    }
  }
}
