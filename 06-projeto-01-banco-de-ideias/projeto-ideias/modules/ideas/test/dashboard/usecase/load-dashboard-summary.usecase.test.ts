import { DomainError } from "@ideias/shared";
import { LoadDashboardSummary } from "../../../src/dashboard/usecase";
import { Idea } from "../../../src/idea/model";
import { FakeIdeaRepository } from "../../../src/idea/provider";
import { IdeaType } from "../../../src/idea-type/model";
import { FakeIdeaTypeRepository } from "../../../src/idea-type/provider";
import { Processing } from "../../../src/processing/model";
import { FakeProcessingRepository } from "../../../src/processing/provider";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const TYPE_A = "33333333-3333-4333-8333-333333333333";
const TYPE_B = "44444444-4444-4444-8444-444444444444";

function utcDay(offset: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - offset,
      12,
      0,
      0,
    ),
  );
}

function dayKey(offset: number): string {
  return utcDay(offset).toISOString().slice(0, 10);
}

function buildIdea(
  overrides: Partial<{
    id: string;
    name: string;
    ideaTypeId: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {},
): Idea {
  return new Idea({
    id: overrides.id,
    name: overrides.name ?? "Ideia de teste valida",
    description: "Descricao valida da ideia para os testes.",
    objective: "Objetivo valido da ideia para os testes.",
    ideaTypeId: overrides.ideaTypeId ?? TYPE_A,
    userId: USER_ID,
    createdAt: overrides.createdAt ?? utcDay(0),
    updatedAt: overrides.updatedAt ?? overrides.createdAt ?? utcDay(0),
  });
}

function buildIdeaType(id: string, name: string): IdeaType {
  return new IdeaType({
    id,
    name,
    description: "Tipo de ideia valido para os testes.",
    prompt: "Avalie {{name}}, {{description}}, {{objective}}.",
    userId: USER_ID,
  });
}

function buildProcessing(createdAt: Date): Processing {
  return new Processing({
    userId: USER_ID,
    ideaId: "55555555-5555-4555-8555-555555555555",
    ideaName: "Ideia base",
    ideaDescription: "Descricao base valida do processamento.",
    ideaObjective: "Objetivo base valido do processamento.",
    ideaTypeId: TYPE_A,
    ideaTypeName: "Produto Digital",
    promptTemplate: "Avalie {{name}}.",
    resources: [],
    iterations: [],
    createdAt,
    updatedAt: createdAt,
  });
}

function setup() {
  const ideaRepo = new FakeIdeaRepository();
  const ideaTypeRepo = new FakeIdeaTypeRepository();
  const processingRepo = new FakeProcessingRepository();
  ideaRepo.ideaTypeNameById.set(TYPE_A, "Produto Digital");
  ideaRepo.ideaTypeNameById.set(TYPE_B, "Servico");
  const useCase = new LoadDashboardSummary(
    ideaRepo,
    ideaTypeRepo,
    processingRepo,
  );
  return { ideaRepo, ideaTypeRepo, processingRepo, useCase };
}

describe("LoadDashboardSummary use case", () => {
  it("retorna stats, latestIdeas (updatedAt desc) e 7 pontos de atividade", async () => {
    const { ideaRepo, ideaTypeRepo, processingRepo, useCase } = setup();

    await ideaRepo.create(
      buildIdea({ name: "Mais antiga", updatedAt: utcDay(3) }),
    );
    await ideaRepo.create(
      buildIdea({ name: "Intermediaria", updatedAt: utcDay(1) }),
    );
    await ideaRepo.create(
      buildIdea({
        name: "Mais recente",
        ideaTypeId: TYPE_B,
        updatedAt: utcDay(0),
      }),
    );
    await ideaTypeRepo.create(buildIdeaType(TYPE_A, "Produto Digital"));
    await ideaTypeRepo.create(buildIdeaType(TYPE_B, "Servico"));
    await processingRepo.create(buildProcessing(utcDay(0)));

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.stats).toEqual({
      ideasCount: 3,
      ideaTypesCount: 2,
      processingsCount: 1,
    });
    expect(result.latestIdeas.map((i) => i.name)).toEqual([
      "Mais recente",
      "Intermediaria",
      "Mais antiga",
    ]);
    expect(result.latestIdeas[0].ideaTypeName).toBe("Servico");
    expect(result.activity).toHaveLength(7);
    const dates = result.activity.map((a) => a.date);
    expect([...dates].sort()).toEqual(dates);
    const today = result.activity[6];
    expect(today.date).toBe(dayKey(0));
    expect(today.ideasCreated).toBe(3);
    expect(today.processingsExecuted).toBe(1);
  });

  it("tudo zerado: stats zerados, latestIdeas vazio, 7 pontos todos 0", async () => {
    const { useCase } = setup();

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.stats).toEqual({
      ideasCount: 0,
      ideaTypesCount: 0,
      processingsCount: 0,
    });
    expect(result.latestIdeas).toEqual([]);
    expect(result.activity).toHaveLength(7);
    for (const point of result.activity) {
      expect(point.ideasCreated).toBe(0);
      expect(point.processingsExecuted).toBe(0);
    }
  });

  it("preenche dias vazios: registros em 2 dias, os outros 5 vem 0", async () => {
    const { ideaRepo, processingRepo, useCase } = setup();

    await ideaRepo.create(buildIdea({ createdAt: utcDay(0) }));
    await ideaRepo.create(buildIdea({ createdAt: utcDay(4) }));
    await processingRepo.create(buildProcessing(utcDay(4)));

    const result = await useCase.execute({ userId: USER_ID });

    expect(result.activity).toHaveLength(7);
    const withIdeas = result.activity.filter((a) => a.ideasCreated > 0);
    expect(withIdeas).toHaveLength(2);
    const empty = result.activity.filter(
      (a) => a.ideasCreated === 0 && a.processingsExecuted === 0,
    );
    expect(empty).toHaveLength(5);
    const day4 = result.activity.find((a) => a.date === dayKey(4))!;
    expect(day4.ideasCreated).toBe(1);
    expect(day4.processingsExecuted).toBe(1);
  });

  it("latestLimit ausente usa default 5", async () => {
    const { ideaRepo, useCase } = setup();
    const spy = jest.spyOn(ideaRepo, "findLatestByUser");

    await useCase.execute({ userId: USER_ID });

    expect(spy).toHaveBeenCalledWith(USER_ID, 5);
  });

  it("latestLimit = 1 e latestLimit = 20 sao validos", async () => {
    const { ideaRepo, useCase } = setup();
    const spy = jest.spyOn(ideaRepo, "findLatestByUser");

    await useCase.execute({ userId: USER_ID, latestLimit: 1 });
    expect(spy).toHaveBeenLastCalledWith(USER_ID, 1);

    await useCase.execute({ userId: USER_ID, latestLimit: 20 });
    expect(spy).toHaveBeenLastCalledWith(USER_ID, 20);
  });

  it("latestLimit = 0 lanca 422 dashboard.latestLimit.invalid", async () => {
    const { useCase } = setup();
    try {
      await useCase.execute({ userId: USER_ID, latestLimit: 0 });
      fail("Deveria ter lancado");
    } catch (error) {
      const domain = error as DomainError;
      expect(domain.message).toBe("dashboard.latestLimit.invalid");
      expect(domain.statusCode).toBe(422);
    }
  });

  it("latestLimit = 21 lanca 422 dashboard.latestLimit.invalid", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ userId: USER_ID, latestLimit: 21 }),
    ).rejects.toThrow("dashboard.latestLimit.invalid");
  });

  it("latestLimit = 3.5 (nao inteiro) lanca 422", async () => {
    const { useCase } = setup();
    await expect(
      useCase.execute({ userId: USER_ID, latestLimit: 3.5 }),
    ).rejects.toThrow("dashboard.latestLimit.invalid");
  });

  it("dispara as 6 leituras em paralelo (antes de qualquer await)", async () => {
    const { ideaRepo, ideaTypeRepo, processingRepo, useCase } = setup();
    const ideaCount = jest.spyOn(ideaRepo, "countByUser");
    const typeCount = jest.spyOn(ideaTypeRepo, "countByUser");
    const procCount = jest.spyOn(processingRepo, "countByUser");
    const latest = jest.spyOn(ideaRepo, "findLatestByUser");
    const ideaDaily = jest.spyOn(ideaRepo, "countDailyByUser");
    const procDaily = jest.spyOn(processingRepo, "countDailyByUser");

    const pending = useCase.execute({ userId: USER_ID });

    // Sincronamente apos chamar execute, todas as 6 leituras ja foram
    // disparadas (Promise.all avalia o array antes de qualquer await).
    expect(ideaCount).toHaveBeenCalledTimes(1);
    expect(typeCount).toHaveBeenCalledTimes(1);
    expect(procCount).toHaveBeenCalledTimes(1);
    expect(latest).toHaveBeenCalledTimes(1);
    expect(ideaDaily).toHaveBeenCalledTimes(1);
    expect(procDaily).toHaveBeenCalledTimes(1);

    await pending;
  });
});
