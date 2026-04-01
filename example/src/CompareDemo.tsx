import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { measureTextSync } from 'pretext-native';

const MESSAGES = Array.from({ length: 200 }, (_, i) => ({
  id: String(i),
  sender: i % 3 === 0 ? 'Alice' : i % 3 === 1 ? 'Bob' : 'Charlie',
  body: [
    'Hey!',
    "I'm doing great, thanks for asking! Just finished a really long project at work and I'm finally taking some time off to relax.",
    '한국 음식도 맛있어요! 일본 가기 전에 서울에 들러보는 건 어때요? 강남에 맛집이 많아요. 특히 삼겹살은 꼭 드셔보세요.',
    'OK 👍',
    'Thinking about a trip to Japan. I want to visit Tokyo, Osaka, Kyoto, and maybe Hokkaido too. Been dreaming about it for years. Do you have any recommendations for places to stay? Budget-friendly options would be great.',
    '그래! 다음에 같이 가자 😊',
    'Sure!',
    "That sounds like a great plan. I've always wanted to try authentic Korean BBQ and visit the traditional markets in Seoul. Maybe we could also check out some temples in Gyeongju.",
    '네',
    'Will do! Thanks so much for all the help planning this trip. Really appreciate it. Can\'t wait to go!',
  ][i % 10],
}));

const FONT_SIZE = 15;
const LINE_HEIGHT = 22;
const BUBBLE_PADDING = 24;
const SENDER_HEIGHT = 20;
const ITEM_MARGIN = 8;

const JUMP_TARGETS = [0, 50, 100, 150, 199];

function OnLayoutItem({
  item,
  maxWidth,
  onShift,
}: {
  item: (typeof MESSAGES)[0];
  maxWidth: number;
  onShift?: () => void;
}) {
  const isMe = item.sender === 'Bob';
  const measuredRef = useRef(false);

  return (
    <View
      style={[
        styles.bubble,
        { maxWidth },
        isMe ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <Text style={styles.sender}>
        #{item.id} · {item.sender}
      </Text>
      <Text
        style={[styles.body, isMe && styles.bodyRight]}
        onLayout={() => {
          if (!measuredRef.current) {
            measuredRef.current = true;
            onShift?.();
          }
        }}
      >
        {item.body}
      </Text>
    </View>
  );
}

function PretextItem({
  item,
  maxWidth,
  textWidth,
  showDetail,
}: {
  item: (typeof MESSAGES)[0];
  maxWidth: number;
  textWidth: number;
  showDetail: boolean;
}) {
  const isMe = item.sender === 'Bob';
  const result = measureTextSync({
    text: item.body,
    width: textWidth,
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
  });

  const [actual, setActual] = useState<number | null>(null);

  return (
    <View
      style={[
        styles.bubble,
        { maxWidth, minHeight: result.height + SENDER_HEIGHT + 12 },
        isMe ? styles.bubbleRight : styles.bubbleLeft,
      ]}
    >
      <Text style={styles.sender}>
        #{item.id} · {item.sender}
      </Text>
      <Text
        style={[styles.body, isMe && styles.bodyRight]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          if (actual === null) setActual(h);
        }}
      >
        {item.body}
      </Text>
      {showDetail && actual !== null && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailText, isMe && styles.detailTextRight]}>
            predicted: {result.height}px ({result.lineCount}L)
          </Text>
          <View
            style={[
              styles.detailBadge,
              {
                backgroundColor:
                  result.height === actual ? '#d1fae5' : '#dbeafe',
              },
            ]}
          >
            <Text
              style={[
                styles.detailBadgeText,
                {
                  color: result.height === actual ? '#065f46' : '#1e40af',
                },
              ]}
            >
              {result.height === actual
                ? 'EXACT'
                : `${Math.abs(result.height - actual).toFixed(1)}px off`}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

export function CompareDemo() {
  const [mode, setMode] = useState<'pretext' | 'onLayout'>('pretext');
  const [showDetail, setShowDetail] = useState(true);
  const { width: screenWidth } = useWindowDimensions();
  const bubbleWidth = screenWidth * 0.72;
  const textWidth = bubbleWidth - BUBBLE_PADDING;
  const listRef = useRef<FlatList>(null);

  // Pre-compute all item heights and cumulative offsets once
  const { layoutData, computeTimeMs } = useMemo(() => {
    const start = performance.now();
    const lengths: number[] = [];
    const offsets: number[] = [];
    let cumulative = 0;

    for (let i = 0; i < MESSAGES.length; i++) {
      const result = measureTextSync({
        text: MESSAGES[i].body,
        width: textWidth,
        fontSize: FONT_SIZE,
        lineHeight: LINE_HEIGHT,
      });
      const length =
        result.height + SENDER_HEIGHT + BUBBLE_PADDING + ITEM_MARGIN;
      lengths.push(length);
      offsets.push(cumulative);
      cumulative += length;
    }

    const elapsed = performance.now() - start;
    return {
      layoutData: { lengths, offsets },
      computeTimeMs: Math.round(elapsed * 100) / 100,
    };
  }, [textWidth]);

  const getItemLayout = useCallback(
    (_data: typeof MESSAGES | null, index: number) => ({
      length: layoutData.lengths[index],
      offset: layoutData.offsets[index],
      index,
    }),
    [layoutData],
  );

  const scrollTo = (index: number) => {
    listRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderOnLayoutItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[0] }) => (
      <OnLayoutItem item={item} maxWidth={bubbleWidth} />
    ),
    [bubbleWidth],
  );

  const renderPretextItem = useCallback(
    ({ item }: { item: (typeof MESSAGES)[0] }) => (
      <PretextItem
        item={item}
        maxWidth={bubbleWidth}
        textWidth={textWidth}
        showDetail={showDetail}
      />
    ),
    [bubbleWidth, textWidth, showDetail],
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Layout Jump Comparison</Text>

        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleBtn,
              mode === 'pretext' && styles.toggleActive,
            ]}
            onPress={() => setMode('pretext')}
          >
            <Text
              style={[
                styles.toggleText,
                mode === 'pretext' && styles.toggleTextActive,
              ]}
            >
              pretext-native
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              mode === 'onLayout' && styles.toggleWarn,
            ]}
            onPress={() => setMode('onLayout')}
          >
            <Text
              style={[
                styles.toggleText,
                mode === 'onLayout' && styles.toggleTextActive,
              ]}
            >
              onLayout
            </Text>
          </Pressable>
        </View>

        {mode === 'pretext' && (
          <View style={styles.infoRow}>
            <View style={styles.timingBadge}>
              <Text style={styles.timingText}>
                {MESSAGES.length} items measured in {computeTimeMs}ms
              </Text>
            </View>
            <Pressable
              style={[
                styles.detailToggle,
                showDetail && styles.detailToggleOn,
              ]}
              onPress={() => setShowDetail((v) => !v)}
            >
              <Text
                style={[
                  styles.detailToggleText,
                  showDetail && styles.detailToggleTextOn,
                ]}
              >
                Detail
              </Text>
            </Pressable>
          </View>
        )}

        {mode === 'onLayout' && (
          <Text style={styles.warnText}>
            No getItemLayout. Jumps will be inaccurate and may flicker.
          </Text>
        )}

        <View style={styles.jumpRow}>
          <Text style={styles.jumpLabel}>Jump to:</Text>
          {JUMP_TARGETS.map((idx) => (
            <Pressable
              key={idx}
              style={({ pressed }) => [
                styles.jumpBtn,
                pressed && styles.jumpBtnPressed,
              ]}
              onPress={() => scrollTo(idx)}
            >
              <Text style={styles.jumpBtnText}>#{idx}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {mode === 'pretext' ? (
        <FlatList
          ref={listRef}
          key="pretext"
          data={MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderPretextItem}
          getItemLayout={getItemLayout}
          style={styles.list}
          initialNumToRender={10}
        />
      ) : (
        <FlatList
          ref={listRef}
          key="onLayout"
          data={MESSAGES}
          keyExtractor={(item) => item.id}
          renderItem={renderOnLayoutItem}
          style={styles.list}
          initialNumToRender={10}
          onScrollToIndexFailed={(info) => {
            const offset = info.averageItemLength * info.index;
            listRef.current?.scrollToOffset({ offset, animated: true });
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { gap: 8, marginBottom: 8 },
  heading: { fontSize: 16, fontWeight: '700' },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
  },
  toggleActive: { backgroundColor: '#3b82f6' },
  toggleWarn: { backgroundColor: '#f59e0b' },
  toggleText: { fontSize: 13, fontWeight: '700', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timingBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3b82f6',
    fontFamily: 'monospace',
  },
  detailToggle: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  detailToggleOn: { backgroundColor: '#3b82f6' },
  detailToggleText: { fontSize: 11, fontWeight: '700', color: '#6b7280' },
  detailToggleTextOn: { color: '#fff' },
  warnText: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  jumpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  jumpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  jumpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  jumpBtnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.93 }],
  },
  jumpBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'monospace',
  },
  list: { flex: 1 },
  bubble: {
    padding: 12,
    borderRadius: 12,
    marginBottom: ITEM_MARGIN,
  },
  bubbleLeft: {
    backgroundColor: '#e5e7eb',
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    backgroundColor: '#3b82f6',
    alignSelf: 'flex-end',
  },
  sender: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    color: '#9ca3af',
    fontFamily: 'monospace',
  },
  body: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#1f2937',
  },
  bodyRight: {
    color: '#fff',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  detailText: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: '#6b7280',
  },
  detailTextRight: {
    color: 'rgba(255,255,255,0.8)',
  },
  detailBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  detailBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
});
