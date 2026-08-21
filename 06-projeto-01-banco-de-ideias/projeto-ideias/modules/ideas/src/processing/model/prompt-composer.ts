import { ProcessingIteration } from "./processing-iteration.entity";
import { ProcessingResource } from "./processing-resource";

export interface PromptSnapshot {
  ideaName: string;
  ideaDescription: string;
  ideaObjective: string;
  promptTemplate: string;
  resources: ProcessingResource[];
}

// Resolve o systemPrompt substituindo os marcadores conhecidos no template.
// - {{name}}, {{description}}, {{objective}}: valores do snapshot.
// - {{resources}}: lista numerada (1. <content>) separada por newlines;
//   string vazia quando nao ha recursos.
// - Marcadores desconhecidos permanecem literais (nao sao tocados).
export function resolveSystemPrompt(snapshot: PromptSnapshot): string {
  const resourcesText = snapshot.resources
    .map((resource, index) => `${index + 1}. ${resource.content}`)
    .join("\n");

  return snapshot.promptTemplate
    .split("{{name}}")
    .join(snapshot.ideaName)
    .split("{{description}}")
    .join(snapshot.ideaDescription)
    .split("{{objective}}")
    .join(snapshot.ideaObjective)
    .split("{{resources}}")
    .join(resourcesText);
}

// Monta o userMessage de uma iteracao de refinamento incluindo todo o
// historico anterior, para o modelo entender a evolucao das geracoes.
export function composeRefinementUserMessage(
  previousIterations: ProcessingIteration[],
  currentRefinement: string,
): string {
  const lines: string[] = ["Histórico de iterações anteriores:"];

  previousIterations
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((iteration, index) => {
      const header =
        iteration.refinement === null
          ? `[Iteração ${index + 1}] (primeira geração)`
          : `[Iteração ${index + 1}] Refinamento aplicado: ${iteration.refinement}`;
      lines.push("");
      lines.push(header);
      lines.push("Resultado:");
      lines.push('"""');
      lines.push(iteration.result);
      lines.push('"""');
    });

  lines.push("");
  lines.push(`Refinamento solicitado agora: ${currentRefinement}`);
  lines.push(
    "Gere um novo resultado aplicando esse refinamento sobre a versão mais recente, preservando o que já estava bom.",
  );

  return lines.join("\n");
}
