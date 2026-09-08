export const PROMPT_MAX_LENGTH = 500;

interface PromptValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePromptLength(prompt: string): PromptValidationResult {
  if (prompt.length > PROMPT_MAX_LENGTH) {
    return { valid: false, message: '프롬프트는 500자를 초과할 수 없습니다.' };
  }
  return { valid: true };
}
