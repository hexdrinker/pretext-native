import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useTextLayout, measureTextSync } from 'pretext-native';

const PARAGRAPHS = [
  'React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components.',
  'pretext-native measures text before rendering. This eliminates layout jumps, enables accurate FlatList heights, and supports truncation detection — all via synchronous JSI calls.',
  '이 라이브러리는 iOS에서 CoreText, Android에서 StaticLayout을 사용하여 네이티브 수준의 정확한 텍스트 측정을 제공합니다. 캐시 기반으로 반복 측정이 즉시 처리됩니다.',
];

const WIDTH_PRESETS = [150, 200, 250, 300, 350];
const FONT_SIZE = 14;
const LINE_HEIGHT = 21;

function MeasuredParagraph({
  text,
  width,
  index,
}: {
  text: string;
  width: number;
  index: number;
}) {
  const { height, lineCount } = useTextLayout({
    text,
    width,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  });

  const colors = ['#dbeafe', '#fef3c7', '#d1fae5'];

  return (
    <View style={styles.paragraph}>
      <View style={styles.paraHeader}>
        <View
          style={[styles.badge, { backgroundColor: colors[index % 3] }]}
        >
          <Text style={styles.badgeText}>
            {lineCount}L · {height}px
          </Text>
        </View>
      </View>
      <View style={[styles.textBox, { width, minHeight: height }]}>
        <Text style={styles.paraText}>{text}</Text>
      </View>
    </View>
  );
}

export function DynamicWidthDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const maxWidth = screenWidth - 24;
  const [containerWidth, setContainerWidth] = useState(
    Math.min(300, maxWidth),
  );

  // Drag handle to resize — capture start width on grant, apply delta on move
  const startWidthRef = useRef(containerWidth);
  const currentWidthRef = useRef(containerWidth);
  currentWidthRef.current = containerWidth;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startWidthRef.current = currentWidthRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        const newWidth = Math.max(
          120,
          Math.min(maxWidth, startWidthRef.current + gestureState.dx),
        );
        setContainerWidth(Math.round(newWidth));
      },
    }),
  ).current;

  // Summary stats
  const totalLines = PARAGRAPHS.reduce((sum, text) => {
    try {
      const result = measureTextSync({
        text,
        width: containerWidth,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });
      return sum + result.lineCount;
    } catch {
      return sum;
    }
  }, 0);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Dynamic Width</Text>
      <Text style={styles.desc}>
        Tap a preset or drag the handle to resize. Measurements update instantly
        — line count and height react to width changes in real-time.
      </Text>

      <View style={styles.presets}>
        {WIDTH_PRESETS.filter((w) => w <= maxWidth).map((w) => (
          <Pressable
            key={w}
            style={[styles.preset, containerWidth === w && styles.presetActive]}
            onPress={() => setContainerWidth(w)}
          >
            <Text
              style={[
                styles.presetText,
                containerWidth === w && styles.presetTextActive,
              ]}
            >
              {w}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Width: {containerWidth}px</Text>
        <Text style={styles.infoLabel}>Total: {totalLines} lines</Text>
      </View>

      <View style={styles.widthIndicator}>
        <View style={[styles.widthBar, { width: containerWidth }]}>
          <View {...panResponder.panHandlers} style={styles.dragHandle}>
            <Text style={styles.dragIcon}>⟷</Text>
          </View>
        </View>
      </View>

      {PARAGRAPHS.map((text, i) => (
        <MeasuredParagraph
          key={i}
          text={text}
          width={containerWidth}
          index={i}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  presets: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  preset: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  presetActive: { backgroundColor: '#3b82f6' },
  presetText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  presetTextActive: { color: '#fff' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13, fontWeight: '600', fontFamily: 'monospace' },
  widthIndicator: {
    height: 28,
    backgroundColor: '#f3f4f6',
    borderRadius: 4,
    justifyContent: 'center',
  },
  widthBar: {
    height: 28,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  dragHandle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1d4ed8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragIcon: { color: '#fff', fontSize: 14, fontWeight: '700' },
  paragraph: { gap: 4 },
  paraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
    color: '#374151',
  },
  textBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  paraText: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#374151',
  },
});
