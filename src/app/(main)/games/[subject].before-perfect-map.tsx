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
  G,
  Path,
  Text as SvgText,
} from 'react-native-svg';

type SubjectId =
  | 'vedic'
  | 'music'
  | 'arts'
  | 'manufacturing'
  | 'electronics'
  | 'physics'
  | 'nutrition'
  | 'nature'
  | 'humanity';

type LevelState = 'completed' | 'current' | 'locked';

type Level = {
  id: string;
  number: number;
  title: string;
  symbol: string;
  state: LevelState;
  route?: string;
};

type Curiosity = {
  id: string;
  title: string;
  symbol: string;
  x: number;
  y: number;
};

type World = {
  title: string;
  subtitle: string;
  symbol: string;
  accent: string;
  levels: Level[];
  curiosities: Curiosity[];
};

const WORLD_DATA: Record<SubjectId, World> = {
  vedic: {
    title: 'Vedic Maths',
    subtitle: 'Follow the number path',
    symbol: '◈',
    accent: '#9B83D7',
    levels: [
      {
        id: 'vedic-6',
        number: 6,
        title: 'Number Patterns',
        symbol: '◇',
        state: 'completed',
      },
      {
        id: 'vedic-7',
        number: 7,
        title: 'Numbers Near 100',
        symbol: '✦',
        state: 'current',
        route: '/play/vedic-escape',
      },
      {
        id: 'vedic-8',
        number: 8,
        title: 'Pattern Bridge',
        symbol: '⌘',
        state: 'locked',
      },
      {
        id: 'vedic-9',
        number: 9,
        title: 'Fast Multiplication',
        symbol: '×',
        state: 'locked',
      },
      {
        id: 'vedic-10',
        number: 10,
        title: 'Number Temple',
        symbol: '△',
        state: 'locked',
      },
      {
        id: 'vedic-11',
        number: 11,
        title: 'Mental Calculation',
        symbol: '◎',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'v1', title: 'Number flower', symbol: '✿', x: 75, y: 250 },
      { id: 'v2', title: 'Hidden pattern', symbol: '✧', x: 315, y: 610 },
    ],
  },

  manufacturing: {
    title: 'Manufacturing',
    subtitle: 'Build your way through the workshop',
    symbol: '⚙',
    accent: '#E7A875',
    levels: [
      {
        id: 'manufacturing-6',
        number: 6,
        title: 'Meet the Gears',
        symbol: '⚙',
        state: 'completed',
      },
      {
        id: 'manufacturing-7',
        number: 7,
        title: 'Broken Machine',
        symbol: '⚒',
        state: 'current',
        route: '/play/manufacturing',
      },
      {
        id: 'manufacturing-8',
        number: 8,
        title: 'Gear Workshop',
        symbol: '⚙',
        state: 'locked',
      },
      {
        id: 'manufacturing-9',
        number: 9,
        title: 'Build the Machine',
        symbol: '▣',
        state: 'locked',
      },
      {
        id: 'manufacturing-10',
        number: 10,
        title: 'Production Line',
        symbol: '→',
        state: 'locked',
      },
      {
        id: 'manufacturing-11',
        number: 11,
        title: 'Inventor Workshop',
        symbol: '✦',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'm1', title: 'Tiny gear', symbol: '⚙', x: 315, y: 330 },
      { id: 'm2', title: 'Old tool', symbol: '⌁', x: 70, y: 710 },
    ],
  },

  arts: {
    title: 'Drawing & Arts',
    subtitle: 'Shape your creative world',
    symbol: '✎',
    accent: '#E98FA3',
    levels: [
      {
        id: 'arts-6',
        number: 6,
        title: 'Shape Garden',
        symbol: '○',
        state: 'completed',
      },
      {
        id: 'arts-7',
        number: 7,
        title: 'Lines & Forms',
        symbol: '△',
        state: 'current',
        route: '/play/arts-drawing',
      },
      {
        id: 'arts-8',
        number: 8,
        title: 'Color Workshop',
        symbol: '●',
        state: 'locked',
      },
      {
        id: 'arts-9',
        number: 9,
        title: 'Build a Picture',
        symbol: '□',
        state: 'locked',
      },
      {
        id: 'arts-10',
        number: 10,
        title: 'Creative Door',
        symbol: '✦',
        state: 'locked',
      },
      {
        id: 'arts-11',
        number: 11,
        title: 'Your Own World',
        symbol: '✿',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'a1', title: 'Shape clue', symbol: '△', x: 75, y: 410 },
      { id: 'a2', title: 'Color seed', symbol: '✿', x: 315, y: 780 },
    ],
  },

  music: {
    title: 'Music',
    subtitle: 'Follow the rhythm',
    symbol: '♫',
    accent: '#82B8E8',
    levels: [
      {
        id: 'music-6',
        number: 6,
        title: 'Rhythm Gate',
        symbol: '♩',
        state: 'completed',
      },
      {
        id: 'music-7',
        number: 7,
        title: 'Sound Bridge',
        symbol: '♫',
        state: 'current',
      },
      {
        id: 'music-8',
        number: 8,
        title: 'Pattern Rhythm',
        symbol: '♪',
        state: 'locked',
      },
      {
        id: 'music-9',
        number: 9,
        title: 'Sound Garden',
        symbol: '◌',
        state: 'locked',
      },
      {
        id: 'music-10',
        number: 10,
        title: 'Melody Workshop',
        symbol: '♬',
        state: 'locked',
      },
      {
        id: 'music-11',
        number: 11,
        title: 'Sound Chamber',
        symbol: '◎',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'mu1', title: 'Sound ripple', symbol: '≈', x: 310, y: 420 },
      { id: 'mu2', title: 'Hidden beat', symbol: '♩', x: 75, y: 690 },
    ],
  },

  electronics: {
    title: 'Electronics',
    subtitle: 'Trace the circuit',
    symbol: '⌁',
    accent: '#86CDB1',
    levels: [
      {
        id: 'electronics-6',
        number: 6,
        title: 'Meet Components',
        symbol: '▣',
        state: 'completed',
      },
      {
        id: 'electronics-7',
        number: 7,
        title: 'Complete the Circuit',
        symbol: '⌁',
        state: 'current',
      },
      {
        id: 'electronics-8',
        number: 8,
        title: 'Switch Mission',
        symbol: '⊙',
        state: 'locked',
      },
      {
        id: 'electronics-9',
        number: 9,
        title: 'Sensor Mission',
        symbol: '◉',
        state: 'locked',
      },
      {
        id: 'electronics-10',
        number: 10,
        title: 'Build a Device',
        symbol: '▦',
        state: 'locked',
      },
      {
        id: 'electronics-11',
        number: 11,
        title: 'Circuit Lab',
        symbol: '✦',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'e1', title: 'Tiny resistor', symbol: '⌁', x: 75, y: 330 },
      { id: 'e2', title: 'Signal', symbol: '∿', x: 315, y: 720 },
    ],
  },

  physics: {
    title: 'Physics',
    subtitle: 'Discover how things move',
    symbol: '↗',
    accent: '#82B8E8',
    levels: [
      {
        id: 'physics-6',
        number: 6,
        title: 'Motion',
        symbol: '→',
        state: 'completed',
      },
      {
        id: 'physics-7',
        number: 7,
        title: 'Forces',
        symbol: '↗',
        state: 'current',
      },
      {
        id: 'physics-8',
        number: 8,
        title: 'Gravity',
        symbol: '↓',
        state: 'locked',
      },
      {
        id: 'physics-9',
        number: 9,
        title: 'Energy',
        symbol: '✦',
        state: 'locked',
      },
      {
        id: 'physics-10',
        number: 10,
        title: 'Motion Lab',
        symbol: '◎',
        state: 'locked',
      },
      {
        id: 'physics-11',
        number: 11,
        title: 'Experiment',
        symbol: '◇',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'p1', title: 'Particle', symbol: '·', x: 315, y: 350 },
      { id: 'p2', title: 'Force arrow', symbol: '↗', x: 75, y: 740 },
    ],
  },

  nutrition: {
    title: 'Nutrition',
    subtitle: 'Explore food and energy',
    symbol: '◉',
    accent: '#F2C96D',
    levels: [
      {
        id: 'nutrition-6',
        number: 6,
        title: 'Food & Energy',
        symbol: '◉',
        state: 'completed',
      },
      {
        id: 'nutrition-7',
        number: 7,
        title: 'Nutrient Puzzle',
        symbol: '◇',
        state: 'current',
      },
      {
        id: 'nutrition-8',
        number: 8,
        title: 'Build a Balanced Plate',
        symbol: '○',
        state: 'locked',
      },
      {
        id: 'nutrition-9',
        number: 9,
        title: 'The Human Body',
        symbol: '♧',
        state: 'locked',
      },
      {
        id: 'nutrition-10',
        number: 10,
        title: 'Energy Lab',
        symbol: '✦',
        state: 'locked',
      },
      {
        id: 'nutrition-11',
        number: 11,
        title: 'Food Detective',
        symbol: '⌕',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'n1', title: 'Molecule', symbol: '◌', x: 70, y: 380 },
      { id: 'n2', title: 'Food clue', symbol: '✿', x: 315, y: 700 },
    ],
  },

  nature: {
    title: 'Nature',
    subtitle: 'Notice the living world',
    symbol: '✿',
    accent: '#86CDB1',
    levels: [
      {
        id: 'nature-6',
        number: 6,
        title: 'Notice the World',
        symbol: '✿',
        state: 'completed',
      },
      {
        id: 'nature-7',
        number: 7,
        title: 'Patterns in Nature',
        symbol: '❋',
        state: 'current',
      },
      {
        id: 'nature-8',
        number: 8,
        title: 'Plants & Structures',
        symbol: '♧',
        state: 'locked',
      },
      {
        id: 'nature-9',
        number: 9,
        title: 'Living Systems',
        symbol: '◎',
        state: 'locked',
      },
      {
        id: 'nature-10',
        number: 10,
        title: 'Nature Detective',
        symbol: '⌕',
        state: 'locked',
      },
      {
        id: 'nature-11',
        number: 11,
        title: 'Field Mission',
        symbol: '✦',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'na1', title: 'Leaf pattern', symbol: '♧', x: 315, y: 360 },
      { id: 'na2', title: 'Tiny world', symbol: '·', x: 70, y: 720 },
    ],
  },

  humanity: {
    title: 'Humanity',
    subtitle: 'Understand people and ideas',
    symbol: '♡',
    accent: '#E98FA3',
    levels: [
      {
        id: 'humanity-6',
        number: 6,
        title: 'Understanding Others',
        symbol: '♡',
        state: 'completed',
      },
      {
        id: 'humanity-7',
        number: 7,
        title: 'Communication Bridge',
        symbol: '↔',
        state: 'current',
      },
      {
        id: 'humanity-8',
        number: 8,
        title: 'Different Perspectives',
        symbol: '◌',
        state: 'locked',
      },
      {
        id: 'humanity-9',
        number: 9,
        title: 'Solve Together',
        symbol: '◇',
        state: 'locked',
      },
      {
        id: 'humanity-10',
        number: 10,
        title: 'Community',
        symbol: '◎',
        state: 'locked',
      },
      {
        id: 'humanity-11',
        number: 11,
        title: 'Big Questions',
        symbol: '✦',
        state: 'locked',
      },
    ],
    curiosities: [
      { id: 'h1', title: 'Idea fragment', symbol: '◇', x: 75, y: 350 },
      { id: 'h2', title: 'Connection', symbol: '↔', x: 315, y: 700 },
    ],
  },
};

const WIDTH = 400;
const HEIGHT = 1050;

const NODE_POSITIONS = [
  { x: 200, y: 100 },
  { x: 292, y: 245 },
  { x: 205, y: 395 },
  { x: 105, y: 550 },
  { x: 190, y: 715 },
  { x: 292, y: 880 },
];

function getWorld(subject: string): World {
  if (subject === 'manufacturing') return WORLD_DATA.manufacturing;
  if (subject === 'electronics') return WORLD_DATA.electronics;
  if (subject === 'physics') return WORLD_DATA.physics;
  if (subject === 'nutrition') return WORLD_DATA.nutrition;
  if (subject === 'nature') return WORLD_DATA.nature;
  if (subject === 'humanity') return WORLD_DATA.humanity;
  if (subject === 'music') return WORLD_DATA.music;
  if (subject === 'arts' || subject === 'drawing') return WORLD_DATA.arts;
  return WORLD_DATA.vedic;
}

function getPath(): string {
  return [
    'M 200 100',
    'C 200 155, 305 175, 292 245',
    'C 280 315, 210 330, 205 395',
    'C 200 465, 90 480, 105 550',
    'C 120 625, 185 640, 190 715',
    'C 195 790, 310 810, 292 880',
  ].join(' ');
}

export default function SubjectJourneyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subject?: string }>();
  const subject = String(params.subject ?? 'vedic').toLowerCase();

  const world = useMemo(() => getWorld(subject), [subject]);
  const [selected, setSelected] = useState(1);

  const selectedLevel = world.levels[selected] ?? world.levels[0];

  function openLevel(level: Level, index: number) {
    setSelected(index);

    if (level.state === 'locked') {
      return;
    }

    if (level.route) {
      router.push(level.route as never);
    }
  }

  const screenWidth = Dimensions.get('window').width;
  const mapWidth = Math.max(320, Math.min(screenWidth, 520));
  const scale = mapWidth / WIDTH;

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <View
              style={[
                styles.subjectIcon,
                { backgroundColor: `${world.accent}22` },
              ]}
            >
              <Text style={[styles.subjectSymbol, { color: world.accent }]}>
                {world.symbol}
              </Text>
            </View>

            <View>
              <Text style={styles.title}>{world.title}</Text>
              <Text style={styles.subtitle}>{world.subtitle}</Text>
            </View>
          </View>
        </View>

        <View style={styles.journeyIntro}>
          <Text style={styles.journeyLabel}>YOUR JOURNEY</Text>
          <Text style={styles.journeyHint}>
            Complete a level to open the next path.
          </Text>
        </View>

        <View
          style={[
            styles.map,
            {
              width: mapWidth,
              height: HEIGHT * scale,
            },
          ]}
        >
          <Svg
            width={mapWidth}
            height={HEIGHT * scale}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          >
            <Path
              d={getPath()}
              fill="none"
              stroke="#E8DFEA"
              strokeWidth={18}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <Path
              d={getPath()}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {world.curiosities.map((item) => (
              <G key={item.id}>
                <Circle
                  cx={item.x}
                  cy={item.y}
                  r={25}
                  fill="#FFFDFB"
                  stroke="#E9E0E8"
                  strokeWidth={2}
                />
                <SvgText
                  x={item.x}
                  y={item.y + 7}
                  textAnchor="middle"
                  fontSize="20"
                  fill={world.accent}
                >
                  {item.symbol}
                </SvgText>
              </G>
            ))}
          </Svg>

          {world.levels.map((level, index) => {
            const pos = NODE_POSITIONS[index];
            const isSelected = selected === index;
            const isCurrent = level.state === 'current';
            const isCompleted = level.state === 'completed';

            return (
              <Pressable
                key={level.id}
                onPress={() => openLevel(level, index)}
                style={[
                  styles.node,
                  {
                    left: pos.x * scale - (isCurrent ? 39 : 32),
                    top: pos.y * scale - (isCurrent ? 39 : 32),
                    width: isCurrent ? 78 : 64,
                    height: isCurrent ? 78 : 64,
                  },
                ]}
              >
                <View
                  style={[
                    styles.nodeOuter,
                    {
                      width: isCurrent ? 78 : 64,
                      height: isCurrent ? 78 : 64,
                      borderRadius: isCurrent ? 39 : 32,
                      borderColor: isCurrent
                        ? world.accent
                        : isCompleted
                          ? world.accent
                          : '#DDD6DE',
                      backgroundColor: isCompleted
                        ? `${world.accent}28`
                        : level.state === 'locked'
                          ? '#F1EDF1'
                          : '#FFFDFB',
                    },
                    isCurrent && {
                      shadowColor: world.accent,
                      shadowOpacity: 0.22,
                      shadowRadius: 9,
                      shadowOffset: { width: 0, height: 3 },
                      elevation: 4,
                    },
                    isSelected && styles.selectedNode,
                  ]}
                >
                  {isCompleted ? (
                    <Text
                      style={[
                        styles.check,
                        { color: world.accent },
                      ]}
                    >
                      ✓
                    </Text>
                  ) : level.state === 'locked' ? (
                    <Text style={styles.lock}>🔒</Text>
                  ) : (
                    <>
                      <Text
                        style={[
                          styles.levelNumber,
                          { color: world.accent },
                        ]}
                      >
                        {level.number}
                      </Text>
                      <Text style={styles.levelSymbol}>
                        {level.symbol}
                      </Text>
                    </>
                  )}
                </View>

                <View
                  style={[
                    styles.numberPill,
                    {
                      backgroundColor:
                        level.state === 'locked'
                          ? '#E7E1E7'
                          : world.accent,
                    },
                  ]}
                >
                  <Text style={styles.numberPillText}>
                    {level.number}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.bottomArea}>
          <View style={styles.selectedPanel}>
            <View
              style={[
                styles.panelSymbol,
                { backgroundColor: `${world.accent}20` },
              ]}
            >
              <Text style={[styles.panelSymbolText, { color: world.accent }]}>
                {selectedLevel.symbol}
              </Text>
            </View>

            <View style={styles.panelText}>
              <Text style={styles.panelLevel}>
                LEVEL {selectedLevel.number}
              </Text>
              <Text style={styles.panelTitle}>
                {selectedLevel.title}
              </Text>

              <Text style={styles.panelState}>
                {selectedLevel.state === 'completed'
                  ? 'Completed'
                  : selectedLevel.state === 'current'
                    ? 'Ready to explore'
                    : 'Locked — complete the previous level first'}
              </Text>
            </View>
          </View>

          {selectedLevel.state !== 'locked' && (
            <Pressable
              onPress={() => openLevel(selectedLevel, selected)}
              style={({ pressed }) => [
                styles.continueButton,
                { backgroundColor: world.accent },
                pressed && styles.continuePressed,
              ]}
            >
              <Text style={styles.continueText}>
                {selectedLevel.state === 'current'
                  ? 'CONTINUE'
                  : 'REVISIT'}
              </Text>
              <Text style={styles.continueArrow}>→</Text>
            </Pressable>
          )}

          <Text style={styles.footerText}>
            Explore at your own pace. There are no streaks or leaderboards.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFF9F5',
  },

  scroll: {
    flex: 1,
  },

  content: {
    alignItems: 'center',
    paddingBottom: 40,
  },

  header: {
    width: '100%',
    paddingTop: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFDFB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEE5E8',
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: '#4B4650',
    marginTop: -3,
  },

  headerCenter: {
    flex: 1,
    marginLeft: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  subjectIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  subjectSymbol: {
    fontSize: 25,
    fontWeight: '700',
  },

  title: {
    color: '#34313A',
    fontSize: 22,
    fontWeight: '800',
  },

  subtitle: {
    color: '#817A84',
    fontSize: 13,
    marginTop: 3,
  },

  journeyIntro: {
    width: '100%',
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 6,
  },

  journeyLabel: {
    color: '#8A818C',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  journeyHint: {
    color: '#716A73',
    fontSize: 13,
    marginTop: 5,
  },

  map: {
    marginTop: 8,
    position: 'relative',
  },

  node: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },

  nodeOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },

  selectedNode: {
    borderWidth: 4,
  },

  check: {
    fontSize: 31,
    fontWeight: '900',
  },

  lock: {
    fontSize: 18,
    opacity: 0.48,
  },

  levelNumber: {
    fontSize: 20,
    fontWeight: '900',
    position: 'absolute',
    top: 8,
  },

  levelSymbol: {
    color: '#8C8790',
    fontSize: 18,
    marginTop: 20,
  },

  numberPill: {
    minWidth: 30,
    height: 21,
    paddingHorizontal: 7,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: -10,
  },

  numberPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },

  bottomArea: {
    width: '100%',
    paddingHorizontal: 20,
    marginTop: 4,
  },

  selectedPanel: {
    width: '100%',
    minHeight: 88,
    backgroundColor: '#FFFDFB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EEE5E8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  panelSymbol: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  panelSymbolText: {
    fontSize: 24,
    fontWeight: '800',
  },

  panelText: {
    flex: 1,
    marginLeft: 14,
  },

  panelLevel: {
    color: '#948B96',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  panelTitle: {
    color: '#34313A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 3,
  },

  panelState: {
    color: '#817A84',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  continueButton: {
    marginTop: 12,
    height: 54,
    borderRadius: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  continueArrow: {
    color: '#FFFFFF',
    fontSize: 22,
    marginLeft: 10,
  },

  continuePressed: {
    opacity: 0.78,
  },

  footerText: {
    color: '#9A929B',
    textAlign: 'center',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 16,
    paddingHorizontal: 30,
  },

  pressed: {
    opacity: 0.65,
  },
});
