import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Switch,
  PixelRatio,
} from 'react-native';
import { useTextLayout } from 'pretext-native';

const DEFAULT_TEXT =
  'React Native에서 텍스트의 줄바꿈과 높이를 렌더링 전에 계산할 수 있습니다. This works for English too!';

const FONT_SIZE = 15;
const LINE_HEIGHT = 22;

export function BasicMeasureDemo() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [width] = useState(300);
  const [allowFontScaling, setAllowFontScaling] = useState(true);

  const fontScale = PixelRatio.getFontScale();

  const { height, lineCount, isTruncated, result } = useTextLayout({
    text,
    width,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    allowFontScaling,
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

      <View style={styles.scaleRow}>
        <View style={styles.scaleInfo}>
          <Text style={styles.label}>allowFontScaling</Text>
          <Text style={styles.scaleValue}>
            fontScale: {fontScale.toFixed(2)}
          </Text>
        </View>
        <Switch value={allowFontScaling} onValueChange={setAllowFontScaling} />
      </View>

      <View style={styles.resultBox}>
        <Text style={styles.label}>Computed height: {height}px</Text>
        <Text style={styles.label}>Line count: {lineCount}</Text>
        <Text style={styles.label}>
          Truncated: {isTruncated ? 'Yes' : 'No'}
        </Text>
        {allowFontScaling && fontScale !== 1 && (
          <Text style={styles.scaleNote}>
            fontSize: {FONT_SIZE} × {fontScale.toFixed(2)} ={' '}
            {(FONT_SIZE * fontScale).toFixed(1)}
          </Text>
        )}
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
        <Text
          style={{ fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT }}
          allowFontScaling={allowFontScaling}
        >
          {text}
        </Text>
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
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  scaleInfo: { gap: 2 },
  scaleValue: { fontSize: 12, color: '#6b7280', fontFamily: 'monospace' },
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
  scaleNote: {
    fontSize: 12,
    color: '#3b82f6',
    fontFamily: 'monospace',
    marginTop: 4,
  },
  preview: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderStyle: 'dashed',
  },
});
