import { ValidationException } from "@sdd/shared";
import { Product, SaveProduct } from "../../../src/product";
import { FakeProductRepository } from "../../mock";

function seedProduct(
  repo: FakeProductRepository,
  overrides: Partial<{
    id: string;
    name: string;
    description: string | null;
    price: number;
    status: "active" | "inactive" | "draft";
    availableOnline: boolean;
    featured: boolean;
    allowsPreOrder: boolean;
  }> = {},
): Product {
  const product = new Product({
    id: overrides.id,
    name: overrides.name ?? "Camiseta Branca",
    description: overrides.description ?? null,
    price: overrides.price ?? 99.9,
    status: overrides.status ?? "active",
    availableOnline: overrides.availableOnline,
    featured: overrides.featured,
    allowsPreOrder: overrides.allowsPreOrder,
  });
  repo.seed(product);
  return product;
}

describe("SaveProduct", () => {
  test("cria novo produto sem id e persiste via create com defaults dos booleanos", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta Branca",
        price: 99.9,
        status: "active",
      }),
    ).resolves.toBeUndefined();

    expect(repo.createdProducts).toHaveLength(1);
    expect(repo.updatedProducts).toHaveLength(0);
    const created = repo.createdProducts[0];
    expect(created.description).toBeNull();
    expect(created.availableOnline).toBe(false);
    expect(created.featured).toBe(false);
    expect(created.allowsPreOrder).toBe(false);
  });

  test("cria com id enviado quando produto não existe no repositório", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);
    const id = "11111111-1111-4111-8111-111111111111";

    await useCase.execute({
      id,
      name: "Camiseta Branca",
      price: 50,
      status: "draft",
    });

    expect(repo.createdProducts).toHaveLength(1);
    expect(repo.createdProducts[0].id).toBe(id);
    expect(repo.updatedProducts).toHaveLength(0);
  });

  test("atualiza produto existente quando id é encontrado", async () => {
    const repo = new FakeProductRepository();
    const existing = seedProduct(repo, {
      name: "Camiseta Branca",
      price: 99.9,
      status: "draft",
      featured: false,
    });
    const useCase = new SaveProduct(repo);

    await useCase.execute({
      id: existing.id,
      name: "Camiseta Premium",
      description: "Algodão peruano",
      price: 149.9,
      status: "active",
      availableOnline: true,
      featured: true,
      allowsPreOrder: true,
    });

    expect(repo.updatedProducts).toHaveLength(1);
    expect(repo.createdProducts).toHaveLength(0);
    const updated = repo.updatedProducts[0];
    expect(updated.id).toBe(existing.id);
    expect(updated.name).toBe("Camiseta Premium");
    expect(updated.description).toBe("Algodão peruano");
    expect(updated.price).toBe(149.9);
    expect(updated.status).toBe("active");
    expect(updated.availableOnline).toBe(true);
    expect(updated.featured).toBe(true);
    expect(updated.allowsPreOrder).toBe(true);
  });

  test("falha com ValidationException quando nome tem menos de 2 caracteres", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "A",
        price: 10,
        status: "active",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando preço é negativo", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: -1,
        status: "active",
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando status está fora do enum", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10,
        status: "archived" as never,
      }),
    ).rejects.toThrow(ValidationException);

    expect(repo.createdProducts).toEqual([]);
  });

  test("falha com ValidationException quando preço tem mais de 2 casas decimais", async () => {
    const repo = new FakeProductRepository();
    const useCase = new SaveProduct(repo);

    await expect(
      useCase.execute({
        name: "Camiseta",
        price: 10.123,
        status: "active",
      }),
    ).rejects.toThrow(ValidationException);
  });
});
