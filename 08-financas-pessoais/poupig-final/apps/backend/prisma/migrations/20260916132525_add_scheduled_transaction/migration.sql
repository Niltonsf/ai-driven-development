-- CreateTable
CREATE TABLE "scheduled_transaction" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "series_id" TEXT NOT NULL,
    "occurrence_index" INTEGER NOT NULL,
    "occurrence_on" DATE NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "note" VARCHAR(500),
    "value" DECIMAL(14,2) NOT NULL,
    "direction" "Direction" NOT NULL,
    "account_id" TEXT NOT NULL,
    "credit_card_id" TEXT,
    "subcategory_id" TEXT,
    "status" "TransactionStatus" NOT NULL,
    "expected_on" DATE NOT NULL,
    "settled_on" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scheduled_transaction_user_id_expected_on_idx" ON "scheduled_transaction"("user_id", "expected_on");

-- CreateIndex
CREATE INDEX "scheduled_transaction_user_id_occurrence_on_idx" ON "scheduled_transaction"("user_id", "occurrence_on");

-- CreateIndex
CREATE INDEX "scheduled_transaction_account_id_idx" ON "scheduled_transaction"("account_id");

-- CreateIndex
CREATE INDEX "scheduled_transaction_credit_card_id_idx" ON "scheduled_transaction"("credit_card_id");

-- CreateIndex
CREATE INDEX "scheduled_transaction_subcategory_id_idx" ON "scheduled_transaction"("subcategory_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_transaction_series_id_occurrence_index_key" ON "scheduled_transaction"("series_id", "occurrence_index");

-- AddForeignKey
ALTER TABLE "scheduled_transaction" ADD CONSTRAINT "scheduled_transaction_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "transaction_series"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transaction" ADD CONSTRAINT "scheduled_transaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transaction" ADD CONSTRAINT "scheduled_transaction_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transaction" ADD CONSTRAINT "scheduled_transaction_credit_card_id_fkey" FOREIGN KEY ("credit_card_id") REFERENCES "card"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_transaction" ADD CONSTRAINT "scheduled_transaction_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "subcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
