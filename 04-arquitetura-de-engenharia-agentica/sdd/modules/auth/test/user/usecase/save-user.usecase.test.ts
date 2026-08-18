import { User } from "../../../src/user/model/user.entity";
import { SaveUser } from "../../../src/user/usecase/save-user.usecase";
import { FakeCryptoProvider, FakeUserRepository } from "../../mock";

const BCRYPT_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

function existingUser() {
  return new User({
    name: "João Silva",
    email: "joao@email.com",
    password: BCRYPT_HASH,
  });
}

describe("SaveUser", () => {
  describe("criação", () => {
    test("cria novo usuário quando id não é informado", async () => {
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      const validateSpy = jest.spyOn(User.prototype, "validate");
      const useCase = new SaveUser(crypto, repo);

      await expect(
        useCase.execute({ name: "João Silva", email: "joao@email.com", password: "Senha@123" }),
      ).resolves.toBeUndefined();

      expect(crypto.hashedPasswords).toEqual(["Senha@123"]);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(repo.users).toHaveLength(1);
      expect(repo.users[0].email).toBe("joao@email.com");
      expect(repo.users[0].password).toBe(BCRYPT_HASH);

      validateSpy.mockRestore();
    });

    test("cria novo usuário com id informado quando ele não existe no banco", async () => {
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      const useCase = new SaveUser(crypto, repo);
      const idForte = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

      await expect(
        useCase.execute({ id: idForte, name: "Maria Oliveira", email: "maria@email.com", password: "Senha@123" }),
      ).resolves.toBeUndefined();

      expect(repo.users).toHaveLength(1);
      expect(repo.users[0].id).toBe(idForte);
    });

    test("não chama update ao criar", async () => {
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      const updateSpy = jest.spyOn(repo, "update");
      const useCase = new SaveUser(crypto, repo);

      await useCase.execute({ name: "Ana Lima", email: "ana@email.com", password: "Senha@123" });

      expect(updateSpy).not.toHaveBeenCalled();
      updateSpy.mockRestore();
    });
  });

  describe("atualização", () => {
    test("atualiza usuário existente quando findById retorna entidade", async () => {
      const user = existingUser();
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      repo.users.push(user);
      const validateSpy = jest.spyOn(User.prototype, "validate");
      const useCase = new SaveUser(crypto, repo);

      await expect(
        useCase.execute({ id: user.id, name: "João Atualizado", email: "joao@email.com", password: "Nova@123" }),
      ).resolves.toBeUndefined();

      expect(crypto.hashedPasswords).toEqual(["Nova@123"]);
      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(repo.users[0].name).toBe("João Atualizado");
      expect(repo.users[0].password).toBe(BCRYPT_HASH);

      validateSpy.mockRestore();
    });

    test("mantém hash existente quando password não é informado na edição", async () => {
      const user = existingUser();
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      repo.users.push(user);
      const useCase = new SaveUser(crypto, repo);

      await expect(
        useCase.execute({ id: user.id, name: "João Editado", email: "joao@email.com" }),
      ).resolves.toBeUndefined();

      expect(crypto.hashedPasswords).toHaveLength(0);
      expect(repo.users[0].password).toBe(BCRYPT_HASH);
      expect(repo.users[0].name).toBe("João Editado");
    });

    test("mantém hash existente quando password vem vazio na edição", async () => {
      const user = existingUser();
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      repo.users.push(user);
      const useCase = new SaveUser(crypto, repo);

      await expect(
        useCase.execute({ id: user.id, name: "João Editado", email: "joao@email.com", password: "" }),
      ).resolves.toBeUndefined();

      expect(crypto.hashedPasswords).toHaveLength(0);
      expect(repo.users[0].password).toBe(BCRYPT_HASH);
    });

    test("não chama create ao atualizar", async () => {
      const user = existingUser();
      const crypto = new FakeCryptoProvider();
      const repo = new FakeUserRepository();
      repo.users.push(user);
      const createSpy = jest.spyOn(repo, "create");
      const useCase = new SaveUser(crypto, repo);

      await useCase.execute({ id: user.id, name: "João Editado", email: "joao@email.com" });

      expect(createSpy).not.toHaveBeenCalled();
      createSpy.mockRestore();
    });
  });
});
