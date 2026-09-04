export class Result<T> {
  constructor(
    private readonly _instance?: T | null,
    private _errors?: string[],
  ) {}

  static ok<T>(instance?: T): Result<T> {
    return new Result<T>(instance ?? null);
  }

  static fail<T>(e: string | string[]): Result<T> {
    const erro = typeof e === 'string' ? [e] : e;
    return new Result<T>(undefined, Array.isArray(erro) ? erro : [erro]);
  }

  static empty<T>(): Result<T> {
    return new Result<T>(null);
  }

  get instance(): T {
    return this._instance!;
  }

  get errors(): string[] {
    const semErros = !this._errors || this._errors.length === 0;
    if (semErros && this._instance === undefined) {
      return ['RESULT_UNDEFINED'];
    }
    return this._errors as string[];
  }

  get isOk(): boolean {
    return !this.errors;
  }

  get isFailure(): boolean {
    return !!this.errors;
  }

  get withFail(): Result<any> {
    return Result.fail<any>(this.errors!);
  }

  toString(): string {
    if (this.isOk) {
      return `Result.ok(${JSON.stringify(this._instance)})`;
    } else {
      return `Result.fail(${JSON.stringify(this._errors)})`;
    }
  }
}
