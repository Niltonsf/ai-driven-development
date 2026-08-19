# Escopo

A partir de uma pasta local com um template estilo admin implementado em HTML, CSS e JS, deve ser criado uma skill que tem como objetivo extrair e recriar a estrutura do template para componentes React em uma aplicação Next.JS. Dentro da aplicação Next.JS deve ser criada a pasta do template em `src/shared/template/admin` com a sugestão dos seguintes componentes:

- admin-shell.component.tsx
- menu.component.tsx
- top-bar.component.tsx (se existir)
- footer.component.tsx (se existir)
- logo.component.tsx
- ???

O objetivo é recriar apenas a estrutura do template sem nenhum componente, mas com todas as variações de responsividade das áreas do template devem ser implementadas.

Lista de atividades da skill com as seguintes informações:

- [tema] detectar qual é o tema padrão (light ou dark) e fixar o tema padrão como escolha inicial. Não implementar mais de um tema ao mesmo tempo e na dúvida usar o tema claro.
- [tema] detectar qual biblioteca de ícones é usada e instalar a biblioteca de ícones no projeto.
- [estrutura] replicar as áreas existentes no template (header, footer, aside, section, div) em componentes diferentes.
- [estrutura] para cada componente detectado, implementar exatamente todos os tamanhos e espaçamentos usados no template.
- [estrutura] implementar em `admin-shell.component.tsx` a disposição das grandes áreas do template, onde cada componente fica posicionado e como os componentes interagem entre si em cenários de responsividade e abertura e fechamento do menu.
- [estrutura] replicar (se existir) o botão de toggle de menu na sua exata posição e usar o ícone (se existir) mais próximo do template original.
- [estrutura] replicar o funcionamento botão de toggle de menu para expandir e colapsar o menu entre os modos (caso exista essa funcionalidade). Criar um hook/context para gerenciar o estado do menu.
- [logo] replicar o componente de logo e posicionar exatamente no mesmo lugar no template original. Implementar as variações do logo em cenários de responsividade com as possíveis mudanças de tamanho e posicionamento. Replicar o texto e ícone (caso tenha).
- [menu] replicar perfeitamente a área do menu (sem o conteúdo) e garantir que o tamanho, tipo de bordas, cores de fonte, cores de background seja replicado para o componente `menu.component.tsx`.
- [menu] replicar o botão de toggle (quando existir) e implementar o estado do menu em todos os cenários (completo, mini, mobile).
- todas as áreas devem permanecer vazias com exceção do botão de toggle do menu e o logo.
- [conteudo] replicar os espaços (padding, margin) da área do conteúdo exatamente como está no template
- [app] criar um grupo de rotas em `src/app/(private)` aplicando o template em `src/app/(private)/layout.tsx` e criando uma página vazia em `src/app/(private)/dashboard/page.tsx` apenas com uma `div` e o texto "Conteúdo".

# Não escopo

- não deve ser criado nenhum componente fora de `src/shared/template/admin`
- não deve ser criado o componente de menu da aplicação, apenas a área onde o menu ficará
- não deve ser criado nenhum componente extra, apenas os componentes de estrutura do template.

# Objetivo

Gerar uma skill chamada `ui-template-admin-shell-to-nextjs` para criar a estrutura básica do template. A ideia é recriar apenas o esqueleto do template sem nenhum componente interno, mas com as mudanças de posicionamento dos elementos por conta da responsividade já implementadas e o botão de toggle de menu com o seu comportamento já implementado.
