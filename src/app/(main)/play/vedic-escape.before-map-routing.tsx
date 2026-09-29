import { GLView } from 'expo-gl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as THREE from 'three';

type Level = 1 | 2 | 3 | 4;

const COLORS = {
  background: '#FFF9F5',
  wall: '#F1ECFA',
  floor: '#F8E8DD',
  wood: '#EBCFBD',
  paper: '#FFFDF9',
  clue: '#DCCFF4',
  purple: '#8B6FC7',
  purpleDark: '#7655B5',
  charcoal: '#34313A',
  peach: '#F3C7A9',
  green: '#A9DCC7',
  blue: '#BFD9F2',
};

const LEVEL_DATA: Record<
  Exclude<Level, 0>,
  {
    title: string;
    puzzle: string;
    answer: string;
    hints: string[];
  }
> = {
  1: {
    title: 'THE FIRST LOCK',
    puzzle: '97 × 96',
    answer: '9312',
    hints: [
      'Both numbers are close to 100.',
      '97 is 3 less than 100.',
      '96 is 4 less than 100.',
      '100 − 3 − 4 = 93.',
      '3 × 4 = 12.',
      '93 | 12 → 9312.',
    ],
  },
  2: {
    title: 'THE SECOND LOCK',
    puzzle: '96 × 94',
    answer: '9024',
    hints: [
      'Both numbers are close to 100.',
      '96 is 4 less than 100.',
      '94 is 6 less than 100.',
      '100 − 4 − 6 = 90.',
      '4 × 6 = 24.',
      '90 | 24 → 9024.',
    ],
  },
  3: {
    title: 'THE HIDDEN LOCK',
    puzzle: '95 × 93',
    answer: '8835',
    hints: [
      'Find the distance of each number from 100.',
      '95 is 5 less than 100.',
      '93 is 7 less than 100.',
      '100 − 5 − 7 = 88.',
      '5 × 7 = 35.',
      '88 | 35 → 8835.',
    ],
  },
  4: {
    title: 'THE MASTER CHAMBER',
    puzzle: '94 × 92',
    answer: '8648',
    hints: [
      'The numbers are both close to 100.',
      'Find both distances yourself.',
      'Subtract both distances from 100.',
      'Multiply the two distances.',
      'Join the two results.',
      '8648 opens the master lock.',
    ],
  },
};



function roundedBox(
  width: number,
  height: number,
  depth: number,
  color: string,
  radius = 0.12,
) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.radius = radius;
  return mesh;
}

function makePaper(text: string, color = COLORS.paper) {
  const group = new THREE.Group();

  const paper = roundedBox(2.25, 0.05, 1.35, color, 0.08);
  group.add(paper);

  const line1 = roundedBox(1.65, 0.025, 0.07, COLORS.purple, 0.03);
  line1.position.set(0, 0.045, -0.25);
  group.add(line1);

  const line2 = roundedBox(1.15, 0.025, 0.07, COLORS.peach, 0.03);
  line2.position.set(0, 0.045, 0.05);
  group.add(line2);

  const line3 = roundedBox(0.85, 0.025, 0.07, COLORS.clue, 0.03);
  line3.position.set(0, 0.045, 0.28);
  group.add(line3);

  group.userData.text = text;
  return group;
}

function makeSmartLock() {
  const group = new THREE.Group();

  const body = roundedBox(1.25, 1.65, 0.22, COLORS.paper, 0.2);
  group.add(body);

  const screen = roundedBox(0.82, 0.38, 0.06, COLORS.clue, 0.12);
  screen.position.set(0, 0.48, 0.15);
  group.add(screen);

  const center = roundedBox(0.55, 0.42, 0.08, COLORS.purple, 0.18);
  center.position.set(0, -0.05, 0.16);
  group.add(center);

  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const key = roundedBox(
        0.22,
        0.22,
        0.07,
        COLORS.clue,
        0.08,
      );

      key.position.set(
        -0.28 + col * 0.28,
        -0.38 - row * 0.27,
        0.16,
      );

      group.add(key);
    }
  }

  const hint = roundedBox(0.8, 0.16, 0.08, COLORS.peach, 0.08);
  hint.position.set(0, -1.18, 0.16);
  group.add(hint);

  group.userData.isSmartLock = true;

  return group;
}

function makeDoor() {
  const group = new THREE.Group();

  // Soft outer doorway — rounded like the Constellation UI.
  const outerFrame = roundedBox(
    4.8,
    4.35,
    0.32,
    COLORS.clue,
    0.42,
  );
  outerFrame.position.y = 2.18;
  group.add(outerFrame);

  // Warm inner doorway.
  const innerFrame = roundedBox(
    4.25,
    3.95,
    0.20,
    COLORS.peach,
    0.38,
  );
  innerFrame.position.set(0, 2.12, 0.20);
  group.add(innerFrame);

  // Left rounded door panel.
  const leftPanel = roundedBox(
    1.92,
    3.55,
    0.24,
    COLORS.paper,
    0.34,
  );
  leftPanel.position.set(-0.98, 2.05, 0.38);
  group.add(leftPanel);

  // Right rounded door panel.
  const rightPanel = roundedBox(
    1.92,
    3.55,
    0.24,
    COLORS.paper,
    0.34,
  );
  rightPanel.position.set(0.98, 2.05, 0.38);
  group.add(rightPanel);

  // Soft lavender center strip.
  const centerStrip = roundedBox(
    0.20,
    3.05,
    0.10,
    COLORS.clue,
    0.10,
  );
  centerStrip.position.set(0, 2.05, 0.55);
  group.add(centerStrip);

  // Integrated smart-lock housing.
  const lockHousing = roundedBox(
    0.72,
    1.02,
    0.20,
    COLORS.clue,
    0.24,
  );
  lockHousing.position.set(0, 2.08, 0.62);
  group.add(lockHousing);

  // Smart-lock face.
  const lockFace = roundedBox(
    0.52,
    0.76,
    0.12,
    COLORS.purple,
    0.18,
  );
  lockFace.position.set(0, 2.08, 0.76);
  group.add(lockFace);

  // Lock indicator.
  const lockIndicator = roundedBox(
    0.22,
    0.12,
    0.05,
    COLORS.green,
    0.06,
  );
  lockIndicator.position.set(0, 2.30, 0.84);
  group.add(lockIndicator);

  // Small peach accent beneath the lock.
  const lockAccent = roundedBox(
    0.34,
    0.08,
    0.05,
    COLORS.peach,
    0.04,
  );
  lockAccent.position.set(0, 1.84, 0.84);
  group.add(lockAccent);

  return {
    group,
    leftPanel,
    rightPanel,
  };
}

function buildRoom(
  scene: THREE.Scene,
  level: Level,
  onDoorCreated: (
    leftPanel: THREE.Object3D,
    rightPanel: THREE.Object3D,
  ) => void,
) {
  scene.background = new THREE.Color(COLORS.background);

  const ambient = new THREE.HemisphereLight(
    0xffffff,
    0xd9cfe8,
    2.1,
  );
  scene.add(ambient);

  const light = new THREE.DirectionalLight(0xffffff, 2.5);
  light.position.set(3, 7, 4);
  scene.add(light);

  const floor = roundedBox(12, 0.2, 11, COLORS.floor, 0.12);
  floor.position.y = -0.1;
  scene.add(floor);

  const backWall = roundedBox(12, 5.2, 0.25, COLORS.wall, 0.12);
  backWall.position.set(0, 2.5, -5.2);
  scene.add(backWall);

  const leftWall = roundedBox(0.25, 5.2, 11, COLORS.wall, 0.12);
  leftWall.position.set(-6, 2.5, 0);
  scene.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 6;
  scene.add(rightWall);

  const table = roundedBox(3.2, 1.1, 1.7, COLORS.wood, 0.18);
  table.position.set(-2.8, 0.55, -0.4);
  scene.add(table);

  const puzzle = LEVEL_DATA[level].puzzle;

  const paper = makePaper(puzzle);
  paper.position.set(-2.8, 1.16, -0.4);
  paper.rotation.x = -0.04;
  scene.add(paper);

  const clue = makePaper(
    level === 1
      ? '97 → 3\n96 → 4'
      : level === 2
        ? '96 → 4\n94 → 6'
        : level === 3
          ? '95 → 5\n93 → 7'
          : '94 → ?\n92 → ?',
    COLORS.clue,
  );

  clue.position.set(2.4, 1.45, -2.8);
  clue.rotation.x = -0.02;
  scene.add(clue);

  const lock = makeSmartLock();
  lock.position.set(3.65, 1.65, -4.55);
  scene.add(lock);

  const door = makeDoor();
  door.group.position.set(0, 0, -5.0);
  scene.add(door.group);

  onDoorCreated(door.leftPanel, door.rightPanel);

  const numberPositions = [
    { x: -3.7, value: '100' },
    { x: -2.3, value: '3' },
    { x: -0.9, value: '4' },
  ];

  numberPositions.forEach(({ x }) => {
    const block = roundedBox(
      0.75,
      0.75,
      0.75,
      COLORS.clue,
      0.18,
    );

    block.position.set(x, 0.38, 2.5);
    scene.add(block);
  });

  const person = roundedBox(
    0.8,
    1.7,
    0.65,
    COLORS.blue,
    0.2,
  );

  person.position.set(3.2, 0.85, 2.2);
  scene.add(person);
}

export default function VedicEscape() {
  const router = useRouter();
  const params = useLocalSearchParams<{ level?: string }>();

  const parsedLevel = Number(params.level ?? '1');
  const level: Level =
    parsedLevel >= 1 && parsedLevel <= 4
      ? (parsedLevel as Level)
      : 1;

  const glRef = useRef<any>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const player = useRef({
    x: 0,
    z: 3.8,
  });

  const yaw = useRef(0);
  const pitch = useRef(-0.08);

  const lookStart = useRef({
    x: 0,
    y: 0,
    yaw: 0,
    pitch: 0,
  });

  const leftDoorRef = useRef<THREE.Object3D | null>(null);
  const rightDoorRef = useRef<THREE.Object3D | null>(null);

  const [lockOpen, setLockOpen] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [nearLock, setNearLock] = useState(false);
  const [nearDoor, setNearDoor] = useState(false);
  const [doorOpen, setDoorOpen] = useState(false);

  const currentLevelData =
    level === 1
      ? LEVEL_DATA[1]
      : level === 2
        ? LEVEL_DATA[2]
        : level === 3
          ? LEVEL_DATA[3]
          : level === 4
            ? LEVEL_DATA[4]
            : null;

  const exampleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const move = (forward: number, sideways: number) => {
    const angle = yaw.current;

    const forwardX = -Math.sin(angle);
    const forwardZ = -Math.cos(angle);

    const rightX = Math.cos(angle);
    const rightZ = -Math.sin(angle);

    player.current.x +=
      forwardX * forward + rightX * sideways;

    player.current.z +=
      forwardZ * forward + rightZ * sideways;

    player.current.x = Math.max(
      -5.1,
      Math.min(5.1, player.current.x),
    );

    player.current.z = Math.max(
      -4.65,
      Math.min(4.65, player.current.z),
    );
  };

  const updateNearby = () => {
    const x = player.current.x;
    const z = player.current.z;

    const lockDistance = Math.sqrt(
      (x - 3.65) ** 2 + (z + 4.55) ** 2,
    );

    const doorDistance = Math.sqrt(
      x ** 2 + (z + 5) ** 2,
    );

    setNearLock(lockDistance < 2.0);
    setNearDoor(doorDistance < 2.0);
  };

  const openLock = () => {
    if (!nearLock) return;

    setLockOpen(true);
    setMessage('');
  };

  const submitCode = () => {
    if (code === LEVEL_DATA[level].answer) {
      setMessage('LOCK OPENED');
      setLockOpen(false);
      setDoorOpen(true);

      const left = leftDoorRef.current;
      const right = rightDoorRef.current;

      if (left && right) {
        left.position.x = -1.15;
        right.position.x = 1.15;
      }
    } else {
      setMessage('Not quite. Try another pattern.');
      setCode('');
    }
  };

  const handleInteract = () => {
    if (nearLock) {
      openLock();
      return;
    }

    if (nearDoor && doorOpen) {
      router.replace(
        `/play/vedic-escape?level=${Math.min(
          4,
          level + 1,
        )}`,
      );
    }
  };

  useEffect(() => {
    const keyHandler = (event: any) => {
      const key = String(event?.key ?? '').toLowerCase();

      if (lockOpen) {
        if (/^[0-9]$/.test(key) && code.length < 4) {
          setCode((current) => current + key);
        }

        if (key === 'backspace') {
          setCode((current) => current.slice(0, -1));
        }

        if (key === 'enter') {
          submitCode();
        }

        if (key === 'escape') {
          setLockOpen(false);
        }

        return;
      }

      if (key === 'w' || key === 'arrowup') {
        move(0.32, 0);
      }

      if (key === 's' || key === 'arrowdown') {
        move(-0.32, 0);
      }

      if (key === 'a' || key === 'arrowleft') {
        move(0, -0.32);
      }

      if (key === 'd' || key === 'arrowright') {
        move(0, 0.32);
      }

      if (key === 'e' || key === 'enter') {
        handleInteract();
      }

      updateNearby();
    };

    if (
      typeof window !== 'undefined' &&
      window.addEventListener
    ) {
      window.addEventListener('keydown', keyHandler);
      return () =>
        window.removeEventListener(
          'keydown',
          keyHandler,
        );
    }

    return undefined;
  }, [level, lockOpen, code, nearLock, nearDoor, doorOpen]);

  const onContextCreate = async (gl: any) => {
    glRef.current = gl;

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      68,
      width / height,
      0.1,
      100,
    );

    camera.rotation.order = 'YXZ';
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      context: gl,
      antialias: true,
    });

    renderer.setSize(width, height, false);
    rendererRef.current = renderer;

    buildRoom(
      scene,
      level,
      (leftPanel, rightPanel) => {
        leftDoorRef.current = leftPanel;
        rightDoorRef.current = rightPanel;
      },
    );

    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(animate);

      camera.position.set(
        player.current.x,
        1.7,
        player.current.z,
      );

      camera.rotation.y = yaw.current;
      camera.rotation.x = pitch.current;

      renderer.render(scene, camera);
      gl.endFrameEXP();

      if (frame % 8 === 0) {
        updateNearby();
      }
    };

    animate();
  };

  const handleTouchStart = (event: any) => {
    const native = event?.nativeEvent;

    lookStart.current = {
      x: native?.locationX ?? 0,
      y: native?.locationY ?? 0,
      yaw: yaw.current,
      pitch: pitch.current,
    };
  };

  const handleTouchMove = (event: any) => {
    const native = event?.nativeEvent;

    const x = native?.locationX ?? 0;
    const y = native?.locationY ?? 0;

    const dx = x - lookStart.current.x;
    const dy = y - lookStart.current.y;

    yaw.current =
      lookStart.current.yaw - dx * 0.006;

    pitch.current = Math.max(
      -1.15,
      Math.min(
        1.15,
        lookStart.current.pitch - dy * 0.004,
      ),
    );
  };

  const handleTouchEnd = (event: any) => {
    const native = event?.nativeEvent;

    const x = native?.locationX ?? 0;
    const y = native?.locationY ?? 0;

    const dx = x - lookStart.current.x;
    const dy = y - lookStart.current.y;

    if (
      Math.abs(dx) < 12 &&
      Math.abs(dy) < 12
    ) {
      handleInteract();
    }
  };

  const addDigit = (digit: string) => {
    if (code.length >= 4) return;
    setCode((current) => current + digit);
  };

  const backspace = () => {
    setCode((current) => current.slice(0, -1));
  };

  const showHint = () => {
    return;

    setHintIndex((current) =>
      Math.min(
        level > 0 ? LEVEL_DATA[level].hints.length - 1 : 0,
        current + 1,
      ),
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>
              VEDIC MATHS
            </Text>

            <Text style={styles.title}>
              LEVEL {level}
            </Text>
          </View>

          {level > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {currentLevelData?.title ?? ''}
              </Text>
            </View>
          )}
        </View>

        <GLView
          style={styles.gl}
          onContextCreate={onContextCreate}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        />

        {level > 0 && (
          <>
            <View style={styles.controls}>
              <View style={styles.dpad}>
                <Pressable
                  style={styles.control}
                  onPress={() => move(0.42, 0)}
                >
                  <Text style={styles.controlText}>
                    ▲
                  </Text>
                </Pressable>

                <View style={styles.dpadMiddle}>
                  <Pressable
                    style={styles.control}
                    onPress={() => move(0, -0.42)}
                  >
                    <Text style={styles.controlText}>
                      ◀
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.control}
                    onPress={() => move(0, 0.42)}
                  >
                    <Text style={styles.controlText}>
                      ▶
                    </Text>
                  </Pressable>
                </View>

                <Pressable
                  style={styles.control}
                  onPress={() => move(-0.42, 0)}
                >
                  <Text style={styles.controlText}>
                    ▼
                  </Text>
                </Pressable>
              </View>

              <View style={styles.helpText}>
                <Text style={styles.helpTitle}>
                  EXPLORE
                </Text>

                <Text style={styles.helpBody}>
                  Swipe to look • WASD / arrows to move
                </Text>
              </View>
            </View>

            {(nearLock || (nearDoor && doorOpen)) && (
              <Pressable
                style={styles.interact}
                onPress={handleInteract}
              >
                <Text style={styles.interactText}>
                  {nearLock
                    ? 'TAP / E  •  SMART LOCK'
                    : 'TAP / E  •  EXIT'}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {message !== '' && (
          <View style={styles.message}>
            <Text style={styles.messageText}>
              {message}
            </Text>
          </View>
        )}

        <Modal
          visible={lockOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setLockOpen(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.lockPanel}>
              <View style={styles.lockTop}>
                <View>
                  <Text style={styles.lockKicker}>
                    VEDIC MATHS
                  </Text>

                  <Text style={styles.lockTitle}>
                    SMART LOCK
                  </Text>
                </View>

                <Pressable
                  style={styles.closeButton}
                  onPress={() => setLockOpen(false)}
                >
                  <Text style={styles.closeText}>
                    ×
                  </Text>
                </Pressable>
              </View>

              <View style={styles.display}>
                <Text style={styles.puzzleText}>
                  {currentLevelData?.puzzle ?? ''}
                </Text>

                <Text style={styles.codeText}>
                  {code.padEnd(4, '•')}
                </Text>
              </View>

              <View style={styles.keypad}>
                {[
                  '1',
                  '2',
                  '3',
                  '4',
                  '5',
                  '6',
                  '7',
                  '8',
                  '9',
                  '0',
                ].map((digit) => (
                  <Pressable
                    key={digit}
                    style={styles.key}
                    onPress={() => addDigit(digit)}
                  >
                    <Text style={styles.keyText}>
                      {digit}
                    </Text>
                  </Pressable>
                ))}

                <Pressable
                  style={styles.key}
                  onPress={backspace}
                >
                  <Text style={styles.keyText}>
                    ⌫
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.submitKey}
                  onPress={submitCode}
                >
                  <Text style={styles.submitText}>
                    ✓
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.hintButton}
                onPress={showHint}
              >
                <Text style={styles.hintIcon}>
                  💡
                </Text>

                <View style={styles.hintCopy}>
                  <Text style={styles.hintTitle}>
                    HINT {hintIndex + 1}
                  </Text>

                  <Text style={styles.hintText}>
                    {currentLevelData?.hints[hintIndex] ?? ''}
                  </Text>
                </View>

                <Text style={styles.nextHint}>
                  {currentLevelData &&
                  hintIndex < currentLevelData.hints.length - 1
                    ? '→'
                    : '✓'}
                </Text>
              </Pressable>

              <Text style={styles.keyboardNote}>
                Keyboard: 0–9 • Backspace • Enter • Esc
              </Text>
            </View>
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    minHeight: 74,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
  },

  kicker: {
    color: COLORS.purpleDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },

  title: {
    color: COLORS.charcoal,
    fontSize: 23,
    fontWeight: '800',
    marginTop: 2,
  },

  badge: {
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: COLORS.clue,
  },

  badgeText: {
    color: COLORS.charcoal,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },

  gl: {
    flex: 1,
  },

  exampleOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    top: 90,
    alignItems: 'center',
  },

  exampleCard: {
    maxWidth: 330,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 24,
    backgroundColor: 'rgba(255,253,249,0.94)',
  },

  exampleLabel: {
    textAlign: 'center',
    color: COLORS.purpleDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  exampleStep: {
    marginTop: 7,
    textAlign: 'center',
    color: COLORS.charcoal,
    fontSize: 25,
    fontWeight: '800',
  },

  exampleCaption: {
    marginTop: 8,
    textAlign: 'center',
    color: COLORS.charcoal,
    opacity: 0.65,
    fontSize: 11,
  },

  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: 10,
  },

  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5DDEB',
  },

  progressDotActive: {
    backgroundColor: COLORS.purple,
  },

  controls: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },

  dpad: {
    alignItems: 'center',
  },

  dpadMiddle: {
    flexDirection: 'row',
    gap: 8,
  },

  control: {
    width: 52,
    height: 48,
    borderRadius: 17,
    backgroundColor: 'rgba(255,253,249,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  controlText: {
    color: COLORS.purpleDark,
    fontSize: 19,
    fontWeight: '800',
  },

  helpText: {
    maxWidth: 210,
    padding: 13,
    borderRadius: 18,
    backgroundColor: 'rgba(255,253,249,0.92)',
  },

  helpTitle: {
    color: COLORS.purpleDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  helpBody: {
    marginTop: 3,
    color: COLORS.charcoal,
    fontSize: 11,
  },

  interact: {
    position: 'absolute',
    bottom: 28,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 22,
    backgroundColor: COLORS.purple,
  },

  interactText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  message: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: COLORS.green,
  },

  messageText: {
    color: COLORS.charcoal,
    fontSize: 12,
    fontWeight: '800',
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(52,49,58,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  lockPanel: {
    width: '100%',
    maxWidth: 390,
    padding: 20,
    borderRadius: 30,
    backgroundColor: COLORS.paper,
  },

  lockTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  lockKicker: {
    color: COLORS.purpleDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  lockTitle: {
    color: COLORS.charcoal,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 2,
  },

  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.wall,
    alignItems: 'center',
    justifyContent: 'center',
  },

  closeText: {
    color: COLORS.charcoal,
    fontSize: 25,
    lineHeight: 28,
  },

  display: {
    marginTop: 18,
    padding: 15,
    borderRadius: 20,
    backgroundColor: COLORS.clue,
    alignItems: 'center',
  },

  puzzleText: {
    color: COLORS.charcoal,
    fontSize: 22,
    fontWeight: '800',
  },

  codeText: {
    marginTop: 8,
    color: COLORS.purpleDark,
    fontSize: 23,
    fontWeight: '800',
    letterSpacing: 7,
  },

  keypad: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },

  key: {
    width: 68,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.wall,
    alignItems: 'center',
    justifyContent: 'center',
  },

  keyText: {
    color: COLORS.charcoal,
    fontSize: 18,
    fontWeight: '800',
  },

  submitKey: {
    width: 68,
    height: 48,
    borderRadius: 15,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  hintButton: {
    marginTop: 15,
    minHeight: 70,
    padding: 13,
    borderRadius: 20,
    backgroundColor: COLORS.peach,
    flexDirection: 'row',
    alignItems: 'center',
  },

  hintIcon: {
    fontSize: 24,
    marginRight: 10,
  },

  hintCopy: {
    flex: 1,
  },

  hintTitle: {
    color: COLORS.purpleDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  hintText: {
    color: COLORS.charcoal,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 3,
  },

  nextHint: {
    color: COLORS.purpleDark,
    fontSize: 22,
    fontWeight: '800',
    paddingLeft: 8,
  },

  keyboardNote: {
    textAlign: 'center',
    marginTop: 12,
    color: COLORS.charcoal,
    opacity: 0.5,
    fontSize: 10,
  },

  nextOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 25,
    alignItems: 'center',
  },

  nextCard: {
    width: '100%',
    maxWidth: 390,
    padding: 20,
    borderRadius: 26,
    backgroundColor: COLORS.paper,
  },

  nextKicker: {
    color: COLORS.purpleDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
  },

  nextTitle: {
    color: COLORS.charcoal,
    fontSize: 25,
    fontWeight: '800',
    marginTop: 3,
  },

  nextBody: {
    color: COLORS.charcoal,
    opacity: 0.7,
    fontSize: 13,
    marginTop: 5,
  },

  nextButton: {
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 19,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
