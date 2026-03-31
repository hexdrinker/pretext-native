/**
 * Performance benchmark for @hexdrinker/pretext-native-core
 *
 * Usage: npx ts-node benchmark/run.ts
 */

import { computeLayout, LayoutCache } from '../src';
import type { MeasureFunc, TextMeasureInput } from '../src';
import { createJsAdapter } from '../../pretext-native/src/jsAdapter';

const measure: MeasureFunc = createJsAdapter();

// --- Test data generators ---

function shortText(): string {
  return 'Hello, world!';
}

function mediumText(): string {
  return 'React Native에서 텍스트의 줄바꿈과 높이를 렌더링 전에 계산할 수 있습니다. This is a medium-length paragraph that should wrap to several lines in a typical mobile screen width.';
}

function longText(): string {
  const paragraph =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ';
  return paragraph.repeat(10);
}

function cjkText(): string {
  return '한글 텍스트 측정 테스트입니다. 이 문장은 한국어로 작성된 긴 텍스트로, CJK 문자의 줄바꿈과 높이 계산을 테스트하기 위한 것입니다. 추가적인 문장을 넣어서 여러 줄에 걸쳐 표시되도록 합니다.';
}

// --- Benchmark runner ---

interface BenchResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  opsPerSec: number;
}

function bench(
  name: string,
  fn: () => void,
  iterations: number = 10000,
): BenchResult {
  // Warm up
  for (let i = 0; i < Math.min(100, iterations); i++) fn();

  const start = performance.now();
  for (let i = 0; i < iterations; i++) fn();
  const totalMs = performance.now() - start;

  return {
    name,
    iterations,
    totalMs: Math.round(totalMs * 100) / 100,
    avgMs: Math.round((totalMs / iterations) * 1000) / 1000,
    opsPerSec: Math.round(iterations / (totalMs / 1000)),
  };
}

function formatResult(r: BenchResult): string {
  return `  ${r.name.padEnd(40)} ${r.opsPerSec.toLocaleString().padStart(10)} ops/s  ${r.avgMs.toFixed(3).padStart(8)}ms/op  (${r.totalMs.toFixed(1)}ms total)`;
}

// --- Run benchmarks ---

console.log('=== @hexdrinker/pretext-native-core Benchmark ===\n');

const inputs: { name: string; input: TextMeasureInput }[] = [
  { name: 'Short text (13 chars, w=300)', input: { text: shortText(), width: 300, fontSize: 14 } },
  { name: 'Medium text (180 chars, w=300)', input: { text: mediumText(), width: 300, fontSize: 14, lineHeight: 20 } },
  { name: 'Long text (1.2K chars, w=300)', input: { text: longText(), width: 300, fontSize: 14, lineHeight: 20 } },
  { name: 'CJK text (120 chars, w=300)', input: { text: cjkText(), width: 300, fontSize: 14, lineHeight: 20 } },
  { name: 'Narrow container (w=80)', input: { text: mediumText(), width: 80, fontSize: 14, lineHeight: 20 } },
  { name: 'With maxLines=3', input: { text: longText(), width: 300, fontSize: 14, maxLines: 3 } },
];

// 1. Without cache
console.log('--- Without Cache ---');
const noCacheResults = inputs.map(({ name, input }) =>
  bench(name, () => computeLayout(input, measure)),
);
noCacheResults.forEach((r) => console.log(formatResult(r)));

// 2. With cache (cold start)
console.log('\n--- With Cache (cold) ---');
const coldCacheResults = inputs.map(({ name, input }) => {
  const cache = new LayoutCache();
  return bench(name, () => computeLayout(input, measure, cache), 10000);
});
coldCacheResults.forEach((r) => console.log(formatResult(r)));

// 3. With cache (warm — second run hits layout cache)
console.log('\n--- With Cache (warm) ---');
const warmCacheResults = inputs.map(({ name, input }) => {
  const cache = new LayoutCache();
  computeLayout(input, measure, cache); // prime
  return bench(name, () => computeLayout(input, measure, cache), 100000);
});
warmCacheResults.forEach((r) => console.log(formatResult(r)));

// 4. Batch throughput
console.log('\n--- Batch Throughput ---');
const batchSizes = [100, 500, 1000];
for (const size of batchSizes) {
  const batchInputs = Array.from({ length: size }, (_, i) => ({
    text: `Message ${i}: ${i % 2 === 0 ? mediumText() : shortText()}`,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
  }));
  const cache = new LayoutCache();
  const r = bench(`Batch ${size} items`, () => {
    for (const inp of batchInputs) {
      computeLayout(inp, measure, cache);
    }
  }, 100);
  console.log(formatResult(r));
}

// 5. Cache hit rate simulation
console.log('\n--- Cache Hit Rate (1000 messages, 50 unique) ---');
{
  const uniqueTexts = Array.from({ length: 50 }, (_, i) =>
    `User ${i}: ${i % 3 === 0 ? longText().slice(0, 100) : shortText()}`
  );
  const cache = new LayoutCache();
  const allInputs = Array.from({ length: 1000 }, (_, i) => ({
    text: uniqueTexts[i % 50],
    width: 300,
    fontSize: 14,
  }));

  const start = performance.now();
  for (const inp of allInputs) {
    computeLayout(inp, measure, cache);
  }
  const elapsed = performance.now() - start;

  const stats = cache.getStats();
  console.log(`  Total time: ${elapsed.toFixed(2)}ms for 1000 items`);
  console.log(`  Word cache: ${stats.wordEntries} entries`);
  console.log(`  Layout cache: ${stats.layoutEntries} entries`);
  console.log(`  Hits: ${stats.hits}, Misses: ${stats.misses}`);
  console.log(`  Hit rate: ${((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(1)}%`);
}

console.log('\nDone.');
