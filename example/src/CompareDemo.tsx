import React, { useState, useCallback } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { measureTextSync } from 'pretext-native';

const MESSAGES = Array.from({ length: 80 }, (_, i) => ({
  id: String(i),
  sender: i % 3 === 0 ? 'Alice' : i % 3 === 1 ? 'Bob' : 'Charlie',
  body: [
    'Hey!',
    "I'm doing great, thanks for asking! Just finished a really long project at work.",
    '한국 음식도 맛있어요! 일본 가기 전에 서울에 들러보는 건 어때요? 강남에 맛집이 많아요.',
    'OK',
    'Thinking about a trip to Japan. I want to visit Tokyo, Osaka, Kyoto, and maybe Hokkaido too. Been dreaming about it for years. Do you have any recommendations for places to stay?',
    '그래! 다음에 같이 가자 😊',
    'Let me know your dates.',
    "That sounds like a great plan. I've always wanted to try authentic Korean BBQ and visit the traditional markets in Seoul.",
    '네, 좋아요!',
    'Will do! Thanks so much for all the help. Really appreciate it.',
  ][i % 10],
}));

const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const BUBBLE_PADDING = 24;
const SENDER_HEIGHT = 20;
const ITEM_MARGIN = 8;

/**
 * Traditional approach: render with estimated height,
 * then correct after onLayout fires — causes visible flicker.
 */
function OnLayoutItem({ item, maxWidth }: { item: (typeof MESSAGES)[0]; maxWidth: number }) {
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const isMe = item.sender === 'Bob';

  return (
    <View
      style={[
        styles.bubble,
        { maxWidth },
        isMe ? styles.bubbleRight : styles.bubbleLeft,
        // Before onLayout: use a placeholder height that's intentionally wrong
        measuredHeight === null && styles.bubblePlaceholder,
      ]}
    >
      <Text style={styles.sender}>{item.sender}</Text>
      <Text
        style={[styles.body, isMe && styles.bodyRight]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (measuredHeight === null) {
            setMeasuredHeight(h);
          }
        }}
      >
        {item.body}
      </Text>
      {measuredHeight !== null && (
        <Text style={styles.heightBadge}>
          {Math.round(measuredHeight)}px
        </Text>
      )}
    </View>
  );
}

/**
 * pretext-native approach: height is known before render.
 * No flicker, no re-render needed.
 */
function PretextItem({
  item,
  maxWidth,
  textWidth,
}: {
  item: (typeof MESSAGES)[0];
  maxWidth: number;
  textWidth: number;
}) {
  const isMe = item.sender === 'Bob';
  const result = measureTextSync({
    text: item.body,
    width: textWidth,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  });

  return (
    <View
      style={[
        styles.bubble,
        { maxWidth },
        isMe ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <Text style={styles.sender}>{item.sender}</Text>
      <Text style={[styles.body, isMe && styles.bodyRight]}>{item.body}</Text>
      <Text style={styles.heightBadge}>{result.height}px</Text>
    </View>
  );
}

export function CompareDemo() {
  const [mode, setMode] = useState<'pretext' | 'onLayout'>('pretext');
  const { width: screenWidth } = useWindowDimensions();
  const bubbleWidth = screenWidth * 0.72;
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
      return {
        length: result.height + SENDER_HEIGHT + BUBBLE_PADDING + ITEM_MARGIN,
        offset,
        index,
      };
    },
    [textWidth],
  );

  const renderOnLayoutItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[0] }) => (
      <OnLayoutItem item={item} maxWidth={bubbleWidth} />
    ),
    [bubbleWidth],
  );

  const renderPretextItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[0] }) => (
      <PretextItem item={item} maxWidth={bubbleWidth} textWidth={textWidth} />
    ),
    [bubbleWidth, textWidth],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Layout Jump Comparison</Text>
      <Text style={styles.desc}>
        {mode === 'onLayout'
          ? 'onLayout: Heights are measured AFTER render. Watch for flicker when scrolling.'
          : 'pretext-native: Heights are pre-calculated. No layout jumps.'}
      </Text>

      <View style={styles.toggleRow}>
        <Pressable
          style={[styles.toggleBtn, mode === 'pretext' && styles.toggleActive]}
          onPress={() => setMode('pretext')}
        >
          <Text style={[styles.toggleText, mode === 'pretext' && styles.toggleTextActive]}>
            pretext-native
          </Text>
        </Pressable>
        <Pressable
          style={[styles.toggleBtn, mode === 'onLayout' && styles.toggleWarn]}
          onPress={() => setMode('onLayout')}
        >
          <Text style={[styles.toggleText, mode === 'onLayout' && styles.toggleTextActive]}>
            onLayout
          </Text>
        </Pressable>
      </View>

      {mode === 'pretext' ? (
        <FlatList
          key="pretext"
          data={MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderPretextItem}
          getItemLayout={getItemLayout}
          style={styles.list}
          initialNumToRender={15}
        />
      ) : (
        <FlatList
          key="onLayout"
          data={MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderOnLayoutItem}
          style={styles.list}
          initialNumToRender={15}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666', minHeight: 36 },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: '#3b82f6' },
  toggleWarn: { backgroundColor: '#f59e0b' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
  list: { flex: 1 },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: ITEM_MARGIN,
  },
  bubblePlaceholder: {
    opacity: 0.6,
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
    color: '#1f2937',
  },
  bodyRight: {
    color: '#fff',
  },
  heightBadge: {
    fontSize: 10,
    color: '#9ca3af',
    fontFamily: 'monospace',
    marginTop: 4,
    textAlign: 'right',
  },
});
