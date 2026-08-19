# Escopo

A partir de uma pasta local com um template estilo admin implementado em HTML, CSS e JS, deve ser criado uma skill que tem como objetivo extrair e recriar a estrutura do menu de navegação para componentes React em uma aplicação Next.JS. Dentro da aplicação Next.JS deve ser criada a pasta do template em `src/shared/template/admin` com a sugestão (usar a melhor estrutura para o template) dos seguintes componentes:

- menu.component.tsx
- menu-section.component.tsx
- menu-item.component.tsx
- menu-group.component.tsx
- menu-divider.component.tsx

O objetivo é recriar apenas a estrutura do menu com todos os seus componentes e com todas as variações de responsividade do menu devem ser implementadas.

Lista de atividades da skill com as seguintes informações:

- [menu] detectar e replicar os tipos de menu (completo, mini, mobile) suportados pelo template
- [menu] replicar perfeitamente o menu em todos os formatos relacionados a responsividade
- [menu] replicar o padrão de item selecionado usando o mesmo padrão de cores do template original
- [menu] replicar o padrão dos itens de menu com labels, ícones, padrões de cores e etc
- [menu] replicar os espaçamentos na área do menu
- [menu] implementar scroll na área do menu conforme o template original
- [menu] replicar os itens de menu conforme estão no template e criar rotas de exemplo para cada item com conteúdo dentro de apenas uma `div` dentro da pasta `src/app/(private)/(examples)`

# Não escopo

- não deve ser criado nenhum componente fora de `src/shared/template/admin`
- não deve ser criado nenhum componente extra, apenas os componentes de menu/navegação.

# Objetivo

Gerar uma skill chamada `design-adm-template-navigation` para criar a estrutura básica do menu de navegação do template. A ideia é recriar perfeitamente, nos mínimos detalhes, apenas o menu do template e com as mudanças de posicionamento dos elementos por conta da responsividade já implementadas.
