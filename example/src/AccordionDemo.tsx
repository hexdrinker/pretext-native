import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { useTextLayout } from 'pretext-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEMS = [
  {
    title: 'What is pretext-native?',
    body: 'A text layout engine for React Native that calculates line count, height, and line breaks before rendering. No more layout jumps or hidden render passes — get accurate text measurements synchronously via JSI.',
  },
  {
    title: 'How does it work?',
    body: 'On iOS, it uses CoreText (CTFramesetter) for thread-safe text measurement. On Android, it uses StaticLayout. Both run off the main thread and results are cached in a two-tier LRU cache (word-level + layout-level) for instant repeated lookups.',
  },
  {
    title: 'When should I use this?',
    body: 'Use it whenever you need to know text dimensions before rendering: FlatList getItemLayout, "Show More" buttons, chat bubble sizing, card layouts with text truncation, eBook pagination, or any scenario where onLayout causes visible jumps.',
  },
  {
    title: 'CJK와 이모지를 지원하나요?',
    body: '네! 토크나이저가 CJK 문자(한국어, 일본어, 중국어)를 개별 토큰으로 처리하고, 이모지도 올바르게 분리합니다. 네이티브 측정 엔진이 실제 폰트 메트릭을 사용하므로 정확한 줄바꿈이 보장됩니다.',
  },
  {
    title: 'Performance characteristics',
    body: 'Synchronous measurement via JSI takes ~0.1-0.3ms per item. Batch measurement of 1000 items typically completes in under 200ms. The LRU cache ensures repeated measurements are essentially free. Pre-warm the cache before rendering large lists for the best experience.',
  },
];

const WIDTH = 320;
const FONT_SIZE = 14;
const LINE_HEIGHT = 21;
const PADDING = 16;

function AccordionItem({
  title,
  body,
  isOpen,
  onToggle,
}: {
  title: string;
  body: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const { height, lineCount } = useTextLayout({
    text: body,
    width: WIDTH - PADDING * 2,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  });

  return (
    <View style={styles.item}>
      <Pressable style={styles.itemHeader} onPress={onToggle}>
        <View style={styles.headerLeft}>
          <Text style={styles.itemTitle}>{title}</Text>
          <Text style={styles.meta}>
            {lineCount} lines · {height}px
          </Text>
        </View>
        <Text style={styles.chevron}>{isOpen ? '▲' : '▼'}</Text>
      </Pressable>

      {isOpen && (
        <View style={[styles.itemBody, { height }]}>
          <Text style={styles.bodyText}>{body}</Text>
        </View>
      )}
    </View>
  );
}

export function AccordionDemo() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex(openIndex === index ? null : index);
  };

  // Calculate total height of all items
  const totalCollapsed = ITEMS.length * 60;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Accordion</Text>
      <Text style={styles.desc}>
        Heights are pre-calculated with pretext-native. No layout jumps when
        expanding — the container height is known before the text renders.
      </Text>

      <Text style={styles.totalInfo}>
        Total collapsed: ~{totalCollapsed}px
      </Text>

      <View style={styles.accordion}>
        {ITEMS.map((item, i) => (
          <AccordionItem
            key={i}
            title={item.title}
            body={item.body}
            isOpen={openIndex === i}
            onToggle={() => toggle(i)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  totalInfo: { fontSize: 12, color: '#999', fontFamily: 'monospace' },
  accordion: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  item: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: PADDING,
    minHeight: 60,
  },
  headerLeft: { flex: 1, gap: 2 },
  itemTitle: { fontSize: 14, fontWeight: '600' },
  meta: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },
  chevron: { fontSize: 12, color: '#9ca3af', marginLeft: 8 },
  itemBody: {
    paddingHorizontal: PADDING,
    paddingBottom: PADDING,
    overflow: 'hidden',
  },
  bodyText: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#374151',
  },
});
