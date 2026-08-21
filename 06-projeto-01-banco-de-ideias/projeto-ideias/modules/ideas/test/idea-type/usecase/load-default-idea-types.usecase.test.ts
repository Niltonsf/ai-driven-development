import { DEFAULT_IDEA_TYPES } from "../../../src/idea-type/constant";
import { IdeaType } from "../../../src/idea-type/model";
import { FakeIdeaTypeRepository } from "../../../src/idea-type/provider";
import { LoadDefaultIdeaTypes } from "../../../src/idea-type/usecase";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

async function listAll(repo: FakeIdeaTypeRepository, userId: string) {
  return repo.findPage({ userId, page: 1, perPage: 1000 });
}

describe("LoadDefaultIdeaTypes use case", () => {
  it("persiste todos os itens quando o usuario nao tem registros", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new LoadDefaultIdeaTypes(repo);

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ loaded: DEFAULT_IDEA_TYPES.length });

    const page = await listAll(repo, USER_ID);
    expect(page.total).toBe(DEFAULT_IDEA_TYPES.length);
    page.items.forEach((item) => expect(item.userId).toBe(USER_ID));
    expect(page.items.map((item) => item.name)).toEqual(
      DEFAULT_IDEA_TYPES.map((item) => item.name),
    );
  });

  it("nao persiste e retorna loaded 0 quando ja existe pelo menos um registro", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new LoadDefaultIdeaTypes(repo);

    await repo.create(
      new IdeaType({
        name: "Tipo Pessoal",
        description: "Tipo de ideia criado manualmente pelo usuario.",
        prompt: "Prompt customizado com {{name}} suficientemente extenso.",
        userId: USER_ID,
      }),
    );

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ loaded: 0 });
    const page = await listAll(repo, USER_ID);
    expect(page.total).toBe(1);
  });

  it("chamada repetida em sequencia nao duplica registros", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new LoadDefaultIdeaTypes(repo);

    const first = await useCase.execute({ userId: USER_ID });
    const second = await useCase.execute({ userId: USER_ID });

    expect(first).toEqual({ loaded: DEFAULT_IDEA_TYPES.length });
    expect(second).toEqual({ loaded: 0 });

    const page = await listAll(repo, USER_ID);
    expect(page.total).toBe(DEFAULT_IDEA_TYPES.length);
  });

  it("nao interfere em registros de outros usuarios", async () => {
    const repo = new FakeIdeaTypeRepository();
    const useCase = new LoadDefaultIdeaTypes(repo);

    await repo.create(
      new IdeaType({
        name: "Tipo do Outro",
        description: "Tipo de ideia pertencente a outro usuario.",
        prompt: "Prompt do outro usuario com {{name}} bem extenso.",
        userId: OTHER_USER_ID,
      }),
    );

    const result = await useCase.execute({ userId: USER_ID });

    expect(result).toEqual({ loaded: DEFAULT_IDEA_TYPES.length });

    const ownerPage = await listAll(repo, USER_ID);
    expect(ownerPage.total).toBe(DEFAULT_IDEA_TYPES.length);

    const otherPage = await listAll(repo, OTHER_USER_ID);
    expect(otherPage.total).toBe(1);
    expect(otherPage.items[0].name).toBe("Tipo do Outro");
  });
});
