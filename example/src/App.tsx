import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompareDemo } from './CompareDemo';
import { BasicMeasureDemo } from './BasicMeasureDemo';
import { DynamicWidthDemo } from './DynamicWidthDemo';
import { SpeedDemo } from './SpeedDemo';
import { ShowMoreDemo } from './ShowMoreDemo';
import { ObstacleTextDemo } from './ObstacleTextDemo';

type DemoKey =
  | 'compare'
  | 'basic'
  | 'dynamic'
  | 'speed'
  | 'showmore'
  | 'obstacle';

const DEMOS: { key: DemoKey; label: string }[] = [
  { key: 'compare', label: 'Compare' },
  { key: 'basic', label: 'Basic' },
  { key: 'dynamic', label: 'Dynamic' },
  { key: 'speed', label: 'Speed' },
  { key: 'showmore', label: 'Show More' },
  { key: 'obstacle', label: 'Obstacle' },
];

export default function App() {
  const [active, setActive] = useState<DemoKey>('compare');

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

      {active === 'basic' || active === 'dynamic' ? (
        <ScrollView
          style={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {active === 'basic' && <BasicMeasureDemo />}
          {active === 'dynamic' && <DynamicWidthDemo />}
        </ScrollView>
      ) : (
        <View style={styles.content}>
          {active === 'compare' && <CompareDemo />}
          {active === 'speed' && <SpeedDemo />}
          {active === 'showmore' && <ShowMoreDemo />}
          {active === 'obstacle' && <ObstacleTextDemo />}
        </View>
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
