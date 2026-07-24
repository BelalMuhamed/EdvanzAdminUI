/** Super Admin login credentials. The backend authenticates by userName. */
export interface LoginRequest {
  userName: string;
  password: string;
}

/**
 * Auth payload returned by the admin-login endpoint. Mirrors the backend
 * `AuthResponse`. `userAccountData` shape is not yet modelled — fill in
 * `UserLoginDto` when its fields are known if you want server-provided
 * identity; navigation currently derives the user from the JWT claims.
 */
export interface AuthResult {
  refreshToken?: string;
  accessToken: string;
  userAccountData?: UserLoginDto;
}

/** Placeholder for the backend `UserLoginDto`. Extend with real fields. */
export interface UserLoginDto {
  [key: string]: unknown;
}

/** The current, in-memory authenticated user. */
export interface CurrentUser {
  displayName: string;
  email: string;
  roles: string[];
}

/** Standard JWT claim shape after base64 decoding the payload segment. */
export interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  /** Standard `exp` claim — seconds since epoch. */
  exp?: number;
  /** Role(s): the .NET default role claim URI or a plain `role`/`roles` key. */
  role?: string | string[];
  roles?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  [key: string]: unknown;
}
/**
 * SuperAdmin-initiated forced password reset (POST /api/Auth/admin/force-change-password).
 * No old-password verification — `userId` targets the account (the User row id, not a
 * Teacher/Student id); the acting admin is resolved from the JWT. Mirrors the backend
 * `ForceChangePasswordDto`, including its password complexity rule: min 8 chars, at
 * least one uppercase, one lowercase, one digit, one special character.
 */
export interface ForceChangePasswordRequest {
  userId: number;
  newPassword: string;
  confirmPassword: string;
}
