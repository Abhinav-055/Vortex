export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};
