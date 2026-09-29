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
  Text as SvgText,
} from 'react-native-svg';

type SubjectId = 'vedic' | 'arts' | 'manufacturing';

type LevelState = 'completed' | 'current' | 'locked';

type Level = {
  number: number;
  title: string;
  description: string;
  object: string;
  route?: string;
  state: LevelState;
};

type SubjectConfig = {
  title: string;
  subtitle: string;
  badge: string;
  accent: string;
  levels: {
    title: string;
    description: string;
    object: string;
    route?: string;
  }[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MAP_WIDTH = Math.max(SCREEN_WIDTH, 360);
const MAP_HEIGHT = 1000;

/*
 * ============================================================
 * REAL SUBJECTS
 * ============================================================
 */

const SUBJECTS: Record<SubjectId, SubjectConfig> = {
  vedic: {
    title: 'Vedic Maths',
    subtitle: 'Numbers · Patterns · Mental Power',
    badge: '123',
    accent: '#9B83D7',

    levels: [
      {
        title: 'Number Sense',
        description: 'Begin your journey with numbers and patterns.',
        object: '123',
        route: '/play/vedic-escape',
      },
      {
        title: 'Number Patterns',
        description: 'Discover the structure hidden inside numbers.',
        object: '×',
      },
      {
        title: 'Fast Calculation',
        description: 'Use clever patterns to calculate faster.',
        object: '÷',
      },
      {
        title: 'Vedic Challenge',
        description: 'Combine the ideas you have discovered.',
        object: '∑',
      },
      {
        title: 'Number Escape',
        description: 'Use your maths thinking to escape the final room.',
        object: '99',
      },
    ],
  },

  arts: {
    title: 'Drawing & Arts',
    subtitle: 'Draw · Shape · Imagine',
    badge: '🖌',
    accent: '#E98FA3',

    levels: [
      {
        title: 'Lines & Shapes',
        description: 'Start by turning simple marks into shapes.',
        object: '🖌',
        route: '/play/arts-drawing',
      },
      {
        title: 'Shape Builder',
        description: 'Combine shapes to create something new.',
        object: '△',
      },
      {
        title: 'Color Workshop',
        description: 'Explore color, balance and visual patterns.',
        object: '🎨',
      },
      {
        title: 'Picture Puzzle',
        description: 'Solve a visual puzzle using your imagination.',
        object: '◯',
      },
      {
        title: 'Creative Challenge',
        description: 'Bring your ideas together into a final creation.',
        object: '✎',
      },
    ],
  },

  manufacturing: {
    title: 'Manufacturing',
    subtitle: 'Machines · Gears · Build',
    badge: '⚙',
    accent: '#E7A875',

    levels: [
      {
        title: 'Meet the Gears',
        description: 'Discover how simple machine parts work together.',
        object: '⚙',
        route: '/play/manufacturing',
      },
      {
        title: 'Fix the Machine',
        description: 'Find the problem and figure out what needs fixing.',
        object: '⚒',
      },
      {
        title: 'Build the Mechanism',
        description: 'Put the right parts together.',
        object: '⚙',
      },
      {
        title: 'Workshop Puzzle',
        description: 'Use engineering thinking to solve the workshop.',
        object: '🔧',
      },
      {
        title: 'Inventor Challenge',
        description: 'Think like an inventor and complete the machine.',
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
 * For now:
 *
 * 0 completed
 * 1 current
 * 2-5 locked
 *
 * Later this becomes saved progress.
 */

const COMPLETED_LEVEL = 0;

function createLevels(subject: SubjectId): Level[] {
  const config = SUBJECTS[subject];

  return config.levels.map((level, index) => {
    const number = index + 1;

    let state: LevelState;

    if (number <= COMPLETED_LEVEL) {
      state = 'completed';
    } else if (number === COMPLETED_LEVEL + 1) {
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
 * JOURNEY POINTS
 * ============================================================
 */

const LEVEL_POINTS = [
  {
    x: MAP_WIDTH * 0.24,
    y: 135,
  },
  {
    x: MAP_WIDTH * 0.73,
    y: 300,
  },
  {
    x: MAP_WIDTH * 0.28,
    y: 470,
  },
  {
    x: MAP_WIDTH * 0.72,
    y: 640,
  },
  {
    x: MAP_WIDTH * 0.43,
    y: 800,
  },
];

/*
 * ============================================================
 * PATH SEGMENTS
 * ============================================================
 *
 * Each segment is separate so we can color only the route
 * the child has already travelled.
 */

function getPathSegments() {
  const p = LEVEL_POINTS;

  return [
    `M ${p[0].x} ${p[0].y}
     C ${p[0].x + 80} ${p[0].y + 45},
       ${p[1].x - 85} ${p[1].y - 45},
       ${p[1].x} ${p[1].y}`,

    `M ${p[1].x} ${p[1].y}
     C ${p[1].x - 90} ${p[1].y + 55},
       ${p[2].x + 90} ${p[2].y - 55},
       ${p[2].x} ${p[2].y}`,

    `M ${p[2].x} ${p[2].y}
     C ${p[2].x + 90} ${p[2].y + 55},
       ${p[3].x - 90} ${p[3].y - 55},
       ${p[3].x} ${p[3].y}`,

    `M ${p[3].x} ${p[3].y}
     C ${p[3].x - 80} ${p[3].y + 55},
       ${p[4].x + 80} ${p[4].y - 55},
       ${p[4].x} ${p[4].y}`,
  ];
}

/*
 * ============================================================
 * LEVEL OBJECT
 * ============================================================
 */

function LevelNode({
  level,
  accent,
  selected,
  onPress,
}: {
  level: Level;
  accent: string;
  selected: boolean;
  onPress: () => void;
}) {
  const point = LEVEL_POINTS[level.number - 1];

  const playable =
    level.state === 'current' && Boolean(level.route);

  return (
    <Pressable
      onPress={onPress}
      disabled={!playable}
      style={[
        styles.nodeWrapper,
        {
          left: point.x - 48,
          top: point.y - 48,
        },
      ]}
    >
      {/* Current-level driver */}

      {level.state === 'current' && (
        <View style={styles.driver}>
          <View
            style={[
              styles.driverDot,
              {
                backgroundColor: accent,
              },
            ]}
          />

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
      )}

      {/* Main object */}

      <View
        style={[
          styles.objectNode,

          level.state === 'completed' && {
            backgroundColor: '#F0EBF7',
            borderColor: '#CFC2E7',
          },

          level.state === 'current' && {
            backgroundColor: '#FFFDFB',
            borderColor: accent,
          },

          level.state === 'locked' && {
            backgroundColor: '#F2EEEA',
            borderColor: '#DDD5CE',
          },

          selected && styles.selectedNode,
        ]}
      >
        {level.state === 'completed' ? (
          <View
            style={[
              styles.completedInner,
              {
                backgroundColor: accent,
              },
            ]}
          >
            <Text style={styles.completedCheck}>✓</Text>
          </View>
        ) : level.state === 'locked' ? (
          <Text style={styles.lockIcon}>🔒</Text>
        ) : (
          <Text
            style={[
              styles.objectText,
              {
                color: accent,
              },
            ]}
          >
            {level.object}
          </Text>
        )}

        {/* Number */}

        <View
          style={[
            styles.numberBadge,
            {
              backgroundColor:
                level.state === 'locked'
                  ? '#CFC8C2'
                  : accent,
            },
          ]}
        >
          <Text style={styles.numberText}>
            {level.number}
          </Text>
        </View>
      </View>

      {/* Level title */}

      <View style={styles.nodeLabel}>
        <Text style={styles.nodeTitle}>
          {level.title}
        </Text>

        {level.state === 'current' && (
          <Text
            style={[
              styles.playText,
              {
                color: accent,
              },
            ]}
          >
            PLAY
          </Text>
        )}

        {level.state === 'locked' && (
          <Text style={styles.lockedText}>
            LOCKED
          </Text>
        )}

        {level.state === 'completed' && (
          <Text style={styles.completedText}>
            COMPLETED
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/*
 * ============================================================
 * MAIN SCREEN
 * ============================================================
 */

export default function GamesSubjectScreen() {
  const params = useLocalSearchParams<{
    subject?: string;
  }>();

  const router = useRouter();

  const requestedSubject =
    params.subject as SubjectId;

  const subject: SubjectId =
    requestedSubject &&
    Object.prototype.hasOwnProperty.call(
      SUBJECTS,
      requestedSubject,
    )
      ? requestedSubject
      : 'vedic';

  const config = SUBJECTS[subject];

  const levels = useMemo(
    () => createLevels(subject),
    [subject],
  );

  const [selectedLevel, setSelectedLevel] = useState(1);

  const selected = levels[selectedLevel - 1];

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

  /*
   * Number of completed path segments.
   *
   * Example:
   *
   * completed = 0
   *   no colored path yet
   *
   * completed = 1
   *   Level 1 → Level 2 is colored
   *
   * completed = 2
   *   Level 1 → 2 → 3 is colored
   */

  const completedSegments = Math.min(
    COMPLETED_LEVEL,
    4,
  );

  const pathSegments = getPathSegments();

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
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

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
              styles.subjectBadge,
              {
                borderColor: config.accent,
              },
            ]}
          >
            <Text
              style={[
                styles.subjectBadgeText,
                {
                  color: config.accent,
                },
              ]}
            >
              {config.badge}
            </Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* INTRO */}
        {/* ================================================= */}

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>
            YOUR JOURNEY
          </Text>

          <Text style={styles.introTitle}>
            Learn → try → discover
          </Text>

          <Text style={styles.introSubtitle}>
            Follow the path and unlock the next discovery.
          </Text>
        </View>

        {/* ================================================= */}
        {/* MAP */}
        {/* ================================================= */}

        <View style={styles.map}>
          <Svg
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          >
            {/* Soft background decoration */}

            <Circle
              cx={MAP_WIDTH * 0.10}
              cy={210}
              r={35}
              fill="#F4EEE9"
            />

            <Circle
              cx={MAP_WIDTH * 0.89}
              cy={400}
              r={48}
              fill="#F7F0EC"
            />

            <Circle
              cx={MAP_WIDTH * 0.11}
              cy={685}
              r={43}
              fill="#F2EEE9"
            />

            <Circle
              cx={MAP_WIDTH * 0.88}
              cy={760}
              r={27}
              fill="#F6F0EC"
            />

            {/* ============================================= */}
            {/* FUTURE PATH */}
            {/* ============================================= */}

            {pathSegments.map((segment, index) => (
              <Path
                key={`future-${index}`}
                d={segment}
                fill="none"
                stroke="#DED7D1"
                strokeWidth={12}
                strokeLinecap="round"
              />
            ))}

            {/* ============================================= */}
            {/* COMPLETED PATH */}
            {/* ============================================= */}

            {pathSegments
              .slice(0, completedSegments)
              .map((segment, index) => (
                <Path
                  key={`completed-${index}`}
                  d={segment}
                  fill="none"
                  stroke={config.accent}
                  strokeOpacity={0.9}
                  strokeWidth={12}
                  strokeLinecap="round"
                />
              ))}

            {/* Thin guide line */}

            {pathSegments.map((segment, index) => (
              <Path
                key={`guide-${index}`}
                d={segment}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.75}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}

            {/* Decorative constellation marks */}

            <SvgText
              x={MAP_WIDTH * 0.86}
              y={120}
              fill="#C7BCB5"
              fontSize="18"
            >
              ✦
            </SvgText>

            <SvgText
              x={MAP_WIDTH * 0.08}
              y={380}
              fill="#CEC3BC"
              fontSize="16"
            >
              ✧
            </SvgText>

            <SvgText
              x={MAP_WIDTH * 0.88}
              y={570}
              fill="#CFC4BD"
              fontSize="17"
            >
              ✦
            </SvgText>

            <SvgText
              x={MAP_WIDTH * 0.12}
              y={820}
              fill="#CEC4BD"
              fontSize="15"
            >
              ✧
            </SvgText>

            {/* ============================================= */}
            {/* PREMIUM AREA */}
            {/* ============================================= */}

            <Path
              d={`M 32 870 L ${MAP_WIDTH - 32} 870`}
              stroke="#DDD5CE"
              strokeWidth={1}
              strokeDasharray="5 7"
            />

            <SvgText
              x={MAP_WIDTH / 2}
              y={905}
              textAnchor="middle"
              fill="#AAA09A"
              fontSize="12"
              fontWeight="700"
              letterSpacing="2"
            >
              PREMIUM
            </SvgText>

            <SvgText
              x={MAP_WIDTH / 2}
              y={928}
              textAnchor="middle"
              fill="#AAA09A"
              fontSize="11"
            >
              Levels 6 and beyond
            </SvgText>
          </Svg>

          {/* ============================================= */}
          {/* LEVEL OBJECTS */}
          {/* ============================================= */}

          {levels.map((level) => (
            <LevelNode
              key={level.number}
              level={level}
              accent={config.accent}
              selected={
                selectedLevel === level.number
              }
              onPress={() => openLevel(level)}
            />
          ))}

          {/* ============================================= */}
          {/* PREMIUM PREVIEW */}
          {/* ============================================= */}

          <View
            style={[
              styles.premiumPreview,
              {
                left: MAP_WIDTH * 0.22,
                top: 950,
              },
            ]}
          >
            <View style={styles.premiumNode}>
              <Text style={styles.premiumLock}>
                🔒
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.premiumPreview,
              {
                left: MAP_WIDTH * 0.68,
                top: 950,
              },
            ]}
          >
            <View style={styles.premiumNode}>
              <Text style={styles.premiumLock}>
                🔒
              </Text>
            </View>
          </View>
        </View>

        {/* ================================================= */}
        {/* LEVEL PANEL */}
        {/* ================================================= */}

        <View style={styles.levelPanel}>
          <View style={styles.panelHeader}>
            <View style={styles.panelHeaderText}>
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

            {selected.state === 'locked' && (
              <View style={styles.lockedPill}>
                <Text style={styles.lockedPillText}>
                  LOCKED
                </Text>
              </View>
            )}

            {selected.state === 'completed' && (
              <View
                style={[
                  styles.completedPill,
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
                BEGIN LEVEL {selected.number}
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
                Finish the previous level to continue
                along the path.
              </Text>
            </View>
          ) : (
            <View style={styles.completedMessage}>
              <Text style={styles.completedMessageIcon}>
                ✓
              </Text>

              <Text style={styles.completedMessageText}>
                You have travelled this part of the
                journey.
              </Text>
            </View>
          )}
        </View>

        {/* ================================================= */}
        {/* PREMIUM CARD */}
        {/* ================================================= */}

        <View style={styles.premiumCard}>
          <View style={styles.premiumCircle}>
            <Text style={styles.premiumStar}>
              ✦
            </Text>
          </View>

          <View style={styles.premiumContent}>
            <Text style={styles.premiumTitle}>
              Levels 6+ are Premium
            </Text>

            <Text style={styles.premiumDescription}>
              Complete the first five levels to continue
              the journey beyond the first world.
            </Text>
          </View>
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
    paddingBottom: 12,
  },

  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E9E1DA',
  },

  backIcon: {
    fontSize: 35,
    lineHeight: 38,
    color: '#4A4542',
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
    color: '#8B817B',
  },

  subjectBadge: {
    minWidth: 53,
    height: 53,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFB',
    paddingHorizontal: 7,
  },

  subjectBadgeText: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
  },

  intro: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 10,
  },

  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    color: '#A49A94',
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
    width: '100%',
    height: MAP_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },

  nodeWrapper: {
    position: 'absolute',
    width: 96,
    alignItems: 'center',
  },

  /*
   * Small driver above the current object.
   */

  driver: {
    position: 'absolute',
    bottom: 105,
    alignItems: 'center',
    width: 125,
    zIndex: 10,
  },

  driverDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },

  driverText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  objectNode: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#5C5048',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },

    elevation: 3,
  },

  selectedNode: {
    borderWidth: 4,
  },

  objectText: {
    fontSize: 25,
    fontWeight: '900',
    textAlign: 'center',
  },

  completedInner: {
    width: 53,
    height: 53,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },

  completedCheck: {
    fontSize: 29,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  lockIcon: {
    fontSize: 22,
  },

  numberBadge: {
    position: 'absolute',
    right: -4,
    bottom: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFDFB',
  },

  numberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  nodeLabel: {
    width: 150,
    alignItems: 'center',
    marginTop: 8,
  },

  nodeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#514A46',
    textAlign: 'center',
  },

  playText: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  lockedText: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#A39A94',
  },

  completedText: {
    marginTop: 3,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#91868F',
  },

  premiumPreview: {
    position: 'absolute',
  },

  premiumNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F1ECE8',
    borderWidth: 1,
    borderColor: '#D8CEC7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  premiumLock: {
    fontSize: 16,
  },

  levelPanel: {
    marginHorizontal: 20,
    marginTop: 6,
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#FFFDFB',
    borderWidth: 1,
    borderColor: '#E9E1DA',
  },

  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  panelHeaderText: {
    flex: 1,
    paddingRight: 10,
  },

  panelEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#A49A94',
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

  completedPill: {
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

  lockedPillText: {
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

  completedMessage: {
    minHeight: 58,
    marginTop: 17,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: '#F1ECF8',
    flexDirection: 'row',
    alignItems: 'center',
  },

  completedMessageIcon: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#9B83D7',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 27,
    fontWeight: '900',
    marginRight: 10,
  },

  completedMessageText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: '#756D67',
  },

  premiumCard: {
    marginHorizontal: 20,
    marginTop: 14,
    padding: 17,
    borderRadius: 22,
    backgroundColor: '#F8F1EC',
    borderWidth: 1,
    borderColor: '#E8DDD5',
    flexDirection: 'row',
    alignItems: 'center',
  },

  premiumCircle: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  premiumStar: {
    fontSize: 21,
    color: '#9B83D7',
  },

  premiumContent: {
    flex: 1,
  },

  premiumTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#514A46',
  },

  premiumDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    color: '#847A73',
  },

  bottomSpace: {
    height: 30,
  },
});
