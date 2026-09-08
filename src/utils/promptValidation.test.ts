import { describe, it, expect } from 'vitest';
import { validatePromptLength, PROMPT_MAX_LENGTH } from './promptValidation';

describe('validatePromptLength', () => {
  it('500자 이하이면 valid: true를 반환한다', () => {
    const result = validatePromptLength('a'.repeat(PROMPT_MAX_LENGTH));
    expect(result.valid).toBe(true);
  });

  it('500자를 초과하면 valid: false와 에러 메시지를 반환한다', () => {
    const result = validatePromptLength('a'.repeat(PROMPT_MAX_LENGTH + 1));
    expect(result.valid).toBe(false);
    expect(result.message).toBe('프롬프트는 500자를 초과할 수 없습니다.');
  });
});
