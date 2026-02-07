const GENERIC_COMMAND_CONFIRM_REASON = "Command execution requires confirmation";

export function formatConfirmReason(reason: string): string {
  if (reason === GENERIC_COMMAND_CONFIRM_REASON) {
    return "Needs approval";
  }
  return reason;
}

export function formatConfirmPreview(preview?: string): string | undefined {
  if (!preview) return undefined;
  const normalized = preview.trim();
  if (!normalized) return undefined;

  if (normalized.startsWith("Run command:")) {
    const command = normalized
      .slice("Run command:".length)
      .trim()
      .replace(/\s*\n\s*/g, " ");
    return command ? `cmd: ${command}` : undefined;
  }

  return normalized.replace(/\s*\n\s*/g, " ");
}

export function shouldShowConfirmReason(
  reason: string,
  preview?: string,
): boolean {
  const normalizedPreview = formatConfirmPreview(preview);
  return !(reason === GENERIC_COMMAND_CONFIRM_REASON && normalizedPreview);
}
