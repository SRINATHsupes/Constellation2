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
  symbol: string;
  state: LevelState;
  route?: string;
};

type SubjectConfig = {
  title: string;
  subtitle: string;
  symbol: string;
  accent: string;
  levels: {
    title: string;
    description: string;
    symbol: string;
    route?: string;
  }[];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MAP_WIDTH = Math.max(SCREEN_WIDTH, 360);
const MAP_HEIGHT = 980;

/*
 * ============================================================
 * REAL SUBJECTS / REAL GAMES
 * ============================================================
 *
 * These are the actual playable routes currently present
 * in the project.
 */

const SUBJECTS: Record<SubjectId, SubjectConfig> = {
  vedic: {
    title: 'Vedic Maths',
    subtitle: 'Numbers · Patterns · Mental Power',
    symbol: '123',
    accent: '#9B83D7',

    levels: [
      {
        title: 'Number Sense',
        description: 'Begin your journey with numbers and patterns.',
        symbol: '123',
        route: '/play/vedic-escape',
      },
      {
        title: 'Number Patterns',
        description: 'Discover the structure hidden inside numbers.',
        symbol: '×',
      },
      {
        title: 'Fast Calculation',
        description: 'Use clever patterns to calculate faster.',
        symbol: '÷',
      },
      {
        title: 'Vedic Challenge',
        description: 'Combine the ideas you have discovered.',
        symbol: '∑',
      },
      {
        title: 'Number Escape',
        description: 'Use your maths thinking to escape the final room.',
        symbol: '99',
      },
    ],
  },

  arts: {
    title: 'Drawing & Arts',
    subtitle: 'Draw · Shape · Imagine',
    symbol: '🖌',
    accent: '#E98FA3',

    levels: [
      {
        title: 'Lines & Shapes',
        description: 'Start by turning simple marks into shapes.',
        symbol: '🖌',
        route: '/play/arts-drawing',
      },
      {
        title: 'Shape Builder',
        description: 'Combine shapes to create something new.',
        symbol: '△',
      },
      {
        title: 'Color Workshop',
        description: 'Explore color, balance and visual patterns.',
        symbol: '🎨',
      },
      {
        title: 'Picture Puzzle',
        description: 'Solve a visual puzzle using your imagination.',
        symbol: '◯',
      },
      {
        title: 'Creative Challenge',
        description: 'Bring your ideas together into a final creation.',
        symbol: '✎',
      },
    ],
  },

  manufacturing: {
    title: 'Manufacturing',
    subtitle: 'Machines · Gears · Build',
    symbol: '⚙',
    accent: '#E7A875',

    levels: [
      {
        title: 'Meet the Gears',
        description: 'Discover how simple machine parts work together.',
        symbol: '⚙',
        route: '/play/manufacturing',
      },
      {
        title: 'Fix the Machine',
        description: 'Find the problem and figure out what needs fixing.',
        symbol: '⚒',
      },
      {
        title: 'Build the Mechanism',
        description: 'Put the right parts together.',
        symbol: '⚙',
      },
      {
        title: 'Workshop Puzzle',
        description: 'Use engineering thinking to solve the workshop.',
        symbol: '🔧',
      },
      {
        title: 'Inventor Challenge',
        description: 'Think like an inventor and complete the machine.',
        symbol: '⚙',
      },
    ],
  },
};

/*
 * ============================================================
 * PROGRESSION
 * ============================================================
 *
 * Stage 1:
 *
 * Level 1 = current/playable
 * Levels 2-5 = locked
 * Level 6+ = Premium
 *
 * Later this value will come from saved game progress.
 */

const COMPLETED_LEVEL = 0;

/*
 * Creates the five levels for the selected subject.
 */
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
      symbol: level.symbol,
      state,
      route: level.route,
    };
  });
}

/*
 * ============================================================
 * MAP POSITIONS
 * ============================================================
 *
 * The path moves left → right → left → right,
 * giving the map a journey feeling instead of a card list.
 */

const LEVEL_POINTS = [
  {
    x: MAP_WIDTH * 0.25,
    y: 125,
  },
  {
    x: MAP_WIDTH * 0.73,
    y: 285,
  },
  {
    x: MAP_WIDTH * 0.29,
    y: 450,
  },
  {
    x: MAP_WIDTH * 0.72,
    y: 615,
  },
  {
    x: MAP_WIDTH * 0.43,
    y: 775,
  },
];

function createJourneyPath(): string {
  const p = LEVEL_POINTS;

  return [
    `M ${p[0].x} ${p[0].y}`,

    `C ${p[0].x + 80} ${p[0].y + 45},
       ${p[1].x - 85} ${p[1].y - 45},
       ${p[1].x} ${p[1].y}`,

    `C ${p[1].x - 90} ${p[1].y + 55},
       ${p[2].x + 90} ${p[2].y - 55},
       ${p[2].x} ${p[2].y}`,

    `C ${p[2].x + 90} ${p[2].y + 55},
       ${p[3].x - 90} ${p[3].y - 55},
       ${p[3].x} ${p[3].y}`,

    `C ${p[3].x - 80} ${p[3].y + 55},
       ${p[4].x + 80} ${p[4].y - 55},
       ${p[4].x} ${p[4].y}`,
  ].join(' ');
}

/*
 * ============================================================
 * LEVEL NODE
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
          left: point.x - 47,
          top: point.y - 47,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Level ${level.number}: ${level.title}`}
    >
      <View
        style={[
          styles.levelNode,

          level.state === 'completed' && {
            backgroundColor: '#F1ECF8',
            borderColor: '#CFC1E7',
          },

          level.state === 'current' && {
            backgroundColor: '#FFFDFB',
            borderColor: accent,
          },

          level.state === 'locked' && {
            backgroundColor: '#F2EEEA',
            borderColor: '#DCD4CD',
          },

          selected && styles.selectedNode,
        ]}
      >
        {level.state === 'completed' ? (
          <Text style={styles.completedIcon}>✓</Text>
        ) : level.state === 'locked' ? (
          <Text style={styles.lockIcon}>🔒</Text>
        ) : (
          <Text
            style={[
              styles.levelSymbol,
              {
                color: accent,
              },
            ]}
          >
            {level.symbol}
          </Text>
        )}

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
          <Text style={styles.numberText}>{level.number}</Text>
        </View>
      </View>

      <View style={styles.nodeLabel}>
        <Text style={styles.nodeTitle}>{level.title}</Text>

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
          <Text style={styles.lockedText}>LOCKED</Text>
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

  /*
   * Only the three real subjects are accepted.
   *
   * If somebody manually enters an invalid subject,
   * we safely fall back to Vedic Maths.
   */
  const requestedSubject = params.subject as SubjectId;

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

  /*
   * Open the actual existing game.
   */
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

  const goBack = () => {
    router.back();
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
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
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
              {config.symbol}
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
            One step at a time
          </Text>

          <Text style={styles.introSubtitle}>
            Learn something, try it, then move forward.
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
            {/* Decorative soft circles */}

            <Circle
              cx={MAP_WIDTH * 0.10}
              cy={205}
              r={34}
              fill="#F5EFEB"
            />

            <Circle
              cx={MAP_WIDTH * 0.88}
              cy={390}
              r={47}
              fill="#F7F0EC"
            />

            <Circle
              cx={MAP_WIDTH * 0.12}
              cy={670}
              r={43}
              fill="#F2EEE9"
            />

            <Circle
              cx={MAP_WIDTH * 0.88}
              cy={740}
              r={28}
              fill="#F6F0EC"
            />

            {/* Main soft path */}

            <Path
              d={createJourneyPath()}
              fill="none"
              stroke="#DED7D1"
              strokeWidth={13}
              strokeLinecap="round"
            />

            {/* Subject-colored inner path */}

            <Path
              d={createJourneyPath()}
              fill="none"
              stroke={config.accent}
              strokeWidth={3}
              strokeOpacity={0.55}
              strokeLinecap="round"
            />

            {/* Small stars */}

            <SvgText
              x={MAP_WIDTH * 0.86}
              y={125}
              fill="#C8BDB6"
              fontSize="18"
            >
              ✦
            </SvgText>

            <SvgText
              x={MAP_WIDTH * 0.08}
              y={365}
              fill="#D0C6BF"
              fontSize="15"
            >
              ✧
            </SvgText>

            <SvgText
              x={MAP_WIDTH * 0.87}
              y={560}
              fill="#CFC4BD"
              fontSize="17"
            >
              ✦
            </SvgText>

            {/* Premium divider */}

            <Path
              d={`M 32 850 L ${MAP_WIDTH - 32} 850`}
              stroke="#DDD5CE"
              strokeWidth={1}
              strokeDasharray="5 7"
            />

            <SvgText
              x={MAP_WIDTH / 2}
              y={885}
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
              y={907}
              textAnchor="middle"
              fill="#AAA09A"
              fontSize="11"
              fontWeight="600"
            >
              More levels beyond 5
            </SvgText>
          </Svg>

          {/* Level nodes */}

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

          {/* Premium preview nodes */}

          <View
            style={[
              styles.premiumPreview,
              {
                left: MAP_WIDTH * 0.22,
                top: 925,
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
                left: MAP_WIDTH * 0.67,
                top: 925,
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
        {/* LEVEL INFORMATION */}
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
              accessibilityRole="button"
              accessibilityLabel={`Begin level ${selected.number}`}
            >
              <Text style={styles.beginText}>
                BEGIN LEVEL {selected.number}
              </Text>

              <Text style={styles.beginArrow}>
                →
              </Text>
            </Pressable>
          ) : (
            <View style={styles.lockMessage}>
              <Text style={styles.lockMessageIcon}>
                🔒
              </Text>

              <Text style={styles.lockMessageText}>
                Finish the previous level to unlock this
                level.
              </Text>
            </View>
          )}
        </View>

        {/* ================================================= */}
        {/* PREMIUM */}
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
              Complete the first five levels to explore
              the next part of the journey.
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFB',
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
    width: 94,
    alignItems: 'center',
  },

  levelNode: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFB',

    shadowColor: '#5C5048',
    shadowOpacity: 0.09,
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

  levelSymbol: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
  },

  completedIcon: {
    fontSize: 36,
    fontWeight: '900',
    color: '#8B6FC7',
  },

  lockIcon: {
    fontSize: 21,
  },

  numberBadge: {
    position: 'absolute',
    right: -3,
    bottom: -5,
    width: 29,
    height: 29,
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
    width: 145,
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

  premiumPreview: {
    position: 'absolute',
  },

  premiumNode: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1ECE8',
    borderWidth: 1,
    borderColor: '#D8CEC7',
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFDFB',
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
