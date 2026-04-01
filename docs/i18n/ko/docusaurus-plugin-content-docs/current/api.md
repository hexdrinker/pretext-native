---
sidebar_position: 3
title: API — pretext-native
---

# API 레퍼런스 — pretext-native

## `useTextLayout(options)`

렌더링 전 텍스트 측정을 위한 React 훅. 네이티브가 사용 가능하면 JSI를 통해 동기로 실행하고, 없으면 비동기로 폴백합니다.

### 옵션

| 옵션 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `text` | `string` | O | 측정할 텍스트 |
| `width` | `number` | O | 컨테이너 너비 (px) |
| `fontSize` | `number` | O | 폰트 크기 (px) |
| `fontFamily` | `string` | X | 폰트 패밀리 이름 |
| `fontWeight` | `string` | X | `"100"`–`"900"`, `"bold"`, `"normal"` |
| `lineHeight` | `number` | X | 줄 높이 (px) |
| `letterSpacing` | `number` | X | 자간 (px) |
| `maxLines` | `number` | X | 이 줄 수 이후 잘라냄 |
| `allowFontScaling` | `boolean` | X | 시스템 폰트 스케일을 fontSize/lineHeight에 적용 (기본값: `true`) |
| `enabled` | `boolean` | X | `false`로 설정하면 측정 건너뜀 (기본값: `true`) |

### 반환값 `UseTextLayoutResult`

| 프로퍼티 | 타입 | 설명 |
|---|---|---|
| `height` | `number` | 계산된 텍스트 높이 (px) |
| `lineCount` | `number` | 줄바꿈 후 총 줄 수 |
| `isTruncated` | `boolean` | `maxLines`에 의해 잘렸으면 `true` |
| `result` | `TextMeasureResult \| null` | 줄별 데이터를 포함한 전체 결과 |
| `isLoading` | `boolean` | 비동기 측정 진행 중이면 `true` |
| `error` | `Error \| null` | 측정 실패 시 에러 |

### 예시

```tsx
import { useTextLayout } from 'pretext-native';

function MyComponent({ text }) {
  const { height, lineCount, isTruncated } = useTextLayout({
    text,
    width: 300,
    fontSize: 15,
    lineHeight: 22,
    maxLines: 3,
  });

  return (
    <View style={{ height }}>
      <Text numberOfLines={3}>{text}</Text>
      {isTruncated && <Text>더 보기</Text>}
    </View>
  );
}
```

---

## `measureTextSync(input)`

동기 측정. 네이티브 JSI를 우선 사용하고 없으면 JS 휴리스틱 엔진으로 폴백합니다. `getItemLayout`이나 렌더 함수 내에서 안전하게 호출 가능합니다.

```tsx
import { measureTextSync } from 'pretext-native';

const result = measureTextSync({
  text: 'Hello, world!',
  width: 300,
  fontSize: 14,
});

console.log(result.height, result.lineCount);
```

---

## `measureText(input)`

비동기 측정. 네이티브 모듈 사용 시 백그라운드 스레드에서 실행하여 JS 스레드를 블로킹하지 않습니다.

```tsx
import { measureText } from 'pretext-native';

const result = await measureText({
  text: longText,
  width: 300,
  fontSize: 14,
  lineHeight: 20,
});
```

---

## `measureTextBatch(inputs)`

여러 텍스트를 단일 네이티브 호출로 측정합니다. `measureText`를 반복 호출하는 것보다 효율적입니다.

```tsx
import { measureTextBatch } from 'pretext-native';

const results = await measureTextBatch(
  messages.map((msg) => ({
    text: msg.body,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
  }))
);
```

---

## `prewarmCache(inputs)`

`measureTextBatch`와 동일하지만 결과를 반환하지 않고 캐시만 채웁니다. 데이터 페치 시점에 호출해두면 리스트 렌더링 시 결과가 즉시 나옵니다.

```tsx
import { prewarmCache } from 'pretext-native';

await prewarmCache(
  messages.map((msg) => ({
    text: msg.body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  }))
);
```

---

## `clearCache()`

JS 레벨과 네이티브 레벨의 LRU 캐시를 모두 초기화합니다.

```tsx
import { clearCache } from 'pretext-native';

clearCache();
```

---

## `getCacheStats()`

현재 캐시 통계를 반환합니다.

```tsx
import { getCacheStats } from 'pretext-native';

const stats = getCacheStats();
// { hits, misses, wordEntries, layoutEntries }
```

---

## `isNativeAvailable()`

네이티브 TurboModule이 로드되어 있으면 `true`를 반환합니다. `false`이면 모든 API가 JS 휴리스틱 엔진으로 폴백합니다.

```tsx
import { isNativeAvailable } from 'pretext-native';

if (isNativeAvailable()) {
  console.log('네이티브 텍스트 측정 사용 중');
}
```

---

## `isFontAvailable(fontFamily)`

커스텀 폰트가 디바이스에 등록되어 있는지 확인합니다. 네이티브 모듈이 없으면 `false`를 반환합니다.

측정 시 폰트를 못 찾으면 경고 로그가 출력되어 폰트명 오류를 디버깅할 수 있습니다.

```tsx
import { isFontAvailable } from 'pretext-native';

if (isFontAvailable('Pretendard-Regular')) {
  // 이 폰트로 측정해도 안전
}
```

---

## `getFontMetrics(options)`

주어진 폰트 설정에 대한 폰트 메트릭(ascender, descender, line height)을 가져옵니다.

```tsx
import { getFontMetrics } from 'pretext-native';

const metrics = await getFontMetrics({
  fontSize: 16,
  fontFamily: 'System',
});
```

---

## 타입

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

### `LineInfo`

```typescript
interface LineInfo {
  text: string;
  width: number;
  height: number;
  y: number;
}
```
