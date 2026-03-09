export type AppError =
  | DatabaseError
  | ValidationError
  | NotFoundError
  | UnauthorizedError
  | ConflictError

export type DatabaseError = {
  type: 'DATABASE_ERROR'
  message: string
  cause?: unknown
}

export type ValidationError = {
  type: 'VALIDATION_ERROR'
  message: string
  issues: Array<{ path: string; message: string }>
}

export type NotFoundError = {
  type: 'NOT_FOUND'
  entity: string
  id: string
}

export type UnauthorizedError = {
  type: 'UNAUTHORIZED'
  message: string
}

export type ConflictError = {
  type: 'CONFLICT'
  message: string
}

export function databaseError(message: string, cause?: unknown): DatabaseError {
  return { type: 'DATABASE_ERROR', message, cause }
}

export function validationError(message: string, issues: ValidationError['issues']): ValidationError {
  return { type: 'VALIDATION_ERROR', message, issues }
}

export function notFoundError(entity: string, id: string): NotFoundError {
  return { type: 'NOT_FOUND', entity, id }
}

export function unauthorizedError(message: string): UnauthorizedError {
  return { type: 'UNAUTHORIZED', message }
}

export function conflictError(message: string): ConflictError {
  return { type: 'CONFLICT', message }
}

