/**
 * Safely parses a value to float with validation
 * @param value - Value to parse
 * @param fieldName - Name of the field for error messages
 * @returns Parsed number
 * @throws Error if value cannot be parsed to a valid number
 */
export function safeParseFloat(value: any, fieldName: string): number {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || !isFinite(parsed)) {
    throw new Error(`Invalid numeric value for ${fieldName}: ${value}`);
  }
  return parsed;
}
