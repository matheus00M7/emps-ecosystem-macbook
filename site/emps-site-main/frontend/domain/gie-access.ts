export function canAccessGie(email: unknown): boolean {
  return typeof email === 'string' && email.trim().toLowerCase() === 'admin.dev@emps.local';
}
