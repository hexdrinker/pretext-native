import React, { useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { measureTextSync } from 'pretext-native';

const MESSAGES = [
  { id: '1', sender: 'Alice', body: 'Hey! How are you?' },
  { id: '2', sender: 'Bob', body: "I'm doing great, thanks for asking! Just finished a really long project at work and I'm finally taking some time off." },
  { id: '3', sender: 'Alice', body: "That's awesome! What are you planning to do?" },
  { id: '4', sender: 'Bob', body: 'Thinking about a trip to Japan. I want to visit Tokyo, Osaka, and maybe Hokkaido. Been dreaming about it for years. Do you have any recommendations?' },
  { id: '5', sender: 'Alice', body: 'Yes! You should definitely visit Kyoto too.' },
  { id: '6', sender: 'Bob', body: 'Good idea! I\'ll add it to the list.' },
  { id: '7', sender: 'Alice', body: '한국 음식도 맛있어요! 일본 가기 전에 서울에 들러보는 건 어때요?' },
  { id: '8', sender: 'Bob', body: "That sounds like a great plan. I've always wanted to try authentic Korean BBQ." },
  { id: '9', sender: 'Alice', body: 'Let me know your dates and I can help plan the itinerary.' },
  { id: '10', sender: 'Bob', body: 'Will do! Thanks so much.' },
];

const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const BUBBLE_PADDING = 24;
const SENDER_HEIGHT = 20;
const ITEM_MARGIN = 8;

export function ChatListDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const bubbleWidth = screenWidth * 0.7;
  const textWidth = bubbleWidth - BUBBLE_PADDING;

  const getItemLayout = useCallback(
    (_data: typeof MESSAGES | null, index: number) => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        const msg = MESSAGES[i];
        const result = measureTextSync({
          text: msg.body,
          width: textWidth,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
        });
        offset += result.height + SENDER_HEIGHT + BUBBLE_PADDING + ITEM_MARGIN;
      }

      const msg = MESSAGES[index];
      const result = measureTextSync({
        text: msg.body,
        width: textWidth,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });
      const length = result.height + SENDER_HEIGHT + BUBBLE_PADDING + ITEM_MARGIN;

      return { length, offset, index };
    },
    [textWidth],
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[0] }) => {
      const isMe = item.sender === 'Bob';
      return (
        <View
          style={[
            styles.bubble,
            { maxWidth: bubbleWidth },
            isMe ? styles.bubbleRight : styles.bubbleLeft,
          ]}
        >
          <Text style={styles.sender}>{item.sender}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </View>
      );
    },
    [bubbleWidth],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Chat List with getItemLayout</Text>
      <Text style={styles.desc}>
        Uses measureTextSync to pre-calculate item heights for FlatList.
        No layout jumps on scroll.
      </Text>

      <FlatList
        data={MESSAGES}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  list: { flex: 1 },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: ITEM_MARGIN,
  },
  bubbleLeft: {
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
  },
  sender: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#888',
  },
  body: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  },
});
