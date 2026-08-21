import { ValidationException } from "@ideias/shared";
import { User, UserState } from "../../../src/user/model/user.entity";

const VALID_PASSWORD_HASH = "$2b$10$" + "a".repeat(53);

function buildProps(overrides: Partial<UserState> = {}): UserState {
  return {
    name: "Maria Silva",
    email: "maria@example.com",
    password: VALID_PASSWORD_HASH,
    ...overrides,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("User entity", () => {
  it("expõe getters dos campos", () => {
    const user = new User(buildProps());

    expect(user.name).toBe("Maria Silva");
    expect(user.email).toBe("maria@example.com");
    expect(user.password).toBe(VALID_PASSWORD_HASH);
  });

  it("herda id, createdAt e updatedAt da entidade base", () => {
    const user = new User(buildProps());

    expect(typeof user.id).toBe("string");
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.deletedAt).toBeNull();
  });

  it("clone preserva id e createdAt e atualiza updatedAt", async () => {
    const user = new User(buildProps());
    await new Promise((resolve) => setTimeout(resolve, 5));
    const clone = user.clone({ name: "Maria Souza" });

    expect(clone.id).toBe(user.id);
    expect(clone.createdAt.getTime()).toBe(user.createdAt.getTime());
    expect(clone.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime());
    expect(clone.name).toBe("Maria Souza");
  });

  it("não dispara validação no construtor (lazy validation)", () => {
    expect(() => new User(buildProps({ name: "" }))).not.toThrow();
  });

  it("valida com sucesso uma entidade válida", () => {
    const user = new User(buildProps());
    expect(() => user.validate()).not.toThrow();
  });

  it("acumula erros para name inválido", () => {
    const user = new User(buildProps({ name: "" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages).toContain("user.name.required");
  });

  it("rejeita name muito curto", () => {
    const user = new User(buildProps({ name: "Jo" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages.some((m) => m.startsWith("user.name."))).toBe(true);
  });

  it("rejeita name muito longo", () => {
    const user = new User(buildProps({ name: "A".repeat(81) }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages.some((m) => m.startsWith("user.name."))).toBe(true);
  });

  it("rejeita name fora do padrão de nome de pessoa", () => {
    const user = new User(buildProps({ name: "Maria123 Silva" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages).toContain("user.name.person.name");
  });

  it("rejeita email inválido", () => {
    const user = new User(buildProps({ email: "nao-email" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages).toContain("user.email.invalid.email");
  });

  it("exige email", () => {
    const user = new User(buildProps({ email: "" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages).toContain("user.email.required");
  });

  it("rejeita password que não está em formato bcrypt", () => {
    const user = new User(buildProps({ password: "senha-plana" }));
    const messages = getValidationMessages(() => user.validate());
    expect(messages).toContain("user.password.bcrypt.hash");
  });
});
