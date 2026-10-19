export function canModerateProperties(roles: readonly string[]): boolean {
  return roles.includes("admin");
}

export function isPublicProperty(property: { status: string; active: boolean }): boolean {
  return property.status === "approved" && property.active;
}