import { DomainError, ValidationException } from "@ideias/shared";
import { RegisterUser, User } from "../../../src";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const VALID_PASSWORD = "Strong@123";
const VALID_HASH = "$2b$10$" + "z".repeat(53);

describe("RegisterUser", () => {
  test("persiste novo usuário no caminho feliz", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "Joao Silva",
        email: "joao@silva.com",
        password: VALID_PASSWORD,
      }),
    ).resolves.toBeUndefined();

    expect(cryptoProvider.encryptedPasswords).toEqual([VALID_PASSWORD]);
    expect(userRepository.createdUsers).toHaveLength(1);
    expect(userRepository.createdUsers[0].email).toBe("joao@silva.com");
  });

  test("falha com ValidationException quando dados de entrada são inválidos", async () => {
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository();
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    await expect(
      useCase.execute({
        name: "",
        email: "nao-email",
        password: "123",
      }),
    ).rejects.toThrow(ValidationException);

    expect(cryptoProvider.encryptedPasswords).toEqual([]);
    expect(userRepository.createdUsers).toEqual([]);
  });

  test("falha com erro 409 quando e-mail já está cadastrado", async () => {
    const existing = new User({
      name: "Joao Silva",
      email: "joao@silva.com",
      password: VALID_HASH,
    });
    const cryptoProvider = new FakeCryptoProvider();
    const userRepository = new FakeUserRepository([existing]);
    const useCase = new RegisterUser(cryptoProvider, userRepository);

    try {
      await useCase.execute({
        name: "Outro Nome",
        email: "joao@silva.com",
        password: VALID_PASSWORD,
      });
      fail("Esperava DomainError");
    } catch (error) {
      expect(error).toBeInstanceOf(DomainError);
      expect((error as DomainError).statusCode).toBe(409);
      expect((error as DomainError).message).toBe("user.email.already.exists");
    }

    expect(cryptoProvider.encryptedPasswords).toEqual([]);
    expect(userRepository.createdUsers).toEqual([]);
  });
});
