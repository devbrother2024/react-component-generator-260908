# PR Template (English / OSS project)

Use for external open-source projects or any repo where the maintainers communicate in English.
Follow the structure below, but omit any section that has no content (e.g. Screenshots, Related issue) entirely — don't fill an empty section with "N/A".

## Title format

```
<type>: <summary>
```

- Only use a Conventional Commits–style prefix (`feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`) if the target repo's existing merged PRs (`gh pr list --state merged`) actually use that style. Many OSS repos don't — if recent PR titles are plain descriptive sentences, match that instead of imposing a convention the maintainers don't use.
- Keep it short (under ~70 characters) and specific — it should make sense standing alone in a PR list.

## Body format

```markdown
## Summary
<1-3 bullet points: what changed and why it's needed>

## Changes
- <change 1>
- <change 2>

## Test plan
- [ ] <verification step 1 — command run or scenario checked>
- [ ] <verification step 2>

## Related issue
Closes #<issue number>

## Screenshots
<only if there are UI changes>

## Notes for reviewers
<anything reviewers should pay special attention to, design tradeoffs, open questions. Omit the section if none>
```

## Writing principles

- Only state what's actually verifiable from the commits/diff. Don't speculate about code you haven't read.
- Favor "why" over "what" — the diff already shows what changed; the body should carry context a diff can't.
- Match the target repo's existing tone and contribution norms if a `CONTRIBUTING.md` or prior PRs give a clear signal (e.g. required DCO sign-off mention, issue-linking format).
