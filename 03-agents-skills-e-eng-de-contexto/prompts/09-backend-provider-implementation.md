Crie uma skill chamada `backend-provider-implementation` dentro de `.agents/skills/backend-provider-implementation` para implementar, no backend NestJS, interfaces de provider definidas nos módulos de negócio dentro de `modules/`, criando classes concretas simples, registrando-as no módulo Nest correspondente e instalando dependências externas quando necessário.

No `SKILL.md`, defina:

- `name`: `backend-provider-implementation`
- `description`: `Implementa no backend NestJS os providers técnicos definidos nos módulos de negócio, criando classes concretas simples, integrando dependências externas quando necessário e registrando essas implementações para uso pelos controllers e casos de uso.`

Objetivo da skill:

- Criar a implementação concreta, no backend, de uma interface de provider definida no domínio.
- Manter a interface original do domínio intacta.
- Permitir implementação simples, direta e fácil de manter.
- Integrar a classe concreta ao módulo Nest correspondente.
- Permitir uso por injeção direta da classe concreta no backend, sem criar símbolos, tokens ou abstrações extras desnecessárias.
- Instalar dependências externas quando a implementação exigir bibliotecas específicas.
- Não inventar arquitetura excessiva para resolver um provider técnico simples.

Referências obrigatórias que a skill deve ler antes de implementar:

1. A interface de provider alvo dentro de `modules/<modulo>/src/**/provider/*.provider.ts`
2. Um exemplo real já existente no projeto, como:
   - `modules/auth/src/user/provider/crypto.provider.ts`
   - `apps/backend/src/modules/auth/bcrypt.crypto.ts`
   - `apps/backend/src/modules/auth/auth.module.ts`
3. O módulo backend correspondente:
   - `apps/backend/src/modules/<modulo>/<modulo>.module.ts`
4. O controller ou ponto de uso no backend, quando isso ajudar a entender como a implementação será consumida

Entradas obrigatórias da skill:

1. A interface de provider que deve ser implementada, informada por:
   - path explícito do arquivo
   - ou nome inequívoco da interface quando houver apenas um alvo claro
2. O nome do módulo, quando isso não puder ser inferido com segurança pelo path.
3. O tipo de provider ou a intenção da implementação, quando isso for necessário para escolher biblioteca, estratégia ou naming.

Entradas opcionais: 4. A biblioteca preferida para a implementação, quando o usuário quiser forçar uma escolha. 5. Restrições de implementação, como:

- evitar dependências extras
- usar biblioteca já instalada
- usar implementação síncrona ou assíncrona
- exigir compatibilidade com uma API específica

Trava obrigatória:

1. A skill só pode executar quando a interface de provider alvo estiver claramente identificada.
2. Se houver ambiguidade sobre qual interface implementar, a skill deve parar e pedir ao usuário que informe exatamente o provider.
3. A skill não pode modificar, reescrever ou expandir a interface original do domínio.
4. A interface em `modules/<modulo>/src/**` deve ser tratada como contrato imutável.

Escopo da skill:

1. Ler a interface alvo e seus tipos relacionados.
2. Inferir o módulo pelo path real do arquivo em `modules/<modulo>/...`.
3. Criar a implementação concreta dentro de:
   - `apps/backend/src/modules/<modulo>/`
4. Atualizar o módulo Nest correspondente para registrar a implementação criada.
5. Instalar dependências externas quando forem necessárias para a implementação.
6. Ajustar consumidores do backend apenas no necessário para permitir injeção direta da classe concreta.

Regras da implementação:

1. A implementação deve ser criada como classe concreta simples e direta.
2. O nome do arquivo deve ser coerente com a responsabilidade técnica do provider.
3. O nome da classe deve ser explícito e orientado à implementação concreta.
   - Exemplo: `BcryptCryptoProvider`
4. A skill deve preferir colocar o arquivo na raiz do módulo backend, salvo quando houver uma convenção local diferente claramente estabelecida.
5. A implementação deve cumprir exatamente o contrato da interface original.
6. A skill não deve adicionar métodos extras não pedidos pela interface, salvo helpers privados estritamente necessários.
7. A skill deve priorizar fácil manutenção, clareza e previsibilidade.
8. A skill não deve criar camadas extras artificiais, factories desnecessárias, símbolos de injeção, adapters supérfluos ou wrappers sem valor prático.
9. No backend, a implementação concreta deve poder ser injetada diretamente no controller ou em outros componentes Nest.
10. O controller pode receber a classe concreta por injeção e passá-la ao caso de uso, sem obrigar o backend a trabalhar com token de interface.
11. A skill deve evitar complexidade de DI desnecessária quando a classe concreta é suficiente.

Regras para dependências externas:

1. A skill deve identificar quando a implementação exige bibliotecas externas.
2. Quando isso ocorrer, ela pode instalar dependências adicionais no workspace correto.
3. A skill deve preferir bibliotecas maduras, simples e compatíveis com o projeto.
4. Se já existir uma biblioteca adequada instalada no projeto, a skill deve preferir reaproveitá-la.
5. Se houver mais de uma opção razoável de biblioteca e o usuário não tiver especificado preferência, a skill deve escolher a opção mais simples e estável.
6. A skill deve relatar claramente quais dependências foram adicionadas e por quê.

Regras de integração com Nest:

1. A skill deve registrar a implementação concreta em:
   - `apps/backend/src/modules/<modulo>/<modulo>.module.ts`
2. A implementação deve entrar em `providers`.
3. Quando fizer sentido, a implementação também pode entrar em `exports`.
4. A skill deve ajustar o consumo no backend para usar a classe concreta diretamente.
5. A skill não deve exigir criação de token simbólico para funcionar, salvo se o projeto já tiver uma convenção explícita e forte nesse sentido.
6. O padrão preferido é:
   - classe concreta registrada no módulo
   - classe concreta injetada diretamente nos controllers ou serviços Nest
   - classe concreta repassada aos casos de uso que dependem da interface do domínio

Regras de adaptação ao contexto:

1. A skill deve ser flexível o suficiente para implementar qualquer provider técnico, por exemplo:
   - criptografia
   - JWT
   - e-mail
   - geração de token
   - relógio/data
   - uuid
   - storage
   - integrações externas simples
2. A skill deve adaptar a implementação ao contrato e ao contexto do projeto, sem impor uma arquitetura rígida.
3. Quando a interface não fornecer informação suficiente para escolher uma estratégia segura, a skill deve pedir esclarecimento em vez de inventar comportamento arriscado.

Regras de testes:

1. Quando a implementação tiver lógica observável relevante, a skill deve criar testes para ela.
2. Quando a implementação depender fortemente de biblioteca externa ou integração, a skill deve ao menos criar testes úteis para o comportamento esperado e relatar limites de cobertura quando houver.
3. Se o projeto já tiver padrão de testes para o backend ou para providers, a skill deve segui-lo.

Determinismo e estrutura da skill:

1. A skill deve ser determinística nos arquivos que cria, no local em que cria e na forma como registra a implementação no módulo Nest.
2. A skill pode incluir few-shots e exemplos internos para diferentes tipos de provider.
3. Esses exemplos devem ficar dentro da própria pasta `.agents/skills/backend-provider-implementation`.
4. Tudo que a skill precisa para funcionar deve estar contido dentro de `.agents/skills/backend-provider-implementation`.
5. Se fizer sentido para completar a skill, crie também `agents/openai.yaml` coerente com o nome e a descrição definidos no `SKILL.md`.

Importante:

- A interface original do provider não deve ser modificada em hipótese nenhuma.
- A implementação concreta deve ficar no backend.
- O backend pode injetar a classe concreta diretamente, sem criar símbolos ou tokens extras desnecessários.
- A skill pode instalar dependências externas quando necessário.
- A implementação deve ser simples, direta e fácil de manter.
- A skill deve focar em cumprir o contrato já definido no domínio, e não em reinventá-lo.
