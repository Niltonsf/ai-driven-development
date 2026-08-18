import { Product } from "../../../src/product/model/product.entity";
import { DeleteProduct } from "../../../src/product/usecase/delete-product.usecase";
import { FakeProductRepository } from "../../mock";

const PRODUCT_ID_1 = "f47ac10b-58cc-4372-a567-0e02b2c3d479";
const PRODUCT_ID_2 = "c73bcdcc-2669-4bf6-81d3-e4ae73fb11fd";

function existingProduct(id = PRODUCT_ID_1) {
  return new Product({
    id,
    name: "Camiseta Básica",
    description: null,
    price: 49.9,
    status: "active",
    availableOnline: true,
    featured: false,
    allowsPreOrder: false,
  });
}

describe("DeleteProduct", () => {
  test("remove produto existente pelo id", async () => {
    const product = existingProduct();
    const repo = new FakeProductRepository();
    repo.products.push(product);
    const useCase = new DeleteProduct(repo);

    await expect(useCase.execute({ id: product.id })).resolves.toBeUndefined();

    expect(repo.products).toHaveLength(0);
  });

  test("lança product.not_found quando id não existe", async () => {
    const repo = new FakeProductRepository();
    const useCase = new DeleteProduct(repo);

    await expect(useCase.execute({ id: PRODUCT_ID_2 })).rejects.toMatchObject({
      message: "product.not_found",
      statusCode: 404,
    });
  });

  test("não remove outros produtos ao excluir um específico", async () => {
    const product1 = existingProduct(PRODUCT_ID_1);
    const product2 = new Product({
      id: PRODUCT_ID_2,
      name: "Caneca",
      description: null,
      price: 19.9,
      status: "draft",
      availableOnline: false,
      featured: false,
      allowsPreOrder: false,
    });
    const repo = new FakeProductRepository();
    repo.products.push(product1, product2);
    const useCase = new DeleteProduct(repo);

    await useCase.execute({ id: product1.id });

    expect(repo.products).toHaveLength(1);
    expect(repo.products[0].id).toBe(product2.id);
  });
});
