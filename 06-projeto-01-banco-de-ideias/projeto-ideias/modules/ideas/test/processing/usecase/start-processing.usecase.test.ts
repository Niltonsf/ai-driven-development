import { DomainError } from "@ideias/shared";
import { Idea, Resource } from "../../../src/idea/model";
import { FakeIdeaRepository } from "../../../src/idea/provider";
import { IdeaType } from "../../../src/idea-type/model";
import { FakeIdeaTypeRepository } from "../../../src/idea-type/provider";
import { FakeProcessingRepository } from "../../../src/processing/provider";
import { StartProcessing } from "../../../src/processing/usecase";
import { FailingAiProvider, FakeAiProvider } from "../support/fake-ai-provider";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const IDEA_ID = "33333333-3333-4333-8333-333333333333";
const IDEA_TYPE_ID = "44444444-4444-4444-8444-444444444444";

function buildIdeaType(): IdeaType {
  return new IdeaType({
    id: IDEA_TYPE_ID,
    name: "Produto Digital",
    description: "Tipo voltado para produtos digitais.",
    prompt:
      "Nome: {{name}} Desc: {{description}} Obj: {{objective}} Rec: {{resources}} Lit: {{unknown}}",
    userId: USER_ID,
  });
}

function buildIdea(resources: Resource[] = [], owner = USER_ID): Idea {
  return new Idea({
    id: IDEA_ID,
    name: "App de Receitas",
    description: "Aplicativo para organizar receitas culinarias.",
    objective: "Ajudar pessoas a cozinhar melhor em casa.",
    ideaTypeId: IDEA_TYPE_ID,
    userId: owner,
    resources,
  });
}

function setup(options: { idea?: Idea | null; ideaType?: IdeaType | null } = {}) {
  const processingRepo = new FakeProcessingRepository();
  const ideaRepo = new FakeIdeaRepository();
  const ideaTypeRepo = new FakeIdeaTypeRepository();
  const ai = new FakeAiProvider("Primeiro resultado da IA.");

  if (options.idea !== null) {
    ideaRepo.create(options.idea ?? buildIdea());
  }
  if (options.ideaType !== null) {
    ideaTypeRepo.create(options.ideaType ?? buildIdeaType());
  }

  const useCase = new StartProcessing(
    processingRepo,
    ideaRepo,
    ideaTypeRepo,
    ai,
  );
  return { processingRepo, ideaRepo, ideaTypeRepo, ai, useCase };
}

describe("StartProcessing use case", () => {
  it("cria Processamento a partir de Ideia sem recursos", async () => {
    const { useCase, processingRepo, ai } = setup();

    const processing = await useCase.execute({
      ideaId: IDEA_ID,
      userId: USER_ID,
    });

    expect(processing.iterations).toHaveLength(1);
    expect(processing.iterations[0].refinement).toBeNull();
    expect(processing.iterations[0].result).toBe("Primeiro resultado da IA.");
    expect(processing.resources).toEqual([]);
    expect(ai.calls[0].userMessage).toBe(
      "Gere o primeiro resultado para esta Ideia.",
    );
    const stored = await processingRepo.findById(processing.id);
    expect(stored).not.toBeNull();
  });

  it("cria Processamento copiando o snapshot de 3 recursos ordenados", async () => {
    const resources = [
      new Resource({ type: "text", content: "C", position: 2 }),
      new Resource({ type: "text", content: "A", position: 0 }),
      new Resource({ type: "text", content: "B", position: 1 }),
    ];
    const { useCase } = setup({ idea: buildIdea(resources) });

    const processing = await useCase.execute({
      ideaId: IDEA_ID,
      userId: USER_ID,
    });

    expect(processing.resources).toEqual([
      { type: "text", content: "A", position: 0 },
      { type: "text", content: "B", position: 1 },
      { type: "text", content: "C", position: 2 },
    ]);
    // Snapshot e copia plana: nao guarda instancias de Resource nem ids.
    expect(processing.resources[0]).not.toBeInstanceOf(Resource);
    expect(
      (processing.resources[0] as Record<string, unknown>).id,
    ).toBeUndefined();
  });

  it("preserva o snapshot mesmo se a colecao original mudar depois", async () => {
    const resources = [new Resource({ type: "text", content: "Original", position: 0 })];
    const { useCase } = setup({ idea: buildIdea(resources) });

    const processing = await useCase.execute({
      ideaId: IDEA_ID,
      userId: USER_ID,
    });

    // Mutacao posterior na lista de origem nao afeta o snapshot copiado.
    resources.push(new Resource({ type: "text", content: "Novo", position: 1 }));

    expect(processing.resources).toEqual([
      { type: "text", content: "Original", position: 0 },
    ]);
  });

  it("substitui os marcadores conhecidos e mantem desconhecido literal", async () => {
    const resources = [new Resource({ type: "text", content: "R1", position: 0 })];
    const { useCase, ai } = setup({ idea: buildIdea(resources) });

    await useCase.execute({ ideaId: IDEA_ID, userId: USER_ID });

    expect(ai.calls[0].systemPrompt).toBe(
      "Nome: App de Receitas Desc: Aplicativo para organizar receitas culinarias. Obj: Ajudar pessoas a cozinhar melhor em casa. Rec: 1. R1 Lit: {{unknown}}",
    );
  });

  it("lanca 422 processing.idea.invalid quando a Ideia nao existe", async () => {
    const { useCase } = setup({ idea: null });

    try {
      await useCase.execute({ ideaId: IDEA_ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.idea.invalid");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("lanca 422 processing.idea.invalid quando a Ideia e de outro usuario", async () => {
    const { useCase } = setup({ idea: buildIdea([], OTHER_USER_ID) });

    try {
      await useCase.execute({ ideaId: IDEA_ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.idea.invalid");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("lanca 422 processing.idea.invalid quando o Tipo nao existe", async () => {
    const { useCase } = setup({ ideaType: null });

    try {
      await useCase.execute({ ideaId: IDEA_ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.idea.invalid");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("propaga 502 quando o AiProvider falha", async () => {
    const processingRepo = new FakeProcessingRepository();
    const ideaRepo = new FakeIdeaRepository();
    const ideaTypeRepo = new FakeIdeaTypeRepository();
    ideaRepo.create(buildIdea());
    ideaTypeRepo.create(buildIdeaType());
    const useCase = new StartProcessing(
      processingRepo,
      ideaRepo,
      ideaTypeRepo,
      new FailingAiProvider(),
    );

    try {
      await useCase.execute({ ideaId: IDEA_ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("ai.generate.failed");
      expect(domain.statusCode).toBe(502);
    }
  });
});
