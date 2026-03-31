---
sidebar_position: 1
slug: /getting-started
title: 시작하기
---

# 시작하기

pretext-native는 React Native에서 텍스트 높이와 줄바꿈을 **렌더링 전에** 계산할 수 있게 해줍니다.

## 설치

```bash
yarn add pretext-native
# 또는
npm install pretext-native
```

### iOS

```bash
cd ios && pod install
```

### Android

추가 설정이 필요 없습니다.

## 요구사항

- React Native 0.71+
- iOS 13+
- Android API 21+
- **New Architecture** (TurboModules) 및 **Legacy Bridge** 모두 지원

## 빠른 예제

```tsx
import { useTextLayout } from 'pretext-native';

function ChatBubble({ text }) {
  const { height, lineCount, isTruncated } = useTextLayout({
    text,
    width: 280,
    fontSize: 15,
    lineHeight: 22,
    maxLines: 5,
  });

  return (
    <View style={{ height }}>
      <Text numberOfLines={5} style={{ fontSize: 15, lineHeight: 22 }}>
        {text}
      </Text>
    </View>
  );
}
```

## 동작 원리

pretext-native는 React Native가 내부적으로 사용하는 네이티브 텍스트 엔진과 직접 통신합니다:

- **iOS**: CoreText (`CTFramesetter`) — 스레드 안전, UIKit 의존성 없음
- **Android**: `StaticLayout` — React Native가 실제 사용하는 것과 동일한 엔진
- **JS 폴백**: 휴리스틱 기반 문자 폭 추정 (테스트/SSR 전용)

2단 LRU 캐시 (단어 레벨 + 레이아웃 레벨)로 실사용 기준 95% 이상 히트율을 달성합니다.

## 다음 단계

- [API 레퍼런스](/docs/api) — 전체 API 문서
- [FlatList 가이드](/docs/guides/flatlist) — `getItemLayout`과 함께 사용하기
- [채팅 레이아웃 가이드](/docs/guides/chat) — 메시지 높이 사전 계산
- [말줄임 가이드](/docs/guides/truncation) — "더 보기" 시나리오 감지
