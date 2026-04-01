import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ScrollView,
} from 'react-native';
import { measureTextSync, isFontAvailable } from 'pretext-native';

const SAMPLE_TEXT =
  'The quick brown fox jumps over the lazy dog. 다람쥐 헌 쳇바퀴에 타고파. 0123456789';

const FONT_SIZES = [12, 14, 16, 18, 24, 32];
const FONT_WEIGHTS = ['300', '400', '500', '600', '700', '900'] as const;

const FONT_FAMILIES = [
  { label: 'System', value: undefined },
  { label: 'Pretendard', value: 'Pretendard-Regular' },
  { label: 'Pretendard Bold', value: 'Pretendard-Bold' },
  { label: 'monospace', value: 'monospace' },
  { label: 'MissingFont', value: 'NonExistentFont-Regular' },
] as const;

const WIDTH = 300;

export function FontCompareDemo() {
  const [text, setText] = useState(SAMPLE_TEXT);
  const [selectedSizes, setSelectedSizes] = useState<number[]>([14, 18, 24]);
  const [selectedWeight, setSelectedWeight] = useState<string>('400');
  const [selectedFont, setSelectedFont] = useState<string | undefined>(
    undefined,
  );

  const toggleSize = (size: number) => {
    setSelectedSizes((prev) =>
      prev.includes(size)
        ? prev.filter((s) => s !== size)
        : [...prev, size].sort((a, b) => a - b),
    );
  };

  const measurements = selectedSizes.map((fontSize) => {
    const result = measureTextSync({
      text,
      width: WIDTH,
      fontSize,
      fontFamily: selectedFont,
      fontWeight: selectedWeight,
      lineHeight: Math.round(fontSize * 1.5),
    });
    return { fontSize, result };
  });

  return (
    <ScrollView style={styles.scroll}>
      <View style={styles.container}>
        <Text style={styles.heading}>Font Comparison</Text>
        <Text style={styles.desc}>
          Compare how the same text renders at different font sizes, weights,
          and font families. All measurements are pre-calculated.
        </Text>

        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Enter text to compare..."
        />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font family</Text>
          <View style={styles.chips}>
            {FONT_FAMILIES.map((f) => {
              const isSelected = selectedFont === f.value;
              const available = f.value
                ? isFontAvailable(f.value)
                : true;
              return (
                <Pressable
                  key={f.label}
                  style={[
                    styles.chip,
                    isSelected && styles.chipActive,
                    !available && styles.chipUnavailable,
                  ]}
                  onPress={() => setSelectedFont(f.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}
                  >
                    {f.label}
                    {f.value && !available ? ' (N/A)' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font sizes</Text>
          <View style={styles.chips}>
            {FONT_SIZES.map((size) => (
              <Pressable
                key={size}
                style={[
                  styles.chip,
                  selectedSizes.includes(size) && styles.chipActive,
                ]}
                onPress={() => toggleSize(size)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedSizes.includes(size) && styles.chipTextActive,
                  ]}
                >
                  {size}px
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Font weight</Text>
          <View style={styles.chips}>
            {FONT_WEIGHTS.map((w) => (
              <Pressable
                key={w}
                style={[
                  styles.chip,
                  selectedWeight === w && styles.chipActive,
                ]}
                onPress={() => setSelectedWeight(w)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedWeight === w && styles.chipTextActive,
                  ]}
                >
                  {w}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {measurements.map(({ fontSize, result }) => (
          <View key={fontSize} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>
                {fontSize}px · {selectedFont ?? 'System'} · w{selectedWeight}
              </Text>
              <Text style={styles.cardMeta}>
                {result.lineCount} lines · {result.height}px
              </Text>
            </View>

            <View style={[styles.preview, { width: WIDTH }]}>
              <Text
                style={{
                  fontSize,
                  lineHeight: Math.round(fontSize * 1.5),
                  fontWeight: selectedWeight as any,
                  fontFamily: selectedFont,
                }}
              >
                {text}
              </Text>
            </View>

            <View style={styles.lineBreaks}>
              {result.lines.map((line, i) => (
                <Text key={i} style={styles.lineInfo}>
                  L{i + 1}: {JSON.stringify(line)}
                </Text>
              ))}
            </View>
          </View>
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 50,
  },
  section: { gap: 6 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#374151' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#3b82f6' },
  chipUnavailable: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: { fontSize: 13, fontWeight: '700', color: '#1f2937' },
  cardMeta: { fontSize: 11, color: '#9ca3af', fontFamily: 'monospace' },
  preview: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 6,
    padding: 8,
    backgroundColor: '#fafafa',
  },
  lineBreaks: {
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    padding: 8,
    gap: 2,
  },
  lineInfo: { fontSize: 11, fontFamily: 'monospace', color: '#6b7280' },
});
