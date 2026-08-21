import { ValidationException } from "@ideias/shared";
import { ProcessingIteration } from "../../../src/processing/model";

describe("ProcessingIteration entity", () => {
  it("valida a primeira iteracao (refinement null)", () => {
    const iteration = new ProcessingIteration({
      refinement: null,
      result: "Resultado valido.",
      position: 0,
    });

    expect(() => iteration.validate()).not.toThrow();
    expect(iteration.refinement).toBeNull();
    expect(iteration.result).toBe("Resultado valido.");
    expect(iteration.position).toBe(0);
  });

  it("valida iteracao com refinement valido", () => {
    const iteration = new ProcessingIteration({
      refinement: "Deixe mais formal",
      result: "Resultado valido.",
      position: 1,
    });

    expect(() => iteration.validate()).not.toThrow();
    expect(iteration.refinement).toBe("Deixe mais formal");
  });

  it("falha quando refinement tem menos de 3 caracteres", () => {
    const iteration = new ProcessingIteration({
      refinement: "ab",
      result: "Resultado valido.",
      position: 1,
    });

    expect(() => iteration.validate()).toThrow(ValidationException);
  });

  it("falha quando refinement excede 2000 caracteres", () => {
    const iteration = new ProcessingIteration({
      refinement: "a".repeat(2001),
      result: "Resultado valido.",
      position: 1,
    });

    expect(() => iteration.validate()).toThrow(ValidationException);
  });

  it("falha quando result e vazio", () => {
    const iteration = new ProcessingIteration({
      refinement: null,
      result: "",
      position: 0,
    });

    expect(() => iteration.validate()).toThrow(ValidationException);
  });

  it("falha quando position e negativa ou nao inteira", () => {
    expect(() =>
      new ProcessingIteration({
        refinement: null,
        result: "ok",
        position: -1,
      }).validate(),
    ).toThrow(ValidationException);

    expect(() =>
      new ProcessingIteration({
        refinement: null,
        result: "ok",
        position: 1.5,
      }).validate(),
    ).toThrow(ValidationException);
  });
});
