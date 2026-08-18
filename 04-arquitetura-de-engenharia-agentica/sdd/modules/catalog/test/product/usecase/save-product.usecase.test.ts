import { Product } from "../../../src/product/model/product.entity";
import { SaveProduct } from "../../../src/product/usecase/save-product.usecase";
import { FakeProductRepository } from "../../mock";

function existingProduct() {
  return new Product({
    name: "Camiseta Básica",
    description: "Camiseta de algodão",
    price: 49.9,
    status: "active",
    availableOnline: true,
    featured: false,
    allowsPreOrder: false,
  });
}

describe("SaveProduct", () => {
  describe("criação", () => {
    test("cria novo produto quando id não é informado", async () => {
      const repo = new FakeProductRepository();
      const validateSpy = jest.spyOn(Product.prototype, "validate");
      const useCase = new SaveProduct(repo);

      await expect(
        useCase.execute({
          name: "Tênis Esportivo",
          description: "Tênis de corrida",
          price: 199.9,
          status: "active",
          availableOnline: true,
          featured: true,
          allowsPreOrder: false,
        }),
      ).resolves.toBeUndefined();

      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(repo.products).toHaveLength(1);
      expect(repo.products[0].name).toBe("Tênis Esportivo");
      expect(repo.products[0].featured).toBe(true);
      validateSpy.mockRestore();
    });

    test("cria novo produto com id informado quando ele não existe no banco", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);
      const id = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

      await useCase.execute({
        id,
        name: "Caneca",
        price: 19.9,
        status: "draft",
      });

      expect(repo.products).toHaveLength(1);
      expect(repo.products[0].id).toBe(id);
    });

    test("aplica defaults false quando flags não são informadas na criação", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        name: "Caderno",
        price: 12.5,
        status: "active",
      });

      expect(repo.products[0].availableOnline).toBe(false);
      expect(repo.products[0].featured).toBe(false);
      expect(repo.products[0].allowsPreOrder).toBe(false);
    });

    test("persiste descrição como null quando ausente", async () => {
      const repo = new FakeProductRepository();
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        name: "Mochila",
        price: 89.9,
        status: "active",
      });

      expect(repo.products[0].description).toBeNull();
    });

    test("não chama update ao criar", async () => {
      const repo = new FakeProductRepository();
      const updateSpy = jest.spyOn(repo, "update");
      const useCase = new SaveProduct(repo);

      await useCase.execute({ name: "Boné", price: 29.9, status: "active" });

      expect(updateSpy).not.toHaveBeenCalled();
      updateSpy.mockRestore();
    });
  });

  describe("atualização", () => {
    test("atualiza produto existente quando findById retorna entidade", async () => {
      const product = existingProduct();
      const repo = new FakeProductRepository();
      repo.products.push(product);
      const validateSpy = jest.spyOn(Product.prototype, "validate");
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        id: product.id,
        name: "Camiseta Atualizada",
        description: "Nova descrição",
        price: 59.9,
        status: "inactive",
        availableOnline: false,
        featured: true,
        allowsPreOrder: true,
      });

      expect(validateSpy).toHaveBeenCalledTimes(1);
      expect(repo.products[0].name).toBe("Camiseta Atualizada");
      expect(repo.products[0].description).toBe("Nova descrição");
      expect(repo.products[0].price).toBe(59.9);
      expect(repo.products[0].status).toBe("inactive");
      expect(repo.products[0].availableOnline).toBe(false);
      expect(repo.products[0].featured).toBe(true);
      expect(repo.products[0].allowsPreOrder).toBe(true);
      validateSpy.mockRestore();
    });

    test("preserva flags existentes quando não informadas na edição", async () => {
      const product = existingProduct();
      const repo = new FakeProductRepository();
      repo.products.push(product);
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        id: product.id,
        name: "Camiseta Editada",
        price: 49.9,
        status: "active",
      });

      expect(repo.products[0].availableOnline).toBe(true);
      expect(repo.products[0].featured).toBe(false);
      expect(repo.products[0].allowsPreOrder).toBe(false);
    });

    test("cria novo produto quando id é informado mas não existe", async () => {
      const repo = new FakeProductRepository();
      const createSpy = jest.spyOn(repo, "create");
      const updateSpy = jest.spyOn(repo, "update");
      const useCase = new SaveProduct(repo);
      const id = "11111111-2222-4333-8444-555555555555";

      await useCase.execute({ id, name: "Novo", price: 10, status: "draft" });

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).not.toHaveBeenCalled();
      expect(repo.products[0].id).toBe(id);
      createSpy.mockRestore();
      updateSpy.mockRestore();
    });

    test("não chama create ao atualizar", async () => {
      const product = existingProduct();
      const repo = new FakeProductRepository();
      repo.products.push(product);
      const createSpy = jest.spyOn(repo, "create");
      const useCase = new SaveProduct(repo);

      await useCase.execute({
        id: product.id,
        name: "Editado",
        price: 49.9,
        status: "active",
      });

      expect(createSpy).not.toHaveBeenCalled();
      createSpy.mockRestore();
    });
  });
});
