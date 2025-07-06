import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface FileUploadResult {
  file_url: string;
  thumbnail_url?: string;
  duration?: number;
  file_size: number;
  mime_type: string;
}

export class FileUploadService {
  private uploadDir: string;
  private maxFileSize: number;
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '524288000'); // 500MB default
    this.allowedMimeTypes = [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/quicktime',
      'video/webm'
    ];
  }

  async uploadVideo(file: File): Promise<FileUploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = this.getFileExtension(file.name);
      const filename = `video_${timestamp}_${randomId}${extension}`;

      // Create directory structure
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const relativePath = `videos/${year}/${month}`;
      const fullPath = join(this.uploadDir, relativePath);

      // Ensure directory exists
      await this.ensureDirectoryExists(fullPath);

      // Save file
      const filePath = join(fullPath, filename);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await writeFile(filePath, buffer);

      // Generate file URL
      const fileUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${relativePath}/${filename}`;

      // Generate thumbnail (placeholder for now)
      const thumbnailUrl = await this.generateThumbnail(filePath, filename);

      return {
        file_url: fileUrl,
        thumbnail_url: thumbnailUrl,
        duration: await this.getVideoDuration(filePath),
        file_size: file.size,
        mime_type: file.type
      };

    } catch (error) {
      console.error('File upload error:', error);
      throw new Error(`Falha no upload do arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  private validateFile(file: File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(`Arquivo muito grande. Tamanho máximo: ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.type)) {
      throw new Error(`Tipo de arquivo não suportado. Tipos permitidos: ${this.allowedMimeTypes.join(', ')}`);
    }

    // Check if file has content
    if (file.size === 0) {
      throw new Error('Arquivo vazio');
    }
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }

  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    if (!existsSync(dirPath)) {
      await mkdir(dirPath, { recursive: true });
    }
  }

  private async generateThumbnail(videoPath: string, filename: string): Promise<string | undefined> {
    try {
      // For now, return a placeholder thumbnail URL
      // In a real implementation, you would use ffmpeg or similar to generate thumbnails
      const thumbnailFilename = filename.replace(/\.[^/.]+$/, '.jpg');
      const thumbnailPath = videoPath.replace(/\.[^/.]+$/, '.jpg');
      
      // Create a simple placeholder thumbnail (1x1 pixel transparent PNG)
      const placeholderThumbnail = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      await writeFile(thumbnailPath, placeholderThumbnail);

      const thumbnailUrl = videoPath.replace(this.uploadDir, '').replace(/\.[^/.]+$/, '.jpg');
      return `${process.env.BASE_URL || 'http://localhost:3000'}/uploads${thumbnailUrl}`;
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
      return undefined;
    }
  }

  private async getVideoDuration(videoPath: string): Promise<number | undefined> {
    try {
      // For now, return undefined
      // In a real implementation, you would use ffmpeg or similar to get video duration
      return undefined;
    } catch (error) {
      console.warn('Failed to get video duration:', error);
      return undefined;
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const url = new URL(fileUrl);
      const filePath = url.pathname.replace('/uploads', this.uploadDir);
      
      // Delete file if it exists
      if (existsSync(filePath)) {
        await writeFile(filePath, ''); // Clear file content
        // Note: In a real implementation, you would use fs.unlink to delete the file
      }
    } catch (error) {
      console.warn('Failed to delete file:', error);
    }
  }
} 