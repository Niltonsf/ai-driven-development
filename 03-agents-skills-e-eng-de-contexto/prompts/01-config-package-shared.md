Crie uma skill chamada `config-package-shared` dentro de `.agents/skills/config-package-shared` para reconstruir de forma determinística o pacote `packages/shared` deste monorepo Turbo com npm workspaces.

No `SKILL.md`, defina:

- `name`: `config-package-shared`
- `description`: `Reconstrói o pacote compartilhado base da aplicação, concentrando contratos reutilizáveis, classes base, erros de domínio, casos de uso e validações consumidas pelo backend, frontend e módulos de negócio.`

Regras da implementação:

1. Use o `packages/shared` atual como fonte da verdade.
2. Copie para dentro da própria pasta da skill todos os arquivos canônicos necessários para recriar esse pacote exatamente do zero, preservando estrutura e conteúdo.
3. Toda a base determinística da reconstrução deve ficar fisicamente dentro de `.agents/skills/config-package-shared/`. A skill não pode depender de arquivos, templates, scripts ou pastas externas para recriar o pacote.
4. Organize os arquivos internos da skill da forma que fizer mais sentido, desde que tudo permaneça dentro da própria skill e que, ao copiar a pasta `.agents/skills/config-package-shared`, todo o conteúdo necessário vá junto.
5. Reconstrua exatamente `packages/shared` com `package.json`, `tsconfig.json`, `jest.config.ts`, `src/**` e `test/**`, incluindo toda a base de `db`, `error`, `model`, `usecase` e `validation`.
6. Não inclua artefatos gerados ou temporários, como `dist`, `coverage`, `.turbo` e `node_modules`.
7. No primeiro momento, recrie o pacote com um namespace temporário e neutro, por exemplo `"@temp/shared"`, para que a skill não carregue namespace fixo de nenhum projeto específico.
8. Depois que `packages/shared` estiver materializado, descubra dinamicamente o namespace real do monorepo atual a partir do contexto do projeto, priorizando a leitura dos nomes definidos em `package.json` da raiz, de `apps/*`, `modules/*` e `packages/*`.
9. Extraia apenas o scope do workspace atual, por exemplo `@empresa`, sem fixar nenhuma referência a `@poupig` ou a qualquer outro namespace dentro da skill.
10. Em seguida, substitua o namespace temporário do pacote recriado pelo namespace real detectado, atualizando o `name` do `packages/shared/package.json` para o formato `@<scope>/shared`.
11. Só depois dessa normalização do namespace, adicione ou normalize a dependência `"@<scope>/shared": "*"` em todos os `package.json` existentes dentro de `apps/*` e `modules/*` que dependam da base compartilhada, sem usar `file:` nem links locais.
12. A skill deve ser robusta para múltiplos projetos diferentes: ela não pode pressupor que o namespace do workspace será `@poupig`.
13. Depois disso, rode `npm i` na raiz do monorepo para instalar as dependências e resolver os vínculos internos do workspace.
14. Faça uma validação objetiva no final, de preferência com `npx turbo run build --filter=@<scope>/shared`, e reporte o que foi criado e atualizado.
15. A skill deve ser enxuta, didática e determinística: ela não deve inventar os arquivos do pacote em tempo de execução; ela deve carregar dentro dela a cópia fiel do projeto shared e apenas materializá-la no lugar certo.
16. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- Não use nenhuma pasta externa compartilhada.
- Não dependa do estado futuro do repositório para reconstruir `packages/shared`.
- Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/config-package-shared`.
- A skill não deve conter namespace de cliente, empresa ou projeto específico embutido em seus arquivos-base.
- O namespace temporário existe apenas para viabilizar a reconstrução inicial e deve ser substituído antes da configuração das dependências internas do workspace.
