import { DomainError } from "@ideias/shared";
import { Processing, ProcessingIteration } from "../../../src/processing/model";
import { FakeProcessingRepository } from "../../../src/processing/provider";
import { DeleteProcessing } from "../../../src/processing/usecase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const PROCESSING_ID = "33333333-3333-4333-8333-333333333333";

function buildProcessing(owner = USER_ID): Processing {
  return new Processing({
    id: PROCESSING_ID,
    userId: owner,
    ideaId: "44444444-4444-4444-8444-444444444444",
    ideaName: "App de Receitas",
    ideaDescription: "Aplicativo para organizar receitas.",
    ideaObjective: "Ajudar pessoas a cozinhar melhor.",
    ideaTypeId: "55555555-5555-4555-8555-555555555555",
    ideaTypeName: "Produto Digital",
    promptTemplate: "Avalie {{name}}.",
    iterations: [
      new ProcessingIteration({
        refinement: null,
        result: "Resultado",
        position: 0,
      }),
    ],
  });
}

describe("DeleteProcessing use case", () => {
  it("apaga o Processamento do proprio usuario", async () => {
    const repo = new FakeProcessingRepository();
    repo.create(buildProcessing());
    const useCase = new DeleteProcessing(repo);

    await useCase.execute({ id: PROCESSING_ID, userId: USER_ID });

    expect(await repo.findById(PROCESSING_ID)).toBeNull();
  });

  it("lanca 404 quando o Processamento nao existe", async () => {
    const repo = new FakeProcessingRepository();
    const useCase = new DeleteProcessing(repo);
    try {
      await useCase.execute({ id: PROCESSING_ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.not_found");
      expect(domain.statusCode).toBe(404);
    }
  });

  it("lanca 404 para Processamento de outro usuario", async () => {
    const repo = new FakeProcessingRepository();
    repo.create(buildProcessing(OTHER_USER_ID));
    const useCase = new DeleteProcessing(repo);
    try {
      await useCase.execute({ id: PROCESSING_ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.not_found");
      expect(domain.statusCode).toBe(404);
    }
  });
});
