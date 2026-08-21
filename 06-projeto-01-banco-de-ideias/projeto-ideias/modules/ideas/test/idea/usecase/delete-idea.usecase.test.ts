import { DomainError } from "@ideias/shared";
import { Idea, Resource } from "../../../src/idea/model";
import { FakeIdeaRepository } from "../../../src/idea/provider";
import { DeleteIdea } from "../../../src/idea/usecase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";
const ID = "44444444-4444-4444-8444-444444444444";

function seed(repo: FakeIdeaRepository, ownerId: string): Promise<Idea> {
  return repo.create(
    new Idea({
      id: ID,
      name: "App de Receitas",
      description: "Descricao valida para o teste de delete.",
      objective: "Objetivo valido para o teste de delete.",
      ideaTypeId: "33333333-3333-4333-8333-333333333333",
      userId: ownerId,
    }),
  );
}

describe("DeleteIdea use case", () => {
  it("deleta quando o registro pertence ao usuario", async () => {
    const repo = new FakeIdeaRepository();
    const useCase = new DeleteIdea(repo);
    await seed(repo, USER_ID);

    await useCase.execute({ id: ID, userId: USER_ID });

    expect(await repo.findById(ID)).toBeNull();
  });

  it("remove a Ideia junto com seus recursos (cascata)", async () => {
    const repo = new FakeIdeaRepository();
    const useCase = new DeleteIdea(repo);
    await repo.create(
      new Idea({
        id: ID,
        name: "App de Receitas",
        description: "Descricao valida para o teste de delete.",
        objective: "Objetivo valido para o teste de delete.",
        ideaTypeId: "33333333-3333-4333-8333-333333333333",
        userId: USER_ID,
        resources: [
          new Resource({
            type: "text",
            content: "Recurso de contexto que deve sumir com a Ideia.",
            position: 0,
          }),
        ],
      }),
    );

    await useCase.execute({ id: ID, userId: USER_ID });

    expect(await repo.findById(ID)).toBeNull();
  });

  it("lanca 404 quando o registro nao existe", async () => {
    const repo = new FakeIdeaRepository();
    const useCase = new DeleteIdea(repo);

    try {
      await useCase.execute({ id: ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.not_found");
      expect(domain.statusCode).toBe(404);
    }
  });

  it("lanca 403 quando o registro pertence a outro usuario", async () => {
    const repo = new FakeIdeaRepository();
    const useCase = new DeleteIdea(repo);
    await seed(repo, OTHER_USER_ID);

    try {
      await useCase.execute({ id: ID, userId: USER_ID });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("idea.forbidden");
      expect(domain.statusCode).toBe(403);
    }
  });
});
