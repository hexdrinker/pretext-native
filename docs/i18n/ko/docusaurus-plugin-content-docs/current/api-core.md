---
sidebar_position: 4
title: API — 코어 엔진
---

# API 레퍼런스 — @hexdrinker/pretext-native-core

코어 레이아웃 엔진은 토큰화, 줄바꿈, 레이아웃 계산을 처리하는 플랫폼 독립적인 패키지입니다. React Native 의존성이 없어 어떤 JavaScript 환경에서든 사용할 수 있습니다.

## `computeLayout(input, measureFunc, cache?)`

입력, 측정 함수, 선택적 캐시를 받아 텍스트 레이아웃을 계산합니다.

### 매개변수

| 매개변수 | 타입 | 설명 |
|---|---|---|
| `input` | `TextMeasureInput` | 텍스트 및 스타일 매개변수 |
| `measureFunc` | `MeasureFunc` | 단어 폭을 측정하는 함수 |
| `cache` | `LayoutCache` | 선택적 캐시 인스턴스 |

### 반환값 `TextMeasureResult`

```typescript
import { computeLayout } from '@hexdrinker/pretext-native-core';

const result = computeLayout(
  { text: 'Hello, world!', width: 300, fontSize: 14 },
  measureFunc
);
```

---

## `LayoutCache`

단어 측정과 레이아웃 결과를 위한 2단 LRU 캐시.

### 생성자

```typescript
const cache = new LayoutCache(maxWordEntries?, maxLayoutEntries?);
```

| 매개변수 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `maxWordEntries` | `number` | 2000 | 최대 단어 레벨 캐시 항목 수 |
| `maxLayoutEntries` | `number` | 500 | 최대 레이아웃 레벨 캐시 항목 수 |

### 메서드

#### `getStats()`

```typescript
const stats = cache.getStats();
// { hits: number, misses: number, wordEntries: number, layoutEntries: number }
```

#### `clear()`

```typescript
cache.clear();
```

---

## `tokenize(text)`

텍스트를 토큰(단어, 공백, CJK 문자, 이모지)으로 분리합니다.

```typescript
import { tokenize } from '@hexdrinker/pretext-native-core';

const tokens = tokenize('Hello 안녕하세요 🎉');
// ['Hello', ' ', '안', '녕', '하', '세', '요', ' ', '🎉']
```

---

## `breakLines(tokens, widths, maxWidth)`

토큰과 측정된 폭을 받아 줄바꿈을 결정합니다.

```typescript
import { breakLines } from '@hexdrinker/pretext-native-core';

const lines = breakLines(tokens, measuredWidths, 300);
```

---

## 타입

### `MeasureFunc`

```typescript
type MeasureFunc = (text: string, fontSize: number) => number;
```

주어진 문자열의 주어진 폰트 크기에서의 픽셀 폭을 반환하는 함수입니다. 디바이스에서는 CoreText/StaticLayout이, 테스트에서는 목(mock)이나 JS 휴리스틱 어댑터를 제공할 수 있습니다.

### `TextMeasureInput`

```typescript
interface TextMeasureInput {
  text: string;
  width: number;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
  maxLines?: number;
  allowFontScaling?: boolean;
}
```

### `TextMeasureResult`

```typescript
interface TextMeasureResult {
  height: number;
  lineCount: number;
  lines: LineInfo[];
  truncated: boolean;
}
```
