-- CreateTable
CREATE TABLE "contas" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(256),
    "agency" VARCHAR(20),
    "account_number" VARCHAR(30),
    "institution_name" VARCHAR(120),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" VARCHAR(9),
    "icon" VARCHAR(60),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contas_name_idx" ON "contas"("name");
