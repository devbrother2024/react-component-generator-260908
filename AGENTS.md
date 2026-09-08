# AGENTS.md

## Operational Commands

- Package manager: **bun** (`bun.lock` present). Do not use npm/yarn/pnpm.
- `bun install` — 의존성 설치
- `bun run dev` — API 서버(3002) + Vite(5173) 동시 실행 (`concurrently`)
- `bun run server` — API 서버만 실행 (`bun --watch run server/index.ts`)
- `bun run build` — `tsc -b && vite build`
- `bun run lint` — eslint
- `bun test` — `vitest run` (server + src 테스트 모두 포함, `vite.config.ts`의 `test.include` 참고)
- `bun run test:watch` — vitest watch 모드

## Golden Rules

### Security Boundary — API 키를 클라이언트로 노출하지 마라
`GET /api/config`는 키 존재 여부만 boolean으로 반환한다 (`server/index.ts:147-157`, `envKeys: { anthropic: !!..., google: !!... }`). 실제 키 값을 응답, 로그, 에러 메시지에 포함하지 마라. `resolveApiKey`(`server/index.ts:64-66`)는 클라이언트가 보낸 `apiKey`가 서버 `.env` 값보다 우선한다는 점도 유의: 새 프로바이더를 추가할 때 이 우선순위(`clientKey || ENV_KEYS[provider] || null`)를 그대로 따르라.

### Hard Constraint — 생성 코드는 import 없는 순수 JS + `render()` 종료여야 한다
`SYSTEM_PROMPT`(`server/index.ts:9-20`)는 "no import statements", "no TypeScript syntax", "call render(<ComponentName />) at the end"를 명시한다. 이는 `LivePreview.tsx:14`의 `<LiveProvider code={code} noInline>`가 코드를 브라우저에서 즉시 실행하며 React를 전역으로 주입하기 때문이다. 시스템 프롬프트나 코드 생성 파이프라인을 수정할 때 이 계약(무-import, 순수 JS, `render()` 호출로 종료)을 깨면 미리보기가 즉시 broken 상태가 된다.

### Double Defense — 프롬프트 지시와 후처리 안전장치를 둘 다 유지하라
모델에게 "마크다운 펜스 없이 응답하라"(`server/index.ts:16`), "render() 호출로 끝내라"(`server/index.ts:13`)고 지시하지만, 동시에 `server/generator.ts`의 `stripCodeFences`와 `ensureRenderCall`이 각각 같은 문제를 후처리로 재차 방어한다. LLM 출력은 지시를 어길 수 있으므로, 한쪽(프롬프트 지시 또는 후처리 함수)이 있다고 다른 쪽을 제거하지 마라.

### Asymmetry — Google과 Anthropic 경로는 대칭이 아니다
Google 호출은 `GOOGLE_MODELS` 배열(`server/index.ts:5`)과 `withModelFallback`(`server/index.ts:134-136`)로 다중 모델 폴백을 갖지만, Anthropic은 단일 모델을 폴백 없이 직접 호출한다(`server/index.ts:68-96`, `callAnthropic`은 `withModelFallback`을 쓰지 않음). 두 프로바이더가 동일한 견고성을 가진다고 가정하지 마라. Anthropic에 폴백을 추가하려면 `withModelFallback`(`server/fallback.ts`) 패턴을 재사용하라.

### Test Boundary — 서버 로직은 순수 함수로 분리해야 테스트가 가능하다
`server/generator.ts:1-2`의 주석대로 "부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다" — 실제로 `generator.ts`와 `fallback.ts`는 각각 `generator.test.ts`/`fallback.test.ts`로 테스트되지만, `Bun.serve` 핸들러가 있는 `server/index.ts`는 테스트가 전혀 없다. `src` 쪽도 동일한 패턴이다: `PromptInput.test.tsx`만 존재하고 `LivePreview.tsx`, `CodeView.tsx`, `ComponentCard.tsx`, `useComponentGenerator.ts`, `App.tsx`는 테스트가 없다. 새 로직을 추가할 때 가능하면 부수효과 없는 순수 함수로 뽑아 `generator.ts`/`fallback.ts` 같은 파일에 두고 테스트를 추가하라. `index.ts`의 `fetch` 핸들러에 비즈니스 로직을 직접 쌓지 마라.

## Context Map

- **[API 프록시 서버 수정 (server/)](./server/AGENTS.md)** — `Bun.serve`, 프로바이더 호출, 폴백/에러 처리 로직 작업 시.
- **[프론트엔드 컴포넌트/훅 수정 (src/)](./src/AGENTS.md)** — React 컴포넌트, `useComponentGenerator`, 미리보기 렌더링 작업 시.

## Project Context

프롬프트를 입력하면 AI(Anthropic Claude 또는 Google Gemini)가 React 컴포넌트를 생성하고, `react-live`로 실시간 미리보기 및 코드를 제공하는 도구.

Tech Stack: React 19, TypeScript, Vite, Bun (API 프록시 서버), react-live, Vitest, ESLint.

## Standards & References

- 코딩 컨벤션/설치/실행 방법: [README.md](./README.md) 참고.
- Git 커밋 메시지: 저장소 첫 커밋(`846a2ec init: ...`)이 `<type>: <한국어 설명>` 형식을 사용한다. 동일 형식을 따르라.
- **Maintenance Policy:** 코드를 수정하다가 위 Golden Rules와 실제 동작이 어긋난 것을 발견하면, 이 파일의 해당 규칙을 갱신하도록 제안하라.
