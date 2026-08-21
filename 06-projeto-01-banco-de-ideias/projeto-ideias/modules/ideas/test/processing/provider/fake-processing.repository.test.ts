import { Processing, ProcessingIteration } from "../../../src/processing/model";
import { FakeProcessingRepository } from "../../../src/processing/provider";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

function buildProcessing(
  id: string,
  owner = USER_ID,
  updatedAt = new Date(),
): Processing {
  return new Processing({
    id,
    userId: owner,
    ideaId: "44444444-4444-4444-8444-444444444444",
    ideaName: "App de Receitas",
    ideaDescription: "Aplicativo para organizar receitas.",
    ideaObjective: "Ajudar pessoas a cozinhar melhor.",
    ideaTypeId: "55555555-5555-4555-8555-555555555555",
    ideaTypeName: "Produto Digital",
    promptTemplate: "Avalie {{name}}.",
    updatedAt,
    resources: [{ type: "text", content: "ctx", position: 0 }],
    iterations: [
      new ProcessingIteration({
        refinement: null,
        result: "R0",
        position: 0,
      }),
    ],
  });
}

const ID_A = "33333333-3333-4333-8333-333333333333";
const ID_B = "66666666-6666-4666-8666-666666666666";

describe("FakeProcessingRepository", () => {
  it("findPage filtra por userId, ordena por updatedAt desc e pagina", async () => {
    const repo = new FakeProcessingRepository();
    await repo.create(buildProcessing(ID_A, USER_ID, new Date(2024, 0, 1)));
    await repo.create(buildProcessing(ID_B, USER_ID, new Date(2024, 0, 2)));
    await repo.create(
      buildProcessing(
        "77777777-7777-4777-8777-777777777777",
        OTHER_USER_ID,
      ),
    );

    const page = await repo.findPage({ userId: USER_ID, page: 1, perPage: 1 });

    expect(page.total).toBe(2);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(ID_B);
    expect(page.items[0].iterationsCount).toBe(1);
    expect(page.items[0].ideaTypeName).toBe("Produto Digital");
  });

  it("appendIteration anexa sem tocar nas anteriores", async () => {
    const repo = new FakeProcessingRepository();
    await repo.create(buildProcessing(ID_A));

    await repo.appendIteration(
      ID_A,
      new ProcessingIteration({
        refinement: "refino",
        result: "R1",
        position: 1,
      }),
    );

    const stored = await repo.findById(ID_A);
    expect(stored!.iterations).toHaveLength(2);
    expect(stored!.iterations[1].position).toBe(1);
  });

  it("appendIteration em id inexistente e no-op", async () => {
    const repo = new FakeProcessingRepository();
    await expect(
      repo.appendIteration(
        ID_A,
        new ProcessingIteration({
          refinement: null,
          result: "R",
          position: 0,
        }),
      ),
    ).resolves.toBeUndefined();
  });

  it("findById retorna null quando nao existe", async () => {
    const repo = new FakeProcessingRepository();
    expect(await repo.findById(ID_A)).toBeNull();
  });

  it("searchIdeas filtra por userId, termo e limita resultados", async () => {
    const repo = new FakeProcessingRepository();
    repo.ideaSearchSeed = [
      {
        userId: USER_ID,
        item: {
          id: "i1",
          name: "App de Receitas",
          ideaTypeId: "t1",
          ideaTypeName: "Produto Digital",
        },
      },
      {
        userId: USER_ID,
        item: {
          id: "i2",
          name: "Loja Virtual",
          ideaTypeId: "t2",
          ideaTypeName: "Marketplace",
        },
      },
      {
        userId: OTHER_USER_ID,
        item: {
          id: "i3",
          name: "Outro",
          ideaTypeId: "t3",
          ideaTypeName: "Outro Tipo",
        },
      },
    ];

    const byName = await repo.searchIdeas({ userId: USER_ID, term: "receitas" });
    expect(byName.map((i) => i.id)).toEqual(["i1"]);

    const byType = await repo.searchIdeas({
      userId: USER_ID,
      term: "marketplace",
    });
    expect(byType.map((i) => i.id)).toEqual(["i2"]);

    const all = await repo.searchIdeas({ userId: USER_ID, term: "" });
    expect(all).toHaveLength(2);
  });

  it("findById ordena iteracoes e recursos por position asc", async () => {
    const repo = new FakeProcessingRepository();
    const processing = new Processing({
      id: ID_A,
      userId: USER_ID,
      ideaId: "44444444-4444-4444-8444-444444444444",
      ideaName: "App de Receitas",
      ideaDescription: "Aplicativo para organizar receitas.",
      ideaObjective: "Ajudar pessoas a cozinhar melhor.",
      ideaTypeId: "55555555-5555-4555-8555-555555555555",
      ideaTypeName: "Produto Digital",
      promptTemplate: "Avalie {{name}}.",
      resources: [
        { type: "text", content: "B", position: 1 },
        { type: "text", content: "A", position: 0 },
      ],
      iterations: [
        new ProcessingIteration({
          refinement: "r1",
          result: "R1",
          position: 1,
        }),
        new ProcessingIteration({
          refinement: null,
          result: "R0",
          position: 0,
        }),
      ],
    });
    await repo.create(processing);

    const stored = await repo.findById(ID_A);
    expect(stored!.iterations.map((i) => i.position)).toEqual([0, 1]);
    expect(stored!.resources.map((r) => r.content)).toEqual(["A", "B"]);
  });

  it("delete remove o Processamento", async () => {
    const repo = new FakeProcessingRepository();
    await repo.create(buildProcessing(ID_A));
    await repo.delete(ID_A);
    expect(await repo.findById(ID_A)).toBeNull();
  });
});
