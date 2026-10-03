import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import { mkdirSync } from 'fs';
import { DocumentsService } from './documents.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkspaceGuard } from '../../common/guards/workspace.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { WorkspaceId } from '../../common/decorators/workspace.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

// Documents (brochure, RERA cert, title deed, etc.) are written to
// <repoRoot>/uploads/documents and served back at /uploads/documents/<file>,
// the same convention used by the social-image and TTS generators.
const uploadsRoot = join(process.cwd().replace(/[/\\](apps[/\\]api|dist).*/, ''), 'uploads', 'documents');
// multer's diskStorage does not create the destination directory itself —
// make sure it exists once at module load (cheap, idempotent).
mkdirSync(uploadsRoot, { recursive: true });

// Accept the document types real estate paperwork actually comes in. Reject
// anything else (e.g. executables) up front rather than storing it.
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);
const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB — comfortably under nginx's client_max_body_size 50M

@ApiTags('Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, WorkspaceGuard, PermissionsGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @RequirePermissions('documents:upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document file (multipart/form-data, field name "file")' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadsRoot,
        filename: (_req, file, cb) => {
          const unique = randomBytes(8).toString('hex');
          cb(null, `${Date.now()}-${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_UPLOAD_BYTES },
      fileFilter: (_req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
          cb(new BadRequestException(`Unsupported file type: ${file.mimetype}. Allowed: PDF, JPG, PNG, WEBP, DOC/DOCX, XLS/XLSX.`), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @WorkspaceId() workspaceId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: { leadId?: string; customerId?: string; type?: string; name?: string; tags?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No file received — send it as multipart/form-data with field name "file".');
    }
    // tags arrives as a comma-separated string over FormData.
    const tags = dto.tags
      ? dto.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

    return this.documentsService.upload(workspaceId, {
      leadId: dto.leadId || undefined,
      customerId: dto.customerId || undefined,
      type: dto.type || 'OTHER',
      name: dto.name || file.originalname,
      originalName: file.originalname,
      url: `/uploads/documents/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      tags,
    });
  }

  @Get()
  @RequirePermissions('documents:view')
  @ApiOperation({ summary: 'List documents' })
  async findAll(
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('leadId') leadId?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
  ) {
    return this.documentsService.findAll(workspaceId, { page, limit, type, leadId, customerId, search });
  }

  @Get('search')
  @RequirePermissions('documents:view')
  @ApiOperation({ summary: 'Search documents by OCR text' })
  async searchByOcr(@WorkspaceId() workspaceId: string, @Query('q') query: string) {
    return this.documentsService.searchByOcr(workspaceId, query);
  }

  @Get(':id')
  @RequirePermissions('documents:view')
  @ApiOperation({ summary: 'Get document details' })
  async findById(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.documentsService.findById(id, workspaceId);
  }

  @Post(':id/versions')
  @RequirePermissions('documents:upload')
  @ApiOperation({ summary: 'Upload new version' })
  async createVersion(
    @Param('id') id: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: { url: string; name: string; originalName: string; mimeType: string; size: number },
  ) {
    return this.documentsService.createVersion(id, workspaceId, dto);
  }

  @Delete(':id')
  @RequirePermissions('documents:delete')
  @ApiOperation({ summary: 'Delete document' })
  async delete(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.documentsService.delete(id, workspaceId);
  }
}
