type DebugSetting = string | null | undefined;

function normalizeDebugSetting(value: DebugSetting): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isDebugEnabled(scope?: string): boolean {
  const envVal = normalizeDebugSetting(import.meta.env.VITE_DEBUG);
  const storageVal = normalizeDebugSetting(localStorage.getItem('pytrader.debug'));
  const raw = envVal ?? storageVal;
  if (!raw) return false;

  const v = raw.toLowerCase();
  if (v === '1' || v === 'true' || v === '*' || v === 'all') return true;
  if (!scope) return true;

  const scopes = new Set(
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return scopes.has(scope.toLowerCase()) || scopes.has('all') || scopes.has('*');
}

export function debugLog(scope: string, message: string, meta?: unknown): void {
  if (!isDebugEnabled(scope)) return;
  const prefix = `[pytrader:${scope}]`;
  if (meta === undefined) {
    console.log(prefix, message);
    return;
  }
  console.log(prefix, message, meta);
}

export function createRequestId(prefix = 'req'): string {
  const cryptoAny = globalThis.crypto as any;
  if (cryptoAny?.randomUUID) {
    return `${prefix}-${cryptoAny.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
