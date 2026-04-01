import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BasicMeasureDemo } from './BasicMeasureDemo';
import { ChatListDemo } from './ChatListDemo';
import { TruncationDemo } from './TruncationDemo';
import { BatchDemo } from './BatchDemo';
import { AccordionDemo } from './AccordionDemo';
import { MasonryDemo } from './MasonryDemo';
import { BubbleDemo } from './BubbleDemo';
import { ShowMoreDemo } from './ShowMoreDemo';
import { FontCompareDemo } from './FontCompareDemo';
import { DynamicWidthDemo } from './DynamicWidthDemo';
import { PerformanceDemo } from './PerformanceDemo';
import { ObstacleTextDemo } from './ObstacleTextDemo';
import { CompareDemo } from './CompareDemo';

type DemoKey =
  | 'compare'
  | 'basic'
  | 'bubbles'
  | 'chat'
  | 'accordion'
  | 'showmore'
  | 'masonry'
  | 'truncation'
  | 'fonts'
  | 'dynamic'
  | 'batch'
  | 'perf'
  | 'obstacle';

const DEMOS: { key: DemoKey; label: string }[] = [
  { key: 'compare', label: 'Compare' },
  { key: 'basic', label: 'Basic' },
  { key: 'bubbles', label: 'Bubbles' },
  { key: 'chat', label: 'Chat List' },
  { key: 'accordion', label: 'Accordion' },
  { key: 'showmore', label: 'Show More' },
  { key: 'masonry', label: 'Masonry' },
  { key: 'truncation', label: 'Truncation' },
  { key: 'fonts', label: 'Fonts' },
  { key: 'dynamic', label: 'Dynamic' },
  { key: 'batch', label: 'Batch' },
  { key: 'obstacle', label: 'Obstacle' },
  { key: 'perf', label: 'Benchmark' },
];

export default function App() {
  const [active, setActive] = useState<DemoKey>('basic');

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>pretext-native</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabs}
      >
        {DEMOS.map((d) => (
          <Pressable
            key={d.key}
            style={[styles.tab, active === d.key && styles.tabActive]}
            onPress={() => setActive(d.key)}
          >
            <Text
              style={[
                styles.tabText,
                active === d.key && styles.tabTextActive,
              ]}
            >
              {d.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Demos with their own scroll (FlatList/ScrollView) get a plain View wrapper */}
      {(active === 'compare' || active === 'chat' || active === 'bubbles' || active === 'fonts' || active === 'showmore' || active === 'perf' || active === 'obstacle') ? (
        <View style={styles.content}>
          {active === 'compare' && <CompareDemo />}
          {active === 'bubbles' && <BubbleDemo />}
          {active === 'chat' && <ChatListDemo />}
          {active === 'showmore' && <ShowMoreDemo />}
          {active === 'fonts' && <FontCompareDemo />}
          {active === 'perf' && <PerformanceDemo />}
          {active === 'obstacle' && <ObstacleTextDemo />}
        </View>
      ) : (
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {active === 'basic' && <BasicMeasureDemo />}
          {active === 'accordion' && <AccordionDemo />}
          {active === 'masonry' && <MasonryDemo />}
          {active === 'truncation' && <TruncationDemo />}
          {active === 'dynamic' && <DynamicWidthDemo />}
          {active === 'batch' && <BatchDemo />}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 10,
  },
  tabScroll: {
    maxHeight: 44,
  },
  tabs: {
    paddingHorizontal: 12,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 12 },
});
