import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, useWindowDimensions } from 'react-native';
import { measureTextSync } from 'pretext-native';

const CARDS = [
  {
    title: 'React Native',
    body: 'Build native apps using React. A framework for building native applications using JavaScript and React.',
    color: '#dbeafe',
  },
  {
    title: 'Text Layout',
    body: 'Pre-render text measurement without DOM. Know the exact height before any pixel is painted.',
    color: '#fef3c7',
  },
  {
    title: 'CoreText',
    body: 'iOS uses CTFramesetter for thread-safe text shaping. Handles CJK, emoji, and complex scripts natively.',
    color: '#d1fae5',
  },
  {
    title: 'StaticLayout',
    body: 'Android counterpart. Uses the platform text engine for pixel-perfect measurement matching actual rendering output.',
    color: '#fce7f3',
  },
  {
    title: 'FlatList 최적화',
    body: 'getItemLayout에 정확한 높이를 전달하면 스크롤 점프가 사라집니다. 수천 개의 아이템도 부드럽게 스크롤됩니다.',
    color: '#e0e7ff',
  },
  {
    title: 'JSI Sync',
    body: 'Synchronous calls via JSI — no bridge overhead. Measure text in <0.3ms per call.',
    color: '#fef9c3',
  },
  {
    title: 'Cache',
    body: 'Two-tier LRU cache: word-level measurements and full layout results. Repeated measurements are essentially free. Cache hit rates typically exceed 90% in real apps.',
    color: '#ede9fe',
  },
  {
    title: 'Batch API',
    body: 'Measure thousands of items at once with the batch API. Pre-warm before rendering for instant layout.',
    color: '#ccfbf1',
  },
  {
    title: 'Truncation',
    body: 'Know if text will be truncated before rendering. Show "Read More" buttons without hidden render passes or onTextLayout callbacks.',
    color: '#fee2e2',
  },
  {
    title: '한글 지원',
    body: '한국어 텍스트도 정확하게 측정합니다. 음절 단위 줄바꿈과 올바른 폰트 메트릭을 제공합니다.',
    color: '#f0fdf4',
  },
  {
    title: 'Hooks',
    body: 'useTextLayout hook for easy integration. Sync-first with async fallback. Memoized and cache-aware.',
    color: '#fff7ed',
  },
  {
    title: 'Zero Layout Shift',
    body: 'Calculate dimensions upfront. No more CLS. No more placeholder shimmer heights that are always wrong.',
    color: '#f5f3ff',
  },
];

const TITLE_FONT_SIZE = 14;
const TITLE_LINE_HEIGHT = 20;
const BODY_FONT_SIZE = 13;
const BODY_LINE_HEIGHT = 19;
const CARD_PADDING = 12;
const GAP = 8;
const COLUMNS = 2;

export function MasonryDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const colWidth = (screenWidth - 24 - GAP * (COLUMNS - 1)) / COLUMNS;
  const textWidth = colWidth - CARD_PADDING * 2;

  const columns = useMemo(() => {
    const cols: { cards: typeof CARDS; heights: number[] }[] = Array.from(
      { length: COLUMNS },
      () => ({ cards: [], heights: [] }),
    );
    const colTotals = new Array(COLUMNS).fill(0);

    for (const card of CARDS) {
      // Measure title
      const titleResult = measureTextSync({
        text: card.title,
        width: textWidth,
        fontSize: TITLE_FONT_SIZE,
        lineHeight: TITLE_LINE_HEIGHT,
        fontWeight: '700',
      });

      // Measure body
      const bodyResult = measureTextSync({
        text: card.body,
        width: textWidth,
        fontSize: BODY_FONT_SIZE,
        lineHeight: BODY_LINE_HEIGHT,
      });

      const cardHeight =
        CARD_PADDING * 2 + titleResult.height + 6 + bodyResult.height;

      // Place in shortest column
      let minCol = 0;
      for (let c = 1; c < COLUMNS; c++) {
        if (colTotals[c] < colTotals[minCol]) minCol = c;
      }

      cols[minCol].cards.push(card);
      cols[minCol].heights.push(cardHeight);
      colTotals[minCol] += cardHeight + GAP;
    }

    return cols;
  }, [textWidth]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Masonry Layout</Text>
      <Text style={styles.desc}>
        Card heights predicted by pretext-native. No DOM measurement needed —
        cards are placed in the shortest column instantly.
      </Text>

      <ScrollView>
        <View style={styles.masonry}>
          {columns.map((col, ci) => (
            <View key={ci} style={[styles.column, { width: colWidth }]}>
              {col.cards.map((card, i) => (
                <View
                  key={i}
                  style={[
                    styles.card,
                    { height: col.heights[i], backgroundColor: card.color },
                  ]}
                >
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardBody}>{card.body}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  masonry: {
    flexDirection: 'row',
    gap: GAP,
  },
  column: { gap: GAP },
  card: {
    padding: CARD_PADDING,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: TITLE_FONT_SIZE,
    lineHeight: TITLE_LINE_HEIGHT,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 6,
  },
  cardBody: {
    fontSize: BODY_FONT_SIZE,
    lineHeight: BODY_LINE_HEIGHT,
    color: '#4b5563',
  },
});
