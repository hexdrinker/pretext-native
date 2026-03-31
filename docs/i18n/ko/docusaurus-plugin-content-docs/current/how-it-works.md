---
sidebar_position: 2
title: 동작 원리
---

# 동작 원리

## 문제점

React Native에서는 텍스트 컴포넌트의 높이를 렌더링 전에 알 수 없습니다. 흔히 쓰는 우회 방법들은 모두 문제가 있습니다:

- **`onLayout` / `onTextLayout`** — 렌더링 이후에 실행되어 레이아웃 점프 발생
- **숨겨진 렌더 패스** — 측정을 위해 오프스크린 렌더링을 먼저 함, 프레임 낭비
- **하드코딩 추정값** — 동적 콘텐츠, 다른 폰트, 다른 언어에서 맞지 않음

그 결과 `FlatList`의 `getItemLayout`을 정확히 구현하기가 불가능하고, 가상화 성능이 저하되며, UI가 튀는 현상이 생깁니다.

## 해결 방법

pretext-native는 React Native 렌더링 파이프라인을 우회하고 네이티브 텍스트 엔진과 직접 통신합니다.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  텍스트     │ ──▶ │  네이티브 엔진   │ ──▶ │   결과      │
│  + 스타일   │     │  iOS: CoreText   │     │  height     │
│  + 너비     │     │  Android: Static │     │  lineCount  │
│             │     │    Layout        │     │  lines[]    │
│             │     │  JS: 휴리스틱    │     │  truncated  │
└─────────────┘     └──────────────────┘     └─────────────┘
```

### iOS — CoreText

iOS에서는 CoreText의 `CTFramesetter`를 사용합니다. UIKit의 `UILabel`과 React Native의 `RCTTextView`가 내부적으로 사용하는 것과 동일한 저수준 조판 엔진입니다. UIKit 의존성이 없어 스레드 안전하게 모든 스레드에서 실행할 수 있습니다.

### Android — StaticLayout

Android에서는 `StaticLayout`을 사용합니다. React Native가 텍스트 측정에 실제로 사용하는 것과 동일한 클래스입니다. 동일한 매개변수(폰트, 크기, 줄 높이, 자간)로 구성하여 동일한 결과를 생성합니다.

### JS 폴백

네이티브 모듈을 사용할 수 없는 환경(테스트, SSR, dev client 없는 Expo Go)에서는 문자 폭 테이블을 사용한 휴리스틱 엔진이 텍스트 크기를 추정합니다. 픽셀 단위로 완벽하지는 않지만 대부분의 사용 사례를 합리적으로 처리합니다.

## 캐싱

pretext-native는 2단 LRU 캐시를 사용합니다:

1. **단어 캐시** — 개별 단어/토큰의 측정된 폭을 캐싱합니다. 동일한 단어가 다른 텍스트에서 반복적으로 나타나므로 상당한 속도 향상을 제공합니다.

2. **레이아웃 캐시** — 전체 입력 매개변수를 키로 하여 완전한 레이아웃 결과(높이, 줄, 말줄임)를 캐싱합니다. 동일한 텍스트를 동일한 설정으로 두 번 측정하면 두 번째 호출은 직접 캐시 히트입니다.

### 성능

- **콜드** (첫 번째 측정): 텍스트당 ~0.1ms
- **웜** (캐시 히트): 텍스트당 ~0.001ms (2–5M ops/s)
- **히트율**: 실사용 채팅/피드 데이터에서 95% 이상

## 아키텍처

```
pretext-native (React Native 패키지)
├── useTextLayout()          — React 훅
├── measureTextSync()        — JSI를 통한 동기 호출
├── measureText()            — 네이티브 브릿지를 통한 비동기 호출
├── measureTextBatch()       — 배치 측정
└── prewarmCache()           — 캐시 사전 충전

@hexdrinker/pretext-native-core (플랫폼 독립)
├── tokenizer                — 단어/CJK/이모지 토큰화
├── lineBreaker              — 줄바꿈 알고리즘
├── layoutCalc               — 높이/줄 계산
└── cache                    — 2단 LRU 캐시
```

코어 레이아웃 엔진은 React Native 의존성이 없는 별도 패키지(`@hexdrinker/pretext-native-core`)입니다. 단어 폭 측정을 제공하는 `measureFunc` 어댑터를 받습니다 — 디바이스에서는 네이티브, 테스트에서는 JS 휴리스틱을 사용합니다.
