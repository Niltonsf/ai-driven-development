import { DomainError, ValidationException } from "@ideias/shared";
import { Idea } from "../../../src/idea/model";
import { FakeIdeaRepository } from "../../../src/idea/provider";
import { SaveIdea } from "../../../src/idea/usecase";
import { IdeaType } from "../../../src/idea-type/model";
import { FakeIdeaTypeRepository } from "../../../src/idea-type/provider";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const IDEA_TYPE_ID = "33333333-3333-4333-8333-333333333333";
const EXISTING_ID = "44444444-4444-4444-8444-444444444444";

function buildIdeaType(ownerId: string): IdeaType {
  return new IdeaType({
    id: IDEA_TYPE_ID,
    name: "Produto Digital",
    description: "Tipo de ideia voltada para produtos digitais.",
    prompt: "Avalie {{name}}, {{description}}, {{objective}}.",
    userId: ownerId,
  });
}

function validInput(
  overrides: Partial<Parameters<SaveIdea["execute"]>[0]> = {},
) {
  return {
    name: "App de Receitas",
    description: "Aplicativo para organizar receitas culinarias.",
    objective: "Ajudar pessoas a cozinhar melhor em casa.",
    ideaTypeId: IDEA_TYPE_ID,
    userId: USER_ID,
    ...overrides,
  };
}

function setup(ideaTypeOwner: string | null = USER_ID) {
  const ideaRepo = new FakeIdeaRepository();
  const ideaTypeRepo = new FakeIdeaTypeRepository();
  if (ideaTypeOwner) {
    ideaTypeRepo.create(buildIdeaType(ideaTypeOwner));
  }
  const useCase = new SaveIdea(ideaRepo, ideaTypeRepo);
  return { ideaRepo, ideaTypeRepo, useCase };
}

describe("SaveIdea use case", () => {
  it("cria uma nova Ideia quando o id nao for informado", async () => {
    const { ideaRepo, useCase } = setup();

    await useCase.execute(validInput());

    const page = await ideaRepo.findPage({
      userId: USER_ID,
      page: 1,
      perPage: 10,
    });
    expect(page.total).toBe(1);
    expect(page.items[0].name).toBe("App de Receitas");
  });

  it("cria Ideia quando o id informado nao existir", async () => {
    const { ideaRepo, useCase } = setup();

    await useCase.execute(validInput({ id: EXISTING_ID }));

    const found = await ideaRepo.findById(EXISTING_ID);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(EXISTING_ID);
  });

  it("atualiza Ideia existente do mesmo usuario", async () => {
    const { ideaRepo, useCase } = setup();
    await ideaRepo.create(
      new Idea({
        id: EXISTING_ID,
        name: "Inicial",
        description: "Descricao inicial valida da ideia.",
        objective: "Objetivo inicial valido da ideia.",
        ideaTypeId: IDEA_TYPE_ID,
        userId: USER_ID,
      }),
    );

    await useCase.execute(validInput({ id: EXISTING_ID, name: "Atualizada" }));

    const found = await ideaRepo.findById(EXISTING_ID);
    expect(found!.name).toBe("Atualizada");
  });

  it("lanca 422 quando o ideaTypeId nao existir", async () => {
    const { useCase } = setup(null);

    try {
      await useCase.execute(validInput());
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.ideaType.invalid");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("lanca 422 quando o ideaTypeId pertencer a outro usuario", async () => {
    const { useCase } = setup(OTHER_USER_ID);

    try {
      await useCase.execute(validInput());
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.ideaType.invalid");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("lanca 403 ao atualizar Ideia de outro usuario", async () => {
    const { ideaRepo, useCase } = setup();
    await ideaRepo.create(
      new Idea({
        id: EXISTING_ID,
        name: "De Outro",
        description: "Descricao valida da ideia de outro usuario.",
        objective: "Objetivo valido da ideia de outro usuario.",
        ideaTypeId: IDEA_TYPE_ID,
        userId: OTHER_USER_ID,
      }),
    );

    try {
      await useCase.execute(validInput({ id: EXISTING_ID }));
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.forbidden");
      expect(domain.statusCode).toBe(403);
    }
  });

  it("falha quando name for invalido", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute(validInput({ name: "" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("falha quando description for invalida", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute(validInput({ description: "" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("falha quando objective for invalido", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute(validInput({ objective: "" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("falha quando ideaTypeId for invalido", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute(validInput({ ideaTypeId: "nao-uuid" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("falha quando userId for invalido", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute(validInput({ userId: "nao-uuid" })),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  function resource(
    overrides: Partial<{
      id: string;
      type: string;
      content: string;
      position: number;
    }> = {},
  ) {
    return {
      type: "text",
      content: "Conteudo de contexto valido para o recurso da ideia.",
      position: 0,
      ...overrides,
    };
  }

  it("cria Ideia sem recursos quando resources nao for informado", async () => {
    const { ideaRepo, useCase } = setup();

    await useCase.execute(validInput({ id: EXISTING_ID }));

    const found = await ideaRepo.findById(EXISTING_ID);
    expect(found!.resources).toEqual([]);
  });

  it("cria Ideia com 1 recurso", async () => {
    const { ideaRepo, useCase } = setup();

    await useCase.execute(
      validInput({ id: EXISTING_ID, resources: [resource()] }),
    );

    const found = await ideaRepo.findById(EXISTING_ID);
    expect(found!.resources).toHaveLength(1);
    expect(found!.resources[0].type).toBe("text");
  });

  it("cria Ideia com N recursos preservando a posição", async () => {
    const { ideaRepo, useCase } = setup();

    await useCase.execute(
      validInput({
        id: EXISTING_ID,
        resources: [
          resource({ position: 0, content: "Primeiro recurso de contexto." }),
          resource({ position: 1, content: "Segundo recurso de contexto." }),
          resource({ position: 2, content: "Terceiro recurso de contexto." }),
        ],
      }),
    );

    const found = await ideaRepo.findById(EXISTING_ID);
    expect(found!.resources).toHaveLength(3);
    expect(found!.resources.map((r) => r.position)).toEqual([0, 1, 2]);
  });

  it("reconcilia recursos no update (adiciona, modifica e remove)", async () => {
    const { ideaRepo, useCase } = setup();
    const keptId = "66666666-6666-4666-8666-666666666666";
    const removedId = "77777777-7777-4777-8777-777777777777";

    await useCase.execute(
      validInput({
        id: EXISTING_ID,
        resources: [
          resource({ id: keptId, position: 0, content: "Recurso mantido." }),
          resource({
            id: removedId,
            position: 1,
            content: "Recurso que sera removido.",
          }),
        ],
      }),
    );

    await useCase.execute(
      validInput({
        id: EXISTING_ID,
        resources: [
          resource({
            id: keptId,
            position: 0,
            content: "Recurso mantido e modificado.",
          }),
          resource({ position: 1, content: "Recurso novo adicionado." }),
        ],
      }),
    );

    const found = await ideaRepo.findById(EXISTING_ID);
    expect(found!.resources).toHaveLength(2);
    const kept = found!.resources.find((r) => r.id === keptId);
    expect(kept!.content).toBe("Recurso mantido e modificado.");
    expect(found!.resources.some((r) => r.id === removedId)).toBe(false);
  });

  it("lança 422 idea.resource.type.unsupported para type fora do union", async () => {
    const { useCase } = setup();

    try {
      await useCase.execute(
        validInput({
          id: EXISTING_ID,
          resources: [resource({ type: "image" })],
        }),
      );
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.resource.type.unsupported");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("propaga idea.resource.content.required quando o conteúdo é vazio", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute(
        validInput({
          id: EXISTING_ID,
          resources: [resource({ content: "" })],
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("propaga idea.resource.type.required quando o type é vazio", async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute(
        validInput({
          id: EXISTING_ID,
          resources: [resource({ type: "" })],
        }),
      ),
    ).rejects.toBeInstanceOf(ValidationException);
  });

  it("lança 422 idea.resources.too_many com 21 recursos", async () => {
    const { useCase } = setup();
    const resources = Array.from({ length: 21 }, (_, i) =>
      resource({ position: i }),
    );

    try {
      await useCase.execute(validInput({ id: EXISTING_ID, resources }));
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.resources.too_many");
      expect(domain.statusCode).toBe(422);
    }
  });
});
