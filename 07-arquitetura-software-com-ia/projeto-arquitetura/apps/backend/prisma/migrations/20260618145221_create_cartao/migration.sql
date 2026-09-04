-- CreateTable
CREATE TABLE "cartao" (
    "id" UUID NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "description" VARCHAR(256),
    "brand" VARCHAR(60),
    "last_digits" VARCHAR(4),
    "limit" DECIMAL(14,2),
    "closing_day" SMALLINT,
    "due_day" SMALLINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "color" VARCHAR(9),
    "icon" VARCHAR(60),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "cartao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cartao_name_key" ON "cartao"("name");

