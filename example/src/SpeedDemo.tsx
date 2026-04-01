import React, { useState, useRef, useCallback } from 'react';
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
  getCacheStats,
  clearCache,
} from 'pretext-native';

const FONT_SIZE = 14;
const LINE_HEIGHT = 21;
const TEST_WIDTH = 300;
const RUNS = 10;

const SAMPLE_TEXTS = [
  'React Native lets you build mobile apps using only JavaScript.',
  'The quick brown fox jumps over the lazy dog.',
  '안녕하세요! pretext-native는 텍스트를 렌더링 전에 측정합니다.',
  'FlatList performance improves dramatically with pre-calculated heights.',
  '이 라이브러리는 CoreText와 StaticLayout을 직접 사용합니다.',
  'Synchronous measurement via JSI enables getItemLayout integration.',
  '캐시 기반으로 반복 측정이 즉시 처리됩니다.',
  'Text layout engines need to handle CJK characters correctly.',
  'Two-tier LRU cache achieves over 95% hit rate on real-world data.',
  "Mixed content: Hello 세계! Let's go!",
];

function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    text: SAMPLE_TEXTS[i % SAMPLE_TEXTS.length] + ` (${i + 1})`,
    width: TEST_WIDTH - (i % 3) * 20,
  }));
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

interface BenchResult {
  label: string;
  count: number;
  totalMs: number;
  perItemMs: number;
  cached?: boolean;
}

export function SpeedDemo() {
  const [results, setResults] = useState<BenchResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [onLayoutTotal, setOnLayoutTotal] = useState(0);
  const [cacheStats, setCacheStats] = useState<ReturnType<
    typeof getCacheStats
  > | null>(null);
  const [showOnLayout, setShowOnLayout] = useState(false);
  const [onLayoutRun, setOnLayoutRun] = useState(0);

  const onLayoutStartRef = useRef(0);
  const onLayoutCollectedRef = useRef(0);
  const onLayoutTimingsRef = useRef<number[]>([]);
  const onLayoutRunRef = useRef(0);
  const onLayoutItemCount = 100;
  const resolveOnLayoutRef = useRef<(() => void) | null>(null);

  const runBenchmark = useCallback(async () => {
    setIsRunning(true);
    setResults([]);
    setOnLayoutTotal(0);
    setShowOnLayout(false);

    const items500 = generateItems(500);

    // --- Sync cold cache (10 runs, median) ---
    // Each run uses unique texts so every item is a genuine cache miss
    const coldTimings: number[] = [];
    for (let r = 0; r < RUNS; r++) {
      setProgress(`Sync cold: ${r + 1}/${RUNS}`);
      clearCache();
      const uniqueItems = generateItems(100).map((item) => ({
        ...item,
        text: item.text + ` [run${r}]`,
      }));
      const start = performance.now();
      for (const item of uniqueItems) {
        measureTextSync({
          text: item.text,
          width: item.width,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
        });
      }
      coldTimings.push(performance.now() - start);
      // Yield to UI thread
      await new Promise((res) => setTimeout(res, 0));
    }

    // --- Sync warm cache (10 runs, median) ---
    // Measure fixed 100 items once to fill cache, then re-measure (100% cache hit)
    const warmItems = generateItems(100);
    clearCache();
    for (const item of warmItems) {
      measureTextSync({
        text: item.text,
        width: item.width,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });
    }
    const warmTimings: number[] = [];
    for (let r = 0; r < RUNS; r++) {
      setProgress(`Sync warm: ${r + 1}/${RUNS}`);
      const start = performance.now();
      for (const item of warmItems) {
        measureTextSync({
          text: item.text,
          width: item.width,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
        });
      }
      warmTimings.push(performance.now() - start);
      await new Promise((res) => setTimeout(res, 0));
    }

    // --- Batch async (10 runs, median) ---
    const batchTimings: number[] = [];
    for (let r = 0; r < RUNS; r++) {
      setProgress(`Batch: ${r + 1}/${RUNS}`);
      clearCache();
      const start = performance.now();
      await measureTextBatch(
        items500.map((item) => ({
          text: item.text,
          width: item.width,
          fontSize: FONT_SIZE,
          lineHeight: LINE_HEIGHT,
        })),
      );
      batchTimings.push(performance.now() - start);
    }

    const coldMedian = median(coldTimings);
    const warmMedian = median(warmTimings);
    const batchMedian = median(batchTimings);

    const newResults: BenchResult[] = [
      {
        label: 'Sync (cold)',
        count: 100,
        totalMs: round(coldMedian),
        perItemMs: round(coldMedian / 100),
      },
      {
        label: 'Sync (warm)',
        count: 100,
        totalMs: round(warmMedian),
        perItemMs: round(warmMedian / 100),
        cached: true,
      },
      {
        label: 'Batch (500)',
        count: 500,
        totalMs: round(batchMedian),
        perItemMs: round(batchMedian / 500),
      },
    ];

    setResults(newResults);
    setCacheStats(getCacheStats());

    // --- onLayout (10 runs, median) ---
    onLayoutTimingsRef.current = [];
    onLayoutRunRef.current = 0;

    for (let r = 0; r < RUNS; r++) {
      setProgress(`onLayout: ${r + 1}/${RUNS}`);
      setOnLayoutRun(r + 1);
      await new Promise<void>((resolve) => {
        resolveOnLayoutRef.current = resolve;
        onLayoutCollectedRef.current = 0;
        onLayoutStartRef.current = performance.now();
        setShowOnLayout(true);
      });
      setShowOnLayout(false);
      // Small delay between runs to let RN clean up
      await new Promise((res) => setTimeout(res, 50));
    }

    const onLayoutMedian = median(onLayoutTimingsRef.current);
    setOnLayoutTotal(round(onLayoutMedian));
    setShowOnLayout(false);
    setProgress('');
    setIsRunning(false);
  }, []);

  const handleOnLayout = useCallback(() => {
    onLayoutCollectedRef.current++;

    if (onLayoutCollectedRef.current === onLayoutItemCount) {
      const elapsed = performance.now() - onLayoutStartRef.current;
      onLayoutTimingsRef.current.push(elapsed);
      resolveOnLayoutRef.current?.();
    }
  }, []);

  const onLayoutItems = generateItems(onLayoutItemCount);

  const coldResult = results.find((r) => r.label === 'Sync (cold)');
  const warmResult = results.find((r) => r.label === 'Sync (warm)');
  const cacheSpeedup =
    coldResult && warmResult && warmResult.totalMs > 0
      ? round(coldResult.totalMs / warmResult.totalMs)
      : null;
  const vsOnLayout =
    onLayoutTotal > 0 && coldResult
      ? round(onLayoutTotal / coldResult.totalMs)
      : null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Speed Benchmark</Text>
      <Text style={styles.desc}>
        Each test runs {RUNS} times and reports the median to reduce variance
        from GC, UI thread contention, and render batching.
      </Text>

      <Pressable
        style={[styles.runBtn, isRunning && styles.runBtnDisabled]}
        onPress={runBenchmark}
        disabled={isRunning}
      >
        <Text style={styles.runBtnText}>
          {isRunning ? progress || 'Running...' : 'Run Speed Test'}
        </Text>
      </Pressable>

      {showOnLayout && (
        <View style={styles.hidden}>
          {onLayoutItems.map((item, i) => (
            <Text
              key={`${onLayoutRun}-${i}`}
              style={{
                width: item.width,
                fontSize: FONT_SIZE,
                lineHeight: LINE_HEIGHT,
              }}
              onLayout={handleOnLayout}
            >
              {item.text}
            </Text>
          ))}
        </View>
      )}

      {results.length > 0 && (
        <>
          {/* pretext-native results */}
          <View style={styles.tableBox}>
            <Text style={styles.tableTitle}>
              pretext-native (median of {RUNS} runs)
            </Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.th, styles.thWide]}>Method</Text>
              <Text style={styles.th}>Items</Text>
              <Text style={styles.th}>Total</Text>
              <Text style={styles.th}>Per item</Text>
            </View>
            {results.map((r, i) => (
              <View
                key={i}
                style={[styles.tableRow, r.cached && styles.cachedRow]}
              >
                <Text style={[styles.td, styles.tdWide, styles.tdLabel]}>
                  {r.label}
                </Text>
                <Text style={styles.td}>{r.count}</Text>
                <Text style={styles.td}>{r.totalMs}ms</Text>
                <Text style={styles.td}>{r.perItemMs}ms</Text>
              </View>
            ))}
          </View>

          {cacheSpeedup && (
            <View style={styles.speedupBox}>
              <Text style={styles.speedupValue}>{cacheSpeedup}x</Text>
              <Text style={styles.speedupLabel}>
                cache speedup (warm vs cold)
              </Text>
            </View>
          )}

          {/* onLayout results */}
          {onLayoutTotal > 0 && (
            <>
              <View style={styles.tableBox}>
                <Text style={styles.tableTitle}>
                  onLayout (median of {RUNS} runs)
                </Text>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, styles.thWide]}>Method</Text>
                  <Text style={styles.th}>Items</Text>
                  <Text style={styles.th}>Total</Text>
                  <Text style={styles.th}>Per item</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.td, styles.tdWide, styles.tdLabel]}>
                    Hidden render
                  </Text>
                  <Text style={styles.td}>{onLayoutItemCount}</Text>
                  <Text style={styles.td}>{onLayoutTotal}ms</Text>
                  <Text style={styles.td}>
                    {round(onLayoutTotal / onLayoutItemCount)}ms
                  </Text>
                </View>
              </View>

              {vsOnLayout && (
                <View style={[styles.speedupBox, styles.speedupMain]}>
                  <Text style={styles.speedupValueBig}>{vsOnLayout}x</Text>
                  <Text style={styles.speedupLabel}>
                    faster than onLayout ({coldResult?.totalMs}ms vs{' '}
                    {onLayoutTotal}ms for {onLayoutItemCount} items)
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Cache stats */}
          {cacheStats && (
            <View style={styles.cacheBox}>
              <Text style={styles.cacheTitle}>Cache Stats</Text>
              <Text style={styles.cacheLine}>
                Word: {cacheStats.wordEntries} | Layout:{' '}
                {cacheStats.layoutEntries}
              </Text>
              <Text style={styles.cacheLine}>
                Hits: {cacheStats.hits} | Misses: {cacheStats.misses} | Rate:{' '}
                {cacheStats.hits + cacheStats.misses > 0
                  ? Math.round(
                      (cacheStats.hits /
                        (cacheStats.hits + cacheStats.misses)) *
                        100,
                    )
                  : 0}
                %
              </Text>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { gap: 12, paddingBottom: 40 },
  heading: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  desc: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
  runBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  runBtnDisabled: { opacity: 0.6 },
  runBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hidden: {
    position: 'absolute',
    opacity: 0,
    left: -9999,
  },
  tableBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  tableTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 6,
  },
  th: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
  },
  thWide: { flex: 1.5, textAlign: 'left' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    alignItems: 'center',
  },
  cachedRow: { backgroundColor: '#f0fdf4' },
  td: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  tdWide: { flex: 1.5, textAlign: 'left' },
  tdLabel: { fontFamily: undefined },
  speedupBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  speedupMain: { backgroundColor: '#ecfdf5' },
  speedupValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  speedupValueBig: {
    fontSize: 36,
    fontWeight: '800',
    color: '#10b981',
    fontFamily: 'monospace',
  },
  speedupLabel: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
  cacheBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  cacheTitle: { fontSize: 13, fontWeight: '700' },
  cacheLine: { fontSize: 12, fontFamily: 'monospace', color: '#6b7280' },
});
