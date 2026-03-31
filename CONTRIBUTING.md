# Contributing to pretext-native

Thank you for your interest in contributing to pretext-native! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js >= 18
- Yarn 4 (Corepack)
- Xcode 15+ (for iOS development)
- Android Studio (for Android development)
- Ruby (for CocoaPods)

### Clone and Install

```bash
git clone https://github.com/hexdrinker/pretext-native.git
cd pretext-native
corepack enable
yarn install
```

### Build

```bash
yarn build
```

### Test

```bash
yarn test
```

### Typecheck

```bash
yarn typecheck
```

### Lint

```bash
yarn lint
```

## Project Structure

```
pretext-native/
├── packages/
│   ├── core/             # Platform-independent layout engine (@hexdrinker/pretext-native-core)
│   │   ├── src/
│   │   │   ├── tokenizer.ts      # Text tokenization (words, CJK, emoji)
│   │   │   ├── lineBreaker.ts    # Line breaking
│   │   │   ├── layoutCalc.ts     # Layout calculation
│   │   │   └── cache.ts          # Two-tier LRU cache
│   │   └── __tests__/
│   ├── pretext-native/   # React Native bindings (pretext-native)
│   │   ├── src/
│   │   │   ├── measureText.ts    # Native measurement API
│   │   │   ├── useTextLayout.ts  # React hook
│   │   │   └── jsAdapter.ts      # JS fallback adapter
│   │   ├── ios/                  # iOS native module (CoreText)
│   │   └── android/              # Android native module (StaticLayout)
│   └── example/          # Demo app
└── turbo.json
```

## How to Contribute

### Reporting Issues

- Bug reports, feature requests, and questions are all welcome.
- For bug reports, please include reproduction steps and environment details (OS, RN version, etc.).

### Pull Requests

1. Fork this repository.
2. Create a feature branch.

```bash
git checkout -b feat/my-feature
```

3. Commit your changes.

```bash
git commit -m "feat: add my feature"
```

4. Push the branch and create a Pull Request.

```bash
git push origin feat/my-feature
```

### Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/).

| Prefix     | Purpose                              |
|-----------|--------------------------------------|
| `feat`    | New feature                          |
| `fix`     | Bug fix                              |
| `docs`    | Documentation changes                |
| `refactor`| Refactoring (no behavior change)     |
| `test`    | Add or update tests                  |
| `chore`   | Build, CI, packages, and other tasks |
| `perf`    | Performance improvements             |

Examples:

```
feat: add batch measurement API
fix: resolve iOS crash on TurboModule input parsing
docs: update contributing guide
```

### Branch Naming

```
feat/feature-name
fix/bug-description
docs/doc-description
refactor/target
```

## Running the Example App

### iOS

```bash
cd example
yarn install
cd ios && bundle install && bundle exec pod install && cd ..
yarn ios
```

### Android

```bash
cd example
yarn install
yarn android
```

## Code Style

- TypeScript strict mode
- Prettier for formatting (auto-format on save recommended)
- Naming: camelCase (variables/functions), PascalCase (types/components)

## Testing Guide

- Please include tests with new features.
- `packages/core/__tests__/` — Core engine tests
- `packages/pretext-native/__tests__/` — RN binding tests
- Make sure `yarn test` passes before submitting a PR.

## Release Process

1. Add changes to `CHANGELOG.md`
2. Update version in `package.json`
3. Create and push a git tag in `v*` format

```bash
git tag v0.1.0
git push origin v0.1.0
```

4. GitHub Actions will automatically publish to npm and create a GitHub Release.

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project.
