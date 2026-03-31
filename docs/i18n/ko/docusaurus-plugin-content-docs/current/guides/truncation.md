---
sidebar_position: 3
title: 말줄임 & 더 보기
---

# 말줄임 & "더 보기"

긴 텍스트의 미리보기와 "더 보기" 버튼을 보여주는 것은 흔한 UI 패턴입니다. pretext-native를 사용하면 텍스트가 잘리는지 **렌더링 전에** 알 수 있으므로, 숨겨진 렌더 패스 없이 조건부로 버튼을 표시할 수 있습니다.

## 기본 예시

```tsx
import { useState } from 'react';
import { useTextLayout } from 'pretext-native';

const MAX_LINES = 3;

function ExpandableText({ text }) {
  const [expanded, setExpanded] = useState(false);

  const { height, isTruncated } = useTextLayout({
    text,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
    maxLines: expanded ? undefined : MAX_LINES,
  });

  return (
    <View>
      <View style={{ height }}>
        <Text
          numberOfLines={expanded ? undefined : MAX_LINES}
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          {text}
        </Text>
      </View>
      {isTruncated && !expanded && (
        <TouchableOpacity onPress={() => setExpanded(true)}>
          <Text style={{ color: '#007AFF', marginTop: 4 }}>더 보기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

## 카드 UI에서의 말줄임 감지

```tsx
function ContentCard({ title, body }) {
  const { isTruncated } = useTextLayout({
    text: body,
    width: CARD_WIDTH - 32,
    fontSize: 14,
    lineHeight: 20,
    maxLines: 4,
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text numberOfLines={4} style={styles.body}>
        {body}
      </Text>
      {isTruncated && (
        <Text style={styles.readMore}>더 읽기</Text>
      )}
    </View>
  );
}
```

## 왜 `onTextLayout`을 쓰면 안 되나요?

기존 방식:

```tsx
// ❌ 레이아웃 깜빡임 발생
function BadExpandableText({ text }) {
  const [showButton, setShowButton] = useState(false);

  return (
    <View>
      <Text
        numberOfLines={3}
        onTextLayout={(e) => {
          // 렌더링 이후에 실행됨 — 버튼이 한 프레임 늦게 나타남
          setShowButton(e.nativeEvent.lines.length > 3);
        }}
      >
        {text}
      </Text>
      {showButton && <Text>더 보기</Text>}
    </View>
  );
}
```

문제점:
1. "더 보기" 버튼이 텍스트 렌더링 후 한 프레임 뒤에 나타남
2. 리스트에서 모든 항목이 다시 렌더링되고 이동됨
3. `onTextLayout`은 잘린 줄에 대한 정보만 제공하고, 전체 텍스트에 대한 정보는 없음

pretext-native를 사용하면 높이와 말줄임 정보가 **첫 번째 렌더링 전에** 준비되므로, UI가 첫 프레임부터 정확합니다.
