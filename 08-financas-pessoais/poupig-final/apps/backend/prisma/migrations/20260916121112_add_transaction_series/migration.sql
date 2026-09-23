-- CreateEnum
CREATE TYPE "SeriesKind" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "FrequencyUnit" AS ENUM ('WEEK', 'MONTH', 'YEAR');

-- CreateTable
CREATE TABLE "transaction_series" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "note" VARCHAR(500),
    "value" DECIMAL(14,2) NOT NULL,
    "direction" "Direction" NOT NULL,
    "account_id" TEXT NOT NULL,
    "credit_card_id" TEXT,
    "subcategory_id" TEXT,
    "kind" "SeriesKind" NOT NULL,
    "frequency_unit" "FrequencyUnit" NOT NULL,
    "frequency_interval" SMALLINT NOT NULL,
    "week_day" SMALLINT,
    "day_of_month" SMALLINT,
    "month" SMALLINT,
    "installments" SMALLINT,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "transaction_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transaction_series_user_id_start_date_idx" ON "transaction_series"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "transaction_series_account_id_idx" ON "transaction_series"("account_id");

-- CreateIndex
CREATE INDEX "transaction_series_credit_card_id_idx" ON "transaction_series"("credit_card_id");

-- CreateIndex
CREATE INDEX "transaction_series_subcategory_id_idx" ON "transaction_series"("subcategory_id");

-- AddForeignKey
ALTER TABLE "transaction_series" ADD CONSTRAINT "transaction_series_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_series" ADD CONSTRAINT "transaction_series_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_series" ADD CONSTRAINT "transaction_series_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_series" ADD CONSTRAINT "transaction_series_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
