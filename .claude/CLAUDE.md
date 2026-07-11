# Tutora — `.claude/` Index

This directory holds Claude Code configuration for **Tutora**. The authoritative
AI development guide is the root [`../CLAUDE.md`](../CLAUDE.md). This file is a
map of what lives here.

> **Tutora** is a modern platform that connects students and parents with trusted
> tutors through a fast, transparent, intelligent matching experience. Claude must
> act as a **Senior Software Engineer** and always prioritize Clean Architecture,
> readable & maintainable code, scalability, performance, security, strong
> TypeScript, and reusable components / business logic.

## Structure

```
.claude/
├── CLAUDE.md          ← you are here (index)
├── skills/            ← reusable skills Claude auto-applies
│   ├── brainstorming.md
│   ├── code-simplify.md
│   ├── code-reviewer.md
│   └── taste.md
├── prompts/           ← reusable prompt templates
│   ├── feature-planning.md
│   ├── bug-fix.md
│   ├── refactor.md
│   ├── ui-review.md
│   └── release.md
└── context/           ← deep project context
    ├── architecture.md
    ├── ui-guidelines.md
    ├── coding-standards.md
    ├── git-workflow.md
    └── project-rules.md
```

## How Claude should use this

1. **Before creative work** (features, components, architecture, DB/API design) →
   apply the [`brainstorming`](skills/brainstorming.md) skill.
2. **While implementing** → follow [`context/coding-standards.md`](context/coding-standards.md)
   and [`context/architecture.md`](context/architecture.md); keep complexity low with
   [`code-simplify`](skills/code-simplify.md).
3. **For UI** → follow [`context/ui-guidelines.md`](context/ui-guidelines.md) and the
   [`taste`](skills/taste.md) skill. **No gradients. Minimal, premium.**
4. **Before “done”** → run the [`code-reviewer`](skills/code-reviewer.md) skill and
   satisfy the Definition of Done in [`context/project-rules.md`](context/project-rules.md).
5. **Git & PRs** → follow [`context/git-workflow.md`](context/git-workflow.md).

## Enabled skills

`brainstorming` · `code-simplify` · `code-reviewer` · `taste`

The `taste` skill is vendored from <https://github.com/Leonxlnx/taste-skill>.
