import { DomainError, ValidationException } from "@ideias/shared";
import { IdeaType } from "../../../src/idea-type/model";
import { FakeIdeaTypeRepository } from "../../../src/idea-type/provider";
import { SaveIdeaType } from "../../../src/idea-type/usecase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const EXISTING_ID = "33333333-3333-4333-8333-333333333333";

function validInput(overrides: Partial<Parameters<SaveIdeaType["execute"]>[0]> = {}) {
  return {
    name: "Produto Digital",
    description: "Tipo de ideia voltada para produtos digitais.",
    prompt:
      "Avalie {{name}}, {{description}}, {{objective}} e {{resources}}.",
    userId: USER_ID,
    ...overrides,
  };
}

describe("SaveIdeaType use case", () => {
  it("cria uma nova entidade quando o id nao for informado", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await useCase.execute(validInput());

    const page = await repo.findPage({ userId: USER_ID, page: 1, perPage: 10 });
    expect(page.total).toBe(1);
    expect(page.items[0].name).toBe("Produto Digital");
  });

  it("cria entidade quando id informado nao existir", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await useCase.execute(validInput({ id: EXISTING_ID }));

    const found = await repo.findById(EXISTING_ID);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(EXISTING_ID);
  });

  it("atualiza entidade existente do mesmo usuario", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await repo.create(
      new IdeaType({
        id: EXISTING_ID,
        name: "Inicial",
        description: "Descricao inicial valida para o agregado.",
        prompt: "Prompt inicial com marcadores {{name}} valido.",
        userId: USER_ID,
      }),
    );

    await useCase.execute(
      validInput({ id: EXISTING_ID, name: "Atualizado" }),
    );

    const found = await repo.findById(EXISTING_ID);
    expect(found!.name).toBe("Atualizado");
  });

  it("lanca 403 quando o id existir mas pertencer a outro usuario", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await repo.create(
      new IdeaType({
        id: EXISTING_ID,
        name: "Outro",
        description: "Descricao valida do outro usuario para teste.",
        prompt: "Prompt valido com {{name}} suficientemente extenso.",
        userId: OTHER_USER_ID,
      }),
    );

    await expect(
      useCase.execute(validInput({ id: EXISTING_ID })),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("propaga 403 com code esperado em update cross-user", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await repo.create(
      new IdeaType({
        id: EXISTING_ID,
        name: "Outro",
        description: "Descricao valida do outro usuario para teste.",
        prompt: "Prompt valido com {{name}} suficientemente extenso.",
        userId: OTHER_USER_ID,
      }),
    );

    try {
      await useCase.execute(validInput({ id: EXISTING_ID }));
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea-type.forbidden");
      expect(domain.statusCode).toBe(403);
    }
  });

  it("falha quando campos obrigatorios sao invalidos", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await expect(
      useCase.execute(validInput({ name: "" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("falha ao atualizar entidade com payload invalido", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new SaveIdeaType(repo);

    await repo.create(
      new IdeaType({
        id: EXISTING_ID,
        name: "Inicial",
        description: "Descricao inicial valida para o agregado.",
        prompt: "Prompt inicial com marcadores {{name}} valido.",
        userId: USER_ID,
      }),
    );

    await expect(
      useCase.execute(validInput({ id: EXISTING_ID, prompt: "curto" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });
});
