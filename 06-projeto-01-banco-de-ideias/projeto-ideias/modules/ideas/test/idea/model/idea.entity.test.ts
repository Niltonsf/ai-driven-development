import { DomainError, ValidationException } from "@ideias/shared";
import { Idea, IdeaState } from "../../../src/idea/model/idea.entity";
import { Resource } from "../../../src/idea/model/resource.entity";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const IDEA_TYPE_ID = "33333333-3333-4333-8333-333333333333";

function buildProps(overrides: Partial<IdeaState> = {}): IdeaState {
  return {
    name: "App de Receitas",
    description: "Aplicativo para organizar receitas culinarias.",
    objective: "Ajudar pessoas a cozinhar melhor em casa.",
    ideaTypeId: IDEA_TYPE_ID,
    userId: USER_ID,
    ...overrides,
  };
}

function buildResource(overrides: Partial<{ id: string; position: number }> = {}) {
  return new Resource({
    id: overrides.id,
    type: "text",
    content: "Conteudo de contexto valido para o recurso da ideia.",
    position: overrides.position ?? 0,
  });
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("Idea entity", () => {
  it("expõe getters dos campos", () => {
    const entity = new Idea(buildProps());

    expect(entity.name).toBe("App de Receitas");
    expect(entity.description).toContain("receitas");
    expect(entity.objective).toContain("cozinhar");
    expect(entity.ideaTypeId).toBe(IDEA_TYPE_ID);
    expect(entity.userId).toBe(USER_ID);
    expect(entity.resources).toEqual([]);
  });

  it("inicializa resources como lista vazia quando ausente", () => {
    const entity = new Idea(buildProps({ resources: undefined }));
    expect(entity.resources).toEqual([]);
  });

  it("herda id, createdAt e updatedAt da entidade base", () => {
    const entity = new Idea(buildProps());

    expect(typeof entity.id).toBe("string");
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.deletedAt).toBeNull();
  });

  it("valida com sucesso uma Ideia sem recursos", () => {
    const entity = new Idea(buildProps());
    expect(() => entity.validate()).not.toThrow();
  });

  it("valida com sucesso uma Ideia com recursos válidos", () => {
    const entity = new Idea(
      buildProps({
        resources: [
          buildResource({ position: 0 }),
          buildResource({ position: 1 }),
        ],
      }),
    );
    expect(() => entity.validate()).not.toThrow();
  });

  it("aceita exatamente 20 recursos", () => {
    const resources = Array.from({ length: 20 }, (_, i) =>
      buildResource({ position: i }),
    );
    const entity = new Idea(buildProps({ resources }));
    expect(() => entity.validate()).not.toThrow();
  });

  it("lança idea.resources.too_many com 21 recursos", () => {
    const resources = Array.from({ length: 21 }, (_, i) =>
      buildResource({ position: i }),
    );
    const entity = new Idea(buildProps({ resources }));
    try {
      entity.validate();
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.resources.too_many");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("lança idea.resources.duplicate_id quando há ids repetidos", () => {
    const repeated = "55555555-5555-4555-8555-555555555555";
    const entity = new Idea(
      buildProps({
        resources: [
          buildResource({ id: repeated, position: 0 }),
          buildResource({ id: repeated, position: 1 }),
        ],
      }),
    );
    try {
      entity.validate();
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.resources.duplicate_id");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("propaga a ValidationException de um recurso inválido", () => {
    const invalid = new Resource({
      type: "text",
      content: "",
      position: 0,
    });
    const entity = new Idea(buildProps({ resources: [invalid] }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.content.required");
  });

  it("exige name", () => {
    const entity = new Idea(buildProps({ name: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.name.required");
  });

  it("exige description", () => {
    const entity = new Idea(buildProps({ description: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.description.required");
  });

  it("exige objective", () => {
    const entity = new Idea(buildProps({ objective: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.objective.required");
  });

  it("rejeita ideaTypeId fora do padrão uuid", () => {
    const entity = new Idea(buildProps({ ideaTypeId: "nao-uuid" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea.ideaTypeId."))).toBe(true);
  });

  it("rejeita userId fora do padrão uuid", () => {
    const entity = new Idea(buildProps({ userId: "nao-uuid" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea.userId."))).toBe(true);
  });

  it("clone preserva id e aplica nova coleção de recursos", () => {
    const entity = new Idea(buildProps());
    const clone = entity.clone({ resources: [buildResource()] });

    expect(clone.id).toBe(entity.id);
    expect(clone.resources).toHaveLength(1);
    expect(entity.resources).toHaveLength(0);
  });
});
