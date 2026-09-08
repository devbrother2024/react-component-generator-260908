import type { GeneratedComponent, Provider } from '../types';

const KEYS = {
  apiKeys: 'rcg:apiKeys',
  provider: 'rcg:provider',
  promptHistory: 'rcg:promptHistory',
  components: 'rcg:components',
} as const;

export const PROMPT_HISTORY_MAX = 20;

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 접근 불가(프라이빗 모드 등) 시 저장을 건너뛴다
  }
}

export function addPromptToHistory(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;
  const deduped = history.filter((p) => p !== trimmed);
  return [trimmed, ...deduped].slice(0, PROMPT_HISTORY_MAX);
}

export function loadApiKeys(): Partial<Record<Provider, string>> {
  return readJSON(KEYS.apiKeys, {});
}

export function saveApiKey(provider: Provider, apiKey: string): void {
  writeJSON(KEYS.apiKeys, { ...loadApiKeys(), [provider]: apiKey });
}

export function loadProvider(): Provider | null {
  return readJSON<Provider | null>(KEYS.provider, null);
}

export function saveProvider(provider: Provider): void {
  writeJSON(KEYS.provider, provider);
}

export function loadPromptHistory(): string[] {
  return readJSON<string[]>(KEYS.promptHistory, []);
}

export function savePromptHistory(history: string[]): void {
  writeJSON(KEYS.promptHistory, history);
}

export function loadComponents(): GeneratedComponent[] {
  const raw = readJSON<Array<Omit<GeneratedComponent, 'createdAt'> & { createdAt: string }>>(
    KEYS.components,
    [],
  );
  return raw.map((c) => ({ ...c, createdAt: new Date(c.createdAt) }));
}

export function saveComponents(components: GeneratedComponent[]): void {
  writeJSON(KEYS.components, components);
}
