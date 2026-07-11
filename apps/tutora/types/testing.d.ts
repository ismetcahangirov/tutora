// Explicitly pull Jest's ambient globals (describe/it/expect/jest) into the
// TypeScript program. Under pnpm + `moduleResolution: bundler`, `@types/jest`
// is not auto-discovered, so this reference makes test files type-check.
/// <reference types="jest" />
