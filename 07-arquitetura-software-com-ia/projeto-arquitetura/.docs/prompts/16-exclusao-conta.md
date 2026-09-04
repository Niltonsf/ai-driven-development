> **Objetivo:** Implementar o fluxo completo de exclusão de conta no módulo `apps/web/src/modules/contas`, conectando o botão de lixeira (hoje `disabled`) ao endpoint `DELETE /contas/:id` por meio de uma confirmação do usuário.
>
> **Padrão a seguir:** Respeite a arquitetura em camadas já usada no módulo (referência `project_web_crud_pattern`): transporte só em `data/contas.client.ts`, estado/orquestração em hook de `data/`, e o componente em `components/` permanece de apresentação ("burro"). Não chame `fetch`/`apiRequest` direto no componente nem crie Context.
>
> **Tarefas:**
>
> 1. **Client** (`data/contas.client.ts`): adicionar `excluirConta(id, signal?)` que chama `apiRequest<void>('/contas/${id}', { method: 'DELETE', signal })`. O backend responde 204 sem corpo (retorno `void`).
> 2. **Hook de exclusão** (`data/use-excluir-conta.hook.ts`, novo): encapsular o estado da mutação — `isExcluindo`, `error` — e expor uma função `excluir(id)` que chama o client. Não acoplar a lista a esse estado.
> 3. **Tabela** (`components/contas.component.tsx`):
>    - Remover `disabled` do botão de excluir e adicionar `onClick` que abre o diálogo para a conta selecionada (controle de estado local: qual `conta` está em exclusão + `open`).
>    - Renderizar o `DeleteConfirmationDialog` de `@/shared/components/ui/delete-confirmation-dialog`, passando `open`, `onOpenChange`, `onConfirm`, `itemLabel="Conta"`, `itemValue={conta.name}`, `isConfirming={isExcluindo}` e, se houver, `confirmDisabledMessage` para erro. O componente já exige que o usuário digite a palavra de confirmação (`confirmWord` padrão `"excluir"`).
>    - No `onConfirm`: chamar `excluir(conta.id)`; em caso de sucesso, fechar o diálogo e atualizar a lista via `refetch()` do `useContas`; em caso de erro, manter o diálogo aberto e exibir a mensagem.
> 4. **Estados de borda:** tratar erro da exclusão (mensagem visível ao usuário), evitar duplo clique durante `isExcluindo`, e garantir que a lista reflita a remoção (preferir `refetch()`; considerar voltar de página se a página atual ficar vazia).
>
> **Restrições:** manter os comentários/idioma e o estilo dos arquivos existentes; usar os contratos compartilhados (`@arquitetura/contas`, `@arquitetura/shared`); não alterar o backend (endpoint já existe). Atualizar o comentário do topo de `contas.component.tsx` que diz "excluir ainda não tem comportamento".
>
> Ao final, rode o type-check/lint do app `web` e descreva o que mudou.
