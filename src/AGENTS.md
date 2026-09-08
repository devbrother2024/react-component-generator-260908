# src/AGENTS.md

## Module Context

React 19 + Vite 프론트엔드. `/api`로 시작하는 요청은 Vite dev 서버가 `server/`(Bun, 3002 포트)로 프록시한다(`vite.config.ts:9-14`). 이 디렉토리는 서버 로직을 직접 알지 못하며 오직 `fetch('/api/...')`로만 통신한다.

## Tech Stack & Constraints

- CSS: CSS 모듈/Tailwind/styled-components 없음. `App.css`, `index.css`에 전역 className과 CSS 변수(`--primary`, `--surface` 등, `App.css:1-18`)로만 스타일링한다. 새 컴포넌트도 이 변수를 재사용하는 className 방식을 따르라.
- 미리보기 렌더링은 `react-live`의 `LiveProvider ... noInline`(`LivePreview.tsx:14`)에 위임한다 — 이 디렉토리 안에서 생성된 코드를 직접 `eval`하거나 별도 샌드박스를 만들지 마라.

## Implementation Patterns

- `src/components/*`의 컴포넌트는 모두 **named export** 함수형 컴포넌트다 (`export function LivePreview(...)`, `export function ComponentCard(...)` 등). `App.tsx`만 엔트리포인트라 default export를 쓴다. 새 컴포넌트를 추가할 때 named export를 유지하라.
- Props는 컴포넌트 파일 상단에 `interface XxxProps`로 선언한다(`LivePreview.tsx:3-5`, `ComponentCard.tsx:6-11`).
- 상태 훅은 `{ 데이터, isLoading, error, 액션 함수들 }` 형태의 객체를 반환하고, 액션은 `useCallback`으로 감싼다(`useComponentGenerator.ts:13-59`). 새로운 데이터-fetch 훅도 이 shape을 따르라.

## Testing Strategy

- `@testing-library/react` + `@testing-library/user-event` + `vitest`(jsdom), 전역 셋업은 `src/test/setup.ts`(각 테스트 후 `cleanup()` 호출).
- 텍스트/역할 기반 쿼리를 사용한다: `screen.getByRole('button', { name: '컴포넌트 생성' })` 처럼 한국어 접근성 라벨로 조회한다(`PromptInput.test.tsx:9,18-19`). `data-testid`를 새로 추가하지 마라 — 기존 테스트는 role/name 쿼리 컨벤션을 따른다.
- `src` 전용 테스트만 실행: `bunx vitest run src`

## Local Golden Rules

- **Test Boundary:** `PromptInput.tsx`만 테스트가 있고(`PromptInput.test.tsx`), `LivePreview.tsx`, `CodeView.tsx`, `ComponentCard.tsx`, `useComponentGenerator.ts`, `App.tsx`는 테스트가 없다. 사용자 입력 검증이 있는 컴포넌트(폼, 버튼 활성/비활성 조건 등)를 새로 만들 때는 `PromptInput.test.tsx`와 같은 role 기반 테스트를 추가하는 관례를 따르라.
- **Hard Constraint:** `LivePreview.tsx`가 렌더링하는 `code`는 서버가 생성한 "import 없는 순수 JS + `render()` 종료" 형식이어야 한다(루트 `AGENTS.md` 참고). 이 디렉토리에서 `code` 문자열을 가공(예: 추가 변환, 이스케이프 처리)할 때 이 계약을 깨지 마라.
