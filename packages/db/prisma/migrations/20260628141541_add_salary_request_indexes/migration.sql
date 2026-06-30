-- CreateIndex
CREATE INDEX "salary_requests_missionId_idx" ON "salary_requests"("missionId");

-- CreateIndex
CREATE INDEX "salary_requests_missionaryId_idx" ON "salary_requests"("missionaryId");

-- CreateIndex
CREATE INDEX "salary_requests_reviewedById_idx" ON "salary_requests"("reviewedById");

-- CreateIndex
CREATE INDEX "salary_requests_status_idx" ON "salary_requests"("status");

-- CreateIndex
CREATE INDEX "salary_requests_year_month_idx" ON "salary_requests"("year", "month");
