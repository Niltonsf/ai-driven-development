import {
  ProcessingIteration,
  composeRefinementUserMessage,
  resolveSystemPrompt,
} from "../../../src/processing/model";

describe("resolveSystemPrompt", () => {
  it("substitui os 4 marcadores conhecidos", () => {
    const result = resolveSystemPrompt({
      ideaName: "App de Receitas",
      ideaDescription: "Organiza receitas culinarias.",
      ideaObjective: "Cozinhar melhor em casa.",
      promptTemplate:
        "Nome: {{name}} | Desc: {{description}} | Obj: {{objective}} | Rec: {{resources}}",
      resources: [
        { type: "text", content: "Primeiro recurso", position: 0 },
        { type: "text", content: "Segundo recurso", position: 1 },
      ],
    });

    expect(result).toBe(
      "Nome: App de Receitas | Desc: Organiza receitas culinarias. | Obj: Cozinhar melhor em casa. | Rec: 1. Primeiro recurso\n2. Segundo recurso",
    );
  });

  it("renderiza {{resources}} vazio quando nao ha recursos", () => {
    const result = resolveSystemPrompt({
      ideaName: "Nome",
      ideaDescription: "Descricao",
      ideaObjective: "Objetivo",
      promptTemplate: "Recursos:[{{resources}}]",
      resources: [],
    });

    expect(result).toBe("Recursos:[]");
  });

  it("mantem marcador desconhecido literal", () => {
    const result = resolveSystemPrompt({
      ideaName: "Nome",
      ideaDescription: "Descricao",
      ideaObjective: "Objetivo",
      promptTemplate: "{{name}} {{unknown}} {{foo}}",
      resources: [],
    });

    expect(result).toBe("Nome {{unknown}} {{foo}}");
  });

  it("numera e separa recursos por newline", () => {
    const result = resolveSystemPrompt({
      ideaName: "n",
      ideaDescription: "d",
      ideaObjective: "o",
      promptTemplate: "{{resources}}",
      resources: [
        { type: "text", content: "A", position: 0 },
        { type: "text", content: "B", position: 1 },
        { type: "text", content: "C", position: 2 },
      ],
    });

    expect(result).toBe("1. A\n2. B\n3. C");
  });
});

describe("composeRefinementUserMessage", () => {
  function iteration(
    position: number,
    refinement: string | null,
    result: string,
  ): ProcessingIteration {
    return new ProcessingIteration({ position, refinement, result });
  }

  it("monta o historico com primeira geracao e refinamentos", () => {
    const message = composeRefinementUserMessage(
      [
        iteration(0, null, "Resultado A"),
        iteration(1, "Deixe mais formal", "Resultado B"),
      ],
      "Adicione exemplos",
    );

    expect(message).toBe(
      [
        "Histórico de iterações anteriores:",
        "",
        "[Iteração 1] (primeira geração)",
        "Resultado:",
        '"""',
        "Resultado A",
        '"""',
        "",
        "[Iteração 2] Refinamento aplicado: Deixe mais formal",
        "Resultado:",
        '"""',
        "Resultado B",
        '"""',
        "",
        "Refinamento solicitado agora: Adicione exemplos",
        "Gere um novo resultado aplicando esse refinamento sobre a versão mais recente, preservando o que já estava bom.",
      ].join("\n"),
    );
  });

  it("ordena as iteracoes por position antes de montar o historico", () => {
    const message = composeRefinementUserMessage(
      [
        iteration(1, "segundo", "B"),
        iteration(0, null, "A"),
      ],
      "agora",
    );

    expect(message.indexOf("[Iteração 1] (primeira geração)")).toBeLessThan(
      message.indexOf("[Iteração 2] Refinamento aplicado: segundo"),
    );
  });
});
