export class BaseAppError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UnauthorizedError extends BaseAppError {
  constructor() {
    super('Unauthorized access');
  }
}

export class ValidationError extends BaseAppError {
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends BaseAppError {
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

