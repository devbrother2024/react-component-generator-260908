import { describe, it, expect, beforeEach } from 'vitest';
import {
  addPromptToHistory,
  loadApiKeys,
  saveApiKey,
  loadProvider,
  saveProvider,
  loadPromptHistory,
  savePromptHistory,
  loadComponents,
  saveComponents,
  PROMPT_HISTORY_MAX,
} from './storage';
import type { GeneratedComponent } from '../types';

beforeEach(() => {
  localStorage.clear();
});

describe('addPromptToHistory', () => {
  it('빈 히스토리에 새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPromptToHistory([], '프로필 카드')).toEqual(['프로필 카드']);
  });

  it('이미 존재하는 프롬프트는 중복 추가하지 않고 맨 앞으로 이동한다', () => {
    const history = ['b', 'a', 'c'];
    expect(addPromptToHistory(history, 'a')).toEqual(['a', 'b', 'c']);
  });

  it(`히스토리는 최대 ${PROMPT_HISTORY_MAX}개까지만 유지한다`, () => {
    const history = Array.from({ length: PROMPT_HISTORY_MAX }, (_, i) => `prompt-${i}`);
    const result = addPromptToHistory(history, 'new-prompt');
    expect(result).toHaveLength(PROMPT_HISTORY_MAX);
    expect(result[0]).toBe('new-prompt');
    expect(result).not.toContain(`prompt-${PROMPT_HISTORY_MAX - 1}`);
  });

  it('공백뿐인 프롬프트는 추가하지 않는다', () => {
    expect(addPromptToHistory(['a'], '   ')).toEqual(['a']);
  });
});

describe('apiKeys 저장/조회', () => {
  it('저장한 값이 없으면 빈 객체를 반환한다', () => {
    expect(loadApiKeys()).toEqual({});
  });

  it('provider별로 키를 저장하고 조회할 수 있다', () => {
    saveApiKey('anthropic', 'sk-ant-test');
    saveApiKey('google', 'AIza-test');
    expect(loadApiKeys()).toEqual({ anthropic: 'sk-ant-test', google: 'AIza-test' });
  });
});

describe('provider 저장/조회', () => {
  it('저장한 값이 없으면 null을 반환한다', () => {
    expect(loadProvider()).toBeNull();
  });

  it('저장한 provider를 그대로 조회한다', () => {
    saveProvider('anthropic');
    expect(loadProvider()).toBe('anthropic');
  });
});

describe('promptHistory 저장/조회', () => {
  it('저장한 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadPromptHistory()).toEqual([]);
  });

  it('저장한 히스토리를 그대로 조회한다', () => {
    savePromptHistory(['a', 'b']);
    expect(loadPromptHistory()).toEqual(['a', 'b']);
  });
});

describe('components 저장/조회', () => {
  it('저장한 값이 없으면 빈 배열을 반환한다', () => {
    expect(loadComponents()).toEqual([]);
  });

  it('저장한 컴포넌트를 조회하면 createdAt이 Date 인스턴스로 복원된다', () => {
    const components: GeneratedComponent[] = [
      { id: '1', prompt: 'p', code: 'render(<div />)', createdAt: new Date('2026-01-01T00:00:00.000Z') },
    ];
    saveComponents(components);

    const result = loadComponents();
    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(result[0].id).toBe('1');
    expect(result[0].code).toBe('render(<div />)');
  });
});

describe('손상된 데이터 처리', () => {
  it('JSON이 손상된 경우 fallback 값을 반환한다', () => {
    localStorage.setItem('rcg:promptHistory', '{invalid json');
    expect(loadPromptHistory()).toEqual([]);
  });
});
