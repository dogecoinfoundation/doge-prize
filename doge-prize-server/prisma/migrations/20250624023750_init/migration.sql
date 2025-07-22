-- CreateEnum
CREATE TYPE "PrizeStatus" AS ENUM ('Available', 'Redeemed', 'Transferred');

-- CreateTable
CREATE TABLE "Prize" (
    "id" SERIAL NOT NULL,
    "redemptionCode" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PrizeStatus" NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prize_redemptionCode_key" ON "Prize"("redemptionCode");

-- CreateIndex
CREATE INDEX "Prize_redemptionCode_idx" ON "Prize"("redemptionCode");
