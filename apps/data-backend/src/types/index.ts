export interface UserJwtPayload {
  id: string;
  userAddress: string;
  iat?: number;
  exp?: number;
}
