export function normalizeUsername(username: string): string {
  const value = username.trim().toLocaleLowerCase();
  return value.startsWith("@") ? value : `@${value}`;
}

export function isBlocked(blockedUsers: string[], username: string): boolean {
  const normalizedUsername = normalizeUsername(username);
  return blockedUsers.some((blocked) => normalizeUsername(blocked) === normalizedUsername);
}
