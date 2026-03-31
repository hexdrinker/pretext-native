---
sidebar_position: 2
title: 채팅 레이아웃
---

# 채팅 레이아웃

메시지 버블 크기를 미리 계산하는 것은 pretext-native의 가장 일반적인 사용 사례 중 하나입니다. 렌더링 후 버블이 리사이즈되면서 보이는 레이아웃 깜빡임을 제거합니다.

## 기본 채팅 버블

```tsx
import { useTextLayout } from 'pretext-native';

const MAX_BUBBLE_WIDTH = 260;
const FONT_SIZE = 15;
const LINE_HEIGHT = 21;
const BUBBLE_PADDING_H = 12;
const BUBBLE_PADDING_V = 8;

function ChatBubble({ message, isMine }) {
  const { height, lineCount, result } = useTextLayout({
    text: message.text,
    width: MAX_BUBBLE_WIDTH - BUBBLE_PADDING_H * 2,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  });

  // 한 줄 메시지: 텍스트에 맞게 버블 축소
  // 여러 줄 메시지: 최대 너비 사용
  const bubbleWidth =
    lineCount === 1 && result?.lines[0]
      ? result.lines[0].width + BUBBLE_PADDING_H * 2
      : MAX_BUBBLE_WIDTH;

  const bubbleHeight = height + BUBBLE_PADDING_V * 2;

  return (
    <View
      style={{
        alignSelf: isMine ? 'flex-end' : 'flex-start',
        width: bubbleWidth,
        height: bubbleHeight,
        backgroundColor: isMine ? '#007AFF' : '#E9E9EB',
        borderRadius: 18,
        paddingHorizontal: BUBBLE_PADDING_H,
        paddingVertical: BUBBLE_PADDING_V,
      }}
    >
      <Text
        style={{
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
          color: isMine ? '#fff' : '#000',
        }}
      >
        {message.text}
      </Text>
    </View>
  );
}
```

## 캐시 사전 충전을 포함한 채팅 리스트

```tsx
import { prewarmCache, measureTextSync } from 'pretext-native';

function ChatScreen({ chatId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await api.getMessages(chatId);

      // 모든 메시지에 대해 캐시 사전 충전
      await prewarmCache(
        data.map((msg) => ({
          text: msg.text,
          width: MAX_BUBBLE_WIDTH - BUBBLE_PADDING_H * 2,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
        }))
      );

      setMessages(data);
    }
    load();
  }, [chatId]);

  const getItemLayout = useCallback((data, index) => {
    const msg = data[index];
    const { height } = measureTextSync({
      text: msg.text,
      width: MAX_BUBBLE_WIDTH - BUBBLE_PADDING_H * 2,
      fontSize: FONT_SIZE,
      lineHeight: LINE_HEIGHT,
    });

    const itemHeight = height + BUBBLE_PADDING_V * 2 + 8; // + 마진

    return { length: itemHeight, offset: 0, index };
  }, []);

  return (
    <FlatList
      data={messages}
      inverted
      getItemLayout={getItemLayout}
      renderItem={({ item }) => (
        <ChatBubble message={item} isMine={item.senderId === myId} />
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```
