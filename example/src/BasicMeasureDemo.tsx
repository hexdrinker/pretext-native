import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTextLayout } from 'pretext-native';

const DEFAULT_TEXT =
  'React Native에서 텍스트의 줄바꿈과 높이를 렌더링 전에 계산할 수 있습니다. This works for English too!';

export function BasicMeasureDemo() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [width] = useState(300);

  const { height, lineCount, isTruncated, result } = useTextLayout({
    text,
    width,
    fontSize: 15,
    lineHeight: 22,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>useTextLayout Hook</Text>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Type text to measure..."
      />

      <View style={styles.resultBox}>
        <Text style={styles.label}>Computed height: {height}px</Text>
        <Text style={styles.label}>Line count: {lineCount}</Text>
        <Text style={styles.label}>
          Truncated: {isTruncated ? 'Yes' : 'No'}
        </Text>
      </View>

      {result && (
        <View style={styles.linesBox}>
          <Text style={styles.label}>Lines:</Text>
          {result.lines.map((line, i) => (
            <Text key={i} style={styles.lineText}>
              {i + 1}: {JSON.stringify(line)}
            </Text>
          ))}
        </View>
      )}

      <View style={[styles.preview, { width }]}>
        <Text style={{ fontSize: 15, lineHeight: 22 }}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { fontSize: 16, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 60,
  },
  resultBox: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  linesBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
    gap: 2,
  },
  label: { fontSize: 13, fontWeight: '600' },
  lineText: { fontSize: 12, fontFamily: 'monospace', color: '#555' },
  preview: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
});
