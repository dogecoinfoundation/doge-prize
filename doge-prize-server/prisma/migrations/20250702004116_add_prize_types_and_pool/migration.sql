-- CreateTable
CREATE TABLE "PrizePool" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "amount" REAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prize" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "redemptionCode" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "type" TEXT NOT NULL DEFAULT 'Specific',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Prize" ("amount", "createdAt", "id", "redemptionCode", "status", "updatedAt") SELECT "amount", "createdAt", "id", "redemptionCode", "status", "updatedAt" FROM "Prize";
DROP TABLE "Prize";
ALTER TABLE "new_Prize" RENAME TO "Prize";
CREATE UNIQUE INDEX "Prize_redemptionCode_key" ON "Prize"("redemptionCode");
CREATE INDEX "Prize_redemptionCode_idx" ON "Prize"("redemptionCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "PrizePool_amount_key" ON "PrizePool"("amount");
