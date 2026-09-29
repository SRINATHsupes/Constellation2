import { GLView } from 'expo-gl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as THREE from 'three';

type PartId = 'largeGear' | 'smallGear' | 'shaft';

type PartDefinition = {
  id: PartId;
  name: string;
  color: number;
  start: [number, number, number];
  target: [number, number, number];
  radius?: number;
  depth?: number;
};

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
  border: '#E8DDE7',
  muted: '#817985',
};

const LEVEL_DATA = {
  1: {
    title: 'GEAR MECHANISM',
    subtitle: 'Build the mechanism',
    parts: [
      {
        id: 'largeGear',
        name: 'Large Gear',
        color: 0x9b83d7,
        start: [-2.8, 1.25, 0.8],
        target: [-0.75, 1.25, -1.0],
        radius: 0.8,
        depth: 0.28,
      },
      {
        id: 'smallGear',
        name: 'Small Gear',
        color: 0xf3c7a9,
        start: [2.5, 1.1, 0.8],
        target: [0.8, 1.1, -1.0],
        radius: 0.5,
        depth: 0.25,
      },
      {
        id: 'shaft',
        name: 'Shaft',
        color: 0x82b8e8,
        start: [0, 1.0, 2.0],
        target: [0, 1.0, -1.0],
        radius: 0.12,
        depth: 1.9,
      },
    ] satisfies PartDefinition[],
  },
} as const;

function roundedBox(
  width: number,
  height: number,
  depth: number,
  color: number,
  radius = 0.08,
) {
  const shape = new THREE.Shape();

  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(
    x + width,
    y,
    x + width,
    y + radius,
  );
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(
    x,
    y + height,
    x,
    y + height - radius,
  );
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(
    x,
    y,
    x + radius,
    y,
  );

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: radius * 0.35,
    bevelThickness: radius * 0.35,
  });

  geometry.center();

  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.7,
    metalness: 0.15,
  });

  return new THREE.Mesh(geometry, material);
}

function makeGear(
  radius: number,
  depth: number,
  color: number,
) {
  const group = new THREE.Group();

  const teeth = 12;

  for (let i = 0; i < teeth; i += 1) {
    const tooth = roundedBox(
      radius * 0.38,
      radius * 0.28,
      depth,
      color,
      0.04,
    );

    const angle = (i / teeth) * Math.PI * 2;

    tooth.position.set(
      Math.cos(angle) * radius * 0.9,
      Math.sin(angle) * radius * 0.9,
      0,
    );

    tooth.rotation.z = angle;
    group.add(tooth);
  }

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 0.82,
      radius * 0.82,
      depth,
      32,
    ),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.2,
    }),
  );

  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 0.18,
      radius * 0.18,
      depth * 1.3,
      24,
    ),
    new THREE.MeshStandardMaterial({
      color: 0x34313a,
      roughness: 0.8,
    }),
  );

  hole.rotation.x = Math.PI / 2;
  group.add(hole);

  return group;
}

function makePart(definition: PartDefinition) {
  if (
    definition.id === 'largeGear' ||
    definition.id === 'smallGear'
  ) {
    return makeGear(
      definition.radius ?? 0.6,
      definition.depth ?? 0.25,
      definition.color,
    );
  }

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(
      definition.radius ?? 0.12,
      definition.radius ?? 0.12,
      definition.depth ?? 1.5,
      20,
    ),
    new THREE.MeshStandardMaterial({
      color: definition.color,
      roughness: 0.45,
      metalness: 0.55,
    }),
  );

  shaft.rotation.z = Math.PI / 2;

  return shaft;
}

function buildWorkshop(
  scene: THREE.Scene,
  parts: PartDefinition[],
) {
  scene.background = new THREE.Color(
    COLORS.background,
  );

  const ambient = new THREE.HemisphereLight(
    0xffffff,
    0xd9cfe8,
    2.2,
  );

  scene.add(ambient);

  const light = new THREE.DirectionalLight(
    0xffffff,
    2.8,
  );

  light.position.set(4, 8, 5);
  scene.add(light);

  const floor = roundedBox(
    12,
    0.2,
    11,
    0xf8e8dd,
    0.12,
  );

  floor.position.y = -0.1;
  scene.add(floor);

  const backWall = roundedBox(
    12,
    5.2,
    0.25,
    0xf1ecfa,
    0.12,
  );

  backWall.position.set(
    0,
    2.5,
    -5.2,
  );

  scene.add(backWall);

  const leftWall = roundedBox(
    0.25,
    5.2,
    11,
    0xf1ecfa,
    0.12,
  );

  leftWall.position.set(
    -6,
    2.5,
    0,
  );

  scene.add(leftWall);

  const rightWall = leftWall.clone();

  rightWall.position.x = 6;
  scene.add(rightWall);

  const workbench = roundedBox(
    7.2,
    0.55,
    3.5,
    0xebcfbd,
    0.16,
  );

  workbench.position.set(
    0,
    0.45,
    -0.7,
  );

  scene.add(workbench);

  const machineBase = roundedBox(
    4.8,
    0.35,
    2.7,
    0xfffdfb,
    0.12,
  );

  machineBase.position.set(
    0,
    0.9,
    -1.0,
  );

  scene.add(machineBase);

  const largeTarget = makeGear(
    0.8,
    0.28,
    0xeee7fa,
  );

  largeTarget.position.set(
    -0.75,
    1.25,
    -1.0,
  );

  scene.add(largeTarget);

  const smallTarget = makeGear(
    0.5,
    0.25,
    0xfce9dd,
  );

  smallTarget.position.set(
    0.8,
    1.1,
    -1.0,
  );

  scene.add(smallTarget);

  const shaftTarget = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.12,
      0.12,
      1.9,
      20,
    ),
    new THREE.MeshStandardMaterial({
      color: 0xdccff4,
      transparent: true,
      opacity: 0.65,
    }),
  );

  shaftTarget.rotation.z = Math.PI / 2;

  shaftTarget.position.set(
    0,
    1.0,
    -1.0,
  );

  scene.add(shaftTarget);

  parts.forEach((definition) => {
    const part = makePart(definition);

    part.name = definition.id;

    part.position.set(
      definition.start[0],
      definition.start[1],
      definition.start[2],
    );

    scene.add(part);
  });
}

export default function Manufacturing() {
  const router = useRouter();
  const params =
    useLocalSearchParams<{ level?: string }>();

  const requestedLevel = Number(
    params.level ?? '1',
  );

  const level =
    requestedLevel >= 1 && requestedLevel <= 5
      ? requestedLevel
      : 1;

  const glRef = useRef<any>(null);
  const sceneRef =
    useRef<THREE.Scene | null>(null);
  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef =
    useRef<THREE.WebGLRenderer | null>(null);

  const partsRef =
    useRef<THREE.Object3D[]>([]);

  const selectedPartRef =
    useRef<THREE.Object3D | null>(null);

  const raycasterRef =
    useRef(new THREE.Raycaster());

  const pointerRef =
    useRef(new THREE.Vector2());

  const dragPlaneRef =
    useRef(new THREE.Plane());

  const dragOffsetRef =
    useRef(new THREE.Vector3());

  const [selectedPart, setSelectedPart] =
    useState<PartId | null>(null);

  const [placedParts, setPlacedParts] =
    useState<PartId[]>([]);

  const [message, setMessage] =
    useState('Drag each part onto its ghost position.');

  const [machineRunning, setMachineRunning] =
    useState(false);

  const onContextCreate = async (gl: any) => {
    glRef.current = gl;

    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera =
      new THREE.PerspectiveCamera(
        58,
        width / height,
        0.1,
        100,
      );

    camera.position.set(
      0,
      5.6,
      8.8,
    );

    camera.lookAt(
      0,
      1.1,
      -0.8,
    );

    cameraRef.current = camera;

    const renderer =
      new THREE.WebGLRenderer({
        context: gl,
        antialias: true,
      });

    renderer.setSize(
      width,
      height,
      false,
    );

    rendererRef.current = renderer;

    const currentLevel =
      LEVEL_DATA[1];

    buildWorkshop(
      scene,
      currentLevel.parts,
    );

    partsRef.current =
      currentLevel.parts.map(
        (definition) =>
          scene.getObjectByName(
            definition.id,
          )!,
      );

    let frame = 0;

    const animate = () => {
      frame = requestAnimationFrame(
        animate,
      );

      if (machineRunning) {
        const largeGear =
          scene.getObjectByName(
            'largeGear',
          );

        const smallGear =
          scene.getObjectByName(
            'smallGear',
          );

        if (largeGear) {
          largeGear.rotation.z += 0.035;
        }

        if (smallGear) {
          smallGear.rotation.z -= 0.055;
        }
      }

      renderer.render(
        scene,
        camera,
      );

      gl.endFrameEXP();

      frame += 1;
    };

    animate();
  };

  const getPointer = (
    event: any,
  ) => {
    const native =
      event?.nativeEvent;

    const width =
      glRef.current?.drawingBufferWidth ??
      1;

    const height =
      glRef.current?.drawingBufferHeight ??
      1;

    pointerRef.current.set(
      ((native?.locationX ?? 0) /
        width) *
        2 -
        1,
      -(
        ((native?.locationY ?? 0) /
          height) *
          2 -
        1
      ),
    );
  };

  const handleTouchStart = (
    event: any,
  ) => {
    const camera =
      cameraRef.current;

    const scene =
      sceneRef.current;

    if (!camera || !scene) return;

    getPointer(event);

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    const hits =
      raycasterRef.current.intersectObjects(
        partsRef.current,
        true,
      );

    if (!hits.length) return;

    let object =
      hits[0].object;

    while (
      object.parent &&
      !partsRef.current.includes(object)
    ) {
      object =
        object.parent;
    }

    if (
      !partsRef.current.includes(object)
    ) {
      return;
    }

    selectedPartRef.current =
      object;

    setSelectedPart(
      object.name as PartId,
    );

    const normal =
      camera.getWorldDirection(
        new THREE.Vector3(),
      );

    dragPlaneRef.current.setFromNormalAndCoplanarPoint(
      normal,
      object.position,
    );

    const ray =
      raycasterRef.current.ray;

    const intersection =
      new THREE.Vector3();

    ray.intersectPlane(
      dragPlaneRef.current,
      intersection,
    );

    if (intersection) {
      dragOffsetRef.current
        .copy(object.position)
        .sub(intersection);
    }

    setMessage(
      `Moving ${object.name}. Place it on the matching ghost.`,
    );
  };

  const handleTouchMove = (
    event: any,
  ) => {
    const camera =
      cameraRef.current;

    const object =
      selectedPartRef.current;

    if (!camera || !object) return;

    getPointer(event);

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    const intersection =
      new THREE.Vector3();

    if (
      raycasterRef.current.ray.intersectPlane(
        dragPlaneRef.current,
        intersection,
      )
    ) {
      object.position.copy(
        intersection,
      );

      object.position.add(
        dragOffsetRef.current,
      );
    }
  };

  const handleTouchEnd = () => {
    const object =
      selectedPartRef.current;

    if (!object) return;

    const definition =
      LEVEL_DATA[1].parts.find(
        (part) =>
          part.id === object.name,
      );

    if (!definition) return;

    const target =
      new THREE.Vector3(
        definition.target[0],
        definition.target[1],
        definition.target[2],
      );

    const distance =
      object.position.distanceTo(
        target,
      );

    if (distance < 0.65) {
      object.position.copy(target);

      if (
        !placedParts.includes(
          object.name as PartId,
        )
      ) {
        setPlacedParts(
          (current) => [
            ...current,
            object.name as PartId,
          ],
        );
      }

      setMessage(
        `${definition.name} snapped into place.`,
      );
    } else {
      setMessage(
        'Not quite. Try the matching ghost position.',
      );
    }

    selectedPartRef.current = null;
    setSelectedPart(null);
  };

  const testMachine = () => {
    const complete =
      placedParts.length ===
      LEVEL_DATA[1].parts.length;

    if (!complete) {
      setMessage(
        'The machine is not complete yet.',
      );
      return;
    }

    setMachineRunning(true);
    setMessage(
      'Machine working! The gears are turning.',
    );
  };

  const resetLevel = () => {
    setPlacedParts([]);
    setSelectedPart(null);
    setMachineRunning(false);

    const scene =
      sceneRef.current;

    if (!scene) return;

    LEVEL_DATA[1].parts.forEach(
      (definition) => {
        const object =
          scene.getObjectByName(
            definition.id,
          );

        if (!object) return;

        object.position.set(
          definition.start[0],
          definition.start[1],
          definition.start[2],
        );

        object.rotation.set(
          0,
          0,
          0,
        );
      },
    );

    setMessage(
      'Parts reset. Start assembling again.',
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>
              MANUFACTURING
            </Text>

            <Text style={styles.title}>
              LEVEL {level}
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {LEVEL_DATA[1].title}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>
            {LEVEL_DATA[1].subtitle}
          </Text>

          <Text style={styles.infoText}>
            Match the real parts with their
            transparent positions.
          </Text>
        </View>

        <GLView
          style={styles.gl}
          onContextCreate={
            onContextCreate
          }
          onStartShouldSetResponder={() =>
            true
          }
          onResponderGrant={
            handleTouchStart
          }
          onResponderMove={
            handleTouchMove
          }
          onResponderRelease={
            handleTouchEnd
          }
        />

        <View
          style={styles.bottomPanel}
        >
          <View style={styles.statusRow}>
            <Text
              style={styles.statusText}
            >
              {placedParts.length}/
              {LEVEL_DATA[1].parts.length}{' '}
              parts placed
            </Text>

            {selectedPart && (
              <Text
                style={styles.selectedText}
              >
                {selectedPart}
              </Text>
            )}
          </View>

          <Text style={styles.message}>
            {message}
          </Text>

          <View style={styles.buttons}>
            <Pressable
              style={[
                styles.button,
                styles.secondaryButton,
              ]}
              onPress={resetLevel}
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                RESET
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.button,
                styles.primaryButton,
              ]}
              onPress={testMachine}
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                TEST MACHINE
              </Text>
            </Pressable>
          </View>
        </View>

        {machineRunning && (
          <View
            style={styles.successCard}
          >
            <Text
              style={styles.successTitle}
            >
              MACHINE WORKING
            </Text>

            <Text
              style={styles.successText}
            >
              Gear mechanism complete.
            </Text>

            <Pressable
              style={styles.nextButton}
              onPress={() => {
                router.push(
                  '/(main)/play/manufacturing?level=2',
                );
              }}
            >
              <Text
                style={styles.nextButtonText}
              >
                NEXT LEVEL →
              </Text>
            </Pressable>
          </View>
        )}
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

  root: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },

  header: {
    minHeight: 76,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
    color: COLORS.purple,
  },

  title: {
    marginTop: 3,
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.charcoal,
  },

  badge: {
    maxWidth: 155,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor:
      '#EEE7FA',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color:
      COLORS.purpleDark,
    textAlign: 'center',
  },

  infoCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.charcoal,
  },

  infoText: {
    marginTop: 3,
    fontSize: 12,
    color: COLORS.muted,
  },

  gl: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 22,
    overflow: 'hidden',
  },

  bottomPanel: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  statusText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.charcoal,
  },

  selectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.purple,
  },

  message: {
    marginTop: 4,
    minHeight: 34,
    fontSize: 12,
    color: COLORS.muted,
  },

  buttons: {
    flexDirection: 'row',
    gap: 10,
  },

  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  primaryButton: {
    backgroundColor:
      COLORS.purple,
  },

  secondaryButton: {
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  secondaryButtonText: {
    color: COLORS.charcoal,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
  },

  successCard: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '38%',
    padding: 22,
    borderRadius: 24,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },

  successTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.purpleDark,
  },

  successText: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.muted,
  },

  nextButton: {
    marginTop: 16,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor:
      COLORS.purple,
  },

  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
