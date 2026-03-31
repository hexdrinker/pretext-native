import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { measureTextSync } from 'pretext-native';

const INITIAL_CARDS = [
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
    body: 'Two-tier LRU cache: word-level measurements and full layout results. Repeated measurements are essentially free.',
    color: '#ede9fe',
  },
  {
    title: 'Batch API',
    body: 'Measure thousands of items at once with the batch API. Pre-warm before rendering for instant layout.',
    color: '#ccfbf1',
  },
  {
    title: 'Truncation',
    body: 'Know if text will be truncated before rendering. Show "Read More" buttons without hidden render passes.',
    color: '#fee2e2',
  },
  {
    title: '한글 지원',
    body: '한국어 텍스트도 정확하게 측정합니다. 음절 단위 줄바꿈과 올바른 폰트 메트릭을 제공합니다.',
    color: '#f0fdf4',
  },
];

const TITLE_FONT_SIZE = 14;
const TITLE_LINE_HEIGHT = 20;
const BODY_FONT_SIZE = 13;
const BODY_LINE_HEIGHT = 19;
const CARD_PADDING = 12;
const GAP = 8;
const COLUMNS = 2;
const EDITABLE_INDEX = 0;

export function MasonryDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const colWidth = (screenWidth - 24 - GAP * (COLUMNS - 1)) / COLUMNS;
  const textWidth = colWidth - CARD_PADDING * 2;

  const [editableText, setEditableText] = useState(INITIAL_CARDS[EDITABLE_INDEX].body);

  const cards = useMemo(() => {
    return INITIAL_CARDS.map((card, i) =>
      i === EDITABLE_INDEX ? { ...card, body: editableText } : card,
    );
  }, [editableText]);

  const columns = useMemo(() => {
    const cols: { cards: (typeof INITIAL_CARDS[0] & { measured: { titleH: number; bodyH: number; totalH: number } })[]; }[] =
      Array.from({ length: COLUMNS }, () => ({ cards: [] }));
    const colTotals = new Array(COLUMNS).fill(0);

    for (const card of cards) {
      const titleResult = measureTextSync({
        text: card.title,
        width: textWidth,
        fontSize: TITLE_FONT_SIZE,
        lineHeight: TITLE_LINE_HEIGHT,
        fontWeight: '700',
      });

      const bodyResult = measureTextSync({
        text: card.body,
        width: textWidth,
        fontSize: BODY_FONT_SIZE,
        lineHeight: BODY_LINE_HEIGHT,
      });

      const totalH = CARD_PADDING * 2 + titleResult.height + 6 + bodyResult.height;

      // Place in shortest column
      let minCol = 0;
      for (let c = 1; c < COLUMNS; c++) {
        if (colTotals[c] < colTotals[minCol]) minCol = c;
      }

      cols[minCol].cards.push({
        ...card,
        measured: {
          titleH: titleResult.height,
          bodyH: bodyResult.height,
          totalH,
        },
      });
      colTotals[minCol] += totalH + GAP;
    }

    return cols;
  }, [textWidth, cards]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Masonry Layout</Text>
      <Text style={styles.desc}>
        Card heights predicted by pretext-native. Edit the first card's text
        below and watch the layout reflow instantly.
      </Text>

      <View style={styles.editSection}>
        <Text style={styles.editLabel}>Edit "{INITIAL_CARDS[EDITABLE_INDEX].title}" card:</Text>
        <TextInput
          style={styles.input}
          value={editableText}
          onChangeText={setEditableText}
          multiline
          placeholder="Type to see masonry reflow..."
        />
      </View>

      <ScrollView>
        <View style={styles.masonry}>
          {columns.map((col, ci) => (
            <View key={ci} style={[styles.column, { width: colWidth }]}>
              {col.cards.map((card, i) => (
                <View
                  key={`${ci}-${i}`}
                  style={[
                    styles.card,
                    { minHeight: card.measured.totalH, backgroundColor: card.color },
                  ]}
                >
                  <Text style={styles.cardTitle}>{card.title}</Text>
                  <Text style={styles.cardBody}>{card.body}</Text>
                  <Text style={styles.cardMeta}>
                    {card.measured.totalH}px
                  </Text>
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
  editSection: { gap: 6 },
  editLabel: { fontSize: 13, fontWeight: '600', color: '#374151' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    backgroundColor: '#fff',
    minHeight: 50,
  },
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
  cardMeta: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: '#9ca3af',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
});
