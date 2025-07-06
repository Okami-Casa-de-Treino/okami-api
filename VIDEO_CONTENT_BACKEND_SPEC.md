# Video Content Management System - Backend Specification

## Overview
This document outlines the backend implementation for the Video Content Management System using Express.js with NestJS patterns. The system allows teachers and admins to upload, manage, and organize martial arts videos by modules and optionally assign them to specific classes.

## Database Schema

### 1. Modules Table
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(200),
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Hex color code
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Videos Table
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  assigned_class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  duration INTEGER, -- Duration in seconds
  file_size BIGINT, -- File size in bytes
  mime_type VARCHAR(100),
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_videos_module_id ON videos(module_id);
CREATE INDEX idx_videos_assigned_class_id ON videos(assigned_class_id);
CREATE INDEX idx_videos_upload_date ON videos(upload_date);
CREATE INDEX idx_videos_title ON videos USING gin(to_tsvector('english', title));
CREATE INDEX idx_videos_description ON videos USING gin(to_tsvector('english', description));
```

## API Endpoints

### Base URL: `/api/videos`

### 1. Video Management

#### GET `/api/videos`
**Description**: Get paginated list of videos with filtering and search
**Access**: Admin, Teacher
**Query Parameters**:
- `page` (number, default: 1): Page number
- `limit` (number, default: 10): Items per page
- `search` (string, optional): Search in title and description
- `moduleId` (string, optional): Filter by module
- `assignedClassId` (string, optional): Filter by assigned class
- `sortBy` (string, optional): Sort field (title, upload_date, duration)
- `sortOrder` (string, optional): Sort order (asc, desc)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Basic Punch Technique",
      "description": "Learn the fundamental punch technique",
      "fileUrl": "https://storage.example.com/videos/basic-punch.mp4",
      "thumbnailUrl": "https://storage.example.com/thumbnails/basic-punch.jpg",
      "moduleId": "uuid",
      "module": {
        "id": "uuid",
        "name": "Basic Techniques",
        "description": "Fundamental martial arts techniques",
        "color": "#3B82F6"
      },
      "assignedClassId": "uuid",
      "assignedClass": {
        "id": "uuid",
        "name": "Beginner Class",
        "description": "Class for beginners"
      },
      "duration": 180,
      "uploadDate": "2024-01-15T10:30:00Z",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "current_page": 1,
  "total_pages": 5,
  "total_items": 50,
  "items_per_page": 10
}
```

#### GET `/api/videos/:id`
**Description**: Get single video by ID
**Access**: Admin, Teacher
**Response**: Single video object with full details

#### POST `/api/videos`
**Description**: Create new video record
**Access**: Admin, Teacher
**Request Body**:
```json
{
  "title": "Basic Punch Technique",
  "description": "Learn the fundamental punch technique",
  "fileUrl": "https://storage.example.com/videos/basic-punch.mp4",
  "thumbnailUrl": "https://storage.example.com/thumbnails/basic-punch.jpg",
  "moduleId": "uuid",
  "assignedClassId": "uuid" // optional
}
```

#### PUT `/api/videos/:id`
**Description**: Update video record
**Access**: Admin, Teacher
**Request Body**: Same as POST but all fields optional

#### DELETE `/api/videos/:id`
**Description**: Delete video record
**Access**: Admin, Teacher
**Response**: Success message

### 2. Video Filtering Endpoints

#### GET `/api/videos/module/:moduleId`
**Description**: Get all videos for a specific module
**Access**: Admin, Teacher
**Response**: Array of videos

#### GET `/api/videos/class/:classId`
**Description**: Get all videos assigned to a specific class
**Access**: Admin, Teacher
**Response**: Array of videos

#### GET `/api/videos/free`
**Description**: Get all videos not assigned to any class
**Access**: Admin, Teacher
**Response**: Array of videos

### 3. File Upload

#### POST `/api/videos/upload`
**Description**: Upload video file and generate thumbnail
**Access**: Admin, Teacher
**Content-Type**: `multipart/form-data`
**Request**:
- `file` (File): Video file (MP4, AVI, MOV, max 500MB)

**Response**:
```json
{
  "success": true,
  "data": {
    "fileUrl": "https://storage.example.com/videos/uploaded-video.mp4",
    "thumbnailUrl": "https://storage.example.com/thumbnails/uploaded-video.jpg",
    "duration": 180,
    "fileSize": 52428800,
    "mimeType": "video/mp4"
  }
}
```

### 4. Module Management

#### GET `/api/modules`
**Description**: Get all modules
**Access**: Admin, Teacher
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Basic Techniques",
      "description": "Fundamental martial arts techniques",
      "color": "#3B82F6",
      "order": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### GET `/api/modules/:id`
**Description**: Get single module by ID
**Access**: Admin, Teacher

#### POST `/api/modules`
**Description**: Create new module
**Access**: Admin only
**Request Body**:
```json
{
  "name": "Advanced Techniques",
  "description": "Advanced martial arts techniques",
  "color": "#EF4444",
  "order": 2
}
```

#### PUT `/api/modules/:id`
**Description**: Update module
**Access**: Admin only

#### DELETE `/api/modules/:id`
**Description**: Delete module (only if no videos assigned)
**Access**: Admin only

## File Storage Strategy

### 1. Local Storage (Development)
```
uploads/
├── videos/
│   ├── 2024/
│   │   ├── 01/
│   │   │   ├── video-1.mp4
│   │   │   └── video-2.mp4
│   │   └── 02/
│   └── thumbnails/
│       ├── 2024/
│       │   ├── 01/
│       │   │   ├── video-1.jpg
│       │   │   └── video-2.jpg
```

### 2. Cloud Storage (Production)
- **AWS S3** or **Google Cloud Storage**
- Organized by year/month for easy management
- CDN integration for fast video delivery
- Automatic thumbnail generation

## Implementation Structure

### 1. Controllers
```typescript
// video.controller.ts
@Controller('videos')
export class VideoController {
  @Get()
  async getAll(@Query() query: VideoQueryDto) {}

  @Get(':id')
  async getById(@Param('id') id: string) {}

  @Post()
  async create(@Body() createVideoDto: CreateVideoDto) {}

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateVideoDto: UpdateVideoDto) {}

  @Delete(':id')
  async delete(@Param('id') id: string) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {}
}

// module.controller.ts
@Controller('modules')
export class ModuleController {
  @Get()
  async getAll() {}

  @Get(':id')
  async getById(@Param('id') id: string) {}

  @Post()
  async create(@Body() createModuleDto: CreateModuleDto) {}

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateModuleDto: UpdateModuleDto) {}

  @Delete(':id')
  async delete(@Param('id') id: string) {}
}
```

### 2. Services
```typescript
// video.service.ts
@Injectable()
export class VideoService {
  async findAll(query: VideoQueryDto): Promise<PaginatedResponse<Video>> {}
  async findById(id: string): Promise<Video> {}
  async create(createVideoDto: CreateVideoDto): Promise<Video> {}
  async update(id: string, updateVideoDto: UpdateVideoDto): Promise<Video> {}
  async delete(id: string): Promise<void> {}
  async uploadFile(file: Express.Multer.File): Promise<FileUploadResponse> {}
  async findByModule(moduleId: string): Promise<Video[]> {}
  async findByClass(classId: string): Promise<Video[]> {}
  async findFreeVideos(): Promise<Video[]> {}
}

// module.service.ts
@Injectable()
export class ModuleService {
  async findAll(): Promise<Module[]> {}
  async findById(id: string): Promise<Module> {}
  async create(createModuleDto: CreateModuleDto): Promise<Module> {}
  async update(id: string, updateModuleDto: UpdateModuleDto): Promise<Module> {}
  async delete(id: string): Promise<void> {}
}
```

### 3. DTOs (Data Transfer Objects)
```typescript
// video.dto.ts
export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsString()
  @IsUrl()
  fileUrl: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  thumbnailUrl?: string;

  @IsUUID()
  moduleId: string;

  @IsUUID()
  @IsOptional()
  assignedClassId?: string;
}

export class UpdateVideoDto extends PartialType(CreateVideoDto) {}

export class VideoQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @IsUUID()
  assignedClassId?: string;

  @IsOptional()
  @IsIn(['title', 'upload_date', 'duration'])
  sortBy?: string = 'upload_date';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: string = 'desc';
}
```

### 4. Entities/Models
```typescript
// video.entity.ts
@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'file_url', type: 'varchar', length: 500 })
  fileUrl: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => Module, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: Module;

  @Column({ name: 'assigned_class_id', type: 'uuid', nullable: true })
  assignedClassId?: string;

  @ManyToOne(() => Class, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_class_id' })
  assignedClass?: Class;

  @Column({ type: 'integer', nullable: true })
  duration?: number;

  @Column({ name: 'file_size', type: 'bigint', nullable: true })
  fileSize?: number;

  @Column({ name: 'mime_type', type: 'varchar', length: 100, nullable: true })
  mimeType?: string;

  @Column({ name: 'upload_date', type: 'timestamp with time zone', default: () => 'NOW()' })
  uploadDate: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// module.entity.ts
@Entity('modules')
export class Module {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 7, default: '#3B82F6' })
  color: string;

  @Column({ name: 'order_index', type: 'integer', default: 0 })
  order: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Video, video => video.module)
  videos: Video[];
}
```

## Middleware & Guards

### 1. Authentication Guard
```typescript
@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Verify JWT token and set user in request
    return true;
  }
}
```

### 2. Role Guard
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### 3. File Upload Interceptor
```typescript
@Injectable()
export class VideoUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const file = request.file;

    // Validate file type and size
    if (!this.isValidVideoFile(file)) {
      throw new BadRequestException('Invalid video file');
    }

    return next.handle();
  }

  private isValidVideoFile(file: Express.Multer.File): boolean {
    const allowedMimes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime'];
    const maxSize = 500 * 1024 * 1024; // 500MB

    return allowedMimes.includes(file.mimetype) && file.size <= maxSize;
  }
}
```

## Error Handling

### 1. Custom Exceptions
```typescript
export class VideoNotFoundException extends NotFoundException {
  constructor(videoId: string) {
    super(`Video with ID ${videoId} not found`);
  }
}

export class ModuleNotFoundException extends NotFoundException {
  constructor(moduleId: string) {
    super(`Module with ID ${moduleId} not found`);
  }
}

export class FileUploadException extends BadRequestException {
  constructor(message: string) {
    super(`File upload failed: ${message}`);
  }
}
```

### 2. Global Exception Filter
```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

## Validation & Security

### 1. Input Validation
- Use class-validator decorators for DTOs
- Sanitize file names and paths
- Validate file types and sizes
- Prevent SQL injection with parameterized queries

### 2. File Security
- Generate unique file names
- Store files outside web root
- Implement file access controls
- Scan uploaded files for malware

### 3. Rate Limiting
```typescript
@Injectable()
export class ThrottlerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Implement rate limiting for file uploads
    return true;
  }
}
```

## Testing Strategy

### 1. Unit Tests
- Service methods
- Controller endpoints
- Validation logic
- File processing utilities

### 2. Integration Tests
- API endpoints
- Database operations
- File upload/download
- Authentication and authorization

### 3. E2E Tests
- Complete video upload flow
- Video management operations
- Module management
- Error scenarios

## Performance Considerations

### 1. Database Optimization
- Proper indexing on frequently queried fields
- Pagination for large datasets
- Efficient joins with related entities
- Query optimization

### 2. File Handling
- Stream large files instead of loading into memory
- Generate thumbnails asynchronously
- Implement file compression
- Use CDN for video delivery

### 3. Caching
- Cache module list
- Cache video metadata
- Implement Redis for session management
- Browser caching for static assets

## Deployment Considerations

### 1. Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/okami

# File Storage
STORAGE_TYPE=local # or s3, gcs
STORAGE_PATH=/uploads
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name

# Security
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# File Upload
MAX_FILE_SIZE=524288000 # 500MB
ALLOWED_VIDEO_TYPES=video/mp4,video/avi,video/mov
```

### 2. Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. Health Checks
```typescript
@Controller('health')
export class HealthController {
  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

## Monitoring & Logging

### 1. Logging
```typescript
@Injectable()
export class VideoService {
  private readonly logger = new Logger(VideoService.name);

  async uploadFile(file: Express.Multer.File) {
    this.logger.log(`Uploading file: ${file.originalname}`);
    // Implementation
  }
}
```

### 2. Metrics
- File upload success/failure rates
- Video processing times
- Storage usage
- API response times

This specification provides a complete foundation for implementing the video content management backend that will seamlessly integrate with your existing frontend implementation. 