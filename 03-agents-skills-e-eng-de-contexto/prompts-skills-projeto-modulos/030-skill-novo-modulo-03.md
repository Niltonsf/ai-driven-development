@.agents/skills/config-new-module/SKILL.md

Destino: apps/backend/src/modules/<nome-do-modulo>. Eu quero que você extenda a capacidade dessa skill que foi referenciada pelo arquivo skill.md.

Ela deve continuar fazendo exatamente tudo que ela está fazendo, que é criar um módulo de negócio dentro da pasta modules no raiz do projeto de uma forma determinística.

E eu quero que você expanda a capacidade dessa skill para criar um módulo dentro da pasta de destino apontada usando o módulo de criação do NextJS. E criando também um controller padrão para aquele módulo com uma função get retornando uma mensagem geral.

Então é para criar um novo módulo no Nest, registrar esse módulo dentro do módulo principal da aplicação, que é o app module, e você criar um endpoint na API daquele módulo e que de tal forma que retorne a algo padrão.

Não precisa criar testes nesse módulo, apenas a definição do módulo e o controller dentro da minha aplicação NestJS.

Não mudar absolutamente nada do que já foi feito, simplesmente criar uma nova capacidade, um novo módulo dentro do backend meu projeto.