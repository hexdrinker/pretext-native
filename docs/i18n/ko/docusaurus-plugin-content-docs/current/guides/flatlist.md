---
sidebar_position: 1
title: FlatList 연동
---

# FlatList와 함께 사용하기

pretext-native의 가장 효과적인 사용 사례 중 하나는 `FlatList`의 `getItemLayout` 구현입니다. 스크롤 점프를 제거하고 가상화 성능을 크게 향상시킵니다.

## 문제점

`getItemLayout` 없이는 `FlatList`가 항목 높이를 미리 알 수 없습니다:

- 항목이 측정될 때마다 스크롤바가 점프
- `scrollToIndex`가 느림 (중간 항목을 모두 렌더링해야 함)
- 가상화 효율 저하 (어떤 항목이 보이는지 정확히 계산 불가)

## 해결 방법

`measureTextSync`를 `getItemLayout`에서 사용하여 항목 높이를 동기적으로 계산합니다:

```tsx
import { FlatList } from 'react-native';
import { measureTextSync } from 'pretext-native';

const CONTENT_WIDTH = Dimensions.get('window').width - 32;
const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const VERTICAL_PADDING = 24;

function MessageList({ messages }) {
  const getItemLayout = useCallback(
    (data, index) => {
      const item = data[index];
      const { height } = measureTextSync({
        text: item.body,
        width: CONTENT_WIDTH,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });

      const itemHeight = height + VERTICAL_PADDING;

      return {
        length: itemHeight,
        offset: itemHeight * index,
        index,
      };
    },
    []
  );

  return (
    <FlatList
      data={messages}
      getItemLayout={getItemLayout}
      renderItem={({ item }) => <MessageItem message={item} />}
      keyExtractor={(item) => item.id}
    />
  );
}
```

## 캐시 사전 충전

최적의 경험을 위해 데이터를 가져올 때 캐시를 미리 채워두세요:

```tsx
import { prewarmCache } from 'pretext-native';

async function fetchMessages() {
  const messages = await api.getMessages();

  await prewarmCache(
    messages.map((msg) => ({
      text: msg.body,
      width: CONTENT_WIDTH,
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
    }))
  );

  return messages;
}
```

## 가변 높이 항목의 오프셋 계산

가변 높이 항목의 경우 오프셋을 누적 합산해야 합니다:

```tsx
const getItemLayout = useCallback(
  (data, index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      const { height } = measureTextSync({
        text: data[i].body,
        width: CONTENT_WIDTH,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });
      offset += height + VERTICAL_PADDING;
    }

    const { height } = measureTextSync({
      text: data[index].body,
      width: CONTENT_WIDTH,
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
    });

    return {
      length: height + VERTICAL_PADDING,
      offset,
      index,
    };
  },
  []
);
```

비용이 높아 보이지만, 웜 캐시(2–5M ops/s)에서는 1000개 항목 합산에 1ms 미만이 소요됩니다.
