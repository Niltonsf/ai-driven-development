export const errorMessagesPt = {
  DEFAULT_API_ERROR: 'Ocorreu um erro inesperado na comunicação com o servidor.',
  INVALID_ARRAY: 'O valor deve ser uma lista.',
  INVALID_ITEM: 'Item inválido.',
  INVALID_OBJECT: 'O valor deve ser um objeto.',
  INVALID_VALUE: 'Valor inválido.',
  MAX_ITEMS: 'Máximo de {{max}} itens.',
  MIN_ITEMS: 'Mínimo de {{min}} itens.',
  REQUIRED_FIELD: 'Campo de preenchimento obrigatório.',
  SHELL_CONTEXT_PROVIDER_REQUIRED: 'useShellContext deve ser usado dentro de <ShellProvider>.',
  UNKNOWN_ERROR_CODE: 'Erro desconhecido: {{code}}',
  INTERNAL_SERVER_ERROR: 'Erro interno no servidor. Tente novamente em instantes.',
  'user.name.required': 'O nome é obrigatório.',
  'user.name.min.length': 'O nome precisa ter pelo menos 3 caracteres.',
  'user.name.max.length': 'O nome pode ter no máximo 80 caracteres.',
  'user.name.person.name': 'Informe o nome completo (nome e sobrenome).',
  'user.email.required': 'O e-mail é obrigatório.',
  'user.email.invalid.email': 'Informe um e-mail válido.',
  'user.email.already.exists': 'Este e-mail já está cadastrado.',
  'user.password.required': 'A senha é obrigatória.',
  'user.password.strong.password':
    'A senha precisa ter pelo menos 8 caracteres, com letras maiúsculas, minúsculas, números e símbolos.',
  'user.password.bcrypt.hash': 'Formato de senha inválido.',
  'user.credentials.invalid': 'E-mail ou senha inválidos.',
  'idea-type.name.required': 'O nome do Tipo de Ideia é obrigatório.',
  'idea-type.name.min.length': 'O nome precisa ter pelo menos 3 caracteres.',
  'idea-type.name.max.length': 'O nome pode ter no máximo 120 caracteres.',
  'idea-type.description.required': 'A descrição é obrigatória.',
  'idea-type.description.min.length': 'A descrição precisa ter pelo menos 10 caracteres.',
  'idea-type.description.max.length': 'A descrição pode ter no máximo 500 caracteres.',
  'idea-type.prompt.required': 'O prompt é obrigatório.',
  'idea-type.prompt.min.length': 'O prompt precisa ter pelo menos 20 caracteres.',
  'idea-type.prompt.max.length': 'O prompt pode ter no máximo 8000 caracteres.',
  'idea-type.not_found': 'Tipo de Ideia não encontrado.',
  'idea-type.forbidden': 'Você não tem permissão para acessar este Tipo de Ideia.',
  'idea.name.required': 'O nome da Ideia é obrigatório.',
  'idea.name.min.length': 'O nome precisa ter pelo menos 3 caracteres.',
  'idea.name.max.length': 'O nome pode ter no máximo 120 caracteres.',
  'idea.description.required': 'A descrição é obrigatória.',
  'idea.description.min.length': 'A descrição precisa ter pelo menos 10 caracteres.',
  'idea.description.max.length': 'A descrição pode ter no máximo 2000 caracteres.',
  'idea.objective.required': 'O objetivo é obrigatório.',
  'idea.objective.min.length': 'O objetivo precisa ter pelo menos 10 caracteres.',
  'idea.objective.max.length': 'O objetivo pode ter no máximo 1000 caracteres.',
  'idea.ideaTypeId.required': 'Selecione um Tipo de Ideia.',
  'idea.ideaTypeId.uuid': 'Tipo de Ideia inválido.',
  'idea.userId.required': 'Usuário não identificado.',
  'idea.userId.uuid': 'Usuário inválido.',
  'idea.ideaType.invalid': 'O Tipo de Ideia selecionado não existe ou não pertence a você.',
  'idea.not_found': 'Ideia não encontrada.',
  'idea.forbidden': 'Você não tem permissão para acessar esta Ideia.',
  'idea.resource.type.required': 'O tipo do recurso é obrigatório.',
  'idea.resource.type.in': 'O tipo do recurso é inválido.',
  'idea.resource.type.unsupported':
    'Este tipo de recurso ainda não é suportado. No momento apenas texto é aceito.',
  'idea.resource.content.required': 'O conteúdo do recurso é obrigatório.',
  'idea.resource.content.min.length':
    'O conteúdo do recurso precisa ter pelo menos 1 caractere.',
  'idea.resource.content.max.length':
    'O conteúdo do recurso pode ter no máximo 20000 caracteres.',
  'idea.resource.position.required': 'A posição do recurso é obrigatória.',
  'idea.resource.position.integer':
    'A posição do recurso precisa ser um número inteiro.',
  'idea.resource.position.min.value':
    'A posição do recurso não pode ser negativa.',
  'idea.resources.too_many': 'Uma Ideia pode ter no máximo 20 recursos.',
  'idea.resources.duplicate_id':
    'Há recursos repetidos na lista. Remova as duplicidades.',
  'idea.has_processings':
    'Esta Ideia possui Processamentos. Exclua os Processamentos antes de remover a Ideia.',
  'processing.idea.invalid':
    'A Ideia selecionada não existe ou não pertence a você.',
  'processing.not_found': 'Processamento não encontrado.',
  'processing.iterations.required':
    'Um Processamento precisa ter pelo menos uma iteração.',
  'processing.iterations.too_many':
    'Este Processamento atingiu o limite de 50 iterações.',
  'processing.refinement.required': 'Informe o refinamento.',
  'processing.refinement.min.length':
    'O refinamento precisa ter pelo menos 3 caracteres.',
  'processing.refinement.max.length':
    'O refinamento pode ter no máximo 2000 caracteres.',
  'processing.userId.required': 'Usuário não identificado.',
  'processing.userId.uuid': 'Usuário inválido.',
  'processing.ideaId.required': 'Ideia não identificada.',
  'processing.ideaId.uuid': 'Ideia inválida.',
  'processing.ideaName.required': 'O nome da Ideia é obrigatório.',
  'processing.ideaName.min.length':
    'O nome da Ideia precisa ter pelo menos 3 caracteres.',
  'processing.ideaName.max.length':
    'O nome da Ideia pode ter no máximo 120 caracteres.',
  'processing.ideaDescription.required': 'A descrição da Ideia é obrigatória.',
  'processing.ideaDescription.min.length':
    'A descrição da Ideia precisa ter pelo menos 10 caracteres.',
  'processing.ideaDescription.max.length':
    'A descrição da Ideia pode ter no máximo 2000 caracteres.',
  'processing.ideaObjective.required': 'O objetivo da Ideia é obrigatório.',
  'processing.ideaObjective.min.length':
    'O objetivo da Ideia precisa ter pelo menos 10 caracteres.',
  'processing.ideaObjective.max.length':
    'O objetivo da Ideia pode ter no máximo 1000 caracteres.',
  'processing.ideaTypeId.required': 'Tipo de Ideia não identificado.',
  'processing.ideaTypeId.uuid': 'Tipo de Ideia inválido.',
  'processing.ideaTypeName.required': 'O nome do Tipo de Ideia é obrigatório.',
  'processing.ideaTypeName.min.length':
    'O nome do Tipo de Ideia precisa ter pelo menos 3 caracteres.',
  'processing.ideaTypeName.max.length':
    'O nome do Tipo de Ideia pode ter no máximo 120 caracteres.',
  'processing.promptTemplate.required': 'O prompt do Tipo de Ideia é obrigatório.',
  'processing.promptTemplate.min.length':
    'O prompt do Tipo de Ideia precisa ter pelo menos 10 caracteres.',
  'processing.promptTemplate.max.length':
    'O prompt do Tipo de Ideia pode ter no máximo 8000 caracteres.',
  'processing.resource.type.required': 'O tipo do recurso é obrigatório.',
  'processing.resource.type.in': 'O tipo do recurso é inválido.',
  'processing.resource.content.required': 'O conteúdo do recurso é obrigatório.',
  'processing.resource.content.min.length':
    'O conteúdo do recurso precisa ter pelo menos 1 caractere.',
  'processing.resource.content.max.length':
    'O conteúdo do recurso pode ter no máximo 20000 caracteres.',
  'processing.resource.position.required': 'A posição do recurso é obrigatória.',
  'processing.resource.position.integer':
    'A posição do recurso precisa ser um número inteiro.',
  'processing.resource.position.min.value':
    'A posição do recurso não pode ser negativa.',
  'processing.iteration.result.required': 'O resultado da iteração é obrigatório.',
  'processing.iteration.result.min.length':
    'O resultado da iteração precisa ter pelo menos 1 caractere.',
  'processing.iteration.result.max.length':
    'O resultado da iteração pode ter no máximo 50000 caracteres.',
  'processing.iteration.position.required':
    'A posição da iteração é obrigatória.',
  'processing.iteration.position.integer':
    'A posição da iteração precisa ser um número inteiro.',
  'processing.iteration.position.min.value':
    'A posição da iteração não pode ser negativa.',
  'dashboard.latestLimit.invalid':
    'O limite da lista de ideias precisa ser um inteiro entre 1 e 20.',
  'ai.prompt.invalid': 'O prompt orientativo é inválido ou excede o tamanho permitido.',
  'ai.input.too_long': 'O conteúdo enviado para a IA é muito longo.',
  'ai.generate.failed': 'Não foi possível gerar o conteúdo com a IA. Tente novamente.',
  'ai.generate.empty': 'A IA não retornou nenhum conteúdo. Tente novamente.',
  'ai.audio.required': 'Nenhum áudio foi enviado.',
  'ai.audio.too_large': 'O áudio é muito grande. O limite é 25MB.',
  'ai.audio.invalid_type': 'O arquivo enviado não é um áudio válido.',
  'ai.transcribe.failed': 'Não foi possível transcrever o áudio agora. Tente novamente.',
  'ai.transcribe.empty': 'Não identificamos fala no áudio. Tente novamente.',
} as const;

export type ErrorMessageKey = keyof typeof errorMessagesPt;
export type ErrorMessages = Record<ErrorMessageKey, string>;
