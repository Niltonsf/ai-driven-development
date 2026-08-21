import {
  InRule,
  IntegerRule,
  MaxLengthRule,
  MinLengthRule,
  MinValueRule,
  RequiredRule,
  Validator,
} from "@ideias/shared";
import { RESOURCE_TYPES, ResourceType } from "../../idea/model";

// Snapshot plano de um recurso da Ideia no momento da criacao do
// Processamento. Nao e entidade: nao tem id proprio nem datas — apenas os
// campos necessarios para compor o prompt. Reaproveita as mesmas regras de
// validacao do Resource (spec 009).
export interface ProcessingResource {
  type: ResourceType;
  content: string;
  position: number;
}

export function validateProcessingResource(resource: ProcessingResource): void {
  Validator.validate([
    {
      code: "processing.resource.type",
      value: resource.type,
      rules: [new RequiredRule(), new InRule(RESOURCE_TYPES)],
    },
    {
      code: "processing.resource.content",
      value: resource.content,
      rules: [
        new RequiredRule(),
        new MinLengthRule(1),
        new MaxLengthRule(20000),
      ],
    },
    {
      code: "processing.resource.position",
      value: resource.position,
      rules: [new RequiredRule(), new IntegerRule(), new MinValueRule(0)],
    },
  ]);
}
