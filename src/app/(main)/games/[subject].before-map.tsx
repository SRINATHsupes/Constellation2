import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';

type SubjectId = 'vedic' | 'music' | 'arts';

type Level = {
  id: string;
  number: number;
  title: string;
  description: string;
  symbol: string;
};

const WORLDS: Record<
  SubjectId,
  {
    title: string;
    subtitle: string;
    symbol: string;
    levels: Level[];
  }
> = {
  vedic: {
    title: 'VEDIC MATHS',
    subtitle: 'Unlock the ancient number world.',
    symbol: '🧮',
    levels: [
      {
        id: 'vedic-1',
        number: 1,
        title: 'The Number Gate',
        description: 'Find the hidden pattern and unlock the gate.',
        symbol: '🔐',
      },
      {
        id: 'vedic-2',
        number: 2,
        title: 'The Hundred Door',
        description: 'Use numbers close to 100 to open the door.',
        symbol: '🚪',
      },
      {
        id: 'vedic-3',
        number: 3,
        title: 'The Final Chamber',
        description: 'Combine what you discovered to escape.',
        symbol: '🏛️',
      },
    ],
  },

  music: {
    title: 'MUSIC',
    subtitle: 'Discover rhythm, sound and patterns.',
    symbol: '🎵',
    levels: [
      {
        id: 'music-1',
        number: 1,
        title: 'The Rhythm Gate',
        description: 'Discover the pattern hidden in the rhythm.',
        symbol: '🥁',
      },
      {
        id: 'music-2',
        number: 2,
        title: 'Sound Bridge',
        description: 'Match sounds to cross the bridge.',
        symbol: '🌉',
      },
      {
        id: 'music-3',
        number: 3,
        title: 'The Sound Chamber',
        description: 'Build the final musical pattern.',
        symbol: '🎼',
      },
    ],
  },

  arts: {
    title: 'ARTS',
    subtitle: 'Create, observe and transform shapes.',
    symbol: '🎨',
    levels: [
      {
        id: 'arts-1',
        number: 1,
        title: 'Shape Garden',
        description: 'Discover shapes hidden in the world.',
        symbol: '🔺',
      },
      {
        id: 'arts-2',
        number: 2,
        title: 'Color Workshop',
        description: 'Mix ideas and transform the picture.',
        symbol: '🖌️',
      },
      {
        id: 'arts-3',
        number: 3,
        title: 'The Creative Door',
        description: 'Create something that solves the final puzzle.',
        symbol: '✨',
      },
    ],
  },
};

function getWorld(subject: string) {
  if (subject === 'music') {
    return WORLDS.music;
  }

  if (subject === 'arts' || subject === 'drawing') {
    return WORLDS.arts;
  }

  return WORLDS.vedic;
}

export default function SubjectGamesScreen() {
  const params = useLocalSearchParams<{
    subject?: string;
  }>();

  const router = useRouter();

  const subject = String(params.subject ?? 'vedic').toLowerCase();
  const world = getWorld(subject);

  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  function openLevel(level: Level) {
    setSelectedLevel(level.number);

    /*
     * For now we only build the world-selection UX.
     *
     * The actual games will be connected one at a time:
     *
     * Vedic Maths → mathematical escape game
     * Music      → rhythm/sound game
     * Arts       → drawing/shape game
     */
  }

  if (selectedLevel !== null) {
    const level = world.levels[selectedLevel - 1];

    return (
      <View style={styles.root}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />

        <View style={styles.gameHeader}>
          <Pressable
            onPress={() => setSelectedLevel(null)}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <Text style={styles.headerTitle}>{world.title}</Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.gameArea}>
          <Text style={styles.gameSymbol}>{level.symbol}</Text>

          <Text style={styles.gameNumber}>
            LEVEL {level.number}
          </Text>

          <Text style={styles.gameTitle}>
            {level.title}
          </Text>

          <Text style={styles.gameDescription}>
            {level.description}
          </Text>

          <View style={styles.futureGame}>
            <Text style={styles.futureGameTitle}>
              THE GAME LIVES HERE
            </Text>

            <Text style={styles.futureGameText}>
              We will build this as a real playable experience,
              not another lesson screen.
            </Text>
          </View>

          <Pressable
            onPress={() => setSelectedLevel(null)}
            style={styles.returnButton}
          >
            <Text style={styles.returnButtonText}>
              BACK TO WORLD
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>

          <Text style={styles.constellationText}>
            CONSTELLATION
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.worldHeader}>
          <Text style={styles.worldSymbol}>
            {world.symbol}
          </Text>

          <Text style={styles.worldTitle}>
            {world.title}
          </Text>

          <Text style={styles.worldSubtitle}>
            {world.subtitle}
          </Text>
        </View>

        <Text style={styles.sectionLabel}>
          YOUR WORLD
        </Text>

        <View style={styles.levelList}>
          {world.levels.map((level) => (
            <Pressable
              key={level.id}
              onPress={() => openLevel(level)}
              style={({ pressed }) => [
                styles.levelCard,
                pressed && styles.levelCardPressed,
              ]}
            >
              <View style={styles.levelSymbolBox}>
                <Text style={styles.levelSymbol}>
                  {level.symbol}
                </Text>
              </View>

              <View style={styles.levelInfo}>
                <Text style={styles.levelNumber}>
                  LEVEL {level.number}
                </Text>

                <Text style={styles.levelTitle}>
                  {level.title}
                </Text>

                <Text style={styles.levelDescription}>
                  {level.description}
                </Text>
              </View>

              <Text style={styles.arrow}>
                →
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomMessage}>

          <Text style={styles.bottomTitle}>
            PLAY TO DISCOVER
          </Text>

          <Text style={styles.bottomText}>
            Each world will have its own kind of game.
            No generic missions. No unnecessary screens.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070914',
  },

  scrollContent: {
    paddingBottom: 60,
  },

  topBar: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  gameHeader: {
    height: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  backText: {
    color: '#FFFFFF',
    fontSize: 26,
  },

  constellationText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },

  headerSpacer: {
    width: 44,
  },

  worldHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingHorizontal: 28,
    paddingBottom: 34,
  },

  worldSymbol: {
    fontSize: 58,
    marginBottom: 12,
  },

  worldTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  worldSubtitle: {
    marginTop: 10,
    color: '#9CA3B8',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },

  sectionLabel: {
    marginHorizontal: 22,
    marginBottom: 12,
    color: '#7E8499',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  levelList: {
    paddingHorizontal: 18,
    gap: 12,
  },

  levelCard: {
    minHeight: 108,
    padding: 16,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111525',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  levelCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  levelSymbolBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B2034',
  },

  levelSymbol: {
    fontSize: 30,
  },

  levelInfo: {
    flex: 1,
    marginLeft: 16,
  },

  levelNumber: {
    color: '#777F99',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  levelTitle: {
    marginTop: 4,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },

  levelDescription: {
    marginTop: 5,
    color: '#9CA3B8',
    fontSize: 12,
    lineHeight: 17,
  },

  arrow: {
    marginLeft: 8,
    color: '#FFFFFF',
    fontSize: 24,
  },

  bottomMessage: {
    marginHorizontal: 22,
    marginTop: 36,
    padding: 22,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#0D1120',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },

  bottomStar: {
    color: '#FFFFFF',
    fontSize: 24,
  },

  bottomTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
  },

  bottomText: {
    marginTop: 8,
    color: '#8E95AA',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },

  gameArea: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 70,
  },

  gameSymbol: {
    fontSize: 72,
  },

  gameNumber: {
    marginTop: 22,
    color: '#777F99',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  gameTitle: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },

  gameDescription: {
    marginTop: 12,
    color: '#9CA3B8',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },

  futureGame: {
    width: '100%',
    marginTop: 42,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    backgroundColor: '#111525',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  futureGameTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  futureGameText: {
    marginTop: 10,
    color: '#8E95AA',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  returnButton: {
    marginTop: 24,
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },

  returnButtonText: {
    color: '#070914',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
});
