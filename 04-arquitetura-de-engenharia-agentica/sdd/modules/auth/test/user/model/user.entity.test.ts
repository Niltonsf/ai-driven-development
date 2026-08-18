import { ValidationException } from "@sdd/shared";
import { User, UserState } from "../../../src/user/model/user.entity";

const BCRYPT_HASH =
  "$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ01234";

function validProps(): UserState {
  return {
    name: "João Silva",
    email: "joao@email.com",
    password: BCRYPT_HASH,
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

describe("User entity", () => {
  it("creates a valid user", () => {
    const user = new User(validProps());
    expect(user).toBeDefined();
  });

  it("returns correct getters", () => {
    const user = new User(validProps());
    expect(user.name).toBe("João Silva");
    expect(user.email).toBe("joao@email.com");
    expect(user.password).toBe(BCRYPT_HASH);
  });

  it("inherits id, createdAt, updatedAt from base entity", () => {
    const user = new User(validProps());
    expect(user.id).toBeDefined();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toBeInstanceOf(Date);
    expect(user.deletedAt).toBeNull();
  });

  it("accepts explicit id and timestamps", () => {
    const id = "550e8400-e29b-41d4-a716-446655440000";
    const now = new Date("2024-01-01T00:00:00Z");
    const user = new User({ ...validProps(), id, createdAt: now, updatedAt: now });
    expect(user.id).toBe(id);
    expect(user.createdAt).toEqual(now);
    expect(user.updatedAt).toEqual(now);
  });

  it("allows entity to exist before validate() is called (lazy)", () => {
    expect(() => new User({ name: "", email: "", password: "" })).not.toThrow();
  });

  it("validate() succeeds for valid data", () => {
    const user = new User(validProps());
    expect(() => user.validate()).not.toThrow();
  });

  it("validate() fails when name is empty", () => {
    const user = new User({ ...validProps(), name: "" });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.name"))).toBe(true);
  });

  it("validate() fails when name is too short", () => {
    const user = new User({ ...validProps(), name: "AB" });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.name"))).toBe(true);
  });

  it("validate() fails when name is too long", () => {
    const user = new User({ ...validProps(), name: "A".repeat(81) });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.name"))).toBe(true);
  });

  it("validate() fails when name contains invalid characters", () => {
    const user = new User({ ...validProps(), name: "J0ão 123" });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.name"))).toBe(true);
  });

  it("validate() fails when email is empty", () => {
    const user = new User({ ...validProps(), email: "" });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.email"))).toBe(true);
  });

  it("validate() fails when email is invalid format", () => {
    const user = new User({ ...validProps(), email: "not-an-email" });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.email"))).toBe(true);
  });

  it("validate() fails when password is not a bcrypt hash", () => {
    const user = new User({ ...validProps(), password: "plaintext123" });
    const msgs = getValidationMessages(() => user.validate());
    expect(msgs.some((m) => m.includes("user.password"))).toBe(true);
  });

  it("validate() succeeds when password is empty (BcryptHashRule skips empty)", () => {
    const user = new User({ ...validProps(), password: "" });
    expect(() => user.validate()).not.toThrow();
  });

  it("clone() preserves id and createdAt, updates updatedAt", () => {
    const user = new User(validProps());
    const cloned = user.clone({ name: "Maria Souza" });
    expect(cloned.id).toBe(user.id);
    expect(cloned.createdAt).toEqual(user.createdAt);
    expect(cloned.name).toBe("Maria Souza");
    expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(
      user.updatedAt.getTime(),
    );
  });

  it("equals() returns true for same id", () => {
    const user = new User(validProps());
    const other = new User({ ...validProps(), id: user.id });
    expect(user.equals(other)).toBe(true);
  });

  it("equals() returns false for different id", () => {
    const user = new User(validProps());
    const other = new User(validProps());
    expect(user.equals(other)).toBe(false);
  });
});
