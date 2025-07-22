-- CreateTable
CREATE TABLE "ServerConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT,
    "subtitle" TEXT,
    "pageTitle" TEXT,
    "pageDescription" TEXT,
    "prizeHeading" TEXT,
    "serverHeading" TEXT,
    "serverPlaceholder" TEXT,
    "redemptionCodeHeading" TEXT,
    "redemptionCodePlaceholder" TEXT,
    "redeemButtonText" TEXT,
    "footerText" TEXT,
    "footerTextPosition" TEXT DEFAULT 'below',
    "footerImage" TEXT,
    "footerUrl" TEXT,
    "backgroundImage" TEXT,
    "logoImage" TEXT,
    "showWave" BOOLEAN NOT NULL DEFAULT false,
    "panelAlignment" TEXT DEFAULT 'left',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
