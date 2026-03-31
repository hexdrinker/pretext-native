import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useTextLayout } from 'pretext-native';

const LONG_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.';

export function TruncationDemo() {
  const [maxLines, setMaxLines] = useState(3);

  const full = useTextLayout({
    text: LONG_TEXT,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
  });

  const truncated = useTextLayout({
    text: LONG_TEXT,
    width: 300,
    fontSize: 14,
    lineHeight: 20,
    maxLines,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Truncation Detection</Text>

      <View style={styles.controls}>
        <Text style={styles.label}>maxLines: {maxLines}</Text>
        <View style={styles.buttons}>
          {[1, 2, 3, 5, 10].map((n) => (
            <Pressable
              key={n}
              style={[styles.btn, maxLines === n && styles.btnActive]}
              onPress={() => setMaxLines(n)}
            >
              <Text
                style={[
                  styles.btnText,
                  maxLines === n && styles.btnTextActive,
                ]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.comparison}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Full</Text>
          <Text style={styles.metric}>{full.lineCount} lines</Text>
          <Text style={styles.metric}>{full.height}px</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Truncated</Text>
          <Text style={styles.metric}>{truncated.lineCount} lines</Text>
          <Text style={styles.metric}>{truncated.height}px</Text>
          <Text
            style={[
              styles.badge,
              truncated.isTruncated ? styles.badgeTrunc : styles.badgeFit,
            ]}
          >
            {truncated.isTruncated ? 'TRUNCATED' : 'FITS'}
          </Text>
        </View>
      </View>

      <View style={{ width: 300 }}>
        <Text
          style={{ fontSize: 14, lineHeight: 20 }}
          numberOfLines={maxLines}
        >
          {LONG_TEXT}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  heading: { fontSize: 16, fontWeight: '700' },
  controls: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  buttons: { flexDirection: 'row', gap: 8 },
  btn: {
    width: 40,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActive: { backgroundColor: '#3b82f6' },
  btnText: { fontSize: 13, fontWeight: '600' },
  btnTextActive: { color: '#fff' },
  comparison: { flexDirection: 'row', gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  cardTitle: { fontSize: 14, fontWeight: '700' },
  metric: { fontSize: 13, color: '#555' },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    overflow: 'hidden',
  },
  badgeTrunc: { backgroundColor: '#fef3c7', color: '#92400e' },
  badgeFit: { backgroundColor: '#d1fae5', color: '#065f46' },
});
