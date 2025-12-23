import { NextResponse, type NextResponseInit } from 'next/server';

import { logger } from '@/lib/logger';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'PLAN_LIMIT'
  | 'INTERNAL_ERROR';

export class ApiError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;

  constructor(message: string, status: number, code?: ApiErrorCode) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonOk<T>(data: T, init?: NextResponseInit) {
  return NextResponse.json(data, init);
}

export function jsonError(
  message: string,
  status = 500,
  code: ApiErrorCode = 'INTERNAL_ERROR',
  init?: NextResponseInit,
) {
  return NextResponse.json({ error: message, code }, { status, ...init });
}

export async function readJsonBody<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError('Invalid JSON body', 400, 'VALIDATION_ERROR');
  }
}

export function handleApiError(error: unknown, context: string, init?: NextResponseInit) {
  if (error instanceof ApiError) {
    logger.warn(`[API] ${context}: ${error.message}`, {
      status: error.status,
      code: error.code,
    });
    return jsonError(error.message, error.status, error.code ?? 'INTERNAL_ERROR', init);
  }

  logger.error(`[API] ${context}: Unhandled error`, {
    error: error instanceof Error ? error.message : String(error),
  });

  return jsonError('Internal server error', 500, 'INTERNAL_ERROR', init);
}
