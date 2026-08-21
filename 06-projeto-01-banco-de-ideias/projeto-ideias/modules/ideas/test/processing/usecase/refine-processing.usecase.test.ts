import { DomainError, ValidationException } from "@ideias/shared";
import {
  Processing,
  ProcessingIteration,
} from "../../../src/processing/model";
import { FakeProcessingRepository } from "../../../src/processing/provider";
import { RefineProcessing } from "../../../src/processing/usecase";
import { FailingAiProvider, FakeAiProvider } from "../support/fake-ai-provider";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const PROCESSING_ID = "33333333-3333-4333-8333-333333333333";
const IDEA_ID = "44444444-4444-4444-8444-444444444444";
const IDEA_TYPE_ID = "55555555-5555-4555-8555-555555555555";

function buildProcessing(
  owner = USER_ID,
  iterationsCount = 1,
): Processing {
  const iterations = Array.from(
    { length: iterationsCount },
    (_, i) =>
      new ProcessingIteration({
        refinement: i === 0 ? null : `refino ${i}`,
        result: `Resultado ${i}`,
        position: i,
      }),
  );
  return new Processing({
    id: PROCESSING_ID,
    userId: owner,
    ideaId: IDEA_ID,
    ideaName: "App de Receitas",
    ideaDescription: "Aplicativo para organizar receitas.",
    ideaObjective: "Ajudar pessoas a cozinhar melhor.",
    ideaTypeId: IDEA_TYPE_ID,
    ideaTypeName: "Produto Digital",
    promptTemplate: "Avalie {{name}} - {{resources}}",
    resources: [{ type: "text", content: "Contexto", position: 0 }],
    iterations,
  });
}

function setup(processing: Processing | null = buildProcessing()) {
  const repo = new FakeProcessingRepository();
  const ai = new FakeAiProvider("Novo resultado refinado.");
  if (processing) {
    repo.create(processing);
  }
  const useCase = new RefineProcessing(repo, ai);
  return { repo, ai, useCase };
}

describe("RefineProcessing use case", () => {
  it("adiciona a 2a e a 3a iteracoes preservando o historico", async () => {
    const { repo, ai, useCase } = setup();

    const second = await useCase.execute({
      processingId: PROCESSING_ID,
      userId: USER_ID,
      refinement: "Deixe mais formal",
    });
    expect(second.position).toBe(1);
    expect(second.refinement).toBe("Deixe mais formal");
    expect(second.result).toBe("Novo resultado refinado.");

    const third = await useCase.execute({
      processingId: PROCESSING_ID,
      userId: USER_ID,
      refinement: "Adicione exemplos praticos",
    });
    expect(third.position).toBe(2);

    const stored = await repo.findById(PROCESSING_ID);
    expect(stored!.iterations).toHaveLength(3);
    expect(ai.calls[1].userMessage).toContain(
      "Histórico de iterações anteriores:",
    );
    expect(ai.calls[1].userMessage).toContain(
      "Refinamento solicitado agora: Adicione exemplos praticos",
    );
    expect(ai.calls[1].systemPrompt).toBe("Avalie App de Receitas - 1. Contexto");
  });

  it("lanca 422 quando refinement e vazio", async () => {
    const { useCase } = setup();
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "",
      });
      fail("Deveria ter lancado");
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      const ex = error as ValidationException;
      expect(ex.statusCode).toBe(422);
      expect(ex.errors.map((e) => e.message)).toContain(
        "processing.refinement.required",
      );
    }
  });

  it("lanca 422 quando refinement tem 1 caractere (min)", async () => {
    const { useCase } = setup();
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "a",
      });
      fail("Deveria ter lancado");
    } catch (error) {
      const ex = error as ValidationException;
      expect(ex.errors.map((e) => e.message)).toContain(
        "processing.refinement.min.length",
      );
    }
  });

  it("lanca 422 quando refinement tem 2001 caracteres (max)", async () => {
    const { useCase } = setup();
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "a".repeat(2001),
      });
      fail("Deveria ter lancado");
    } catch (error) {
      const ex = error as ValidationException;
      expect(ex.errors.map((e) => e.message)).toContain(
        "processing.refinement.max.length",
      );
    }
  });

  it("lanca 404 processing.not_found quando o Processamento nao existe", async () => {
    const { useCase } = setup(null);
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "Refinamento valido",
      });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.not_found");
      expect(domain.statusCode).toBe(404);
    }
  });

  it("lanca 404 processing.not_found para Processamento de outro usuario", async () => {
    const { useCase } = setup(buildProcessing(OTHER_USER_ID));
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "Refinamento valido",
      });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.not_found");
      expect(domain.statusCode).toBe(404);
    }
  });

  it("lanca 422 processing.iterations.too_many no estouro de 50", async () => {
    const { useCase } = setup(buildProcessing(USER_ID, 50));
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "Refinamento valido",
      });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.iterations.too_many");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("propaga 502 quando o AiProvider falha", async () => {
    const repo = new FakeProcessingRepository();
    repo.create(buildProcessing());
    const useCase = new RefineProcessing(repo, new FailingAiProvider());
    try {
      await useCase.execute({
        processingId: PROCESSING_ID,
        userId: USER_ID,
        refinement: "Refinamento valido",
      });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("ai.generate.failed");
      expect(domain.statusCode).toBe(502);
    }
  });
});
