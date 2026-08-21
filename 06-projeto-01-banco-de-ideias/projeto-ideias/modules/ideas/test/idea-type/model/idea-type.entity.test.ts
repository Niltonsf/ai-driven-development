import { ValidationException } from "@ideias/shared";
import {
  IdeaType,
  IdeaTypeState,
} from "../../../src/idea-type/model/idea-type.entity";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function buildProps(overrides: Partial<IdeaTypeState> = {}): IdeaTypeState {
  return {
    name: "Produto Digital",
    description: "Tipo de ideia voltada para produtos digitais SaaS.",
    prompt:
      "Avalie a ideia {{name}} considerando {{description}}, {{objective}} e {{resources}}.",
    userId: USER_ID,
    ...overrides,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("IdeaType entity", () => {
  it("expõe getters dos campos", () => {
    const entity = new IdeaType(buildProps());

    expect(entity.name).toBe("Produto Digital");
    expect(entity.description).toContain("SaaS");
    expect(entity.prompt).toContain("{{name}}");
    expect(entity.userId).toBe(USER_ID);
  });

  it("herda id, createdAt e updatedAt da entidade base", () => {
    const entity = new IdeaType(buildProps());

    expect(typeof entity.id).toBe("string");
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.deletedAt).toBeNull();
  });

  it("clone preserva id e createdAt e atualiza updatedAt", async () => {
    const entity = new IdeaType(buildProps());
    await new Promise((resolve) => setTimeout(resolve, 5));
    const clone = entity.clone({ name: "Produto Físico" });

    expect(clone.id).toBe(entity.id);
    expect(clone.createdAt.getTime()).toBe(entity.createdAt.getTime());
    expect(clone.updatedAt.getTime()).toBeGreaterThanOrEqual(
      entity.updatedAt.getTime(),
    );
    expect(clone.name).toBe("Produto Físico");
  });

  it("não dispara validação no construtor (lazy validation)", () => {
    expect(() => new IdeaType(buildProps({ name: "" }))).not.toThrow();
  });

  it("valida com sucesso uma entidade válida", () => {
    const entity = new IdeaType(buildProps());
    expect(() => entity.validate()).not.toThrow();
  });

  it("exige name", () => {
    const entity = new IdeaType(buildProps({ name: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea-type.name.required");
  });

  it("rejeita name muito curto", () => {
    const entity = new IdeaType(buildProps({ name: "ab" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.name."))).toBe(true);
  });

  it("rejeita name muito longo", () => {
    const entity = new IdeaType(buildProps({ name: "A".repeat(121) }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.name."))).toBe(true);
  });

  it("exige description", () => {
    const entity = new IdeaType(buildProps({ description: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea-type.description.required");
  });

  it("rejeita description muito curta", () => {
    const entity = new IdeaType(buildProps({ description: "curta" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.description."))).toBe(
      true,
    );
  });

  it("rejeita description muito longa", () => {
    const entity = new IdeaType(buildProps({ description: "A".repeat(501) }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.description."))).toBe(
      true,
    );
  });

  it("exige prompt", () => {
    const entity = new IdeaType(buildProps({ prompt: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea-type.prompt.required");
  });

  it("rejeita prompt muito curto", () => {
    const entity = new IdeaType(buildProps({ prompt: "muito curto" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.prompt."))).toBe(true);
  });

  it("rejeita prompt muito longo", () => {
    const entity = new IdeaType(buildProps({ prompt: "A".repeat(8001) }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.prompt."))).toBe(true);
  });

  it("exige userId", () => {
    const entity = new IdeaType(buildProps({ userId: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea-type.userId.required");
  });

  it("rejeita userId fora do padrão uuid", () => {
    const entity = new IdeaType(buildProps({ userId: "nao-uuid" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages.some((m) => m.startsWith("idea-type.userId."))).toBe(true);
  });
});
