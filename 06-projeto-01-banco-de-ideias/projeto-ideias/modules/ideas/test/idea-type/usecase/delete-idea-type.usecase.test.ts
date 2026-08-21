import { DomainError } from "@ideias/shared";
import { IdeaType } from "../../../src/idea-type/model";
import { FakeIdeaTypeRepository } from "../../../src/idea-type/provider";
import { DeleteIdeaType } from "../../../src/idea-type/usecase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const ID = "33333333-3333-4333-8333-333333333333";

function seed(repo: FakeIdeaTypeRepository, ownerId: string): Promise<IdeaType> {
  return repo.create(
    new IdeaType({
      id: ID,
      name: "Tipo",
      description: "Descricao valida para o teste de delete.",
      prompt: "Prompt valido com marcadores {{name}} para o teste.",
      userId: ownerId,
    }),
  );
}

describe("DeleteIdeaType use case", () => {
  it("deleta quando o registro pertence ao usuario", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new DeleteIdeaType(repo);

    await seed(repo, USER_ID);

    await useCase.execute({ id: ID, userId: USER_ID });

    expect(await repo.findById(ID)).toBeNull();
  });

  it("lanca 404 quando o registro nao existe", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new DeleteIdeaType(repo);

    try {
      await useCase.execute({ id: ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea-type.not_found");
      expect(domain.statusCode).toBe(404);
    }
  });

  it("lanca 403 quando o registro pertence a outro usuario", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new DeleteIdeaType(repo);

    await seed(repo, OTHER_USER_ID);

    try {
      await useCase.execute({ id: ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea-type.forbidden");
      expect(domain.statusCode).toBe(403);
    }
  });
});
