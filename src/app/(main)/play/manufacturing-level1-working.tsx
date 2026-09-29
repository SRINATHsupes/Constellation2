import { GLView } from 'expo-gl';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as THREE from 'three';

type PartId = 'bigGear' | 'smallGear' | 'shaft';

const COLORS = {
  background: '#FFF9F5',
  paper: '#FFFDFB',
  charcoal: '#34313A',
  muted: '#817985',
  purple: '#8B6FC7',
  purpleDark: '#7655B5',
  lavender: '#9B83D7',
  peach: '#F2B38F',
  mint: '#86CDB1',
  sky: '#82B8E8',
  yellow: '#F2C96D',
  border: '#E8DDE7',
  softPurple: '#EEE7FA',
};

const TRAY: Record<PartId, THREE.Vector3> = {
  bigGear: new THREE.Vector3(-2.35, -2.35, 0.5),
  smallGear: new THREE.Vector3(0, -2.35, 0.5),
  shaft: new THREE.Vector3(2.35, -2.35, 0.5),
};

const TARGET: Record<PartId, THREE.Vector3> = {
  bigGear: new THREE.Vector3(-0.9, 0.35, 0.5),
  smallGear: new THREE.Vector3(0.9, 0.35, 0.5),
  shaft: new THREE.Vector3(0, -0.95, 0.5),
};

const LABEL: Record<PartId, string> = {
  bigGear: 'BIG GEAR',
  smallGear: 'SMALL GEAR',
  shaft: 'SHAFT',
};

function makeGear(
  radius: number,
  teeth: number,
  depth: number,
  color: number,
) {
  const shape = new THREE.Shape();

  const innerRadius = radius * 0.76;
  const outerRadius = radius;

  const points = teeth * 4;

  for (let i = 0; i <= points; i += 1) {
    const angle =
      (i / points) * Math.PI * 2;

    const phase = i % 4;

    let r = innerRadius;

    if (phase === 1 || phase === 2) {
      r = outerRadius;
    }

    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();

  const hole = new THREE.Path();

  hole.absarc(
    0,
    0,
    radius * 0.22,
    0,
    Math.PI * 2,
    true,
  );

  shape.holes.push(hole);

  const geometry =
    new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: radius * 0.035,
      bevelThickness: radius * 0.035,
      curveSegments: 2,
    });

  geometry.center();

  const material =
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.38,
      metalness: 0.35,
    });

  const gear = new THREE.Mesh(
    geometry,
    material,
  );

  gear.userData.isPart = true;

  return gear;
}

function makeShaft() {
  const group = new THREE.Group();

  const metal =
    new THREE.MeshStandardMaterial({
      color: 0x9b83d7,
      roughness: 0.32,
      metalness: 0.7,
    });

  const shaftGeometry =
    new THREE.CylinderGeometry(
      0.13,
      0.13,
      2.25,
      32,
    );

  const shaft =
    new THREE.Mesh(
      shaftGeometry,
      metal,
    );

  shaft.rotation.z =
    Math.PI / 2;

  group.add(shaft);

  const capGeometry =
    new THREE.CylinderGeometry(
      0.23,
      0.23,
      0.18,
      32,
    );

  const left =
    new THREE.Mesh(
      capGeometry,
      metal,
    );

  left.rotation.z =
    Math.PI / 2;

  left.position.x =
    -1.05;

  const right =
    new THREE.Mesh(
      capGeometry,
      metal,
    );

  right.rotation.z =
    Math.PI / 2;

  right.position.x =
    1.05;

  group.add(left);
  group.add(right);

  group.userData.isPart = true;

  return group;
}

function makeGhostGear(
  radius: number,
  teeth: number,
) {
  const ghost = makeGear(
    radius,
    teeth,
    0.05,
    0x9b83d7,
  );

  ghost.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material =
        child.material as THREE.MeshStandardMaterial;

      material.transparent = true;
      material.opacity = 0.16;
      material.depthWrite = false;
      material.emissive =
        new THREE.Color(0x9b83d7);
      material.emissiveIntensity = 0.15;
    }
  });

  return ghost;
}

function makeGhostShaft() {
  const ghost = makeShaft();

  ghost.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material =
        child.material as THREE.MeshStandardMaterial;

      material.transparent = true;
      material.opacity = 0.13;
      material.depthWrite = false;
    }
  });

  return ghost;
}

function box(
  scene: THREE.Scene,
  position: THREE.Vector3,
  size: THREE.Vector3,
  color: number,
) {
  const geometry =
    new THREE.BoxGeometry(
      size.x,
      size.y,
      size.z,
    );

  const material =
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.65,
      metalness: 0.05,
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material,
    );

  mesh.position.copy(position);

  scene.add(mesh);

  return mesh;
}

function cylinder(
  scene: THREE.Scene,
  position: THREE.Vector3,
  radius: number,
  color: number,
) {
  const geometry =
    new THREE.CylinderGeometry(
      radius,
      radius,
      0.16,
      32,
    );

  const material =
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.5,
      metalness: 0.45,
    });

  const mesh =
    new THREE.Mesh(
      geometry,
      material,
    );

  mesh.rotation.x =
    Math.PI / 2;

  mesh.position.copy(position);

  scene.add(mesh);

  return mesh;
}

function buildWorkshop(
  scene: THREE.Scene,
) {
  scene.background =
    new THREE.Color(
      COLORS.background,
    );

  const hemisphere =
    new THREE.HemisphereLight(
      0xfff8f3,
      0x817985,
      2.4,
    );

  scene.add(hemisphere);

  const light =
    new THREE.DirectionalLight(
      0xffffff,
      3.5,
    );

  light.position.set(
    -2,
    5,
    8,
  );

  scene.add(light);

  const sideLight =
    new THREE.DirectionalLight(
      0xe8dfff,
      1.3,
    );

  sideLight.position.set(
    5,
    2,
    5,
  );

  scene.add(sideLight);

  box(
    scene,
    new THREE.Vector3(
      0,
      -1.65,
      0,
    ),
    new THREE.Vector3(
      7,
      0.2,
      2.8,
    ),
    0xf3dfd2,
  );

  box(
    scene,
    new THREE.Vector3(
      -3.35,
      0.4,
      -0.6,
    ),
    new THREE.Vector3(
      0.18,
      4.3,
      2.8,
    ),
    0xf1ecfa,
  );

  box(
    scene,
    new THREE.Vector3(
      3.35,
      0.4,
      -0.6,
    ),
    new THREE.Vector3(
      0.18,
      4.3,
      2.8,
    ),
    0xf1ecfa,
  );

  box(
    scene,
    new THREE.Vector3(
      0,
      2.45,
      -0.6,
    ),
    new THREE.Vector3(
      6.7,
      0.18,
      2.8,
    ),
    0xf1ecfa,
  );

  box(
    scene,
    new THREE.Vector3(
      0,
      0.05,
      0,
    ),
    new THREE.Vector3(
      5.5,
      2.7,
      0.35,
    ),
    0xebcfbd,
  );

  box(
    scene,
    new THREE.Vector3(
      0,
      0.05,
      0.25,
    ),
    new THREE.Vector3(
      5.15,
      2.35,
      0.16,
    ),
    0xfffdfb,
  );

  cylinder(
    scene,
    TARGET.bigGear,
    0.18,
    0x817985,
  );

  cylinder(
    scene,
    TARGET.smallGear,
    0.16,
    0x817985,
  );

  cylinder(
    scene,
    TARGET.shaft,
    0.14,
    0x817985,
  );

  const ghostBig =
    makeGhostGear(
      0.95,
      16,
    );

  ghostBig.position.copy(
    TARGET.bigGear,
  );

  ghostBig.position.z =
    0.15;

  scene.add(ghostBig);

  const ghostSmall =
    makeGhostGear(
      0.58,
      12,
    );

  ghostSmall.position.copy(
    TARGET.smallGear,
  );

  ghostSmall.position.z =
    0.15;

  scene.add(ghostSmall);

  const ghostShaft =
    makeGhostShaft();

  ghostShaft.position.copy(
    TARGET.shaft,
  );

  ghostShaft.position.z =
    0.15;

  scene.add(ghostShaft);

  box(
    scene,
    new THREE.Vector3(
      0,
      -2.38,
      0.15,
    ),
    new THREE.Vector3(
      6.5,
      0.5,
      1.25,
    ),
    0xfffdfb,
  );
}

export default function ManufacturingScreen() {
  const router =
    useRouter();

  const sceneRef =
    useRef<THREE.Scene | null>(
      null,
    );

  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(
      null,
    );

  const rendererRef =
    useRef<THREE.WebGLRenderer | null>(
      null,
    );

  const partsRef =
    useRef<
      Record<
        PartId,
        THREE.Object3D | null
      >
    >({
      bigGear: null,
      smallGear: null,
      shaft: null,
    });

  const placedRef =
    useRef<
      Record<PartId, boolean>
    >({
      bigGear: false,
      smallGear: false,
      shaft: false,
    });

  const runningRef =
    useRef(false);

  const frameRef =
    useRef<number | null>(null);

  const viewportRef =
    useRef({
      width: 1,
      height: 1,
    });

  const raycaster =
    useRef(
      new THREE.Raycaster(),
    );

  const pointer =
    useRef(
      new THREE.Vector2(),
    );

  const dragRef =
    useRef<{
      id: PartId;
      offset: THREE.Vector3;
    } | null>(null);

  const [placed, setPlaced] =
    useState<
      Record<PartId, boolean>
    >({
      bigGear: false,
      smallGear: false,
      shaft: false,
    });

  const [running, setRunning] =
    useState(false);

  const [message, setMessage] =
    useState(
      'Drag a real part onto its faint outline.',
    );

  const allPlaced =
    placed.bigGear &&
    placed.smallGear &&
    placed.shaft;

  const updatePointer =
    (event: any) => {
      const native =
        event?.nativeEvent;

      const x =
        native?.locationX ?? 0;

      const y =
        native?.locationY ?? 0;

      const width =
        viewportRef.current.width;

      const height =
        viewportRef.current.height;

      pointer.current.x =
        (x / width) * 2 - 1;

      pointer.current.y =
        -(y / height) * 2 + 1;
    };

  const screenToWorld =
    (
      event: any,
      z: number,
    ) => {
      const camera =
        cameraRef.current;

      if (!camera) {
        return null;
      }

      updatePointer(event);

      const ray =
        raycaster.current;

      ray.setFromCamera(
        pointer.current,
        camera,
      );

      const plane =
        new THREE.Plane(
          new THREE.Vector3(
            0,
            0,
            1,
          ),
          -z,
        );

      const point =
        new THREE.Vector3();

      const hit =
        ray.ray.intersectPlane(
          plane,
          point,
        );

      return hit
        ? point
        : null;
    };

  const findPart =
    (event: any) => {
      const camera =
        cameraRef.current;

      if (!camera) {
        return null;
      }

      updatePointer(event);

      raycaster.current.setFromCamera(
        pointer.current,
        camera,
      );

      const objects: THREE.Object3D[] =
        [];

      Object.entries(
        partsRef.current,
      ).forEach(
        ([id, object]) => {
          if (
            object &&
            !placedRef.current[
              id as PartId
            ]
          ) {
            object.traverse(
              (child) => {
                if (
                  child instanceof
                  THREE.Mesh
                ) {
                  child.userData.partId =
                    id;

                  objects.push(child);
                }
              },
            );
          }
        },
      );

      const hits =
        raycaster.current.intersectObjects(
          objects,
          false,
        );

      if (!hits.length) {
        return null;
      }

      let current:
        | THREE.Object3D
        | null =
        hits[0].object;

      while (current) {
        const id =
          current.userData
            ?.partId as
            | PartId
            | undefined;

        if (id) {
          return id;
        }

        current =
          current.parent;
      }

      return null;
    };

  const startDrag =
    (event: any) => {
      if (
        runningRef.current
      ) {
        return;
      }

      const id =
        findPart(event);

      if (!id) {
        return;
      }

      const object =
        partsRef.current[id];

      if (!object) {
        return;
      }

      const point =
        screenToWorld(
          event,
          object.position.z,
        );

      if (!point) {
        return;
      }

      dragRef.current = {
        id,
        offset:
          object.position
            .clone()
            .sub(point),
      };

      setMessage(
        `Move the ${LABEL[id].toLowerCase()} to its outline.`,
      );
    };

  const moveDrag =
    (event: any) => {
      const drag =
        dragRef.current;

      if (!drag) {
        return;
      }

      const object =
        partsRef.current[
          drag.id
        ];

      if (!object) {
        return;
      }

      const point =
        screenToWorld(
          event,
          object.position.z,
        );

      if (!point) {
        return;
      }

      const next =
        point
          .clone()
          .add(drag.offset);

      next.x = Math.max(
        -3.0,
        Math.min(3.0, next.x),
      );

      next.y = Math.max(
        -2.7,
        Math.min(2.0, next.y),
      );

      object.position.x =
        next.x;

      object.position.y =
        next.y;
    };

  const finishDrag =
    () => {
      const drag =
        dragRef.current;

      if (!drag) {
        return;
      }

      dragRef.current = null;

      const object =
        partsRef.current[
          drag.id
        ];

      if (!object) {
        return;
      }

      const distance =
        object.position.distanceTo(
          TARGET[drag.id],
        );

      const snapDistance =
        drag.id === 'bigGear'
          ? 0.8
          : drag.id === 'smallGear'
            ? 0.65
            : 0.8;

      if (
        distance <=
        snapDistance
      ) {
        object.position.copy(
          TARGET[drag.id],
        );

        placedRef.current[
          drag.id
        ] = true;

        setPlaced(
          {
            ...placedRef.current,
          },
        );

        const complete =
          placedRef.current.bigGear &&
          placedRef.current.smallGear &&
          placedRef.current.shaft;

        if (complete) {
          setMessage(
            'READY! You built the machine. Now run it.',
          );
        } else {
          setMessage(
            `${LABEL[drag.id]} snapped into place.`,
          );
        }
      } else {
        object.position.copy(
          TRAY[drag.id],
        );

        setMessage(
          'Look at the faint outline and try again.',
        );
      }
    };

  const runMachine =
    () => {
      if (
        !allPlaced ||
        runningRef.current
      ) {
        return;
      }

      runningRef.current =
        true;

      setRunning(true);

      setMessage(
        'Watch how one gear makes the other gear turn.',
      );
    };

  const reset =
    () => {
      runningRef.current =
        false;

      setRunning(false);

      (
        Object.keys(
          partsRef.current,
        ) as PartId[]
      ).forEach(
        (id) => {
          const object =
            partsRef.current[id];

          if (object) {
            object.position.copy(
              TRAY[id],
            );

            object.rotation.set(
              0,
              0,
              0,
            );
          }
        },
      );

      placedRef.current = {
        bigGear: false,
        smallGear: false,
        shaft: false,
      };

      setPlaced(
        {
          bigGear: false,
          smallGear: false,
          shaft: false,
        },
      );

      setMessage(
        'Drag a real part onto its faint outline.',
      );
    };

  const createParts =
    (scene: THREE.Scene) => {
      const big =
        makeGear(
          0.78,
          16,
          0.24,
          0xdccff4,
        );

      big.position.copy(
        TRAY.bigGear,
      );

      big.userData.partId =
        'bigGear';

      scene.add(big);

      const small =
        makeGear(
          0.5,
          12,
          0.24,
          0xf2b38f,
        );

      small.position.copy(
        TRAY.smallGear,
      );

      small.userData.partId =
        'smallGear';

      scene.add(small);

      const shaft =
        makeShaft();

      shaft.position.copy(
        TRAY.shaft,
      );

      shaft.userData.partId =
        'shaft';

      scene.add(shaft);

      partsRef.current = {
        bigGear: big,
        smallGear: small,
        shaft,
      };
    };

  const onContextCreate =
    async (gl: any) => {
      const width =
        gl.drawingBufferWidth;

      const height =
        gl.drawingBufferHeight;

      viewportRef.current = {
        width,
        height,
      };

      const scene =
        new THREE.Scene();

      sceneRef.current =
        scene;

      buildWorkshop(scene);
      createParts(scene);

      const camera =
        new THREE.PerspectiveCamera(
          52,
          width / height,
          0.1,
          100,
        );

      camera.position.set(
        0,
        0,
        10,
      );

      camera.lookAt(
        0,
        0,
        0,
      );

      cameraRef.current =
        camera;

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

      renderer.setPixelRatio(1);

      rendererRef.current =
        renderer;

      const clock =
        new THREE.Clock();

      const animate =
        () => {
          frameRef.current =
            requestAnimationFrame(
              animate,
            );

          const delta =
            clock.getDelta();

          if (
            runningRef.current
          ) {
            const big =
              partsRef.current
                .bigGear;

            const small =
              partsRef.current
                .smallGear;

            const shaft =
              partsRef.current
                .shaft;

            if (big) {
              big.rotation.z +=
                delta * 1.7;
            }

            if (small) {
              small.rotation.z -=
                delta * 2.8;
            }

            if (shaft) {
              shaft.rotation.x +=
                delta * 2.2;
            }
          }

          renderer.render(
            scene,
            camera,
          );

          gl.endFrameEXP();
        };

      animate();
    };

  useEffect(() => {
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(
          frameRef.current,
        );
      }

      rendererRef.current?.dispose();
    };
  }, []);

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
            style={styles.headerLeft}
          >
            <Pressable
              onPress={() =>
                router.back()
              }
              style={({ pressed }) => [
                styles.back,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text
                style={styles.backText}
              >
                ‹
              </Text>
            </Pressable>

            <View>
              <Text
                style={styles.eyebrow}
              >
                TECH · LEVEL 1
              </Text>

              <Text
                style={styles.title}
              >
                Gear Machine
              </Text>
            </View>
          </View>

          <Pressable
            onPress={reset}
            style={({ pressed }) => [
              styles.reset,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={styles.resetText}
            >
              RESET
            </Text>
          </Pressable>
        </View>

        <View
          style={styles.instruction}
        >
          <Text
            style={styles.instructionTitle}
          >
            Build the machine
          </Text>

          <Text
            style={styles.instructionText}
          >
            {message}
          </Text>
        </View>

        <View
          style={styles.game}
        >
          <GLView
            style={styles.gl}
            onContextCreate={
              onContextCreate
            }
            onStartShouldSetResponder={() =>
              true
            }
            onMoveShouldSetResponder={() =>
              true
            }
            onResponderGrant={
              startDrag
            }
            onResponderMove={
              moveDrag
            }
            onResponderRelease={
              finishDrag
            }
            onResponderTerminate={
              finishDrag
            }
          />

          <View
            pointerEvents="none"
            style={styles.hint}
          >
            <Text
              style={styles.hintText}
            >
              DRAG THE REAL PARTS
            </Text>
          </View>
        </View>

        <View
          style={styles.bottom}
        >
          <View
            style={styles.statusRow}
          >
            {(
              [
                'bigGear',
                'smallGear',
                'shaft',
              ] as PartId[]
            ).map((id) => (
              <View
                key={id}
                style={styles.status}
              >
                <View
                  style={[
                    styles.dot,
                    placed[id] &&
                      styles.dotDone,
                  ]}
                />

                <Text
                  style={styles.statusText}
                >
                  {LABEL[id]}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            disabled={
              !allPlaced ||
              running
            }
            onPress={
              runMachine
            }
            style={({ pressed }) => [
              styles.run,
              (!allPlaced ||
                running) &&
                styles.runDisabled,
              pressed &&
                allPlaced &&
                !running &&
                styles.runPressed,
            ]}
          >
            <Text
              style={[
                styles.runText,
                (!allPlaced ||
                  running) &&
                  styles.runTextDisabled,
              ]}
            >
              {running
                ? 'MACHINE RUNNING'
                : allPlaced
                  ? 'RUN MACHINE'
                  : 'PLACE ALL PARTS'}
            </Text>
          </Pressable>
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
    backgroundColor:
      COLORS.background,
  },

  header: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: COLORS.charcoal,
    fontSize: 32,
    lineHeight: 34,
    marginTop: -3,
  },

  eyebrow: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  title: {
    color: COLORS.charcoal,
    fontSize: 22,
    fontWeight: '900',
  },

  reset: {
    height: 38,
    minWidth: 70,
    paddingHorizontal: 14,
    borderRadius: 19,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  pressed: {
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  instruction: {
    marginHorizontal: 18,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 17,
    backgroundColor:
      COLORS.softPurple,
    borderWidth: 1,
    borderColor:
      '#E2D8F2',
  },

  instructionTitle: {
    color: COLORS.charcoal,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },

  instructionText: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
  },

  game: {
    flex: 1,
    minHeight: 300,
    marginHorizontal: 10,
    overflow: 'hidden',
    borderRadius: 26,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.paper,
  },

  gl: {
    flex: 1,
  },

  hint: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor:
      'rgba(255,253,251,0.88)',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  hintText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  bottom: {
    paddingHorizontal: 16,
    paddingTop: 9,
    paddingBottom: 12,
  },

  statusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 17,
    marginBottom: 9,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor:
      COLORS.border,
  },

  dotDone: {
    backgroundColor:
      COLORS.mint,
  },

  statusText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  run: {
    height: 52,
    borderRadius: 18,
    backgroundColor:
      COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  runPressed: {
    backgroundColor:
      COLORS.purpleDark,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  runDisabled: {
    backgroundColor:
      '#E8E1EC',
  },

  runText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },

  runTextDisabled: {
    color: COLORS.muted,
  },
});
