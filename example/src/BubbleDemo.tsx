import React, { useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { measureTextSync } from 'pretext-native';

const MESSAGES = [
  { sender: 'me', text: 'Hey!' },
  { sender: 'them', text: 'Hi! How are you?' },
  { sender: 'me', text: "I'm good! Just shipped the new text measurement library." },
  { sender: 'them', text: 'Oh nice! How does it work?' },
  {
    sender: 'me',
    text: 'It uses CoreText on iOS and StaticLayout on Android to measure text before rendering. So you get exact heights synchronously via JSI — no bridge overhead.',
  },
  { sender: 'them', text: 'That sounds really useful for chat apps like this one 💬' },
  {
    sender: 'me',
    text: "Exactly! The bubble widths and heights here are all pre-calculated. No onLayout, no jumps. FlatList's getItemLayout works perfectly.",
  },
  { sender: 'them', text: '한국어도 되나요?' },
  {
    sender: 'me',
    text: '네! CJK 문자를 개별 토큰으로 처리해서 줄바꿈이 정확합니다. 이모지도 물론 지원해요 🎉',
  },
  { sender: 'them', text: '대박! 👏👏👏' },
  {
    sender: 'me',
    text: 'Check out the line count and pixel height shown on each bubble — those are computed before any text is rendered.',
  },
  { sender: 'them', text: 'This is amazing. Shipping it to production ASAP 🚀' },
];

const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const BUBBLE_H_PAD = 12;
const BUBBLE_V_PAD = 8;
const MAX_BUBBLE_RATIO = 0.75;

export function BubbleDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const maxBubbleWidth = screenWidth * MAX_BUBBLE_RATIO;
  const maxTextWidth = maxBubbleWidth - BUBBLE_H_PAD * 2;

  const measuredMessages = useMemo(() => {
    return MESSAGES.map((msg) => {
      const result = measureTextSync({
        text: msg.text,
        width: maxTextWidth,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });

      // For single-line messages, shrink bubble to fit text
      // Use a heuristic: if only 1 line, measure with very large width
      let tightWidth = maxBubbleWidth;
      if (result.lineCount === 1) {
        // The text fits in one line, so use just enough width
        // Estimate from line content — add padding
        tightWidth = Math.min(
          maxBubbleWidth,
          msg.text.length * FONT_SIZE * 0.55 + BUBBLE_H_PAD * 2,
        );
        // Ensure it's not too small
        tightWidth = Math.max(tightWidth, 60);
      }

      return {
        ...msg,
        result,
        bubbleWidth: result.lineCount === 1 ? tightWidth : maxBubbleWidth,
        bubbleHeight: result.height + BUBBLE_V_PAD * 2,
      };
    });
  }, [maxBubbleWidth, maxTextWidth]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Smart Bubbles</Text>
      <Text style={styles.desc}>
        Bubble sizes are pre-calculated. Single-line messages shrink to fit.
        Multi-line messages use max width. No layout jumps.
      </Text>

      <ScrollView style={styles.chatArea}>
        {measuredMessages.map((msg, i) => {
          const isMe = msg.sender === 'me';
          return (
            <View
              key={i}
              style={[
                styles.row,
                isMe ? styles.rowRight : styles.rowLeft,
              ]}
            >
              <View
                style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubbleThem,
                  {
                    maxWidth: msg.bubbleWidth,
                    minHeight: msg.bubbleHeight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    isMe && styles.bubbleTextMe,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.measurement,
                    isMe && styles.measurementMe,
                  ]}
                >
                  {msg.result.lineCount}L · {msg.result.height}px
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  chatArea: { flex: 1 },
  row: { marginBottom: 6 },
  rowLeft: { alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  bubble: {
    paddingHorizontal: BUBBLE_H_PAD,
    paddingVertical: BUBBLE_V_PAD,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#f3f4f6',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#1f2937',
  },
  bubbleTextMe: { color: '#fff' },
  measurement: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#9ca3af',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  measurementMe: { color: 'rgba(255,255,255,0.6)' },
});
