import { User } from "../../../src/user/model/user.entity";
import { DeleteUser } from "../../../src/user/usecase/delete-user.usecase";
import { FakeUserRepository } from "../../mock";

const BCRYPT_HASH = "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";
const USER_ID_1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const USER_ID_2 = "c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd";

function existingUser(id = USER_ID_1) {
  return new User({
    id,
    name: "João Silva",
    email: "joao@email.com",
    password: BCRYPT_HASH,
  });
}

describe("DeleteUser", () => {
  test("remove usuário existente pelo id", async () => {
    const user = existingUser();
    const repo = new FakeUserRepository();
    repo.users.push(user);
    const useCase = new DeleteUser(repo);

    await expect(useCase.execute({ id: user.id })).resolves.toBeUndefined();

    expect(repo.users).toHaveLength(0);
  });

  test("lança user.not_found quando id não existe", async () => {
    const repo = new FakeUserRepository();
    const useCase = new DeleteUser(repo);

    await expect(useCase.execute({ id: USER_ID_2 })).rejects.toMatchObject({
      message: "user.not_found",
      statusCode: 404,
    });
  });

  test("não remove outros usuários ao excluir um específico", async () => {
    const user1 = existingUser(USER_ID_1);
    const user2 = new User({
      id: USER_ID_2,
      name: "Maria Souza",
      email: "maria@email.com",
      password: BCRYPT_HASH,
    });
    const repo = new FakeUserRepository();
    repo.users.push(user1, user2);
    const useCase = new DeleteUser(repo);

    await useCase.execute({ id: user1.id });

    expect(repo.users).toHaveLength(1);
    expect(repo.users[0].id).toBe(user2.id);
  });
});
