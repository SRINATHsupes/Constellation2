import React, { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: number;
  points: Point[];
  color: string;
  width: number;
};

type Tool = 'pen' | 'eraser';

type ShapeName =
  | 'triangle'
  | 'circle'
  | 'square'
  | 'combination';

type Phase =
  | 'guided-1'
  | 'guided-2'
  | 'memory'
  | 'complete';

type Level = {
  level: number;
  title: string;
  shape: ShapeName;
  description: string;
  colorMode?: boolean;
};

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 390;

/*
 * Internal accuracy only.
 * The child never sees this percentage.
 */
const PASS_THRESHOLD = 0.60;

const COLORS = {
  background: '#FFF9F5',
  paper: '#FFFDFB',
  charcoal: '#34313A',
  muted: '#817985',
  purple: '#8B6FC7',
  purpleDark: '#7655B5',
  lavender: '#9B83D7',
  pink: '#E98FA3',
  peach: '#F2B38F',
  mint: '#86CDB1',
  sky: '#82B8E8',
  yellow: '#F2C96D',
  border: '#E8DDE7',
  guide: '#B9A6D8',
  softPurple: '#EEE7FA',
  softPink: '#FCE9EF',
  softPeach: '#FCE9DD',
  softMint: '#E4F4ED',
};

const PEN_COLORS = [
  {
    name: 'Lavender',
    color: COLORS.lavender,
  },
  {
    name: 'Coral',
    color: COLORS.pink,
  },
  {
    name: 'Peach',
    color: COLORS.peach,
  },
  {
    name: 'Mint',
    color: COLORS.mint,
  },
  {
    name: 'Sky',
    color: COLORS.sky,
  },
  {
    name: 'Sun',
    color: COLORS.yellow,
  },
];

const LEVELS: Level[] = [
  {
    level: 1,
    title: 'TRACE THE SHAPE',
    shape: 'triangle',
    description:
      'Follow the guide. Draw the triangle carefully.',
  },
  {
    level: 2,
    title: 'DRAW IT YOURSELF',
    shape: 'circle',
    description:
      'Follow the guide. Learn the circle.',
  },
  {
    level: 3,
    title: 'BUILD THE FORM',
    shape: 'square',
    description:
      'Follow the guide. Learn the square.',
  },
  {
    level: 4,
    title: 'COLOR THE WORLD',
    shape: 'combination',
    description:
      'Remember the forms, then draw and color them.',
    colorMode: true,
  },
  {
    level: 5,
    title: 'THE MASTERPIECE',
    shape: 'combination',
    description:
      'Create your own composition.',
    colorMode: true,
  },
];

function distance(a: Point, b: Point) {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2),
  );
}

function pointToSegmentDistance(
  p: Point,
  a: Point,
  b: Point,
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  if (dx === 0 && dy === 0) {
    return distance(p, a);
  }

  const t = Math.max(
    0,
    Math.min(
      1,
      ((p.x - a.x) * dx +
        (p.y - a.y) * dy) /
        (dx * dx + dy * dy),
    ),
  );

  return distance(p, {
    x: a.x + t * dx,
    y: a.y + t * dy,
  });
}

function getTriangle(): Point[] {
  return [
    { x: 320, y: 60 },
    { x: 185, y: 310 },
    { x: 455, y: 310 },
    { x: 320, y: 60 },
  ];
}

function getCircle(): Point[] {
  const points: Point[] = [];

  for (let i = 0; i <= 90; i += 1) {
    const angle =
      (Math.PI * 2 * i) / 90;

    points.push({
      x: 320 + Math.cos(angle) * 120,
      y: 195 + Math.sin(angle) * 120,
    });
  }

  return points;
}

function getSquare(): Point[] {
  return [
    { x: 205, y: 80 },
    { x: 435, y: 80 },
    { x: 435, y: 310 },
    { x: 205, y: 310 },
    { x: 205, y: 80 },
  ];
}

function getCombination(): Point[][] {
  return [
    getTriangle().map((p) => ({
      x: p.x - 125,
      y: p.y - 10,
    })),

    getCircle().map((p) => ({
      x: p.x + 115,
      y: p.y - 20,
    })),

    getSquare().map((p) => ({
      x: p.x,
      y: p.y + 40,
    })),
  ];
}

function getTargets(
  shape: ShapeName,
): Point[][] {
  if (shape === 'triangle') {
    return [getTriangle()];
  }

  if (shape === 'circle') {
    return [getCircle()];
  }

  if (shape === 'square') {
    return [getSquare()];
  }

  return getCombination();
}

function pointsToPath(points: Point[]) {
  if (!points.length) {
    return '';
  }

  return points
    .map((point, index) =>
      index === 0
        ? `M ${point.x} ${point.y}`
        : `L ${point.x} ${point.y}`,
    )
    .join(' ');
}

/*
 * More forgiving accuracy:
 *
 * We sample the target and ask:
 * "Did the child draw reasonably close to this part?"
 *
 * This is deliberately not pixel-perfect.
 */
function scoreDrawing(
  strokes: Stroke[],
  targets: Point[][],
) {
  const userPoints = strokes.flatMap(
    (stroke) => stroke.points,
  );

  if (userPoints.length < 10) {
    return 0;
  }

  let total = 0;

  for (const target of targets) {
    let targetScore = 0;

    for (let i = 0; i < target.length; i += 2) {
      const targetPoint = target[i];

      let closest = Infinity;

      for (const stroke of strokes) {
        for (
          let p = 0;
          p < stroke.points.length - 1;
          p += 1
        ) {
          closest = Math.min(
            closest,
            pointToSegmentDistance(
              targetPoint,
              stroke.points[p],
              stroke.points[p + 1],
            ),
          );
        }
      }

      /*
       * 42 px tolerance gives a comfortable
       * child-friendly drawing range.
       */
      const localScore = Math.max(
        0,
        1 - closest / 42,
      );

      targetScore += localScore;
    }

    targetScore /=
      Math.ceil(target.length / 2);

    total += targetScore;
  }

  return total / targets.length;
}

function GuideShape({
  shape,
}: {
  shape: ShapeName;
}) {
  if (shape === 'triangle') {
    return (
      <Polygon
        points={getTriangle()
          .map(
            (p) =>
              `${p.x},${p.y}`,
          )
          .join(' ')}
        fill="rgba(185,166,216,0.06)"
        stroke={COLORS.guide}
        strokeWidth={8}
        strokeDasharray="13 10"
        strokeLinejoin="round"
      />
    );
  }

  if (shape === 'circle') {
    return (
      <Circle
        cx="320"
        cy="195"
        r="120"
        fill="rgba(185,166,216,0.06)"
        stroke={COLORS.guide}
        strokeWidth={8}
        strokeDasharray="13 10"
      />
    );
  }

  if (shape === 'square') {
    return (
      <Rect
        x="205"
        y="80"
        width="230"
        height="230"
        rx="20"
        fill="rgba(185,166,216,0.06)"
        stroke={COLORS.guide}
        strokeWidth={8}
        strokeDasharray="13 10"
      />
    );
  }

  const combination =
    getCombination();

  return (
    <>
      <Polygon
        points={combination[0]
          .map(
            (p) =>
              `${p.x},${p.y}`,
          )
          .join(' ')}
        fill="rgba(185,166,216,0.05)"
        stroke={COLORS.guide}
        strokeWidth={6}
        strokeDasharray="12 9"
        strokeLinejoin="round"
      />

      <Circle
        cx="435"
        cy="175"
        r="120"
        fill="rgba(185,166,216,0.05)"
        stroke={COLORS.guide}
        strokeWidth={6}
        strokeDasharray="12 9"
      />

      <Rect
        x="205"
        y="120"
        width="230"
        height="230"
        rx="20"
        fill="rgba(185,166,216,0.05)"
        stroke={COLORS.guide}
        strokeWidth={6}
        strokeDasharray="12 9"
      />
    </>
  );
}

export default function ArtsDrawingScreen() {
  const [levelIndex, setLevelIndex] =
    useState(0);

  /*
   * IMPORTANT:
   *
   * guided-1 = first guided drawing
   * guided-2 = second guided drawing
   * memory   = guide disappears
   *
   * Only the memory drawing is evaluated.
   */
  const [phase, setPhase] =
    useState<Phase>('guided-1');

  const [strokes, setStrokes] =
    useState<Stroke[]>([]);

  const [tool, setTool] =
    useState<Tool>('pen');

  const [selectedColor, setSelectedColor] =
    useState(COLORS.lavender);

  /*
   * Eraser size 1–10.
   */
  const [eraserSize, setEraserSize] =
    useState(5);

  const [message, setMessage] =
    useState(
      'Follow the dotted guide.',
    );

  const [completed, setCompleted] =
    useState<Record<number, boolean>>({});

  const strokeId =
    useRef(1);

  const currentLevel =
    LEVELS[levelIndex];

  const targets = useMemo(
    () =>
      getTargets(
        currentLevel.shape,
      ),
    [currentLevel.shape],
  );

  const canvasWidth =
    useRef(CANVAS_WIDTH);

  const canvasHeight =
    useRef(CANVAS_HEIGHT);

  const activeStroke =
    useRef<Stroke | null>(null);

  const getCanvasPoint = (
    event: any,
  ): Point => {
    const x =
      Number(
        event.nativeEvent.locationX,
      ) || 0;

    const y =
      Number(
        event.nativeEvent.locationY,
      ) || 0;

    const scaleX =
      CANVAS_WIDTH /
      Math.max(
        1,
        canvasWidth.current,
      );

    const scaleY =
      CANVAS_HEIGHT /
      Math.max(
        1,
        canvasHeight.current,
      );

    return {
      x: Math.max(
        0,
        Math.min(
          CANVAS_WIDTH,
          x * scaleX,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          CANVAS_HEIGHT,
          y * scaleY,
        ),
      ),
    };
  };

  const startStroke = (
    event: any,
  ) => {
    if (
      phase !== 'guided-1' &&
      phase !== 'guided-2' &&
      phase !== 'memory'
    ) {
      return;
    }

    const point =
      getCanvasPoint(event);

    if (tool === 'eraser') {
      eraseAtPoint(point);
      return;
    }

    const stroke: Stroke = {
      id: strokeId.current++,
      points: [point],
      color: selectedColor,
      width: 9,
    };

    activeStroke.current =
      stroke;

    setStrokes(
      (previous) => [
        ...previous,
        stroke,
      ],
    );
  };

  const moveStroke = (
    event: any,
  ) => {
    const point =
      getCanvasPoint(event);

    if (tool === 'eraser') {
      eraseAtPoint(point);
      return;
    }

    const current =
      activeStroke.current;

    if (!current) {
      return;
    }

    const last =
      current.points[
        current.points.length - 1
      ];

    /*
     * Ignore tiny finger movements.
     * This reduces excessive sensitivity.
     */
    if (
      distance(last, point) < 5
    ) {
      return;
    }

    current.points.push(point);

    setStrokes(
      (previous) => {
        const copy = [
          ...previous,
        ];

        copy[
          copy.length - 1
        ] = {
          ...current,
          points: [
            ...current.points,
          ],
        };

        return copy;
      },
    );
  };

  const endStroke = () => {
    activeStroke.current =
      null;
  };

  const eraseAtPoint = (
    point: Point,
  ) => {
    /*
     * Size 1–10 maps to approximately
     * 14px–50px erase radius.
     */
    const radius =
      10 + eraserSize * 4;

    setStrokes(
      (previous) =>
        previous.flatMap(
          (stroke) => {
            const pieces: Stroke[] =
              [];

            let currentPoints: Point[] =
              [];

            for (
              let i = 0;
              i < stroke.points.length;
              i += 1
            ) {
              const p =
                stroke.points[i];

              const hit =
                distance(
                  point,
                  p,
                ) <= radius;

              if (hit) {
                if (
                  currentPoints.length >
                  1
                ) {
                  pieces.push({
                    ...stroke,
                    id:
                      strokeId.current++,
                    points:
                      currentPoints,
                  });
                }

                currentPoints = [];
              } else {
                currentPoints.push(p);
              }
            }

            if (
              currentPoints.length > 1
            ) {
              pieces.push({
                ...stroke,
                id:
                  strokeId.current++,
                points:
                  currentPoints,
              });
            }

            return pieces;
          },
        ),
    );
  };

  const undo = () => {
    setStrokes(
      (previous) =>
        previous.slice(
          0,
          -1,
        ),
    );
  };

  const clearCurrentDrawing =
    () => {
      setStrokes([]);
    };

  const finishGuidedAttempt =
    () => {
      /*
       * Guided attempts are NOT scored.
       * We simply move through the
       * observation/training process.
       */
      if (
        phase === 'guided-1'
      ) {
        clearCurrentDrawing();

        setPhase('guided-2');

        setMessage(
          'Great. Follow the guide one more time.',
        );

        return;
      }

      if (
        phase === 'guided-2'
      ) {
        clearCurrentDrawing();

        setPhase('memory');

        setMessage(
          'Now the guide disappears. Draw it from memory.',
        );
      }
    };

  const finishMemoryAttempt =
    () => {
      if (
        strokes.length === 0
      ) {
        return;
      }

      const score =
        scoreDrawing(
          strokes,
          targets,
        );

      /*
       * SCORE IS NEVER DISPLAYED.
       *
       * 60% is enough to pass.
       */
      if (
        score >=
        PASS_THRESHOLD
      ) {
        setCompleted(
          (previous) => ({
            ...previous,
            [currentLevel.level]:
              true,
          }),
        );

        setPhase('complete');

        setMessage(
          'You remembered the shape! ⭐',
        );

        clearCurrentDrawing();

        return;
      }

      /*
       * Failed memory attempt:
       * give another memory attempt.
       * No percentage is shown.
       */
      clearCurrentDrawing();

      setMessage(
        'Almost! Try remembering the shape and draw it again.',
      );
    };

  const nextLevel = () => {
    if (
      !completed[
        currentLevel.level
      ]
    ) {
      return;
    }

    if (
      levelIndex >=
      LEVELS.length - 1
    ) {
      return;
    }

    setLevelIndex(
      (previous) =>
        previous + 1,
    );

    setPhase('guided-1');

    setStrokes([]);

    setTool('pen');

    setMessage(
      'Follow the dotted guide.',
    );
  };

  const previousLevel = () => {
    if (
      levelIndex === 0
    ) {
      return;
    }

    setLevelIndex(
      (previous) =>
        previous - 1,
    );

    setPhase('guided-1');

    setStrokes([]);

    setTool('pen');

    setMessage(
      'Follow the dotted guide.',
    );
  };

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () => true,

          onMoveShouldSetPanResponder:
            () => true,

          onPanResponderGrant:
            startStroke,

          onPanResponderMove:
            moveStroke,

          onPanResponderRelease:
            endStroke,

          onPanResponderTerminate:
            endStroke,
        }),
      [
        phase,
        tool,
        selectedColor,
        eraserSize,
      ],
    );

  const isGuided =
    phase === 'guided-1' ||
    phase === 'guided-2';

  const isMemory =
    phase === 'memory';

  const observationNumber =
    phase === 'guided-1'
      ? '1 / 2'
      : phase === 'guided-2'
        ? '2 / 2'
        : 'MEMORY';

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View
        style={styles.container}
      >
        <View
          style={styles.header}
        >
          <View
            style={styles.headerText}
          >
            <Text
              style={styles.eyebrow}
            >
              ARTS STUDIO
            </Text>

            <Text
              style={styles.title}
            >
              {currentLevel.title}
            </Text>

            <Text
              style={styles.subtitle}
            >
              {currentLevel.description}
            </Text>
          </View>

          <View
            style={styles.levelBadge}
          >
            <Text
              style={styles.levelSmall}
            >
              LEVEL
            </Text>

            <Text
              style={styles.levelNumber}
            >
              {currentLevel.level}
            </Text>
          </View>
        </View>

        <View
          style={styles.workspace}
        >
          <View
            style={styles.tools}
          >
            <Text
              style={styles.toolLabel}
            >
              PENS
            </Text>

            {PEN_COLORS.map(
              (pen) => (
                <Pressable
                  key={pen.color}
                  disabled={
                    !isGuided &&
                    !isMemory
                  }
                  onPress={() => {
                    setTool(
                      'pen',
                    );
                    setSelectedColor(
                      pen.color,
                    );
                  }}
                  style={[
                    styles.pen,
                    {
                      backgroundColor:
                        pen.color,
                    },
                    selectedColor ===
                      pen.color &&
                      tool ===
                        'pen' &&
                      styles.selectedPen,
                  ]}
                  accessibilityLabel={`${pen.name} pen`}
                >
                  <View
                    style={
                      styles.penTip
                    }
                  />
                </Pressable>
              ),
            )}

            <View
              style={styles.divider}
            />

            <Pressable
              onPress={() =>
                setTool(
                  'eraser',
                )
              }
              disabled={
                !isGuided &&
                !isMemory
              }
              style={[
                styles.toolButton,
                tool ===
                  'eraser' &&
                  styles.toolSelected,
              ]}
            >
              <Text
                style={styles.toolIcon}
              >
                ◇
              </Text>

              <Text
                style={styles.toolText}
              >
                Eraser
              </Text>
            </Pressable>

            <View
              style={styles.eraserCard}
            >
              <Text
                style={
                  styles.eraserTitle
                }
              >
                SIZE
              </Text>

              <View
                style={
                  styles.sizeRow
                }
              >
                {[1, 2, 3, 4, 5].map(
                  (size) => (
                    <Pressable
                      key={size}
                      onPress={() =>
                        setEraserSize(
                          size,
                        )
                      }
                      style={[
                        styles.sizeDot,
                        eraserSize ===
                          size &&
                          styles.sizeSelected,
                      ]}
                    >
                      <View
                        style={{
                          width:
                            4 +
                            size * 2,
                          height:
                            4 +
                            size * 2,
                          borderRadius:
                            20,
                          backgroundColor:
                            COLORS.muted,
                        }}
                      />
                    </Pressable>
                  ),
                )}
              </View>

              <View
                style={
                  styles.sizeRow
                }
              >
                {[6, 7, 8, 9, 10].map(
                  (size) => (
                    <Pressable
                      key={size}
                      onPress={() =>
                        setEraserSize(
                          size,
                        )
                      }
                      style={[
                        styles.sizeDot,
                        eraserSize ===
                          size &&
                          styles.sizeSelected,
                      ]}
                    >
                      <View
                        style={{
                          width:
                            4 +
                            size * 2,
                          height:
                            4 +
                            size * 2,
                          borderRadius:
                            20,
                          backgroundColor:
                            COLORS.muted,
                        }}
                      />
                    </Pressable>
                  ),
                )}
              </View>
            </View>

            <Pressable
              onPress={
                undo
              }
              disabled={
                strokes.length ===
                0
              }
              style={[
                styles.toolButton,
                strokes.length ===
                  0 &&
                  styles.disabledTool,
              ]}
            >
              <Text
                style={styles.toolIcon}
              >
                ↶
              </Text>

              <Text
                style={styles.toolText}
              >
                Undo
              </Text>
            </Pressable>
          </View>

          <View
            style={styles.canvasArea}
          >
            <View
              style={
                styles.canvasHeader
              }
            >
              <Text
                style={
                  styles.canvasPhase
                }
              >
                {isGuided
                  ? `FOLLOW THE GUIDE · ${observationNumber}`
                  : isMemory
                    ? 'DRAW FROM MEMORY'
                    : 'LEVEL COMPLETE'}
              </Text>

              {isGuided && (
                <Text
                  style={
                    styles.guideLabel
                  }
                >
                  GUIDE ON
                </Text>
              )}

              {isMemory && (
                <Text
                  style={
                    styles.memoryLabel
                  }
                >
                  GUIDE OFF
                </Text>
              )}
            </View>

            <View
              style={styles.canvas}
              onLayout={(event) => {
                canvasWidth.current =
                  event.nativeEvent.layout.width;

                canvasHeight.current =
                  event.nativeEvent.layout.height;
              }}
              {...panResponder.panHandlers}
            >
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
              >
                {isGuided && (
                  <GuideShape
                    shape={
                      currentLevel.shape
                    }
                  />
                )}

                {strokes.map(
                  (stroke) => (
                    <Path
                      key={
                        stroke.id
                      }
                      d={pointsToPath(
                        stroke.points,
                      )}
                      fill="none"
                      stroke={
                        stroke.color
                      }
                      strokeWidth={
                        stroke.width
                      }
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ),
                )}
              </Svg>

              {isMemory &&
                strokes.length ===
                  0 && (
                  <View
                    pointerEvents="none"
                    style={
                      styles.blankHint
                    }
                  >
                    <Text
                      style={
                        styles.blankHintText
                      }
                    >
                      DRAW FROM MEMORY
                    </Text>
                  </View>
                )}

              {phase ===
                'complete' && (
                <View
                  pointerEvents="none"
                  style={
                    styles.completeOverlay
                  }
                >
                  <Text
                    style={
                      styles.star
                    }
                  >
                    ★
                  </Text>

                  <Text
                    style={
                      styles.completeText
                    }
                  >
                    REMEMBERED
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={styles.message}
            >
              {message}
            </Text>
          </View>

          <View
            style={styles.sidePanel}
          >
            <View
              style={
                styles.infoCard
              }
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                PRACTICE
              </Text>

              <View
                style={
                  styles.practiceSteps
                }
              >
                <View
                  style={[
                    styles.step,
                    phase !==
                      'guided-1' &&
                      styles.stepDone,
                  ]}
                >
                  <Text
                    style={
                      styles.stepText
                    }
                  >
                    1
                  </Text>
                </View>

                <View
                  style={[
                    styles.step,
                    (phase === 'memory' ||
                      phase === 'complete' ||
                      phase === 'guided-2') &&
                      styles.stepDone,
                  ]}
                >
                  <Text
                    style={
                      styles.stepText
                    }
                  >
                    2
                  </Text>
                </View>

                <View
                  style={[
                    styles.step,
                    isMemory ||
                      phase ===
                        'complete' ?
                      styles.stepDone :
                      null,
                  ]}
                >
                  <Text
                    style={
                      styles.stepText
                    }
                  >
                    3
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.cardText
                }
              >
                Follow twice, then
                remember once.
              </Text>
            </View>

            {currentLevel.colorMode && (
              <View
                style={[
                  styles.infoCard,
                  {
                    backgroundColor:
                      COLORS.softMint,
                  },
                ]}
              >
                <Text
                  style={
                    styles.cardLabel
                  }
                >
                  COLOR
                </Text>

                <Text
                  style={
                    styles.colorTitle
                  }
                >
                  Make it yours
                </Text>

                <Text
                  style={
                    styles.cardText
                  }
                >
                  Pick any pastel pen
                  and add your own
                  colors.
                </Text>
              </View>
            )}

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor:
                    COLORS.softPeach,
                },
              ]}
            >
              <Text
                style={
                  styles.cardLabel
                }
              >
                MEMORY
              </Text>

              <Text
                style={
                  styles.memoryBig
                }
              >
                {isMemory
                  ? 'DRAW'
                  : phase ===
                      'complete'
                    ? '★'
                    : 'LOOK'}
              </Text>

              <Text
                style={
                  styles.cardText
                }
              >
                {isMemory
                  ? 'The guide is gone. Trust what you remember.'
                  : 'Study the shape before the guide disappears.'}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={styles.footer}
        >
          <Pressable
            onPress={
              previousLevel
            }
            disabled={
              levelIndex === 0
            }
            style={[
              styles.navButton,
              levelIndex ===
                0 &&
                styles.disabledTool,
            ]}
          >
            <Text
              style={
                styles.navText
              }
            >
              ‹
            </Text>
          </Pressable>

          <View
            style={
              styles.levelDots
            }
          >
            {LEVELS.map(
              (item, index) => (
                <View
                  key={
                    item.level
                  }
                  style={[
                    styles.levelDot,
                    index ===
                      levelIndex &&
                      styles.currentDot,
                    completed[
                      item.level
                    ] &&
                      styles.completeDot,
                  ]}
                />
              ),
            )}
          </View>

          {isGuided && (
            <Pressable
              onPress={
                finishGuidedAttempt
              }
              style={
                styles.primaryButton
              }
            >
              <Text
                style={
                  styles.primaryText
                }
              >
                {phase ===
                'guided-1'
                  ? 'NEXT LOOK'
                  : 'HIDE & DRAW'}
              </Text>
            </Pressable>
          )}

          {isMemory && (
            <Pressable
              onPress={
                finishMemoryAttempt
              }
              disabled={
                strokes.length ===
                0
              }
              style={[
                styles.primaryButton,
                strokes.length ===
                  0 &&
                  styles.primaryDisabled,
              ]}
            >
              <Text
                style={
                  styles.primaryText
                }
              >
                CHECK DRAWING
              </Text>
            </Pressable>
          )}

          {phase ===
            'complete' && (
            <Pressable
              onPress={
                nextLevel
              }
              disabled={
                !completed[
                  currentLevel.level
                ] ||
                levelIndex >=
                  LEVELS.length -
                    1
              }
              style={[
                styles.primaryButton,
                (levelIndex >=
                  LEVELS.length -
                    1 ||
                  !completed[
                    currentLevel.level
                  ]) &&
                  styles.primaryDisabled,
              ]}
            >
              <Text
                style={
                  styles.primaryText
                }
              >
                {levelIndex >=
                LEVELS.length - 1
                  ? 'MASTERED'
                  : 'NEXT LEVEL'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 12,
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  eyebrow: {
    color: COLORS.purple,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    marginBottom: 3,
  },

  title: {
    color: COLORS.charcoal,
    fontSize: 25,
    fontWeight: '900',
  },

  subtitle: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 3,
  },

  levelBadge: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor:
      COLORS.softPurple,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  levelSmall: {
    color:
      COLORS.purpleDark,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
  },

  levelNumber: {
    color:
      COLORS.purpleDark,
    fontSize: 22,
    fontWeight: '900',
  },

  workspace: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },

  tools: {
    width: 74,
    alignItems: 'center',
    paddingVertical: 6,
    marginRight: 10,
  },

  toolLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },

  pen: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: 7,
  },

  selectedPen: {
    borderWidth: 3,
    borderColor:
      COLORS.purpleDark,
  },

  penTip: {
    width: 7,
    height: 15,
    borderRadius: 5,
    backgroundColor:
      'rgba(255,255,255,0.75)',
  },

  divider: {
    width: 38,
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical: 6,
  },

  toolButton: {
    width: 64,
    minHeight: 48,
    borderRadius: 16,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent:
      'center',
    marginBottom: 7,
  },

  toolSelected: {
    borderWidth: 2,
    borderColor:
      COLORS.purple,
    backgroundColor:
      COLORS.softPurple,
  },

  disabledTool: {
    opacity: 0.35,
  },

  toolIcon: {
    color: COLORS.charcoal,
    fontSize: 17,
  },

  toolText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 2,
  },

  eraserCard: {
    width: 64,
    borderRadius: 16,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    paddingVertical: 7,
    marginBottom: 7,
  },

  eraserTitle: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 3,
  },

  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 1,
    marginVertical: 1,
  },

  sizeDot: {
    width: 11,
    height: 18,
    alignItems: 'center',
    justifyContent:
      'center',
    borderRadius: 5,
  },

  sizeSelected: {
    backgroundColor:
      COLORS.softPurple,
  },

  canvasArea: {
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },

  canvasHeader: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  canvasPhase: {
    color:
      COLORS.charcoal,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  guideLabel: {
    color:
      COLORS.purple,
    fontSize: 9,
    fontWeight: '900',
  },

  memoryLabel: {
    color:
      COLORS.pink,
    fontSize: 9,
    fontWeight: '900',
  },

  canvas: {
    flex: 1,
    minHeight: 230,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  blankHint: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  blankHintText: {
    color: '#E6DEE6',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },

  completeOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent:
      'center',
    backgroundColor:
      'rgba(255,253,251,0.88)',
  },

  star: {
    color:
      COLORS.yellow,
    fontSize: 58,
  },

  completeText: {
    color:
      COLORS.purpleDark,
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
  },

  message: {
    height: 32,
    color: COLORS.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingTop: 8,
  },

  sidePanel: {
    width: 150,
    minWidth: 120,
    paddingTop: 40,
    gap: 10,
  },

  infoCard: {
    borderRadius: 22,
    backgroundColor:
      COLORS.softPurple,
    padding: 14,
  },

  cardLabel: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  cardText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 7,
  },

  colorTitle: {
    color:
      COLORS.charcoal,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 5,
  },

  memoryBig: {
    color:
      COLORS.purpleDark,
    fontSize: 25,
    fontWeight: '900',
    marginTop: 4,
  },

  practiceSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
  },

  step: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor:
      '#D8CBEA',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  stepDone: {
    backgroundColor:
      COLORS.purple,
  },

  stepText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  footer: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 12,
    paddingTop: 8,
  },

  navButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  navText: {
    color:
      COLORS.charcoal,
    fontSize: 30,
    lineHeight: 32,
  },

  levelDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
  },

  levelDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      '#DDD4DF',
  },

  currentDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor:
      COLORS.purple,
  },

  completeDot: {
    backgroundColor:
      COLORS.yellow,
  },

  primaryButton: {
    minWidth: 130,
    minHeight: 46,
    borderRadius: 17,
    paddingHorizontal: 18,
    backgroundColor:
      COLORS.purple,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  primaryDisabled: {
    opacity: 0.4,
  },

  primaryText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
});
