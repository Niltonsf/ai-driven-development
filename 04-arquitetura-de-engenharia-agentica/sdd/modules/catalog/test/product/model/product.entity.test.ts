import { ValidationException } from "@sdd/shared";
import { Product, ProductState } from "../../../src/product/model/product.entity";

function validProps(): ProductState {
  return {
    name: "Camiseta Básica",
    description: "Camiseta de algodão",
    price: 49.9,
    status: "active",
    availableOnline: true,
    featured: false,
    allowsPreOrder: false,
  };
}

function getValidationMessages(callback: () => void): string[] {
  try {
    callback();
    return [];
  } catch (error) {
    return (error as ValidationException).errors.map((item) => item.message);
  }
}

describe("Product entity", () => {
  it("creates a valid product", () => {
    const product = new Product(validProps());
    expect(product).toBeDefined();
  });

  it("returns correct getters", () => {
    const product = new Product(validProps());
    expect(product.name).toBe("Camiseta Básica");
    expect(product.description).toBe("Camiseta de algodão");
    expect(product.price).toBe(49.9);
    expect(product.status).toBe("active");
    expect(product.availableOnline).toBe(true);
    expect(product.featured).toBe(false);
    expect(product.allowsPreOrder).toBe(false);
  });

  it("inherits id, createdAt, updatedAt from base entity", () => {
    const product = new Product(validProps());
    expect(product.id).toBeDefined();
    expect(product.createdAt).toBeInstanceOf(Date);
    expect(product.updatedAt).toBeInstanceOf(Date);
    expect(product.deletedAt).toBeNull();
  });

  it("description is null when omitted", () => {
    const { description: _description, ...rest } = validProps();
    const product = new Product(rest as ProductState);
    expect(product.description).toBeNull();
  });

  it("validate() succeeds for valid data", () => {
    const product = new Product(validProps());
    expect(() => product.validate()).not.toThrow();
  });

  it("validate() succeeds when description is null", () => {
    const product = new Product({ ...validProps(), description: null });
    expect(() => product.validate()).not.toThrow();
  });

  it("validate() fails when name is empty", () => {
    const product = new Product({ ...validProps(), name: "" });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.name"))).toBe(true);
  });

  it("validate() fails when name is too short", () => {
    const product = new Product({ ...validProps(), name: "A" });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.name"))).toBe(true);
  });

  it("validate() fails when name is too long", () => {
    const product = new Product({ ...validProps(), name: "A".repeat(121) });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.name"))).toBe(true);
  });

  it("validate() fails when description is too long", () => {
    const product = new Product({ ...validProps(), description: "x".repeat(501) });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.description"))).toBe(true);
  });

  it("validate() fails when price is negative", () => {
    const product = new Product({ ...validProps(), price: -1 });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.price"))).toBe(true);
  });

  it("validate() fails when price has more than 2 decimals", () => {
    const product = new Product({ ...validProps(), price: 1.234 });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.price"))).toBe(true);
  });

  it("validate() fails when status is out of enum", () => {
    const product = new Product({ ...validProps(), status: "invalid" as never });
    const msgs = getValidationMessages(() => product.validate());
    expect(msgs.some((m) => m.includes("product.status"))).toBe(true);
  });

  it("clone() preserves id and createdAt, updates updatedAt", () => {
    const product = new Product(validProps());
    const cloned = product.clone({ name: "Camiseta Estampada" });
    expect(cloned.id).toBe(product.id);
    expect(cloned.createdAt).toEqual(product.createdAt);
    expect(cloned.name).toBe("Camiseta Estampada");
    expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(product.updatedAt.getTime());
  });

  it("equals() returns true for same id", () => {
    const product = new Product(validProps());
    const other = new Product({ ...validProps(), id: product.id });
    expect(product.equals(other)).toBe(true);
  });
});
