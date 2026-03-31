import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { measureTextSync } from 'pretext-native';

const BALL_RADIUS = 40;
const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const PADDING = 12;
const BALL_SPEED = 120; // px/second — frame-rate independent

const SAMPLE_TEXT =
  'React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components. pretext-native measures text before rendering. This eliminates layout jumps, enables accurate FlatList heights, and supports truncation detection via synchronous JSI calls. The two-tier LRU cache achieves over 95% hit rate on real-world data, running at 2 to 5 million operations per second with warm cache. This demo shows text reflowing around a floating obstacle in real time, computing layout on every frame. 이 라이브러리는 iOS에서 CoreText, Android에서 StaticLayout을 사용하여 네이티브 수준의 정확한 텍스트 측정을 제공합니다. 캐시 기반으로 반복 측정이 즉시 처리됩니다. Try dragging the ball around to see the text reflow dynamically.';

interface LineSegment {
  text: string;
  x: number;
  y: number;
  width: number;
}

interface ReflowResult {
  lines: LineSegment[];
  measureCount: number;
}

function computeReflowLines(
  text: string,
  containerWidth: number,
  ballX: number,
  ballY: number,
  ballRadius: number,
): ReflowResult {
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const lines: LineSegment[] = [];
  let measureCount = 0;
  let currentY = 0;
  let wordIndex = 0;

  while (wordIndex < words.length) {
    const lineTop = currentY;
    const lineBottom = currentY + LINE_HEIGHT;
    const ballTop = ballY - ballRadius;
    const ballBottom = ballY + ballRadius;

    let availableSegments: { x: number; width: number }[] = [];

    if (lineBottom > ballTop && lineTop < ballBottom) {
      const dy = Math.min(
        Math.abs(ballY - lineTop),
        Math.abs(ballY - lineBottom),
        Math.abs(ballY - (lineTop + lineBottom) / 2),
      );
      const halfChord =
        dy < ballRadius ? Math.sqrt(ballRadius * ballRadius - dy * dy) : 0;

      if (halfChord > 0) {
        const exLeft = Math.max(0, ballX - halfChord);
        const exRight = Math.min(containerWidth, ballX + halfChord);

        if (exLeft > 30) {
          availableSegments.push({ x: 0, width: exLeft - 4 });
        }
        if (containerWidth - exRight > 30) {
          availableSegments.push({ x: exRight + 4, width: containerWidth - exRight - 4 });
        }

        if (availableSegments.length === 0) {
          currentY += LINE_HEIGHT;
          continue;
        }
      } else {
        availableSegments.push({ x: 0, width: containerWidth });
      }
    } else {
      availableSegments.push({ x: 0, width: containerWidth });
    }

    let placedAny = false;
    for (const seg of availableSegments) {
      if (wordIndex >= words.length) break;

      let lineText = '';
      let tempIndex = wordIndex;

      while (tempIndex < words.length) {
        const candidate = lineText + words[tempIndex];
        const trimmed = candidate.trim();
        if (trimmed.length === 0) {
          tempIndex++;
          continue;
        }
        measureCount++;
        const measured = measureTextSync({
          text: trimmed,
          width: seg.width,
          fontSize: FONT_SIZE,
        });

        if (measured.lineCount > 1 && lineText.length > 0) {
          break;
        }

        lineText = candidate;
        tempIndex++;

        if (measured.lineCount > 1) {
          break;
        }
      }

      if (lineText.trim().length > 0) {
        lines.push({
          text: lineText.trim(),
          x: seg.x,
          y: currentY,
          width: seg.width,
        });
        wordIndex = tempIndex;
        placedAny = true;
      }
    }

    if (!placedAny) {
      currentY += LINE_HEIGHT;
      continue;
    }

    currentY += LINE_HEIGHT;
  }

  return { lines, measureCount };
}

interface FrameStats {
  fps: number;
  reflowMs: number;
  lineCount: number;
  measureCount: number;
}

interface FrameData {
  ballPos: { x: number; y: number };
  lines: LineSegment[];
  stats: FrameStats;
}

export function ObstacleTextDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const containerWidth = screenWidth - PADDING * 2 - 24;
  const containerHeight = 500;

  const initX = containerWidth / 2;
  const initY = containerHeight / 3;

  const [frameData, setFrameData] = useState<FrameData>(() => {
    const { lines, measureCount } = computeReflowLines(
      SAMPLE_TEXT, containerWidth, initX, initY, BALL_RADIUS + 8,
    );
    return {
      ballPos: { x: initX, y: initY },
      lines,
      stats: { fps: 0, reflowMs: 0, lineCount: lines.length, measureCount },
    };
  });

  const [isDragging, setIsDragging] = useState(false);

  const velocityRef = useRef({ vx: 1, vy: 1 }); // direction unit vectors
  const posRef = useRef({ x: initX, y: initY });
  const animFrameRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastTimeRef = useRef<number>(0);
  const fpsHistoryRef = useRef<number[]>([]);

  const animate = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const rawDelta = (timestamp - lastTimeRef.current) / 1000;
    const delta = Math.min(rawDelta, 0.05); // cap at 50ms to avoid teleporting after tab switch
    lastTimeRef.current = timestamp;

    // Rolling FPS average over last 30 frames
    const instantFps = rawDelta > 0 ? 1 / rawDelta : 0;
    fpsHistoryRef.current.push(instantFps);
    if (fpsHistoryRef.current.length > 30) fpsHistoryRef.current.shift();
    const avgFps = Math.round(
      fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length,
    );

    if (!draggingRef.current) {
      const pos = posRef.current;
      const vel = velocityRef.current;

      let nx = pos.x + vel.vx * BALL_SPEED * delta;
      let ny = pos.y + vel.vy * BALL_SPEED * delta;

      if (nx - BALL_RADIUS < 0 || nx + BALL_RADIUS > containerWidth) {
        vel.vx *= -1;
        nx = Math.max(BALL_RADIUS, Math.min(containerWidth - BALL_RADIUS, nx));
      }
      if (ny - BALL_RADIUS < 0 || ny + BALL_RADIUS > containerHeight) {
        vel.vy *= -1;
        ny = Math.max(BALL_RADIUS, Math.min(containerHeight - BALL_RADIUS, ny));
      }

      posRef.current = { x: nx, y: ny };

      const t0 = performance.now();
      const result = computeReflowLines(SAMPLE_TEXT, containerWidth, nx, ny, BALL_RADIUS + 8);
      const reflowMs = parseFloat((performance.now() - t0).toFixed(2));

      setFrameData({
        ballPos: { x: nx, y: ny },
        lines: result.lines,
        stats: { fps: avgFps, reflowMs, lineCount: result.lines.length, measureCount: result.measureCount },
      });
    }

    animFrameRef.current = requestAnimationFrame(animate);
  }, [containerWidth, containerHeight]);

  useEffect(() => {
    lastTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [animate]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        draggingRef.current = true;
        setIsDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        const nx = Math.max(
          BALL_RADIUS,
          Math.min(containerWidth - BALL_RADIUS, gesture.moveX - PADDING - 12),
        );
        const ny = Math.max(
          BALL_RADIUS,
          Math.min(containerHeight - BALL_RADIUS, gesture.moveY - 200),
        );
        posRef.current = { x: nx, y: ny };

        const t0 = performance.now();
        const result = computeReflowLines(SAMPLE_TEXT, containerWidth, nx, ny, BALL_RADIUS + 8);
        const reflowMs = parseFloat((performance.now() - t0).toFixed(2));

        setFrameData((prev) => ({
          ballPos: { x: nx, y: ny },
          lines: result.lines,
          stats: { ...prev.stats, reflowMs, lineCount: result.lines.length, measureCount: result.measureCount },
        }));
      },
      onPanResponderRelease: () => {
        draggingRef.current = false;
        setIsDragging(false);
        velocityRef.current = {
          vx: Math.random() > 0.5 ? 1 : -1,
          vy: Math.random() > 0.5 ? 1 : -1,
        };
      },
    }),
  ).current;

  const { ballPos, lines, stats } = frameData;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Obstacle Text Reflow</Text>
      <Text style={styles.subtitle}>
        {isDragging ? 'Drag the ball around!' : 'Tap the ball to grab it'}
      </Text>

      <View
        style={[styles.container, { width: containerWidth, height: containerHeight }]}
        {...panResponder.panHandlers}
      >
        {lines.map((line, i) => (
          <Text
            key={`${i}-${line.x}-${line.y}`}
            style={[
              styles.lineText,
              { position: 'absolute', left: line.x, top: line.y, width: line.width },
            ]}
            numberOfLines={1}
          >
            {line.text}
          </Text>
        ))}

        <View
          style={[
            styles.ball,
            {
              left: ballPos.x - BALL_RADIUS,
              top: ballPos.y - BALL_RADIUS,
              opacity: isDragging ? 0.9 : 0.75,
            },
          ]}
        >
          <Text style={styles.ballEmoji}>{'🏀'}</Text>
        </View>
      </View>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>FPS</Text>
          <Text style={[styles.statValue, stats.fps < 40 && styles.statWarn]}>
            {stats.fps}
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>REFLOW</Text>
          <Text style={[styles.statValue, stats.reflowMs > 8 && styles.statWarn]}>
            {stats.reflowMs}ms
          </Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>LINES</Text>
          <Text style={styles.statValue}>{stats.lineCount}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MEASURES</Text>
          <Text style={styles.statValue}>{stats.measureCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    gap: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  lineText: {
    fontSize: FONT_SIZE,
    lineHeight: LINE_HEIGHT,
    color: '#1f2937',
  },
  ball: {
    position: 'absolute',
    width: BALL_RADIUS * 2,
    height: BALL_RADIUS * 2,
    borderRadius: BALL_RADIUS,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ballEmoji: {
    fontSize: 28,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6,6,10,0.88)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.35)',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    fontVariant: ['tabular-nums'],
  },
  statWarn: {
    color: '#f87171',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
