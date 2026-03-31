---
sidebar_position: 6
title: 기여하기
---

# 기여하기

기여를 환영합니다! Pull Request를 보내기 전에 GitHub의 [기여 가이드](https://github.com/hexdrinker/pretext-native/blob/main/CONTRIBUTING.md)를 읽어주세요.

## 빠른 시작

```bash
git clone https://github.com/hexdrinker/pretext-native.git
cd pretext-native
corepack enable
yarn install
yarn build
yarn test
```

## 프로젝트 구조

| 디렉토리 | 설명 |
|---|---|
| `packages/core` | 플랫폼 독립 레이아웃 엔진 |
| `packages/pretext-native` | React Native 바인딩 (iOS/Android 네이티브 모듈) |
| `example` | 11개 화면의 데모 앱 |
| `docs` | 이 문서 사이트 |

## 커밋 규칙

[Conventional Commits](https://www.conventionalcommits.org/)를 따릅니다: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`.

## 예제 앱 실행

```bash
cd example
yarn install

# iOS
cd ios && bundle install && bundle exec pod install && cd ..
yarn ios

# Android
yarn android
```
