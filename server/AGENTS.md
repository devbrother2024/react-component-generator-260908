# server/AGENTS.md

## Module Context

Bun 런타임 위에서 동작하는 단일 파일 API 프록시(`Bun.serve`, `server/index.ts`). 프론트엔드는 Vite 프록시(`/api` → `localhost:3002`)를 통해서만 이 서버에 접근한다.

## Tech Stack & Constraints

- 라우팅/미들웨어 프레임워크(Express, Hono 등) 없음. `Bun.serve`의 `fetch(req)` 안에서 `req.method` + `url.pathname`을 직접 분기한다(`index.ts:140-219`).
- CORS는 미들웨어가 아니라 상수 `CORS_HEADERS`(`index.ts:51-55`)를 **모든** 응답(`OPTIONS`, `/api/config`, `/api/generate` 성공/에러, 404)에 수동으로 스프레드해서 처리한다. 새 라우트/에러 분기를 추가할 때 `{ headers: CORS_HEADERS }`를 빠뜨리면 그 응답만 조용히 CORS가 깨진다.

## Implementation Patterns

- 프로바이더 호출 함수(`callAnthropic`, `callGoogleModel`)는 실패 시 커스텀 에러 클래스가 아니라 **HTTP 상태 코드를 메시지 문자열에 포함한 `Error`** 를 던진다 (예: `` `Claude API error: ${response.status}` ``, `index.ts:85`). 최상위 `catch` 블록(`index.ts:194-206`)은 `message.includes('503')` / `message.includes('429')`로 문자열 매칭해 사용자용 한국어 에러로 변환한다. 새 프로바이더를 추가할 때도 이 문자열 매칭 규약을 따르라 — 구조화된 에러 타입을 도입하려면 이 catch 블록도 함께 바꿔야 한다.
- 순수 로직(코드 정규화, 폴백 전략)은 `Bun.serve` 밖의 별도 파일(`generator.ts`, `fallback.ts`)로 분리하고, `index.ts`는 그 함수들을 호출만 한다(`index.ts:1-2`). 새 로직도 이 분리를 따르라.

## Testing Strategy

- 테스트는 로직 파일 옆에 `*.test.ts`로 co-locate (`generator.test.ts`, `fallback.test.ts`). `vitest`로 실행하며 서버를 띄울 필요 없음 — 순수 함수를 직접 import해서 검증한다.
- 서버만 테스트: `bunx vitest run server`

## Local Golden Rules

- **Test Boundary:** `generator.ts`/`fallback.ts`는 부수효과가 없어 테스트가 있지만(`generator.ts:1-2` 주석 참고), `index.ts`(`Bun.serve` 핸들러)는 테스트가 전혀 없다. `index.ts`의 `fetch` 함수에 분기 로직이나 비즈니스 로직을 직접 추가하지 마라 — 테스트 가능한 별도 함수로 뽑아라.
- **Asymmetry:** Google 경로만 다중 모델 폴백(`GOOGLE_MODELS`, `withModelFallback`, `index.ts:5,134-136`)을 가진다. Anthropic은 단일 모델을 직접 호출한다(`index.ts:68-96`). Anthropic에 폴백이 없다고 해서 버그로 판단해 임의로 "대칭"을 맞추지 마라 — 폴백이 필요하면 `withModelFallback`을 재사용하되, 별도 작업으로 명시적으로 다뤄라.
- **Security Boundary:** `resolveApiKey`(`index.ts:64-66`)는 `clientKey || ENV_KEYS[provider] || null` 순서다. 클라이언트가 보낸 키가 `.env` 키보다 항상 우선한다. 새 코드에서 이 우선순위를 뒤집거나, 실제 키 값을 응답/로그에 노출하지 마라(`/api/config`는 boolean만 반환, `index.ts:147-157`).
