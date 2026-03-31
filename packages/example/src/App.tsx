import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from 'react-native';

import { BasicMeasureDemo } from './BasicMeasureDemo';
import { ChatListDemo } from './ChatListDemo';
import { TruncationDemo } from './TruncationDemo';
import { BatchDemo } from './BatchDemo';

type DemoKey = 'basic' | 'chat' | 'truncation' | 'batch';

const DEMOS: { key: DemoKey; label: string }[] = [
  { key: 'basic', label: 'Basic Measure' },
  { key: 'chat', label: 'Chat List' },
  { key: 'truncation', label: 'Truncation' },
  { key: 'batch', label: 'Batch Pre-warm' },
];

export default function App() {
  const [active, setActive] = useState<DemoKey>('basic');

  return (
    <SafeAreaView style={styles.root}>
      <Text style={styles.title}>pretext-native Example</Text>

      <View style={styles.tabs}>
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
      </View>

      <ScrollView style={styles.content}>
        {active === 'basic' && <BasicMeasureDemo />}
        {active === 'chat' && <ChatListDemo />}
        {active === 'truncation' && <TruncationDemo />}
        {active === 'batch' && <BatchDemo />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f5f5f5' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    paddingVertical: 12,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#333' },
  tabTextActive: { color: '#fff' },
  content: { flex: 1, padding: 12 },
});
