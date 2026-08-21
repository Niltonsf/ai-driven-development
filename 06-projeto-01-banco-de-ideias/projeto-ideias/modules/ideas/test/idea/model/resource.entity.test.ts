import { ValidationException } from "@ideias/shared";
import {
  RESOURCE_TYPES,
  Resource,
  ResourceState,
} from "../../../src/idea/model/resource.entity";

function buildProps(overrides: Partial<ResourceState> = {}): ResourceState {
  return {
    type: "text",
    content: "Conteudo de contexto valido para o recurso da ideia.",
    position: 0,
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

describe("Resource entity", () => {
  it("expõe getters dos campos", () => {
    const entity = new Resource(buildProps());

    expect(entity.type).toBe("text");
    expect(entity.content).toContain("contexto");
    expect(entity.position).toBe(0);
  });

  it("herda id, createdAt e updatedAt da entidade base", () => {
    const entity = new Resource(buildProps());

    expect(typeof entity.id).toBe("string");
    expect(entity.createdAt).toBeInstanceOf(Date);
    expect(entity.updatedAt).toBeInstanceOf(Date);
    expect(entity.deletedAt).toBeNull();
  });

  it("expõe a lista de tipos suportados (apenas text no MVP)", () => {
    expect([...RESOURCE_TYPES]).toEqual(["text"]);
  });

  it("não dispara validação no construtor (lazy validation)", () => {
    expect(
      () => new Resource(buildProps({ content: "" })),
    ).not.toThrow();
  });

  it("valida com sucesso um recurso válido", () => {
    const entity = new Resource(buildProps());
    expect(() => entity.validate()).not.toThrow();
  });

  it("exige type", () => {
    const entity = new Resource(
      buildProps({ type: "" as unknown as "text" }),
    );
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.type.required");
  });

  it("rejeita type fora do union suportado", () => {
    const entity = new Resource(
      buildProps({ type: "image" as unknown as "text" }),
    );
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.type.in");
  });

  it("exige content", () => {
    const entity = new Resource(buildProps({ content: "" }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.content.required");
  });

  it("rejeita content acima do limite máximo", () => {
    const entity = new Resource(
      buildProps({ content: "A".repeat(20001) }),
    );
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.content.max.length");
  });

  it("aceita content no limite mínimo de 1 caractere", () => {
    const entity = new Resource(buildProps({ content: "x" }));
    expect(() => entity.validate()).not.toThrow();
  });

  it("exige position", () => {
    const entity = new Resource(
      buildProps({ position: undefined as unknown as number }),
    );
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.position.required");
  });

  it("rejeita position negativa", () => {
    const entity = new Resource(buildProps({ position: -1 }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.position.min.value");
  });

  it("rejeita position não inteira", () => {
    const entity = new Resource(buildProps({ position: 1.5 }));
    const messages = getValidationMessages(() => entity.validate());
    expect(messages).toContain("idea.resource.position.integer");
  });
});
