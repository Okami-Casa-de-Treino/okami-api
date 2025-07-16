-- CreateEnum
CREATE TYPE "expense_status" AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'partial');

-- CreateEnum
CREATE TYPE "expense_category" AS ENUM ('rent', 'utilities', 'insurance', 'taxes', 'loans', 'credit_cards', 'services', 'supplies', 'maintenance', 'other');

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "due_date" DATE NOT NULL,
    "payment_date" DATE,
    "payment_method" "payment_method",
    "status" "expense_status" DEFAULT 'pending',
    "category" "expense_category" DEFAULT 'other',
    "creditor" VARCHAR(255),
    "reference_number" VARCHAR(100),
    "discount" DECIMAL(10,2) DEFAULT 0,
    "late_fee" DECIMAL(10,2) DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_expenses_due_date" ON "expenses"("due_date");

-- CreateIndex
CREATE INDEX "idx_expenses_status" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "idx_expenses_category" ON "expenses"("category");
