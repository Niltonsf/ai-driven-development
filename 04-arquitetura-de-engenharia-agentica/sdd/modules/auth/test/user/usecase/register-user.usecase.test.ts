import { DomainError, ValidationException } from "@sdd/shared";
import { User } from "../../../src/user/model/user.entity";
import { RegisterUser } from "../../../src/user/usecase/register-user.usecase";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const BCRYPT_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

function validInput() {
  return {
    name: "João Silva",
    email: "joao@email.com",
    password: "Strong@123",
  };
}

describe("RegisterUser", () => {
  test("persiste usuário válido no caminho feliz", async () => {
    const crypto = new FakeCryptoProvider();
    const repo = new FakeUserRepository();
    const validateSpy = jest.spyOn(User.prototype, "validate");
    const useCase = new RegisterUser(crypto, repo);

    await expect(useCase.execute(validInput())).resolves.toBeUndefined();

    expect(crypto.hashedPasswords).toEqual(["Strong@123"]);
    expect(validateSpy).toHaveBeenCalledTimes(1);
    expect(repo.users).toHaveLength(1);
    expect(repo.users[0].email).toBe("joao@email.com");
    expect(repo.users[0].password).toBe(BCRYPT_HASH);

    validateSpy.mockRestore();
  });

  test("lança ValidationException quando name é inválido", async () => {
    const useCase = new RegisterUser(new FakeCryptoProvider(), new FakeUserRepository());
    await expect(
      useCase.execute({ ...validInput(), name: "" }),
    ).rejects.toThrow(ValidationException);
  });

  test("lança ValidationException quando email é inválido", async () => {
    const useCase = new RegisterUser(new FakeCryptoProvider(), new FakeUserRepository());
    await expect(
      useCase.execute({ ...validInput(), email: "not-an-email" }),
    ).rejects.toThrow(ValidationException);
  });

  test("lança ValidationException quando password é fraca", async () => {
    const useCase = new RegisterUser(new FakeCryptoProvider(), new FakeUserRepository());
    await expect(
      useCase.execute({ ...validInput(), password: "123456" }),
    ).rejects.toThrow(ValidationException);
  });

  test("não persiste quando validação de entrada falha", async () => {
    const crypto = new FakeCryptoProvider();
    const repo = new FakeUserRepository();
    const useCase = new RegisterUser(crypto, repo);

    await expect(
      useCase.execute({ ...validInput(), name: "" }),
    ).rejects.toThrow(ValidationException);

    expect(crypto.hashedPasswords).toHaveLength(0);
    expect(repo.users).toHaveLength(0);
  });

  test("lança DomainError quando e-mail já está cadastrado", async () => {
    const crypto = new FakeCryptoProvider();
    const repo = new FakeUserRepository();
    const useCase = new RegisterUser(crypto, repo);

    await useCase.execute(validInput());
    await expect(useCase.execute(validInput())).rejects.toThrow(DomainError);
  });

  test("não persiste segunda vez quando e-mail já existe", async () => {
    const crypto = new FakeCryptoProvider();
    const repo = new FakeUserRepository();
    const useCase = new RegisterUser(crypto, repo);

    await useCase.execute(validInput());
    await expect(useCase.execute(validInput())).rejects.toThrow();
    expect(repo.users).toHaveLength(1);
  });
});
