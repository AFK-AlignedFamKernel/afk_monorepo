export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  INVALID_EVENT: 'INVALID_EVENT',
  INVALID_EVENT_SIGNATURE: 'INVALID_EVENT_SIGNATURE',
  INVALID_EVENT_CONTENT: 'INVALID_EVENT_CONTENT',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  DEPOSIT_NOT_FOUND: 'DEPOSIT_NOT_FOUND',
  INVALID_GAS_AMOUNT: 'INVALID_GAS_AMOUNT',
  TRANSACTION_ERROR: 'TRANSACTION_ERROR',
  ESTIMATION_ERROR: 'ESTIMATION_ERROR',
  NO_ROUTE_FOUND: 'NO_ROUTE_FOUND',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorCode = {
  ...ErrorCodes,
  isErrorCode: (code: string): code is ErrorCode => code in ErrorCodes,
};

// Type guard function
export function isErrorCode(code: string): code is ErrorCode {
  return code in ErrorCodes;
}
