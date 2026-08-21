import { DomainError, ValidationException } from "@ideias/shared";
import {
  Processing,
  ProcessingIteration,
  ProcessingState,
} from "../../../src/processing/model";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const IDEA_ID = "22222222-2222-4222-8222-222222222222";
const IDEA_TYPE_ID = "33333333-3333-4333-8333-333333333333";

function iteration(position = 0): ProcessingIteration {
  return new ProcessingIteration({
    refinement: position === 0 ? null : `refino ${position}`,
    result: "Resultado valido.",
    position,
  });
}

function build(overrides: Partial<ProcessingState> = {}): Processing {
  return new Processing({
    userId: USER_ID,
    ideaId: IDEA_ID,
    ideaName: "App de Receitas",
    ideaDescription: "Organiza receitas culinarias do usuario.",
    ideaObjective: "Ajudar pessoas a cozinhar melhor em casa.",
    ideaTypeId: IDEA_TYPE_ID,
    ideaTypeName: "Produto Digital",
    promptTemplate: "Avalie {{name}}.",
    iterations: [iteration(0)],
    ...overrides,
  });
}

describe("Processing entity", () => {
  it("valida um agregado correto com 1 iteracao", () => {
    const processing = build();
    expect(() => processing.validate()).not.toThrow();
    expect(processing.userId).toBe(USER_ID);
    expect(processing.ideaId).toBe(IDEA_ID);
    expect(processing.ideaTypeId).toBe(IDEA_TYPE_ID);
    expect(processing.ideaTypeName).toBe("Produto Digital");
    expect(processing.promptTemplate).toBe("Avalie {{name}}.");
    expect(processing.resources).toEqual([]);
    expect(processing.iterations).toHaveLength(1);
  });

  it("aplica defaults [] para resources e iterations ausentes", () => {
    const processing = new Processing({
      userId: USER_ID,
      ideaId: IDEA_ID,
      ideaName: "App de Receitas",
      ideaDescription: "Organiza receitas culinarias do usuario.",
      ideaObjective: "Ajudar pessoas a cozinhar melhor em casa.",
      ideaTypeId: IDEA_TYPE_ID,
      ideaTypeName: "Produto Digital",
      promptTemplate: "Avalie {{name}}.",
    });
    expect(processing.resources).toEqual([]);
    expect(processing.iterations).toEqual([]);
  });

  it("lanca 422 processing.iterations.too_many com 51 iteracoes", () => {
    const processing = build({
      iterations: Array.from({ length: 51 }, (_, i) => iteration(i)),
    });
    try {
      processing.validate();
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.iterations.too_many");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("lanca 422 processing.iterations.required sem iteracoes", () => {
    const processing = build({ iterations: [] });
    try {
      processing.validate();
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("processing.iterations.required");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("falha quando ideaName e muito curto", () => {
    expect(() => build({ ideaName: "ab" }).validate()).toThrow(
      ValidationException,
    );
  });

  it("falha quando userId nao e uuid", () => {
    expect(() => build({ userId: "nao-uuid" }).validate()).toThrow(
      ValidationException,
    );
  });

  it("falha quando promptTemplate e muito curto", () => {
    expect(() => build({ promptTemplate: "curto" }).validate()).toThrow(
      ValidationException,
    );
  });

  it("valida cada ProcessingResource do snapshot", () => {
    expect(() =>
      build({
        resources: [{ type: "text", content: "ok", position: 0 }],
      }).validate(),
    ).not.toThrow();

    expect(() =>
      build({
        resources: [
          { type: "image" as never, content: "x", position: 0 },
        ],
      }).validate(),
    ).toThrow(ValidationException);

    expect(() =>
      build({
        resources: [{ type: "text", content: "", position: 0 }],
      }).validate(),
    ).toThrow(ValidationException);

    expect(() =>
      build({
        resources: [{ type: "text", content: "ok", position: -1 }],
      }).validate(),
    ).toThrow(ValidationException);
  });

  it("delega validacao para cada iteracao", () => {
    const processing = build({
      iterations: [
        new ProcessingIteration({
          refinement: null,
          result: "",
          position: 0,
        }),
      ],
    });
    expect(() => processing.validate()).toThrow(ValidationException);
  });
});
