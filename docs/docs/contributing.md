---
sidebar_position: 6
title: Contributing
---

# Contributing

Contributions are welcome! Please read the full [Contributing Guide on GitHub](https://github.com/hexdrinker/pretext-native/blob/main/CONTRIBUTING.md) before submitting a pull request.

## Quick Start

```bash
git clone https://github.com/hexdrinker/pretext-native.git
cd pretext-native
corepack enable
yarn install
yarn build
yarn test
```

## Project Structure

| Directory | Description |
|---|---|
| `packages/core` | Platform-independent layout engine |
| `packages/pretext-native` | React Native bindings (iOS/Android native modules) |
| `example` | Demo app with 6 screens |
| `docs` | This documentation site |

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`.

## Running the Example App

```bash
cd example
yarn install

# iOS
cd ios && bundle install && bundle exec pod install && cd ..
yarn ios

# Android
yarn android
```
