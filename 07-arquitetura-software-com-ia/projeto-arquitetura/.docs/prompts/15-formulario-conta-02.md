## Contexto

O componente de formulário de contas já está **pronto e funcional** para o fluxo de **criação** de conta. Agora preciso habilitar o fluxo de **edição** reutilizando esse mesmo formulário.

## Objetivo

Implementar o fluxo de edição de conta a partir da tabela de contas, seguindo o mesmo padrão de CRUD já adotado em `apps/web` (api-client compartilhado, hook + client em `data/`, sem Context, componente apresentacional).

## Tarefas

1. **Habilitar o botão de edição** na linha/ação correspondente da tabela de contas (atualmente desabilitado).
2. **Passar a conta selecionada** (ou seu identificador) para o formulário ao acionar a edição.
3. **Carregar/pré-preencher** os dados da conta selecionada no formulário existente, reaproveitando-o sem duplicar lógica de criação.
4. **Diferenciar criação x edição** no submit: criação cria um novo registro; edição atualiza o registro existente pelo id.
5. **Atualizar a tabela** após a edição ser concluída com sucesso.

## Restrições

- Reutilizar o formulário atual — **não** criar um componente novo nem quebrar o fluxo de criação já funcional.
- Seguir o padrão de módulos web do projeto (hook de dados, client e schema em `data/`).
- Manter validação e tratamento de erro consistentes com o fluxo de criação.
