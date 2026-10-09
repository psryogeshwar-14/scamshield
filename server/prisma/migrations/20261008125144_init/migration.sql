-- CreateTable
CREATE TABLE "ThreatCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "inputType" TEXT NOT NULL,
    "userInput" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "threatType" TEXT,
    "confidence" REAL,
    "summary" TEXT,
    "evidenceJson" TEXT,
    "recommendedAction" TEXT,
    "safetyStepsJson" TEXT,
    "safeBrowsingResult" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SafetyRecommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "threatCheckId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SafetyRecommendation_threatCheckId_fkey" FOREIGN KEY ("threatCheckId") REFERENCES "ThreatCheck" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
