---
sidebar_position: 2
title: Chat Layout
---

# Chat Layout

Pre-calculating message bubble sizes is one of the most common use cases for pretext-native. It eliminates the layout flash that's visible when bubbles resize after rendering.

## Basic Chat Bubble

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

  // Single-line messages: shrink bubble to fit text
  // Multi-line messages: use max width
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

## Chat List with Pre-warming

```tsx
import { prewarmCache, measureTextSync } from 'pretext-native';

function ChatScreen({ chatId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    async function load() {
      const data = await api.getMessages(chatId);

      // Pre-warm cache for all messages
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

    const itemHeight = height + BUBBLE_PADDING_V * 2 + 8; // + margin

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
