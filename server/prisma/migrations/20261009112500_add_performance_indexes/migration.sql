-- CreateIndex
CREATE INDEX "ThreatCheck_createdAt_idx" ON "ThreatCheck"("createdAt");

-- CreateIndex
CREATE INDEX "ThreatCheck_inputType_idx" ON "ThreatCheck"("inputType");

-- CreateIndex
CREATE INDEX "ThreatCheck_riskLevel_idx" ON "ThreatCheck"("riskLevel");

-- CreateIndex
CREATE INDEX "SafetyRecommendation_threatCheckId_idx" ON "SafetyRecommendation"("threatCheckId");
