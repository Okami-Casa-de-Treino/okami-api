-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "checkin_method" AS ENUM ('manual', 'qr_code', 'app');

-- CreateEnum
CREATE TYPE "class_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'card', 'pix', 'bank_transfer');

-- CreateEnum
CREATE TYPE "payment_status" AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- CreateEnum
CREATE TYPE "student_class_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "student_status" AS ENUM ('active', 'inactive', 'suspended');

-- CreateEnum
CREATE TYPE "teacher_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('admin', 'teacher', 'receptionist');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'inactive');

-- CreateEnum
CREATE TYPE "promotion_type" AS ENUM ('regular', 'skip_degree', 'honorary', 'correction');

-- CreateTable
CREATE TABLE "students" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "cpf" VARCHAR(14),
    "rg" VARCHAR(20),
    "belt" VARCHAR(50),
    "belt_degree" INTEGER DEFAULT 0,
    "address" TEXT,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "emergency_contact_name" VARCHAR(255),
    "emergency_contact_phone" VARCHAR(20),
    "emergency_contact_relationship" VARCHAR(100),
    "medical_observations" TEXT,
    "photo_url" VARCHAR(500),
    "enrollment_date" DATE DEFAULT CURRENT_DATE,
    "monthly_fee" DECIMAL(10,2),
    "status" "student_status" DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "full_name" VARCHAR(255) NOT NULL,
    "birth_date" DATE,
    "cpf" VARCHAR(14),
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "belt" VARCHAR(50),
    "belt_degree" INTEGER,
    "specialties" JSONB,
    "hourly_rate" DECIMAL(10,2),
    "status" "teacher_status" DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "teacher_id" UUID,
    "days_of_week" INTEGER[],
    "start_time" TIME(6),
    "end_time" TIME(6),
    "max_students" INTEGER DEFAULT 30,
    "belt_requirement" VARCHAR(50),
    "age_group" VARCHAR(50),
    "status" "class_status" DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_classes" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "class_id" UUID NOT NULL,
    "enrollment_date" DATE DEFAULT CURRENT_DATE,
    "status" "student_class_status" DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkins" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "class_id" UUID,
    "checkin_date" DATE DEFAULT CURRENT_DATE,
    "checkin_time" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "method" "checkin_method" DEFAULT 'manual',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "checkins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "payment_date" DATE,
    "payment_method" "payment_method",
    "status" "payment_status" DEFAULT 'pending',
    "reference_month" DATE,
    "discount" DECIMAL(10,2) DEFAULT 0,
    "late_fee" DECIMAL(10,2) DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "username" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "user_role" DEFAULT 'receptionist',
    "teacher_id" UUID,
    "status" "user_status" DEFAULT 'active',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "belt_promotions" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "promoted_by" UUID NOT NULL,
    "previous_belt" VARCHAR(50),
    "previous_degree" INTEGER DEFAULT 0,
    "new_belt" VARCHAR(50) NOT NULL,
    "new_degree" INTEGER NOT NULL DEFAULT 0,
    "promotion_date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "promotion_type" "promotion_type" NOT NULL DEFAULT 'regular',
    "requirements_met" JSONB,
    "notes" TEXT,
    "certificate_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "belt_promotions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_cpf_key" ON "students"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "students_phone_key" ON "students"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE INDEX "idx_students_cpf" ON "students"("cpf");

-- CreateIndex
CREATE INDEX "idx_students_enrollment_date" ON "students"("enrollment_date");

-- CreateIndex
CREATE INDEX "idx_students_status" ON "students"("status");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_cpf_key" ON "teachers"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_phone_key" ON "teachers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_email_key" ON "teachers"("email");

-- CreateIndex
CREATE INDEX "idx_teachers_cpf" ON "teachers"("cpf");

-- CreateIndex
CREATE INDEX "idx_teachers_status" ON "teachers"("status");

-- CreateIndex
CREATE INDEX "idx_classes_status" ON "classes"("status");

-- CreateIndex
CREATE INDEX "idx_classes_teacher_id" ON "classes"("teacher_id");

-- CreateIndex
CREATE INDEX "idx_student_classes_class_id" ON "student_classes"("class_id");

-- CreateIndex
CREATE INDEX "idx_student_classes_status" ON "student_classes"("status");

-- CreateIndex
CREATE INDEX "idx_student_classes_student_id" ON "student_classes"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_classes_student_id_class_id_key" ON "student_classes"("student_id", "class_id");

-- CreateIndex
CREATE INDEX "idx_checkins_class_id" ON "checkins"("class_id");

-- CreateIndex
CREATE INDEX "idx_checkins_date" ON "checkins"("checkin_date");

-- CreateIndex
CREATE INDEX "idx_checkins_student_id" ON "checkins"("student_id");

-- CreateIndex
CREATE INDEX "idx_payments_due_date" ON "payments"("due_date");

-- CreateIndex
CREATE INDEX "idx_payments_reference_month" ON "payments"("reference_month");

-- CreateIndex
CREATE INDEX "idx_payments_status" ON "payments"("status");

-- CreateIndex
CREATE INDEX "idx_payments_student_id" ON "payments"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_role" ON "users"("role");

-- CreateIndex
CREATE INDEX "idx_users_status" ON "users"("status");

-- CreateIndex
CREATE INDEX "idx_users_username" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_belt_promotions_student_id" ON "belt_promotions"("student_id");

-- CreateIndex
CREATE INDEX "idx_belt_promotions_date" ON "belt_promotions"("promotion_date");

-- CreateIndex
CREATE INDEX "idx_belt_promotions_belt" ON "belt_promotions"("new_belt");

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_classes" ADD CONSTRAINT "student_classes_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "checkins" ADD CONSTRAINT "checkins_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "belt_promotions" ADD CONSTRAINT "belt_promotions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "belt_promotions" ADD CONSTRAINT "belt_promotions_promoted_by_fkey" FOREIGN KEY ("promoted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
