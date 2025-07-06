/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "user_role" ADD VALUE 'student';

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "password_hash" VARCHAR(255),
ADD COLUMN     "username" VARCHAR(100);

-- CreateTable
CREATE TABLE "modules" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "color" VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "file_url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "module_id" UUID NOT NULL,
    "assigned_class_id" UUID,
    "duration" INTEGER,
    "file_size" BIGINT,
    "mime_type" VARCHAR(100),
    "upload_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "modules_name_key" ON "modules"("name");

-- CreateIndex
CREATE INDEX "idx_modules_name" ON "modules"("name");

-- CreateIndex
CREATE INDEX "idx_modules_order" ON "modules"("order_index");

-- CreateIndex
CREATE INDEX "idx_videos_module_id" ON "videos"("module_id");

-- CreateIndex
CREATE INDEX "idx_videos_assigned_class_id" ON "videos"("assigned_class_id");

-- CreateIndex
CREATE INDEX "idx_videos_upload_date" ON "videos"("upload_date");

-- CreateIndex
CREATE INDEX "idx_videos_title" ON "videos"("title");

-- CreateIndex
CREATE UNIQUE INDEX "students_username_key" ON "students"("username");

-- CreateIndex
CREATE INDEX "idx_students_username" ON "students"("username");

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "videos" ADD CONSTRAINT "videos_assigned_class_id_fkey" FOREIGN KEY ("assigned_class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
