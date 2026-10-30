export const USER_ROLES = [
  "SUPER_ADMIN",
  "PROJECT_ADMIN",
  "QA_TESTER",
  "VIEWER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function normalizeUserRole(role: string): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : "QA_TESTER";
}
