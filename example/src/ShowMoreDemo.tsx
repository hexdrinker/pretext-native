import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { useTextLayout } from 'pretext-native';

const ARTICLES = [
  {
    title: 'Understanding Text Layout Engines',
    body: "Text layout is one of the most complex problems in computing. A layout engine must handle Unicode bidirectional text, complex script shaping, line breaking rules that vary by language, hyphenation, justification, and font fallback chains. Modern engines like CoreText and HarfBuzz handle this complexity by separating the pipeline into distinct phases: itemization, shaping, and layout. pretext-native leverages these platform engines to give React Native developers access to accurate text measurements without rendering.",
  },
  {
    title: 'JSI: The Bridge Killer',
    body: "React Native's new architecture replaces the asynchronous JSON bridge with JSI (JavaScript Interface), allowing synchronous C++ calls from JavaScript. This is a game-changer for text measurement: instead of sending a message across the bridge, waiting for native to process it, and getting a callback, you can now call measureTextSync() and get the result immediately. The overhead is microseconds, not milliseconds.",
  },
  {
    title: 'CJK 줄바꿈의 이해',
    body: '한국어, 중국어, 일본어(CJK) 텍스트는 영어와 다른 줄바꿈 규칙을 따릅니다. 영어는 단어 사이의 공백에서 줄바꿈이 일어나지만, CJK 텍스트는 거의 모든 문자 사이에서 줄바꿈이 가능합니다. 다만 구두점 앞뒤, 괄호 등에는 줄바꿈 금지 규칙이 적용됩니다. pretext-native의 토크나이저는 이러한 CJK 특성을 인식하여 각 문자를 개별 토큰으로 처리합니다. 이를 통해 네이티브 텍스트 엔진과 동일한 줄바꿈 결과를 얻을 수 있습니다.',
  },
  {
    title: 'Cache Architecture',
    body: "pretext-native uses a two-tier LRU cache strategy. The first tier caches individual word measurements: given the same text fragment, font, and size, you'll always get the same width. The second tier caches complete layout results: given the same input parameters, you get the full height, line count, and line strings. This means measuring the same text twice is essentially free — and measuring similar texts (sharing common words) also benefits from the word-level cache.",
  },
];

const WIDTH = 320;
const FONT_SIZE = 14;
const LINE_HEIGHT = 21;
const COLLAPSED_LINES = 3;

function ArticleCard({ title, body }: { title: string; body: string }) {
  const [expanded, setExpanded] = useState(false);

  const full = useTextLayout({
    text: body,
    width: WIDTH - 24, // card padding
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  });

  const collapsed = useTextLayout({
    text: body,
    width: WIDTH - 24,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    maxLines: COLLAPSED_LINES,
  });

  const needsShowMore = full.lineCount > COLLAPSED_LINES;
  const current = expanded ? full : collapsed;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {full.lineCount} lines · {full.height}px total
        </Text>
        {needsShowMore && !expanded && (
          <Text style={styles.metaTrunc}>
            showing {collapsed.lineCount} of {full.lineCount}
          </Text>
        )}
      </View>

      <View style={{ height: current.height, overflow: 'hidden' }}>
        <Text
          style={styles.bodyText}
          numberOfLines={expanded ? undefined : COLLAPSED_LINES}
        >
          {body}
        </Text>
      </View>

      {needsShowMore && (
        <Pressable
          style={styles.showMore}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.showMoreText}>
            {expanded ? 'Show Less' : 'Show More'}
          </Text>
          <Text style={styles.showMoreMeta}>
            {expanded
              ? `collapse to ${collapsed.height}px`
              : `expand to ${full.height}px`}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function ShowMoreDemo() {
  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.heading}>Show More / Less</Text>
        <Text style={styles.desc}>
          Truncation detection without rendering. Know if text needs "Show More"
          before a single pixel is drawn. Heights transition smoothly.
        </Text>

        {ARTICLES.map((article, i) => (
          <ArticleCard key={i} title={article.title} body={article.body} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { gap: 12, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    width: WIDTH,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: { fontSize: 11, fontFamily: 'monospace', color: '#9ca3af' },
  metaTrunc: { fontSize: 11, fontFamily: 'monospace', color: '#f59e0b' },
  bodyText: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#374151',
  },
  showMore: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  showMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3b82f6',
  },
  showMoreMeta: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#9ca3af',
  },
});
