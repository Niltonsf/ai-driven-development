import { DomainError, ValidationException } from "@sdd/shared";
import { User } from "../../../src/user/model/user.entity";
import { LoginUser } from "../../../src/user/usecase/login-user.usecase";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const BCRYPT_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

function makeUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  return new User({
    name: overrides.name ?? "João Silva",
    email: overrides.email ?? "joao@email.com",
    password: overrides.password ?? BCRYPT_HASH,
  });
}

function validInput() {
  return { email: "joao@email.com", password: "Strong@123" };
}

describe("LoginUser", () => {
  test("retorna { id, name, email } sem password no caminho feliz", async () => {
    const crypto = new FakeCryptoProvider();
    const repo = new FakeUserRepository();
    const user = makeUser();
    await repo.create(user);
    const useCase = new LoginUser(crypto, repo);

    const result = await useCase.execute(validInput());

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(result).not.toHaveProperty("password");
    expect(result).not.toHaveProperty("passwordHash");
  });

  test("lança DomainError 401 quando o e-mail não existe", async () => {
    const repo = new FakeUserRepository();
    const useCase = new LoginUser(new FakeCryptoProvider(), repo);

    await expect(
      useCase.execute({ email: "nao-existe@email.com", password: "Strong@123" }),
    ).rejects.toMatchObject({
      message: "user.credentials.invalid",
      statusCode: 401,
    });
    await expect(
      useCase.execute({ email: "nao-existe@email.com", password: "Strong@123" }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  test("lança DomainError 401 quando a senha está incorreta", async () => {
    const repo = new FakeUserRepository();
    await repo.create(makeUser({ password: "$2b$10$differentHashThatWontMatch00000000000000000000000000000" }));
    const useCase = new LoginUser(new FakeCryptoProvider(), repo);

    await expect(useCase.execute(validInput())).rejects.toMatchObject({
      message: "user.credentials.invalid",
      statusCode: 401,
    });
  });

  test("lança ValidationException quando e-mail é vazio", async () => {
    const useCase = new LoginUser(new FakeCryptoProvider(), new FakeUserRepository());
    await expect(
      useCase.execute({ email: "", password: "Strong@123" }),
    ).rejects.toThrow(ValidationException);
  });

  test("lança ValidationException quando e-mail é inválido", async () => {
    const useCase = new LoginUser(new FakeCryptoProvider(), new FakeUserRepository());
    await expect(
      useCase.execute({ email: "nao-e-um-email", password: "Strong@123" }),
    ).rejects.toThrow(ValidationException);
  });

  test("lança ValidationException quando senha é vazia", async () => {
    const repo = new FakeUserRepository();
    await repo.create(makeUser());
    const useCase = new LoginUser(new FakeCryptoProvider(), repo);
    await expect(
      useCase.execute({ email: "joao@email.com", password: "" }),
    ).rejects.toThrow(ValidationException);
  });
});
