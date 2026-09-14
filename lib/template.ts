// Fills {token} placeholders in an admin-edited template string.
// Unknown/missing tokens are left as-is rather than silently
// dropped, so a typo in the admin panel is visible instead of
// quietly eating part of the message. Kept dependency-free (no
// prisma import) so client components can use it directly.
export function fillTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match
  );
}
