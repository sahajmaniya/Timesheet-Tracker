export function resolveSupportEmail(raw?: string | null) {
  const value = (raw || "").trim();
  if (!value) return "";

  const bracketMatch = value.match(/<([^>]+)>/);
  if (bracketMatch?.[1]) return bracketMatch[1].trim();

  return value;
}

