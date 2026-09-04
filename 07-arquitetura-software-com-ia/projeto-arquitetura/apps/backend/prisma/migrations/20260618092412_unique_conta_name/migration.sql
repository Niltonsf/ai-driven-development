
-- DropIndex
DROP INDEX "contas_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "contas_name_key" ON "contas"("name");

