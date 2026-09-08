// PreToolUse 훅: Write/Edit 대상이 .ts/.tsx 파일일 때 TDD 규칙(.claude/rules/tdd.md) 재확인 리마인더를 주입한다.
const input = await new Response(Bun.stdin).text();

let data: { tool_input?: { file_path?: string } };
try {
  data = JSON.parse(input);
} catch {
  process.exit(0);
}

const filePath = data.tool_input?.file_path;
if (!filePath || !/\.(ts|tsx)$/.test(filePath)) {
  process.exit(0);
}

const additionalContext = `[TDD 리마인더] "${filePath}"는 .ts/.tsx 파일입니다. 코드를 작성/수정하기 전에 .claude/rules/tdd.md의 TDD 규칙을 다시 확인하세요.
- 비즈니스 로직(조건 분기·계산·상태 전이), API 엔드포인트/핸들러, 유틸리티 함수, 버그 수정이라면 TDD 필수 적용 대상입니다: 실패하는 테스트(RED)를 먼저 작성했는지 확인하세요.
- 타입 정의(.d.ts), 설정 파일, 로직 없는 순수 프레젠테이셔널 컴포넌트라면 TDD 적용 대상이 아닙니다.
- 테스트보다 프로덕션 코드를 먼저 작성했다면, 규칙에 따라 해당 코드를 삭제하고 RED부터 다시 시작하세요.`;

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      additionalContext,
    },
  }),
);
