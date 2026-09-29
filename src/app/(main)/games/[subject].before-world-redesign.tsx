import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Path,
  Rect,
  Line,
} from 'react-native-svg';

type SubjectId = 'vedic' | 'arts' | 'manufacturing';

type LevelState = 'completed' | 'current' | 'locked';

type Level = {
  number: number;
  title: string;
  description: string;
  object: string;
  state: LevelState;
  route?: string;
};

type SubjectConfig = {
  title: string;
  subtitle: string;
  accent: string;
  accentLight: string;
  levels: {
    title: string;
    description: string;
    object: string;
    route?: string;
  }[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MAP_WIDTH = Math.max(SCREEN_WIDTH, 360);
const MAP_HEIGHT = 1040;

/*
 * ============================================================
 * SUBJECT WORLDS
 * ============================================================
 */

const SUBJECTS: Record<SubjectId, SubjectConfig> = {
  vedic: {
    title: 'Vedic Maths',
    subtitle: 'Numbers · Patterns · Mental Power',
    accent: '#9B83D7',
    accentLight: '#DCD1F0',

    levels: [
      {
        title: 'Number Sense',
        description:
          'Begin your journey by noticing numbers and patterns.',
        object: '123',
        route: '/play/vedic-escape',
      },
      {
        title: 'Number Patterns',
        description:
          'Discover the hidden structure inside numbers.',
        object: '×',
      },
      {
        title: 'Fast Calculation',
        description:
          'Use clever mathematical patterns to calculate faster.',
        object: '÷',
      },
      {
        title: 'Vedic Challenge',
        description:
          'Combine the ideas you discovered along the journey.',
        object: '∑',
      },
      {
        title: 'Number Escape',
        description:
          'Use your mathematical thinking to solve the final room.',
        object: '99',
      },
    ],
  },

  arts: {
    title: 'Drawing & Arts',
    subtitle: 'Draw · Shape · Imagine',
    accent: '#E98FA3',
    accentLight: '#F4CBD5',

    levels: [
      {
        title: 'Lines & Shapes',
        description:
          'Turn simple marks into shapes and pictures.',
        object: '🖌',
        route: '/play/arts-drawing',
      },
      {
        title: 'Shape Builder',
        description:
          'Combine shapes to create something new.',
        object: '△',
      },
      {
        title: 'Color Workshop',
        description:
          'Explore color, balance and visual patterns.',
        object: '🎨',
      },
      {
        title: 'Picture Puzzle',
        description:
          'Solve a visual puzzle using your imagination.',
        object: '◯',
      },
      {
        title: 'Creative Challenge',
        description:
          'Bring your ideas together into a final creation.',
        object: '✎',
      },
    ],
  },

  manufacturing: {
    title: 'Manufacturing',
    subtitle: 'Machines · Gears · Build',
    accent: '#D99461',
    accentLight: '#F0C8AA',

    levels: [
      {
        title: 'Meet the Gears',
        description:
          'Discover how simple machine parts work together.',
        object: '⚙',
        route: '/play/manufacturing',
      },
      {
        title: 'Fix the Machine',
        description:
          'Find the problem and figure out what needs fixing.',
        object: '⚒',
      },
      {
        title: 'Build the Mechanism',
        description:
          'Put the right parts together and make them work.',
        object: '⚙',
      },
      {
        title: 'Workshop Puzzle',
        description:
          'Use engineering thinking to solve the workshop.',
        object: '🔧',
      },
      {
        title: 'Inventor Challenge',
        description:
          'Think like an inventor and complete the machine.',
        object: '⚙',
      },
    ],
  },
};

/*
 * ============================================================
 * PROGRESS
 * ============================================================
 *
 * TEMPORARY:
 * Level 1 is the current playable level.
 *
 * Later this value comes from saved local progress.
 */



/*
 * ============================================================
 * LEVEL DATA
 * ============================================================
 */

function createLevels(subject: SubjectId, completedLevel: number): Level[] {
  const world = SUBJECTS[subject];

  return world.levels.map((level, index) => {
    const number = index + 1;

    let state: LevelState;

    if (number <= completedLevel) {
      state = 'completed';
    } else if (number === completedLevel + 1) {
      state = 'current';
    } else {
      state = 'locked';
    }

    return {
      number,
      title: level.title,
      description: level.description,
      object: level.object,
      route: level.route,
      state,
    };
  });
}

/*
 * ============================================================
 * CONSTELLATION POSITIONS
 * ============================================================
 *
 * Deliberately NOT a zig-zag.
 *
 * These positions create a network where paths can cross.
 */

const LEVEL_POINTS = [
  {
    x: MAP_WIDTH * 0.22,
    y: 155,
  },
  {
    x: MAP_WIDTH * 0.73,
    y: 300,
  },
  {
    x: MAP_WIDTH * 0.43,
    y: 445,
  },
  {
    x: MAP_WIDTH * 0.77,
    y: 600,
  },
  {
    x: MAP_WIDTH * 0.28,
    y: 755,
  },
];

/*
 * ============================================================
 * CONSTELLATION NETWORK
 * ============================================================
 *
 * Five large nodes are the real levels.
 *
 * Everything else is a constellation star or connector.
 * Decorative stars are NOT playable levels.
 */

const CONSTELLATION_STARS = [
  { x: MAP_WIDTH * 0.10, y: 105, r: 3 },
  { x: MAP_WIDTH * 0.42, y: 95, r: 2.5 },
  { x: MAP_WIDTH * 0.78, y: 120, r: 3 },
  { x: MAP_WIDTH * 0.91, y: 225, r: 2.5 },

  { x: MAP_WIDTH * 0.38, y: 225, r: 3 },
  { x: MAP_WIDTH * 0.56, y: 205, r: 2.5 },
  { x: MAP_WIDTH * 0.15, y: 300, r: 3 },

  { x: MAP_WIDTH * 0.58, y: 365, r: 3 },
  { x: MAP_WIDTH * 0.88, y: 400, r: 3 },
  { x: MAP_WIDTH * 0.20, y: 430, r: 2.5 },

  { x: MAP_WIDTH * 0.65, y: 485, r: 2.5 },
  { x: MAP_WIDTH * 0.34, y: 545, r: 3 },
  { x: MAP_WIDTH * 0.91, y: 555, r: 3 },

  { x: MAP_WIDTH * 0.55, y: 655, r: 2.5 },
  { x: MAP_WIDTH * 0.16, y: 680, r: 3 },
  { x: MAP_WIDTH * 0.48, y: 735, r: 2.5 },

  { x: MAP_WIDTH * 0.72, y: 760, r: 3 },
  { x: MAP_WIDTH * 0.88, y: 845, r: 2.5 },
  { x: MAP_WIDTH * 0.12, y: 850, r: 3 },
];

/*
 * Thin constellation connections.
 *
 * The first four paths form the actual level journey.
 * The remaining paths create branches and crossings.
 */

function getJourneyPaths() {
  const p = LEVEL_POINTS;

  return {
    main: [
      `M ${p[0].x} ${p[0].y}
       C ${MAP_WIDTH * 0.30} 120,
         ${MAP_WIDTH * 0.52} 235,
         ${p[1].x} ${p[1].y}`,

      `M ${p[1].x} ${p[1].y}
       C ${MAP_WIDTH * 0.62} 330,
         ${MAP_WIDTH * 0.52} 405,
         ${p[2].x} ${p[2].y}`,

      `M ${p[2].x} ${p[2].y}
       C ${MAP_WIDTH * 0.50} 500,
         ${MAP_WIDTH * 0.68} 555,
         ${p[3].x} ${p[3].y}`,

      `M ${p[3].x} ${p[3].y}
       C ${MAP_WIDTH * 0.65} 650,
         ${MAP_WIDTH * 0.43} 720,
         ${p[4].x} ${p[4].y}`,
    ],

    decorative: [
      `M ${MAP_WIDTH * 0.10} 105
       C ${MAP_WIDTH * 0.30} 75,
         ${MAP_WIDTH * 0.55} 145,
         ${MAP_WIDTH * 0.78} 120`,

      `M ${MAP_WIDTH * 0.15} 300
       C ${MAP_WIDTH * 0.35} 190,
         ${MAP_WIDTH * 0.55} 330,
         ${MAP_WIDTH * 0.91} 225`,

      `M ${MAP_WIDTH * 0.10} 105
       C ${MAP_WIDTH * 0.20} 245,
         ${MAP_WIDTH * 0.48} 205,
         ${MAP_WIDTH * 0.58} 365`,

      `M ${MAP_WIDTH * 0.38} 225
       C ${MAP_WIDTH * 0.62} 250,
         ${MAP_WIDTH * 0.70} 390,
         ${MAP_WIDTH * 0.88} 400`,

      `M ${MAP_WIDTH * 0.20} 430
       C ${MAP_WIDTH * 0.40} 350,
         ${MAP_WIDTH * 0.55} 470,
         ${MAP_WIDTH * 0.65} 485`,

      `M ${MAP_WIDTH * 0.34} 545
       C ${MAP_WIDTH * 0.48} 470,
         ${MAP_WIDTH * 0.72} 535,
         ${MAP_WIDTH * 0.91} 555`,

      `M ${MAP_WIDTH * 0.16} 680
       C ${MAP_WIDTH * 0.30} 585,
         ${MAP_WIDTH * 0.50} 690,
         ${MAP_WIDTH * 0.72} 760`,

      `M ${MAP_WIDTH * 0.55} 655
       C ${MAP_WIDTH * 0.68} 585,
         ${MAP_WIDTH * 0.82} 700,
         ${MAP_WIDTH * 0.88} 845`,

      `M ${MAP_WIDTH * 0.12} 850
       C ${MAP_WIDTH * 0.32} 760,
         ${MAP_WIDTH * 0.55} 805,
         ${MAP_WIDTH * 0.72} 760`,
    ],
  };
}

/*
 * ============================================================
 * SUBJECT OBJECT
 * ============================================================
 *
 * The object is deliberately inside a gradient "hole".
 */

function SubjectObject({
  subject,
  object,
  color,
}: {
  subject: SubjectId;
  object: string;
  color: string;
}) {
  if (subject === 'manufacturing') {
    return (
      <View style={styles.machineObject}>
        <View
          style={[
            styles.gearRing,
            {
              borderColor: color,
            },
          ]}
        >
          <Text
            style={[
              styles.gearText,
              {
                color,
              },
            ]}
          >
            ⚙
          </Text>
        </View>
      </View>
    );
  }

  if (subject === 'arts') {
    return (
      <View style={styles.artObject}>
        <Text
          style={[
            styles.artBrush,
            {
              color,
            },
          ]}
        >
          {object}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mathObject}>
      <Text
        style={[
          styles.mathText,
          {
            color,
          },
        ]}
      >
        {object}
      </Text>
    </View>
  );
}

/*
 * ============================================================
 * LEVEL NODE
 * ============================================================
 */

function LevelNode({
  level,
  subject,
  accent,
  selected,
  onPress,
}: {
  level: Level;
  subject: SubjectId;
  accent: string;
  selected: boolean;
  onPress: () => void;
}) {
  const point = LEVEL_POINTS[level.number - 1];

  const isCurrent = level.state === 'current';
  const isCompleted = level.state === 'completed';
  const isLocked = level.state === 'locked';

  return (
    <Pressable
      disabled={isLocked || !level.route}
      onPress={onPress}
      style={[
        styles.nodeWrapper,
        {
          left: point.x - 53,
          top: point.y - 53,
        },
      ]}
    >
      {/* ================================================ */}
      {/* DRIVER */}
      {/* ================================================ */}

      {isCurrent && (
        <View style={styles.driver}>
          <View
            style={[
              styles.driverStar,
              {
                backgroundColor: accent,
              },
            ]}
          >
            <Text style={styles.driverStarText}>✦</Text>
          </View>

          <View
            style={[
              styles.driverPill,
              {
                borderColor: accent,
              },
            ]}
          >
            <Text
              style={[
                styles.driverText,
                {
                  color: accent,
                },
              ]}
            >
              YOU ARE HERE
            </Text>
          </View>
        </View>
      )}

      {/* ================================================ */}
      {/* LEVEL HOLE */}
      {/* ================================================ */}

      <LinearGradient
        colors={
          isLocked
            ? ['#EEE9E5', '#FFFDFB', '#F4F0ED']
            : isCompleted
            ? [accent + '88', '#FFFDFB', accent + '30']
            : [accent + '75', '#FFFDFB', accent + '28']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.levelHole,

          isCurrent && {
            borderColor: accent,
            borderWidth: 3,
          },

          isCompleted && {
            borderColor: accent + 'AA',
          },

          isLocked && {
            borderColor: '#DCD5CF',
          },

          selected && {
            borderWidth: 4,
          },
        ]}
      >
        {/* inner glow */}

        <View
          style={[
            styles.innerGlow,
            {
              borderColor: isLocked
                ? '#DDD6D0'
                : accent + '45',
            },
          ]}
        >
          {isLocked ? (
            <Text style={styles.lockIcon}>🔒</Text>
          ) : isCompleted ? (
            <View
              style={[
                styles.completedCircle,
                {
                  backgroundColor: accent,
                },
              ]}
            >
              <Text style={styles.check}>✓</Text>
            </View>
          ) : (
            <SubjectObject
              subject={subject}
              object={level.object}
              color={accent}
            />
          )}
        </View>

        {/* number */}

        <View
          style={[
            styles.numberBadge,
            {
              backgroundColor: isLocked
                ? '#C9C2BC'
                : accent,
            },
          ]}
        >
          <Text style={styles.numberText}>
            {level.number}
          </Text>
        </View>
      </LinearGradient>

      {/* ================================================ */}
      {/* LABEL */}
      {/* ================================================ */}

      <View style={styles.nodeLabel}>
        <Text style={styles.nodeTitle}>
          {level.title}
        </Text>

        {isCurrent && (
          <Text
            style={[
              styles.nodeStatus,
              {
                color: accent,
              },
            ]}
          >
            PLAY
          </Text>
        )}

        {isCompleted && (
          <Text style={styles.nodeStatus}>
            COMPLETED
          </Text>
        )}

        {isLocked && (
          <Text style={styles.nodeStatus}>
            LOCKED
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/*
 * ============================================================
 * SCREEN
 * ============================================================
 */

export default function GamesSubjectScreen() {
  const params = useLocalSearchParams<{
    subject?: string;
    completed?: string;
  }>();

  const router = useRouter();

  const completedLevel = Math.max(
    0,
    Math.min(
      5,
      Number(params.completed ?? '0'),
    ),
  );

  const requestedSubject =
    String(params.subject ?? 'vedic').toLowerCase();

  const subject: SubjectId =
    requestedSubject === 'arts'
      ? 'arts'
      : requestedSubject === 'manufacturing' ||
        requestedSubject === 'tech'
      ? 'manufacturing'
      : 'vedic';

  const config = SUBJECTS[subject];

  /*
   * Eventually this comes from local persistence.
   *
   * For now we keep Level 1 current.
   */

  const levels = useMemo(
    () => createLevels(subject, completedLevel),
    [subject],
  );

  const [selectedLevel, setSelectedLevel] =
    useState(completedLevel + 1);

  const selected =
    levels[selectedLevel - 1] ?? levels[0];

  const { main, decorative } = getJourneyPaths();

  const openLevel = (level: Level) => {
    setSelectedLevel(level.number);

    if (level.state !== 'current') {
      return;
    }

    if (!level.route) {
      return;
    }

    router.push(level.route as any);
  };

  return (
    <View style={styles.screen}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ================================================ */}
        {/* HEADER */}
        {/* ================================================ */}

        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.subjectTitle}>
              {config.title}
            </Text>

            <Text style={styles.subjectSubtitle}>
              {config.subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.worldOrb,
              {
                borderColor: config.accent,
              },
            ]}
          >
            <View
              style={[
                styles.worldOrbInner,
                {
                  backgroundColor:
                    config.accentLight,
                },
              ]}
            />
          </View>
        </View>

        {/* ================================================ */}
        {/* INTRO */}
        {/* ================================================ */}

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>
            YOUR CONSTELLATION
          </Text>

          <Text style={styles.introTitle}>
            Follow the discoveries
          </Text>

          <Text style={styles.introSubtitle}>
            Each star opens a new level of the journey.
          </Text>
        </View>

        {/* ================================================ */}
        {/* CONSTELLATION */}
        {/* ================================================ */}

        <View
          style={[
            styles.map,
            {
              width: MAP_WIDTH,
            },
          ]}
        >
          <Svg
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          >
            {/* soft atmosphere */}

            <Circle
              cx={MAP_WIDTH * 0.12}
              cy={160}
              r={72}
              fill={config.accentLight}
              opacity={0.16}
            />

            <Circle
              cx={MAP_WIDTH * 0.87}
              cy={390}
              r={90}
              fill={config.accentLight}
              opacity={0.14}
            />

            <Circle
              cx={MAP_WIDTH * 0.14}
              cy={690}
              r={85}
              fill={config.accentLight}
              opacity={0.12}
            />

            {/* ============================================ */}
            {/* DECORATIVE CROSSING CONSTELLATION */}
            {/* ============================================ */}

            {decorative.map((path, index) => (
              <Path
                key={`decorative-${index}`}
                d={path}
                fill="none"
                stroke={config.accentLight}
                strokeWidth={1.6}
                strokeOpacity={0.38}
                strokeLinecap="round"
              />
            ))}

            {/* ============================================ */}
            {/* FUTURE MAIN PATH */}
            {/* ============================================ */}

            {main.map((path, index) => (
              <Path
                key={`future-${index}`}
                d={path}
                fill="none"
                stroke="#DED8D3"
                strokeWidth={1.8}
                strokeOpacity={0.72}
                strokeLinecap="round"
              />
            ))}

            {/* ============================================ */}
            {/* COMPLETED / TRAVELLED PATH */}
            {/* ============================================ */}

            {main
              .slice(0, completedLevel)
              .map((path, index) => (
                <Path
                  key={`completed-${index}`}
                  d={path}
                  fill="none"
                  stroke={config.accent}
                  strokeOpacity={0.78}
                  strokeWidth={3}
                  strokeLinecap="round"
                />
              ))}

            {/* ============================================ */}
            {/* PATH HIGHLIGHT */}
            {/* ============================================ */}

            {main.map((path, index) => (
              <Path
                key={`highlight-${index}`}
                d={path}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.70}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}

            {/* ============================================ */}
            {/* CONSTELLATION STARS */}
            {/* ============================================ */}

            {CONSTELLATION_STARS.map(
              (star, index) => (
                <React.Fragment
                  key={`star-${index}`}
                >
                  <Circle
                    cx={star.x}
                    cy={star.y}
                    r={star.r * 2.8}
                    fill={config.accentLight}
                    opacity={0.10}
                  />

                  <Circle
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill={config.accent}
                    opacity={0.62}
                  />

                  <Line
                    x1={star.x - star.r * 2.2}
                    y1={star.y}
                    x2={star.x + star.r * 2.2}
                    y2={star.y}
                    stroke={config.accent}
                    strokeOpacity={0.28}
                    strokeWidth={1}
                  />

                  <Line
                    x1={star.x}
                    y1={star.y - star.r * 2.2}
                    x2={star.x}
                    y2={star.y + star.r * 2.2}
                    stroke={config.accent}
                    strokeOpacity={0.28}
                    strokeWidth={1}
                  />
                </React.Fragment>
              )
            )}

            {/* small constellation cross-stars */}

            <Line
              x1={MAP_WIDTH * 0.17}
              y1={325}
              x2={MAP_WIDTH * 0.17 + 16}
              y2={325}
              stroke={config.accent}
              strokeOpacity={0.30}
              strokeWidth={1.5}
            />

            <Line
              x1={MAP_WIDTH * 0.17 + 8}
              y1={317}
              x2={MAP_WIDTH * 0.17 + 8}
              y2={333}
              stroke={config.accent}
              strokeOpacity={0.30}
              strokeWidth={1.5}
            />

            <Line
              x1={MAP_WIDTH * 0.82}
              y1={925}
              x2={MAP_WIDTH * 0.82 + 16}
              y2={925}
              stroke={config.accent}
              strokeOpacity={0.30}
              strokeWidth={1.5}
            />

            <Line
              x1={MAP_WIDTH * 0.82 + 8}
              y1={917}
              x2={MAP_WIDTH * 0.82 + 8}
              y2={933}
              stroke={config.accent}
              strokeOpacity={0.30}
              strokeWidth={1.5}
            />

            {/* ============================================ */}
            {/* PREMIUM HORIZON */}
            {/* ============================================ */}

            <Path
              d={`M 32 920 L ${MAP_WIDTH - 32} 920`}
              stroke="#D8D0C9"
              strokeWidth={1}
              strokeDasharray="5 8"
            />
          </Svg>

          {/* ============================================ */}
          {/* LEVELS */}
          {/* ============================================ */}

          {levels.map((level) => (
            <LevelNode
              key={level.number}
              level={level}
              subject={subject}
              accent={config.accent}
              selected={
                selectedLevel === level.number
              }
              onPress={() => openLevel(level)}
            />
          ))}

          {/* ============================================ */}
          {/* PREMIUM FUTURE CONSTELLATION */}
          {/* ============================================ */}

          <View
            style={[
              styles.premiumNode,
              {
                left: MAP_WIDTH * 0.19,
                top: 910,
              },
            ]}
          >
            <Text style={styles.premiumLock}>
              🔒
            </Text>
          </View>

          <View
            style={[
              styles.premiumNode,
              {
                left: MAP_WIDTH * 0.68,
                top: 925,
              },
            ]}
          >
            <Text style={styles.premiumLock}>
              🔒
            </Text>
          </View>

          <View style={styles.premiumLabel}>
            <Text style={styles.premiumEyebrow}>
              BEYOND THE FIRST CONSTELLATION
            </Text>

            <Text style={styles.premiumTitle}>
              Levels 6+
            </Text>
          </View>
        </View>

        {/* ================================================ */}
        {/* SELECTED LEVEL */}
        {/* ================================================ */}

        <View style={styles.levelPanel}>
          <View style={styles.panelTop}>
            <View style={styles.panelTitles}>
              <Text style={styles.panelEyebrow}>
                LEVEL {selected.number}
              </Text>

              <Text style={styles.panelTitle}>
                {selected.title}
              </Text>
            </View>

            {selected.state === 'current' && (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: config.accent,
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  CURRENT
                </Text>
              </View>
            )}

            {selected.state === 'completed' && (
              <View
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: config.accent,
                  },
                ]}
              >
                <Text style={styles.statusText}>
                  DONE
                </Text>
              </View>
            )}

            {selected.state === 'locked' && (
              <View style={styles.lockedPill}>
                <Text style={styles.lockedText}>
                  LOCKED
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.description}>
            {selected.description}
          </Text>

          {selected.state === 'current' &&
          selected.route ? (
            <Pressable
              onPress={() => openLevel(selected)}
              style={[
                styles.beginButton,
                {
                  backgroundColor: config.accent,
                },
              ]}
            >
              <Text style={styles.beginText}>
                PLAY LEVEL {selected.number}
              </Text>

              <Text style={styles.beginArrow}>
                →
              </Text>
            </Pressable>
          ) : selected.state === 'locked' ? (
            <View style={styles.lockMessage}>
              <Text style={styles.lockMessageIcon}>
                🔒
              </Text>

              <Text style={styles.lockMessageText}>
                Complete the previous discovery to reach
                this level.
              </Text>
            </View>
          ) : (
            <View style={styles.doneMessage}>
              <Text
                style={[
                  styles.doneIcon,
                  {
                    backgroundColor: config.accent,
                  },
                ]}
              >
                ✓
              </Text>

              <Text style={styles.doneMessageText}>
                You have travelled through this part of
                the constellation.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

/*
 * ============================================================
 * STYLES
 * ============================================================
 */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 10,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#E9E1DA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  backIcon: {
    fontSize: 35,
    color: '#4A4542',
    lineHeight: 38,
    marginTop: -4,
  },

  headerText: {
    flex: 1,
    paddingHorizontal: 14,
  },

  subjectTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#34313A',
  },

  subjectSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: '#817873',
  },

  worldOrb: {
    width: 51,
    height: 51,
    borderRadius: 26,
    borderWidth: 2,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  worldOrbInner: {
    width: 29,
    height: 29,
    borderRadius: 15,
  },

  intro: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 7,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#A39A94',
  },

  introTitle: {
    marginTop: 5,
    fontSize: 25,
    fontWeight: '800',
    color: '#34313A',
  },

  introSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#817873',
  },

  map: {
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },

  /*
   * LEVEL NODE
   */

  nodeWrapper: {
    position: 'absolute',
    width: 106,
    alignItems: 'center',
    zIndex: 5,
  },

  levelHole: {
    width: 106,
    height: 106,
    borderRadius: 53,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,

    shadowColor: '#675B54',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 5,
    },

    elevation: 5,
  },

  innerGlow: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /*
   * MATH OBJECT
   */

  mathObject: {
    minWidth: 58,
    height: 45,
    borderRadius: 14,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
  },

  mathText: {
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /*
   * ART OBJECT
   */

  artObject: {
    width: 58,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  artBrush: {
    fontSize: 29,
  },

  /*
   * MACHINE OBJECT
   */

  machineObject: {
    width: 58,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#FFFFFFAA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  gearRing: {
    width: 45,
    height: 45,
    borderRadius: 23,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  gearText: {
    fontSize: 27,
  },

  /*
   * COMPLETED
   */

  completedCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },

  /*
   * LOCK
   */

  lockIcon: {
    fontSize: 21,
    opacity: 0.7,
  },

  /*
   * LEVEL NUMBER
   */

  numberBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  /*
   * LABEL
   */

  nodeLabel: {
    width: 155,
    alignItems: 'center',
    marginTop: 9,
  },

  nodeTitle: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: '800',
    color: '#514A46',
    textAlign: 'center',
  },

  nodeStatus: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#A09892',
  },

  /*
   * DRIVER
   */

  driver: {
    position: 'absolute',
    bottom: 115,
    width: 145,
    alignItems: 'center',
    zIndex: 20,
  },

  driverStar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },

  driverStarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  driverPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
  },

  driverText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },

  /*
   * PREMIUM
   */

  premiumNode: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1ECE8',
    borderWidth: 1,
    borderColor: '#D8CEC7',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.9,
  },

  premiumLock: {
    fontSize: 16,
  },

  premiumLabel: {
    position: 'absolute',
    top: 963,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  premiumEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: '#A49B94',
  },

  premiumTitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '800',
    color: '#827872',
  },

  /*
   * LEVEL PANEL
   */

  levelPanel: {
    marginHorizontal: 20,
    marginTop: 4,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#E9E1DA',
  },

  panelTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  panelTitles: {
    flex: 1,
    paddingRight: 8,
  },

  panelEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#A39A94',
  },

  panelTitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '800',
    color: '#34313A',
  },

  statusPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
  },

  statusText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  lockedPill: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 14,
    backgroundColor: '#EEE9E4',
  },

  lockedText: {
    color: '#898079',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  description: {
    marginTop: 9,
    fontSize: 14,
    lineHeight: 21,
    color: '#756D67',
  },

  beginButton: {
    minHeight: 54,
    marginTop: 18,
    paddingHorizontal: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  beginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  beginArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },

  lockMessage: {
    minHeight: 58,
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#F5F0EC',
    flexDirection: 'row',
    alignItems: 'center',
  },

  lockMessageIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  lockMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#756D67',
  },

  doneMessage: {
    minHeight: 58,
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#F3EDF8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  doneIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '900',
    marginRight: 10,
  },

  doneMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#756D67',
  },

  bottomSpace: {
    height: 30,
  },
});
