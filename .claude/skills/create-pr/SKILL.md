---
name: create-pr
description: |
  현재 브랜치의 변경사항으로 GitHub PR을 생성한다. 저장소가 내부 프로젝트인지 해외 오픈소스 프로젝트인지 판별해 references/의 한국어 또는 영어 PR 템플릿을 골라 제목·본문 초안을 작성하고, 사용자 승인을 받은 뒤 fork 서브에이전트에게 push + `gh pr create` 실행을 위임한다.
  "PR 만들어줘", "PR 생성해줘", "pull request 열어줘", "이 브랜치로 PR 올려줘", "create a PR", "open a pull request" 같은 요청에 반드시 사용한다. 이미 열려 있는 PR의 리뷰 코멘트 반영 요청("리뷰 반영해줘", "review 처리")에는 사용하지 않는다 — 그건 autofix 스킬의 영역이다.
context: fork
---

# create-pr: 템플릿 기반 PR 생성

현재 작업 디렉토리의 git 저장소를 기준으로, 지금 브랜치의 변경사항을 요약해 PR을 생성한다. 특정 프로젝트를 가정하지 않는다.

PR 생성은 다른 사람(리뷰어, 팀)에게 즉시 노출되는 되돌리기 번거로운 행동이다. **초안 작성까지는 메인 에이전트가 하고, 실제 push/`gh pr create` 실행은 사용자 승인 후에만, 그리고 항상 fork 서브에이전트에게 위임한다.** 이렇게 나누는 이유는 두 가지다: (1) push나 `gh pr create` 실행 결과, 실패 로그 같은 무거운 출력이 메인 대화 컨텍스트를 차지하지 않게 하고, (2) fork는 지금까지의 대화 맥락(분석한 diff, 커밋 이력, 승인된 제목/본문)을 그대로 물려받으므로 다시 설명할 필요가 없다.

## Step 0: 사전 확인

1. `git rev-parse --is-inside-work-tree`로 git 저장소인지 확인한다. 아니면 안내 후 종료.
2. `gh auth status`로 GitHub CLI 인증 여부를 확인한다. 인증돼 있지 않으면 사용자에게 알리고 종료(로그인은 사용자 몫).
3. 현재 브랜치와 base 브랜치(대개 `main`/`master`, `gh repo view --json defaultBranchRef`로 확인 가능)를 파악한다. 현재 브랜치가 base 브랜치 자체라면 PR을 만들 수 없으니 새 브랜치가 필요함을 알리고 종료한다.
4. 저장소 루트의 `AGENTS.md`/`CLAUDE.md`에 PR·커밋 컨벤션이 명시돼 있으면 이 스킬의 기본 템플릿보다 그 지침을 우선한다.

## Step 1: 템플릿 언어 판별 — 내부 프로젝트 vs 해외 오픈소스

기본값은 **한국어 템플릿**(`references/pr_template_ko.md`)이다. 다음 신호가 있으면 **영어 템플릿**(`references/pr_template_en.md`)으로 전환한다:

- `git remote -v`에 `upstream`처럼 origin과 다른 소유자를 가리키는 remote가 있다 (개인 fork → 원본 OSS 프로젝트에 기여하는 전형적 패턴).
- `gh repo view --json owner,isFork,description`으로 확인한 저장소 소유자가 사용자/팀 소속이 아니거나, 저장소가 fork이다.
- `README.md`/`CONTRIBUTING.md`가 영어로 작성돼 있고, 최근 병합된 PR 제목·본문(`gh pr list --state merged --limit 10`)이 대부분 영어다.

신호가 상충하거나 판단이 애매하면(예: 내부 저장소인데 README만 영어인 경우 등) 추측하지 말고 사용자에게 어느 언어로 작성할지 짧게 물어본다 — PR은 게시되면 언어를 바꾸기 번거로우므로 애매할 때 넘겨짚지 않는다.

## Step 2: 변경사항 분석

가벼운 명령으로 필요한 정보만 모은다 (전체 diff를 통째로 읽어 컨텍스트를 낭비하지 않는다):

- `git log <base>..HEAD --oneline` — 이 브랜치에 담긴 커밋 목록.
- `git diff <base>...HEAD --stat` — 변경 규모와 어떤 파일들이 바뀌었는지 개관.
- 커밋 메시지만으로 "왜"가 불충분하면, 관련된 파일의 `git diff <base>...HEAD -- <path>`를 선택적으로 읽어 배경을 보충한다. 스킬을 실행하기까지 오간 대화에 변경 배경(요구사항, 버그 재현 등)이 있으면 그 맥락도 함께 반영한다.
- 로컬 커밋이 아직 origin에 push되지 않았을 수 있다 — `git status -sb`로 ahead/behind, push 필요 여부를 확인해둔다(실제 push는 Step 4의 fork가 수행).

## Step 3: 초안 작성 및 사용자 승인

Step 1에서 고른 템플릿 파일을 읽고, 그 구조를 그대로 따라 제목과 본문 초안을 작성한다. 내용 없는 섹션은 템플릿 지침대로 생략한다.

초안을 사용자에게 보여주고 승인을 받는다:

```
PR 초안 ({ko|en} 템플릿, {base} ← {현재 브랜치})

제목: <초안 제목>

---
<초안 본문>
---
```

사용자 선택지:
- **승인**: 그대로 Step 4 진행.
- **수정 요청**: 피드백 반영 후 다시 제시.
- **취소**: 아무 것도 실행하지 않고 종료.

승인 없이는 절대 push나 `gh pr create`를 실행하지 않는다.

## Step 4: fork 서브에이전트에게 생성 위임

Agent 도구를 `subagent_type: "fork"`로 호출해 다음을 지시한다 (fork는 지금까지의 분석·승인된 제목/본문을 이미 알고 있으므로 다시 설명할 필요 없이 실행 지시만 명확히 준다):

- 현재 브랜치가 origin에 push되지 않았거나 ahead 상태이면 `git push -u origin <branch>`로 push한다.
- 승인된 제목/본문 그대로 `gh pr create --title "<제목>" --body "$(cat <<'EOF' ... EOF)"` 형태로 PR을 생성한다(본문은 heredoc으로 전달해 따옴표·개행 문제를 피한다).
- base 브랜치를 명시적으로 지정한다(`--base <base>`), draft 여부는 사용자가 명시하지 않았다면 일반 PR로 생성한다.
- 생성된 PR URL을 결과로 보고한다. 실패하면(권한, 이미 존재하는 PR 등) 원인과 `gh` 출력 요지를 보고한다.
- **push나 PR 생성 자체를 벗어난 추가 작업(다른 브랜치 정리, 코드 수정 등)은 하지 않는다** — 범위는 이 PR 생성 하나로 한정한다.

fork의 보고를 받으면 PR URL을 사용자에게 전달한다. 실패했다면 원인을 설명하고, 필요시 Step 3으로 돌아가 초안을 조정하거나 사용자에게 다음 조치를 확인한다.

## 참고

- 이미 열린 PR이 있는 브랜치에서 다시 실행하면 `gh pr create`가 실패한다 — fork의 실패 보고를 통해 이를 알아채고, 이미 PR이 있다는 사실과 URL(`gh pr view --json url` 등으로 조회 가능)을 사용자에게 안내한다. 기존 PR을 덮어쓰거나 강제로 새로 만들지 않는다.
- 템플릿 자체를 수정해야 할 일이 생기면(팀 컨벤션 변경 등) `references/pr_template_ko.md` / `references/pr_template_en.md`만 고치면 된다 — 이 SKILL.md의 워크플로우는 바꿀 필요 없다.
