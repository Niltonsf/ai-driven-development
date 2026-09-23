Revisar os erros em `modules/category` para retornar código de erro como string sem que os erros estejam traduzidos para português ou qualquer outra lingua... Os código de erro serão traduzido no frontend da aplicação via i18n (farei isso em outro momento).

Usar o padrão de mensagens da aplicação. Siga o padrão de nomenclatura de códigos de erro que deve ser em inglês.

---

Revisar os códigos de erro em todo o projeto (backend, camada de negócio/modules/\* e frontend), seguindo o padrão já aplicado em modules/category.

1. Padrão de nomenclatura dos códigos de erro:
   - MAIÚSCULAS
   - Palavras separadas por "\_" (UPPER_SNAKE_CASE)
   - Em inglês
   - Ex.: CATEGORY_NOT_FOUND, UNAUTHORIZED, INVALID_CREDENTIALS

2. Backend e camada de negócio (modules/\*, apps/backend):
   - Nenhuma mensagem de erro traduzida (nem português, nem inglês em texto livre) deve ser retornada pela API.
   - Toda exceção/Result de falha deve devolver apenas o código de erro (string), nunca uma frase traduzida.
   - Percorrer todos os módulos (account, auth, credit-card, category e demais) e controllers, corrigindo qualquer mensagem hardcoded (ex.: "Acesso negado", "Email already in use", "Invalid credentials") para usar o código de erro correspondente.

3. Frontend (apps/frontend):
   - Usar o mecanismo de i18n já existente em apps/frontend/src/shared/i18n (index.ts, messages.en.ts, messages.pt.ts).
   - Para cada código de erro retornado pela API, garantir que exista uma chave de tradução correspondente em messages.pt.ts (padrão) e messages.en.ts.
   - Nenhum código de erro deve aparecer cru na tela para o usuário final; todos devem ter uma entrada de tradução correspondente nos dois idiomas.
   - Adicionar as chaves faltantes seguindo a estrutura/convenção já usada nesses arquivos.

Fazer essa revisão de forma incremental, módulo por módulo, seguindo o mesmo padrão já aplicado em modules/category e apps/backend/src/modules/category/category.controller.ts como referência.
