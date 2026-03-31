# pretext-native

[pretext](https://github.com/chenglou/pretext)의 React Native 포트 — 텍스트 높이와 줄바꿈을 **렌더링 전에** 계산합니다.

[English](./README.md)

## 왜 필요한가?

React Native에서는 텍스트 컴포넌트의 높이를 렌더링 전에 알 수 없습니다. 흔히 쓰는 우회 방법들은 모두 문제가 있습니다:

- `onLayout` / `onTextLayout` — 렌더링 이후에 실행되어 **레이아웃 점프** 발생
- 숨겨진 렌더 패스 — 측정을 위해 오프스크린 렌더링을 먼저 함, **프레임 낭비**
- 하드코딩 추정값 — 동적 콘텐츠, 다른 폰트, 다른 언어에서 틀림

그 결과 `FlatList`의 `getItemLayout`을 정확히 구현하기가 불가능하고, 가상화 성능이 저하되며, 채팅·피드·카드 레이아웃에서 UI가 튀는 현상이 생깁니다.

## 동작 원리

pretext-native는 React Native가 내부적으로 사용하는 네이티브 텍스트 엔진과 직접 통신합니다. 렌더링이 필요 없습니다.

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│  텍스트     │ ──▶ │  네이티브 엔진   │ ──▶ │   결과      │
│  + 스타일   │     │  iOS: CoreText   │     │  height     │
│  + 너비     │     │  Android: Static │     │  lineCount  │
│             │     │    Layout        │     │  lines[]    │
│             │     │  JS: 휴리스틱    │     │  truncated  │
└─────────────┘     └──────────────────┘     └─────────────┘
```

- **iOS**: CoreText (`CTFramesetter`) — 스레드 안전, UIKit 의존성 없음
- **Android**: `StaticLayout` — React Native가 실제 사용하는 것과 동일한 엔진
- **JS 폴백**: 휴리스틱 기반 문자 폭 추정 (테스트/SSR 전용)
- **캐시**: 2단 LRU (단어 레벨 + 레이아웃 레벨). 실사용 기준 95% 이상 히트율. 캐시 워밍 후 2–5M ops/s.

## 설치

```bash
yarn add pretext-native
# iOS만 해당
cd ios && pod install
```

## 사용법

### 훅

```tsx
import { useTextLayout } from 'pretext-native'

const { height, lineCount, isTruncated } = useTextLayout({
  text,
  width: 320,
  fontSize: 15,
  lineHeight: 22,
  maxLines: 3,
})
```

### FlatList getItemLayout

```tsx
import { measureTextSync } from 'pretext-native'

const getItemLayout = (data, index) => {
  const { height } = measureTextSync({
    text: data[index].body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  })
  return { length: height + PADDING, offset: ..., index }
}
```

### 대량 리스트 전 캐시 사전 계산

```tsx
import { prewarmCache } from 'pretext-native'

await prewarmCache(messages.map((msg) => ({
  text: msg.body,
  width: CONTENT_WIDTH,
  fontSize: 15,
  lineHeight: 22,
})))
```

## API

### `useTextLayout(options): UseTextLayoutResult`

렌더링 전 텍스트 측정을 위한 React 훅. 네이티브가 사용 가능하면 JSI를 통해 동기로 실행하고, 없으면 비동기로 폴백합니다.

**옵션:**

| 옵션            | 타입      | 필수 | 설명                                                |
| --------------- | --------- | ---- | --------------------------------------------------- |
| `text`          | `string`  | O    | 측정할 텍스트                                       |
| `width`         | `number`  | O    | 컨테이너 너비 (px)                                  |
| `fontSize`      | `number`  | O    | 폰트 크기 (px)                                      |
| `fontFamily`    | `string`  | X    | 폰트 패밀리 이름                                    |
| `fontWeight`    | `string`  | X    | `"100"`–`"900"`, `"bold"`, `"normal"`               |
| `lineHeight`    | `number`  | X    | 줄 높이 (px)                                        |
| `letterSpacing` | `number`  | X    | 자간 (px)                                           |
| `maxLines`      | `number`  | X    | 이 줄 수 이후 잘라냄                                |
| `enabled`       | `boolean` | X    | `false`로 설정하면 측정 건너뜀 (기본값: `true`)     |

**반환값:**

| 프로퍼티      | 타입                        | 설명                                   |
| ------------- | --------------------------- | -------------------------------------- |
| `height`      | `number`                    | 계산된 텍스트 높이 (px)                |
| `lineCount`   | `number`                    | 줄바꿈 후 총 줄 수                     |
| `isTruncated` | `boolean`                   | `maxLines`에 의해 잘렸으면 `true`      |
| `result`      | `TextMeasureResult \| null` | 줄별 데이터를 포함한 전체 결과 객체    |
| `isLoading`   | `boolean`                   | 비동기 측정 진행 중이면 `true`         |
| `error`       | `Error \| null`             | 측정 실패 시 에러                      |

### `measureTextSync(input): TextMeasureResult`

동기 측정. 네이티브 JSI를 우선 사용하고 없으면 JS 휴리스틱 엔진으로 폴백합니다. `getItemLayout`이나 렌더 함수 내에서 안전하게 호출 가능합니다.

### `measureText(input): Promise<TextMeasureResult>`

비동기 측정. 네이티브 모듈 사용 시 백그라운드 스레드에서 실행하여 JS 스레드를 블로킹하지 않습니다.

### `measureTextBatch(inputs): Promise<TextMeasureResult[]>`

여러 텍스트를 단일 네이티브 호출로 측정합니다. `measureText`를 반복 호출하는 것보다 효율적입니다. 리스트 렌더링 전 사전 캐싱에 사용하세요.

### `prewarmCache(inputs): Promise<void>`

`measureTextBatch`와 동일하지만 결과를 반환하지 않고 캐시만 채웁니다. 데이터 페치 시점에 호출해두면 리스트가 렌더링될 때 결과가 즉시 나옵니다.

### `clearCache(): void`

JS 레벨과 네이티브 레벨의 LRU 캐시를 모두 초기화합니다.

### `isNativeAvailable(): boolean`

네이티브 TurboModule이 로드되어 있으면 `true`를 반환합니다. `false`이면 모든 API가 JS 휴리스틱 엔진으로 폴백합니다.

## 지원 플랫폼

- iOS 13+
- Android API 21+
- React Native 0.71+ (New Architecture 및 Legacy Bridge)

## 라이선스

[MIT](./LICENSE)
