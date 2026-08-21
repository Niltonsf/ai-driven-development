-- CreateTable
CREATE TABLE "processings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "ideaName" TEXT NOT NULL,
    "ideaDescription" TEXT NOT NULL,
    "ideaObjective" TEXT NOT NULL,
    "ideaTypeId" TEXT NOT NULL,
    "ideaTypeName" TEXT NOT NULL,
    "promptTemplate" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_iterations" (
    "id" TEXT NOT NULL,
    "processingId" TEXT NOT NULL,
    "refinement" TEXT,
    "result" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processing_iterations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_resources" (
    "id" TEXT NOT NULL,
    "processingId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "processing_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "processings_userId_idx" ON "processings"("userId");

-- CreateIndex
CREATE INDEX "processings_ideaId_idx" ON "processings"("ideaId");

-- CreateIndex
CREATE INDEX "processing_iterations_processingId_position_idx" ON "processing_iterations"("processingId", "position");

-- CreateIndex
CREATE INDEX "processing_resources_processingId_position_idx" ON "processing_resources"("processingId", "position");

-- AddForeignKey
ALTER TABLE "processings" ADD CONSTRAINT "processings_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "ideas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processings" ADD CONSTRAINT "processings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "auth_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_iterations" ADD CONSTRAINT "processing_iterations_processingId_fkey" FOREIGN KEY ("processingId") REFERENCES "processings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_resources" ADD CONSTRAINT "processing_resources_processingId_fkey" FOREIGN KEY ("processingId") REFERENCES "processings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
