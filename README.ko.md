# pretext-native

> React Native에서 텍스트의 줄바꿈, 높이, 레이아웃을 **렌더링 전에** 계산하는 텍스트 레이아웃 엔진.

[English](./README.md)

## 왜 필요한가?

React Native에서 텍스트의 실제 높이와 줄바꿈을 알려면 보통 렌더링 이후 `onLayout` 또는 `onTextLayout`에 의존합니다. 이 방식은 다음과 같은 문제를 유발합니다:

- **초기 렌더링 점프** — 높이를 모르기 때문에 레이아웃이 갑자기 변함
- **비효율적인 가상화** — FlatList/FlashList에서 `getItemLayout`을 쓸 수 없음
- **숨겨진 렌더 패스** — 텍스트 높이를 측정하기 위한 불필요한 렌더링
- **성능 저하** — 채팅, 피드, 카드 UI에서 체감됨

**pretext-native**는 플랫폼의 네이티브 텍스트 엔진을 직접 사용하여 화면에 렌더링하지 않고 텍스트 레이아웃을 계산합니다.

## 동작 원리

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
- **JS 폴백**: 휴리스틱 기반 문자 폭 추정 (테스트 전용)
- **캐싱**: 2단 LRU 캐시 (단어 레벨 + 레이아웃 레벨), 95% 이상 캐시 히트율

## 설치

```bash
yarn add pretext-native
```

iOS의 경우:

```bash
cd ios && pod install
```

## 사용법

### `useTextLayout` 훅

```tsx
import { useTextLayout } from 'pretext-native'

function MessageBubble({ text, width }) {
  const { height, lineCount, isTruncated } = useTextLayout({
    text,
    width,
    fontSize: 15,
    lineHeight: 22,
    maxLines: 3,
  })

  return (
    <View style={{ height }}>
      <Text
        style={{ fontSize: 15, lineHeight: 22 }}
        numberOfLines={3}
      >
        {text}
      </Text>
    </View>
  )
}
```

### FlatList `getItemLayout`

```tsx
import { measureTextSync } from 'pretext-native';

const getItemLayout = (data, index) => {
  const item = data[index];
  const { height } = measureTextSync({
    text: item.body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  });

  return { length: height + PADDING, offset: /* 누적값 */, index };
};

<FlatList data={messages} getItemLayout={getItemLayout} ... />
```

### 일괄 사전 캐싱

```tsx
import { prewarmCache } from 'pretext-native'

// 대량 리스트 렌더링 전에 미리 계산
await prewarmCache(
  messages.map((msg) => ({
    text: msg.body,
    width: CONTENT_WIDTH,
    fontSize: 15,
    lineHeight: 22,
  })),
)
```

## API 레퍼런스

### `useTextLayout(options): UseTextLayoutResult`

렌더링 전 텍스트 측정을 위한 React 훅.

**옵션** (`UseTextLayoutOptions`):

| 프로퍼티        | 타입      | 필수 | 설명                                                |
| --------------- | --------- | ---- | --------------------------------------------------- |
| `text`          | `string`  | O    | 측정할 텍스트                                       |
| `width`         | `number`  | O    | 컨테이너 너비 (px)                                  |
| `fontSize`      | `number`  | O    | 폰트 크기 (px)                                      |
| `fontFamily`    | `string`  | X    | 폰트 패밀리 이름                                    |
| `fontWeight`    | `string`  | X    | 폰트 두께 (`"100"` - `"900"`, `"bold"`, `"normal"`) |
| `lineHeight`    | `number`  | X    | 줄 높이 (px)                                        |
| `letterSpacing` | `number`  | X    | 자간 (px)                                           |
| `maxLines`      | `number`  | X    | 최대 줄 수                                          |
| `enabled`       | `boolean` | X    | `false`로 설정하면 측정 건너뜀 (기본값: `true`)     |

**반환값** (`UseTextLayoutResult`):

| 프로퍼티      | 타입                        | 설명                             |
| ------------- | --------------------------- | -------------------------------- |
| `height`      | `number`                    | 계산된 텍스트 높이 (미측정 시 0) |
| `lineCount`   | `number`                    | 줄 수 (미측정 시 0)              |
| `isTruncated` | `boolean`                   | `maxLines`에 의해 잘렸는지 여부  |
| `result`      | `TextMeasureResult \| null` | 전체 결과 객체                   |
| `isLoading`   | `boolean`                   | 비동기 측정 진행 중 여부         |
| `error`       | `Error \| null`             | 측정 실패 시 에러                |

### `measureTextSync(input): TextMeasureResult`

동기 측정. 네이티브 JSI를 우선 사용하고, 없으면 JS 엔진으로 폴백.

### `measureText(input): Promise<TextMeasureResult>`

비동기 측정. 네이티브 모듈 사용 시 백그라운드 스레드에서 실행.

### `measureTextBatch(inputs): Promise<TextMeasureResult[]>`

여러 텍스트를 한 번에 측정. 리스트 렌더링 전 사전 캐싱에 효율적.

### `prewarmCache(inputs): Promise<void>`

입력 세트에 대한 레이아웃 결과를 미리 계산하고 캐시.

### `clearCache(): void`

모든 캐시 초기화 (JS 및 네이티브).

### `isNativeAvailable(): boolean`

네이티브 TurboModule이 로드되었는지 확인.

## 성능

Apple M 시리즈에서 벤치마크 (Node.js, JS 엔진 기준):

| 시나리오            | 캐시 없음  | 캐시 워밍 후 |
| ------------------- | ---------- | ------------ |
| 짧은 텍스트 (13자)  | 815K ops/s | 5.8M ops/s   |
| 중간 텍스트 (180자) | 112K ops/s | 2.3M ops/s   |
| 긴 텍스트 (1.2K자)  | 17K ops/s  | 503K ops/s   |
| CJK 텍스트 (120자)  | 159K ops/s | 2.7M ops/s   |

50개 유니크 텍스트를 1,000번 조회했을 때 캐시 히트율: **95%**

네이티브 측정은 JS 토크나이징을 건너뛰므로 더 빠릅니다.

## 패키지 구조

| 패키지                                        | 설명                                           |
| --------------------------------------------- | ---------------------------------------------- |
| [`@pretext-native/core`](./packages/core)     | 플랫폼 독립 텍스트 레이아웃 엔진 (의존성 없음) |
| [`pretext-native`](./packages/pretext-native) | React Native 래퍼 + 네이티브 모듈              |

## 아키텍처

```
pretext-native/
├── packages/
│   ├── core/                  # 순수 TS 엔진 (의존성 없음)
│   │   ├── src/
│   │   │   ├── tokenizer.ts   # 텍스트 → 토큰 (단어, 공백, CJK, 줄바꿈)
│   │   │   ├── lineBreaker.ts # 탐욕 줄바꿈 알고리즘
│   │   │   ├── layoutEngine.ts# 오케스트레이터: 토큰화 → 측정 → 줄바꿈 → 잘라내기
│   │   │   ├── truncation.ts  # maxLines + 말줄임표
│   │   │   ├── cache.ts       # 2단 LRU 캐시
│   │   │   └── types.ts       # 공유 타입 정의
│   │   ├── __tests__/         # 48개 유닛 테스트
│   │   └── benchmark/         # 성능 벤치마크
│   │
│   ├── pretext-native/        # React Native 패키지
│   │   ├── src/
│   │   │   ├── measureText.ts # 동기/비동기/일괄 측정 API
│   │   │   ├── useTextLayout.ts # React 훅 (동기 우선, 비동기 폴백)
│   │   │   ├── jsAdapter.ts   # 휴리스틱 JS 폴백
│   │   │   └── NativePretextNative.ts # TurboModule 코드젠 스펙
│   │   ├── ios/               # CoreText 기반 네이티브 모듈
│   │   ├── android/           # StaticLayout 기반 네이티브 모듈
│   │   └── __tests__/         # 32개 유닛 테스트
│   │
│   └── example/               # 데모 앱
```

## 지원 플랫폼

- iOS 13+
- Android API 21+ (API 28+에서 세밀한 폰트 두께 지원)
- React Native 0.71+ (New Architecture 및 Legacy Bridge)

## 라이선스

[MIT](./LICENSE)
