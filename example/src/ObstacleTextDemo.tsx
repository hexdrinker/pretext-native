import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Animated,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { measureTextSync } from 'pretext-native';

const BALL_RADIUS = 40;
const FONT_SIZE = 14;
const LINE_HEIGHT = 20;
const PADDING = 12;

const SAMPLE_TEXT =
  'React Native lets you build mobile apps using only JavaScript. It uses the same design as React, letting you compose a rich mobile UI from declarative components. pretext-native measures text before rendering. This eliminates layout jumps, enables accurate FlatList heights, and supports truncation detection via synchronous JSI calls. The two-tier LRU cache achieves over 95% hit rate on real-world data, running at 2 to 5 million operations per second with warm cache. This demo shows text reflowing around a floating obstacle in real time, computing layout on every frame. 이 라이브러리는 iOS에서 CoreText, Android에서 StaticLayout을 사용하여 네이티브 수준의 정확한 텍스트 측정을 제공합니다. 캐시 기반으로 반복 측정이 즉시 처리됩니다. Try dragging the ball around to see the text reflow dynamically.';

interface LineSegment {
  text: string;
  x: number;
  y: number;
  width: number;
}

function computeReflowLines(
  text: string,
  containerWidth: number,
  ballX: number,
  ballY: number,
  ballRadius: number,
): LineSegment[] {
  const words = text.split(/(\s+)/).filter((w) => w.length > 0);
  const lines: LineSegment[] = [];
  let currentY = 0;
  let wordIndex = 0;

  while (wordIndex < words.length) {
    // Calculate exclusion zone for this line
    const lineTop = currentY;
    const lineBottom = currentY + LINE_HEIGHT;
    const ballTop = ballY - ballRadius;
    const ballBottom = ballY + ballRadius;

    let availableSegments: { x: number; width: number }[] = [];

    if (lineBottom > ballTop && lineTop < ballBottom) {
      // Line intersects ball — compute horizontal exclusion
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

        // Left segment
        if (exLeft > 30) {
          availableSegments.push({ x: 0, width: exLeft - 4 });
        }
        // Right segment
        if (containerWidth - exRight > 30) {
          availableSegments.push({ x: exRight + 4, width: containerWidth - exRight - 4 });
        }

        if (availableSegments.length === 0) {
          // Ball covers entire line width — skip this line
          currentY += LINE_HEIGHT;
          continue;
        }
      } else {
        availableSegments.push({ x: 0, width: containerWidth });
      }
    } else {
      availableSegments.push({ x: 0, width: containerWidth });
    }

    // Fill words into available segments
    let placedAny = false;
    for (const seg of availableSegments) {
      if (wordIndex >= words.length) break;

      let lineText = '';
      let tempIndex = wordIndex;

      while (tempIndex < words.length) {
        const candidate = lineText + words[tempIndex];
        const measured = measureTextSync({
          text: candidate.trim(),
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
      // Safety: skip a line to avoid infinite loop
      currentY += LINE_HEIGHT;
      continue;
    }

    currentY += LINE_HEIGHT;
  }

  return lines;
}

export function ObstacleTextDemo() {
  const { width: screenWidth } = useWindowDimensions();
  const containerWidth = screenWidth - PADDING * 2 - 24;
  const containerHeight = 500;

  const [ballPos, setBallPos] = useState({
    x: containerWidth / 2,
    y: containerHeight / 3,
  });
  const [isDragging, setIsDragging] = useState(false);

  // Bouncing animation
  const velocityRef = useRef({ vx: 1.8, vy: 1.2 });
  const posRef = useRef({ x: containerWidth / 2, y: containerHeight / 3 });
  const animFrameRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  const animate = useCallback(() => {
    if (draggingRef.current) {
      animFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const pos = posRef.current;
    const vel = velocityRef.current;

    let nx = pos.x + vel.vx;
    let ny = pos.y + vel.vy;

    if (nx - BALL_RADIUS < 0 || nx + BALL_RADIUS > containerWidth) {
      vel.vx *= -1;
      nx = Math.max(BALL_RADIUS, Math.min(containerWidth - BALL_RADIUS, nx));
    }
    if (ny - BALL_RADIUS < 0 || ny + BALL_RADIUS > containerHeight) {
      vel.vy *= -1;
      ny = Math.max(BALL_RADIUS, Math.min(containerHeight - BALL_RADIUS, ny));
    }

    posRef.current = { x: nx, y: ny };
    setBallPos({ x: nx, y: ny });

    animFrameRef.current = requestAnimationFrame(animate);
  }, [containerWidth, containerHeight]);

  useEffect(() => {
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
        setBallPos({ x: nx, y: ny });
      },
      onPanResponderRelease: () => {
        draggingRef.current = false;
        setIsDragging(false);
        velocityRef.current = {
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
        };
      },
    }),
  ).current;

  const lines = computeReflowLines(
    SAMPLE_TEXT,
    containerWidth,
    ballPos.x,
    ballPos.y,
    BALL_RADIUS + 8,
  );

  return (
    <View style={styles.wrapper}>
      <Text style={styles.heading}>Obstacle Text Reflow</Text>
      <Text style={styles.subtitle}>
        {isDragging ? 'Drag the ball around!' : 'Tap the ball to grab it'}
      </Text>

      <View
        style={[
          styles.container,
          { width: containerWidth, height: containerHeight },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Text lines */}
        {lines.map((line, i) => (
          <Text
            key={`${i}-${line.x}-${line.y}`}
            style={[
              styles.lineText,
              {
                position: 'absolute',
                left: line.x,
                top: line.y,
                width: line.width,
              },
            ]}
            numberOfLines={1}
          >
            {line.text}
          </Text>
        ))}

        {/* Ball */}
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

      <Text style={styles.info}>
        Lines: {lines.length} | Ball: ({Math.round(ballPos.x)},{' '}
        {Math.round(ballPos.y)})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
  info: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});
