import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  measureTextSync,
  measureTextBatch,
  clearCache,
  getCacheStats,
} from 'pretext-native';

const SAMPLE_TEXTS = [
  'Short.',
  'A medium length message that takes a couple of lines on screen.',
  'This is a considerably longer message that demonstrates how the measurement engine handles multi-line text with various characters and sufficient length to wrap across three or four lines depending on the container width.',
  '한국어 텍스트 측정 테스트입니다. 이 메시지는 여러 줄에 걸쳐 표시될 수 있습니다.',
  'Mixed 한영 content with emoji 🎉 and numbers 12345 and special chars @#$%.',
];

interface BenchResult {
  label: string;
  count: number;
  totalMs: number;
  perItemMs: number;
  cached: boolean;
}

export function PerformanceDemo() {
  const [results, setResults] = useState<BenchResult[]>([]);
  const [running, setRunning] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getCacheStats> | null>(
    null,
  );

  const runBenchmarks = useCallback(async () => {
    setRunning(true);
    setResults([]);
    clearCache();

    const benchResults: BenchResult[] = [];

    // 1. Sync — cold cache
    const syncInputs = Array.from({ length: 100 }, (_, i) => ({
      text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
      width: 300,
      fontSize: 15,
      lineHeight: 22,
    }));

    const syncStart = performance.now();
    for (const input of syncInputs) {
      measureTextSync(input);
    }
    const syncElapsed = performance.now() - syncStart;

    benchResults.push({
      label: 'Sync (cold)',
      count: 100,
      totalMs: Math.round(syncElapsed * 100) / 100,
      perItemMs: Math.round((syncElapsed / 100) * 1000) / 1000,
      cached: false,
    });

    // 2. Sync — warm cache (same inputs)
    const warmStart = performance.now();
    for (const input of syncInputs) {
      measureTextSync(input);
    }
    const warmElapsed = performance.now() - warmStart;

    benchResults.push({
      label: 'Sync (warm)',
      count: 100,
      totalMs: Math.round(warmElapsed * 100) / 100,
      perItemMs: Math.round((warmElapsed / 100) * 1000) / 1000,
      cached: true,
    });

    // 3. Batch async — 500 items
    clearCache();
    const batchInputs = Array.from({ length: 500 }, (_, i) => ({
      text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
      width: 280 + (i % 5) * 10, // vary widths to avoid all-cache
      fontSize: 14 + (i % 3),
      lineHeight: 20 + (i % 3) * 2,
    }));

    const batchStart = performance.now();
    await measureTextBatch(batchInputs);
    const batchElapsed = performance.now() - batchStart;

    benchResults.push({
      label: 'Batch async',
      count: 500,
      totalMs: Math.round(batchElapsed * 100) / 100,
      perItemMs: Math.round((batchElapsed / 500) * 1000) / 1000,
      cached: false,
    });

    // 4. Large batch — 2000 items
    const largeInputs = Array.from({ length: 2000 }, (_, i) => ({
      text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length],
      width: 250 + (i % 10) * 10,
      fontSize: 13 + (i % 4),
      lineHeight: 19 + (i % 4) * 2,
    }));

    const largeStart = performance.now();
    await measureTextBatch(largeInputs);
    const largeElapsed = performance.now() - largeStart;

    benchResults.push({
      label: 'Batch 2K',
      count: 2000,
      totalMs: Math.round(largeElapsed * 100) / 100,
      perItemMs: Math.round((largeElapsed / 2000) * 1000) / 1000,
      cached: false,
    });

    setResults(benchResults);
    setStats(getCacheStats());
    setRunning(false);
  }, []);

  const speedup =
    results.length >= 2 && results[0].totalMs > 0
      ? Math.round((results[0].totalMs / results[1].totalMs) * 10) / 10
      : null;

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.heading}>Performance Benchmark</Text>
        <Text style={styles.desc}>
          Measure cold vs warm cache performance and batch throughput.
          All times include JSI round-trip overhead.
        </Text>

        <Pressable
          style={[styles.runBtn, running && styles.runBtnDisabled]}
          onPress={runBenchmarks}
          disabled={running}
        >
          <Text style={styles.runBtnText}>
            {running ? 'Running...' : 'Run Benchmarks'}
          </Text>
        </Pressable>

        {results.length > 0 && (
          <View style={styles.resultsContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.cellLabel]}>Test</Text>
              <Text style={[styles.cell, styles.cellNum]}>Items</Text>
              <Text style={[styles.cell, styles.cellNum]}>Total</Text>
              <Text style={[styles.cell, styles.cellNum]}>Per item</Text>
            </View>

            {results.map((r, i) => (
              <View
                key={i}
                style={[
                  styles.tableRow,
                  r.cached && styles.tableRowCached,
                ]}
              >
                <Text style={[styles.cell, styles.cellLabel]}>{r.label}</Text>
                <Text style={[styles.cell, styles.cellNum]}>{r.count}</Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {r.totalMs}ms
                </Text>
                <Text style={[styles.cell, styles.cellNum]}>
                  {r.perItemMs}ms
                </Text>
              </View>
            ))}

            {speedup && (
              <View style={styles.speedupBox}>
                <Text style={styles.speedupText}>
                  Cache speedup: {speedup}x faster
                </Text>
              </View>
            )}
          </View>
        )}

        {stats && (
          <View style={styles.statsBox}>
            <Text style={styles.statsTitle}>Cache Stats</Text>
            <Text style={styles.statsText}>
              JS word cache: {stats.js.wordEntries} entries
            </Text>
            <Text style={styles.statsText}>
              JS layout cache: {stats.js.layoutEntries} entries
            </Text>
            <Text style={styles.statsText}>
              Hits: {stats.js.hits} · Misses: {stats.js.misses}
            </Text>
            <Text style={styles.statsText}>
              Hit rate:{' '}
              {stats.js.hits + stats.js.misses > 0
                ? Math.round(
                    (stats.js.hits / (stats.js.hits + stats.js.misses)) * 100,
                  )
                : 0}
              %
            </Text>
            {stats.native && (
              <Text style={styles.statsText}>
                Native font cache: {stats.native.fontMetricsEntries} entries
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { gap: 12, paddingBottom: 40 },
  heading: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 13, color: '#666' },
  runBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  runBtnDisabled: { backgroundColor: '#93c5fd' },
  runBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  tableRowCached: { backgroundColor: '#f0fdf4' },
  cell: { fontSize: 12 },
  cellLabel: { flex: 2, fontWeight: '600' },
  cellNum: { flex: 1, textAlign: 'right', fontFamily: 'monospace' },
  speedupBox: {
    backgroundColor: '#dbeafe',
    padding: 12,
    alignItems: 'center',
  },
  speedupText: { fontSize: 14, fontWeight: '700', color: '#1e40af' },
  statsBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 10,
    gap: 4,
  },
  statsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  statsText: { fontSize: 12, fontFamily: 'monospace', color: '#4b5563' },
});
