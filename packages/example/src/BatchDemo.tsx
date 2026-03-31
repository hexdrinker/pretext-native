import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import {
  measureTextBatch,
  prewarmCache,
  getCacheStats,
  type TextMeasureInput,
} from 'pretext-native';

function generateMessages(count: number): TextMeasureInput[] {
  const samples = [
    'Short message.',
    'A slightly longer message that takes more space on screen.',
    'This is a much longer message that will definitely wrap to multiple lines when rendered in a typical mobile screen width. It contains enough text to test the batch measurement capabilities.',
    '한글 메시지도 정확하게 측정됩니다.',
    'Mixed 한영 message with emoji support coming soon!',
  ];

  return Array.from({ length: count }, (_, i) => ({
    text: samples[i % samples.length],
    width: 300,
    fontSize: 15,
    lineHeight: 22,
  }));
}

export function BatchDemo() {
  const [results, setResults] = useState<{
    count: number;
    elapsed: number;
    heights: number[];
  } | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof getCacheStats> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const runBatch = useCallback(async (count: number) => {
    setLoading(true);
    const inputs = generateMessages(count);

    const start = performance.now();
    const measured = await measureTextBatch(inputs);
    const elapsed = performance.now() - start;

    setResults({
      count,
      elapsed: Math.round(elapsed * 100) / 100,
      heights: measured.map((r) => r.height),
    });
    setStats(getCacheStats());
    setLoading(false);
  }, []);

  const runPrewarm = useCallback(async () => {
    setLoading(true);
    const inputs = generateMessages(1000);

    const start = performance.now();
    await prewarmCache(inputs);
    const elapsed = performance.now() - start;

    setResults({
      count: 1000,
      elapsed: Math.round(elapsed * 100) / 100,
      heights: [],
    });
    setStats(getCacheStats());
    setLoading(false);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Batch Measurement & Cache</Text>
      <Text style={styles.desc}>
        Pre-warm the cache before rendering a list for instant getItemLayout.
      </Text>

      <View style={styles.buttons}>
        {[10, 100, 500].map((n) => (
          <Pressable
            key={n}
            style={styles.btn}
            onPress={() => runBatch(n)}
            disabled={loading}
          >
            <Text style={styles.btnText}>Batch {n}</Text>
          </Pressable>
        ))}
        <Pressable
          style={[styles.btn, styles.btnWarm]}
          onPress={runPrewarm}
          disabled={loading}
        >
          <Text style={styles.btnText}>Pre-warm 1K</Text>
        </Pressable>
      </View>

      {loading && <Text style={styles.loading}>Measuring...</Text>}

      {results && !loading && (
        <View style={styles.resultBox}>
          <Text style={styles.metric}>
            {results.count} items in {results.elapsed}ms
          </Text>
          <Text style={styles.metric}>
            ~{(results.elapsed / results.count).toFixed(3)}ms per item
          </Text>
          {results.heights.length > 0 && (
            <Text style={styles.metric}>
              Heights: [{results.heights.slice(0, 5).join(', ')}
              {results.heights.length > 5 ? ', ...' : ''}]
            </Text>
          )}
        </View>
      )}

      {stats && (
        <View style={styles.statsBox}>
          <Text style={styles.cardTitle}>Cache Stats</Text>
          <Text style={styles.metric}>
            JS: {stats.js.wordEntries} words, {stats.js.layoutEntries} layouts
          </Text>
          <Text style={styles.metric}>
            Hits: {stats.js.hits} / Misses: {stats.js.misses}
          </Text>
          {stats.native && (
            <Text style={styles.metric}>
              Native: {stats.native.measurementEntries} entries (
              {(stats.native.hitRate * 100).toFixed(0)}% hit rate)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  buttons: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  btnWarm: { backgroundColor: '#f59e0b' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  loading: { fontSize: 13, color: '#888' },
  resultBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  statsBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  metric: { fontSize: 13, color: '#555' },
});
