import { DomainError, ValidationException } from "@ideias/shared";
import { LoginUser, User } from "../../../src";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_PASSWORD = "Strong@123";
const VALID_HASH = "$2b$10$" + "z".repeat(53);

function makeUser(): User {
  return new User({
    name: "José da Conceição",
    email: "jose@exemplo.com",
    password: VALID_PASSWORD,
  });
}

describe("LoginUser", () => {
  test("retorna { id, name, email } no caminho feliz, sem expor senha", async () => {
    const user = makeUser();
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository([user]);
    const useCase = new LoginUser(cryptoProvider, userRepository);

    const result = await useCase.execute({
      email: "jose@exemplo.com",
      password: VALID_PASSWORD,
    });

    expect(result).toEqual({
      id: user.id,
      name: "José da Conceição",
      email: "jose@exemplo.com",
    });
    expect(result as unknown as { password?: string }).not.toHaveProperty(
      "password",
    );
    expect(result as unknown as { passwordHash?: string }).not.toHaveProperty(
      "passwordHash",
    );
  });

  test("falha com 401 quando e-mail não existe", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new LoginUser(cryptoProvider, userRepository);

    try {
      await useCase.execute({
        email: "ninguem@exemplo.com",
        password: VALID_PASSWORD,
      });
      fail("Esperava DomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).statusCode).toBe(401);
      expect((error as DomainError).message).toBe("user.credentials.invalid");
    }
  });

  test("falha com 401 quando senha está incorreta", async () => {
    const user = new User({
      name: "Joao Silva",
      email: "joao@silva.com",
      password: VALID_HASH,
    });
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository([user]);
    const useCase = new LoginUser(cryptoProvider, userRepository);

    try {
      await useCase.execute({
        email: "joao@silva.com",
        password: "Outro@123",
      });
      fail("Esperava DomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).statusCode).toBe(401);
      expect((error as DomainError).message).toBe("user.credentials.invalid");
    }
  });

  test("falha com ValidationException quando e-mail está vazio", async () => {
    const useCase = new LoginUser(
      new FakeCryptoProvider(),
      new FakeUserRepository(),
    );
    await expect(
      useCase.execute({ email: "", password: VALID_PASSWORD }),
    ).rejects.toThrow(ValidationException);
  });

  test("falha com ValidationException quando e-mail é inválido", async () => {
    const useCase = new LoginUser(
      new FakeCryptoProvider(),
      new FakeUserRepository(),
    );
    await expect(
      useCase.execute({ email: "nao-email", password: VALID_PASSWORD }),
    ).rejects.toThrow(ValidationException);
  });

  test("falha com ValidationException quando senha está vazia", async () => {
    const useCase = new LoginUser(
      new FakeCryptoProvider(),
      new FakeUserRepository(),
    );
    await expect(
      useCase.execute({ email: "joao@silva.com", password: "" }),
    ).rejects.toThrow(ValidationException);
  });
});
