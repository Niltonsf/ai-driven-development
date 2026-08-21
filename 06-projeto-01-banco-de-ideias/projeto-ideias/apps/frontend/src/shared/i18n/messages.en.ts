import type { ErrorMessages } from './messages.pt';

export const errorMessagesEn: ErrorMessages = {
  DEFAULT_API_ERROR: 'An unexpected error occurred while contacting the server.',
  INVALID_ARRAY: 'The value must be an array.',
  INVALID_ITEM: 'Invalid item.',
  INVALID_OBJECT: 'The value must be an object.',
  INVALID_VALUE: 'Invalid value.',
  MAX_ITEMS: 'Maximum of {{max}} items.',
  MIN_ITEMS: 'Minimum of {{min}} items.',
  REQUIRED_FIELD: 'This field is required.',
  SHELL_CONTEXT_PROVIDER_REQUIRED: 'useShellContext must be used within <ShellProvider>.',
  UNKNOWN_ERROR_CODE: 'Unknown error: {{code}}',
  INTERNAL_SERVER_ERROR: 'Internal server error. Please try again shortly.',
  'user.name.required': 'Name is required.',
  'user.name.min.length': 'Name must be at least 3 characters long.',
  'user.name.max.length': 'Name must be at most 80 characters long.',
  'user.name.person.name': 'Please provide a full name (first and last).',
  'user.email.required': 'Email is required.',
  'user.email.invalid.email': 'Please provide a valid email.',
  'user.email.already.exists': 'This email is already registered.',
  'user.password.required': 'Password is required.',
  'user.password.strong.password':
    'Password must have at least 8 characters, including upper-case, lower-case, numbers and symbols.',
  'user.password.bcrypt.hash': 'Invalid password format.',
  'user.credentials.invalid': 'Invalid email or password.',
  'idea-type.name.required': 'Idea Type name is required.',
  'idea-type.name.min.length': 'Name must be at least 3 characters long.',
  'idea-type.name.max.length': 'Name must be at most 120 characters long.',
  'idea-type.description.required': 'Description is required.',
  'idea-type.description.min.length': 'Description must be at least 10 characters long.',
  'idea-type.description.max.length': 'Description must be at most 500 characters long.',
  'idea-type.prompt.required': 'Prompt is required.',
  'idea-type.prompt.min.length': 'Prompt must be at least 20 characters long.',
  'idea-type.prompt.max.length': 'Prompt must be at most 8000 characters long.',
  'idea-type.not_found': 'Idea Type not found.',
  'idea-type.forbidden': 'You do not have permission to access this Idea Type.',
  'idea.name.required': 'Idea name is required.',
  'idea.name.min.length': 'Name must be at least 3 characters long.',
  'idea.name.max.length': 'Name must be at most 120 characters long.',
  'idea.description.required': 'Description is required.',
  'idea.description.min.length': 'Description must be at least 10 characters long.',
  'idea.description.max.length': 'Description must be at most 2000 characters long.',
  'idea.objective.required': 'Objective is required.',
  'idea.objective.min.length': 'Objective must be at least 10 characters long.',
  'idea.objective.max.length': 'Objective must be at most 1000 characters long.',
  'idea.ideaTypeId.required': 'Please select an Idea Type.',
  'idea.ideaTypeId.uuid': 'Invalid Idea Type.',
  'idea.userId.required': 'User not identified.',
  'idea.userId.uuid': 'Invalid user.',
  'idea.ideaType.invalid': 'The selected Idea Type does not exist or does not belong to you.',
  'idea.not_found': 'Idea not found.',
  'idea.forbidden': 'You do not have permission to access this Idea.',
  'idea.resource.type.required': 'Resource type is required.',
  'idea.resource.type.in': 'Resource type is invalid.',
  'idea.resource.type.unsupported':
    'This resource type is not supported yet. Only text is accepted for now.',
  'idea.resource.content.required': 'Resource content is required.',
  'idea.resource.content.min.length':
    'Resource content must be at least 1 character long.',
  'idea.resource.content.max.length':
    'Resource content must be at most 20000 characters long.',
  'idea.resource.position.required': 'Resource position is required.',
  'idea.resource.position.integer':
    'Resource position must be an integer.',
  'idea.resource.position.min.value':
    'Resource position cannot be negative.',
  'idea.resources.too_many': 'An Idea can have at most 20 resources.',
  'idea.resources.duplicate_id':
    'There are duplicated resources in the list. Please remove duplicates.',
  'idea.has_processings':
    'This Idea has Processings. Delete the Processings before removing the Idea.',
  'processing.idea.invalid':
    'The selected Idea does not exist or does not belong to you.',
  'processing.not_found': 'Processing not found.',
  'processing.iterations.required':
    'A Processing must have at least one iteration.',
  'processing.iterations.too_many':
    'This Processing reached the limit of 50 iterations.',
  'processing.refinement.required': 'Please provide the refinement.',
  'processing.refinement.min.length':
    'The refinement must be at least 3 characters long.',
  'processing.refinement.max.length':
    'The refinement must be at most 2000 characters long.',
  'processing.userId.required': 'User not identified.',
  'processing.userId.uuid': 'Invalid user.',
  'processing.ideaId.required': 'Idea not identified.',
  'processing.ideaId.uuid': 'Invalid idea.',
  'processing.ideaName.required': 'The Idea name is required.',
  'processing.ideaName.min.length':
    'The Idea name must be at least 3 characters long.',
  'processing.ideaName.max.length':
    'The Idea name must be at most 120 characters long.',
  'processing.ideaDescription.required': 'The Idea description is required.',
  'processing.ideaDescription.min.length':
    'The Idea description must be at least 10 characters long.',
  'processing.ideaDescription.max.length':
    'The Idea description must be at most 2000 characters long.',
  'processing.ideaObjective.required': 'The Idea objective is required.',
  'processing.ideaObjective.min.length':
    'The Idea objective must be at least 10 characters long.',
  'processing.ideaObjective.max.length':
    'The Idea objective must be at most 1000 characters long.',
  'processing.ideaTypeId.required': 'Idea Type not identified.',
  'processing.ideaTypeId.uuid': 'Invalid Idea Type.',
  'processing.ideaTypeName.required': 'The Idea Type name is required.',
  'processing.ideaTypeName.min.length':
    'The Idea Type name must be at least 3 characters long.',
  'processing.ideaTypeName.max.length':
    'The Idea Type name must be at most 120 characters long.',
  'processing.promptTemplate.required': 'The Idea Type prompt is required.',
  'processing.promptTemplate.min.length':
    'The Idea Type prompt must be at least 10 characters long.',
  'processing.promptTemplate.max.length':
    'The Idea Type prompt must be at most 8000 characters long.',
  'processing.resource.type.required': 'The resource type is required.',
  'processing.resource.type.in': 'The resource type is invalid.',
  'processing.resource.content.required': 'The resource content is required.',
  'processing.resource.content.min.length':
    'The resource content must be at least 1 character long.',
  'processing.resource.content.max.length':
    'The resource content must be at most 20000 characters long.',
  'processing.resource.position.required': 'The resource position is required.',
  'processing.resource.position.integer':
    'The resource position must be an integer.',
  'processing.resource.position.min.value':
    'The resource position cannot be negative.',
  'processing.iteration.result.required': 'The iteration result is required.',
  'processing.iteration.result.min.length':
    'The iteration result must be at least 1 character long.',
  'processing.iteration.result.max.length':
    'The iteration result must be at most 50000 characters long.',
  'processing.iteration.position.required':
    'The iteration position is required.',
  'processing.iteration.position.integer':
    'The iteration position must be an integer.',
  'processing.iteration.position.min.value':
    'The iteration position cannot be negative.',
  'dashboard.latestLimit.invalid':
    'The ideas list limit must be an integer between 1 and 20.',
  'ai.prompt.invalid': 'The guiding prompt is invalid or exceeds the allowed length.',
  'ai.input.too_long': 'The content sent to the AI is too long.',
  'ai.generate.failed': 'Could not generate content with AI. Please try again.',
  'ai.generate.empty': 'The AI returned no content. Please try again.',
  'ai.audio.required': 'No audio was sent.',
  'ai.audio.too_large': 'The audio is too large. The limit is 25MB.',
  'ai.audio.invalid_type': 'The uploaded file is not a valid audio.',
  'ai.transcribe.failed': 'Could not transcribe the audio right now. Please try again.',
  'ai.transcribe.empty': 'No speech was detected in the audio. Please try again.',
};
