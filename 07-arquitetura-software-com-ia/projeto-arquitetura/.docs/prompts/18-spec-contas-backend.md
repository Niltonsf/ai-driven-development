/opsx:propose

Utilize o arquivo .docs/sequencia.md especificamente a parte da camada de backend e utilize o código do cadastro contas que está em apps/backend/src/modules/contas para fazer a engenharia reversa em uma especificação que é capaz de reconstruir o módulo de backend de contas. A ideia é usar em um segundo momento essa spec como referência para outros cadastros.

Agora quero apenas uma spec específica para a camada de backend.

Evitar adicionar muitos detalhes técnico dentro da spec, quero que os passos sejam detalhados, mas como seria uma spec feita a mão por um DEV experiente.

---

Alterar openspec/changes/spec-modulo-backend-conta/tasks.md para chamar sempre que possível uma skill que está na pasta .claude/skills. Os principais padrões de projeto utilizados na aplicação estão descritos de forma detalhada nas skills do projeto que devem ser usadas como base para os passos definidos nas tarefas.

Simplificar os passos e usar as skills armazenadas na pasta .claude/skills.
