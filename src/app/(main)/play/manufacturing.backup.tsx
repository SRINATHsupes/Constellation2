import { GLView } from 'expo-gl';
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

type Point3 = {
  x: number;
  y: number;
  z: number;
};

type Level = {
  id: number;
  title: string;
  lesson: string;
  parts: PartId[];
};

const COLORS = {
  background: '#FFF9F5',
  paper: '#FFFDFB',
  charcoal: '#34313A',
  muted: '#817985',
  purple: '#8B6FC7',
  purpleDark: '#7655B5',
  lavender: '#9B83D7',
  peach: '#F2B38F',
  sky: '#82B8E8',
  yellow: '#F2C96D',
  border: '#E8DDE7',
  softPurple: '#EEE7FA',
  softBlue: '#E8F2FC',
};

const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Basic Gears',
    lesson: 'Place the big gear on its matching socket.',
    parts: ['bigGear'],
  },
  {
    id: 2,
    title: 'Gear Pair',
    lesson: 'Connect the big and small gears.',
    parts: ['bigGear', 'smallGear'],
  },
  {
    id: 3,
    title: 'Belt & Pulley',
    lesson: 'Add the shaft to transfer the motion.',
    parts: ['smallGear', 'shaft'],
  },
  {
    id: 4,
    title: 'Transmission',
    lesson: 'Assemble all three machine parts.',
    parts: ['bigGear', 'smallGear', 'shaft'],
  },
  {
    id: 5,
    title: 'Complete Machine',
    lesson: 'Build everything, then run the machine.',
    parts: ['bigGear', 'smallGear', 'shaft'],
  },
];

const TARGETS: Record<PartId, Point3> = {
  bigGear: { x: -1.35, y: 0.25, z: 0.35 },
  smallGear: { x: 1.25, y: 0.25, z: 0.35 },
  shaft: { x: 0, y: -0.85, z: 0.35 },
};

const TRAY_POSITIONS: Record<PartId, Point3> = {
  bigGear: { x: -2.25, y: 2.0, z: 0.5 },
  smallGear: { x: 0, y: 2.0, z: 0.5 },
  shaft: { x: 2.25, y: 2.0, z: 0.5 },
};

const PART_LABELS: Record<PartId, string> = {
  bigGear: 'BIG GEAR',
  smallGear: 'SMALL GEAR',
  shaft: 'SHAFT',
};

function createGearGeometry(
  outerRadius: number,
  innerRadius: number,
  teeth: number,
  depth: number,
) {
  const shape = new THREE.Shape();
  const points = teeth * 4;

  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const phase = i % 4;
    const radius =
      phase === 0 || phase === 3
        ? innerRadius
        : outerRadius;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.06,
    bevelThickness: 0.05,
  });

  geometry.center();
  return geometry;
}

function material(
  color: string,
  metalness = 0.2,
  roughness = 0.45,
) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });
}

function box(
  parent: THREE.Object3D,
  size: Point3,
  position: Point3,
  color: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(size.x, size.y, size.z),
    material(color, 0.08, 0.6),
  );

  mesh.position.set(
    position.x,
    position.y,
    position.z,
  );

  parent.add(mesh);
  return mesh;
}

function createGear(
  radius: number,
  teeth: number,
  color: string,
) {
  return new THREE.Mesh(
    createGearGeometry(
      radius,
      radius * 0.78,
      teeth,
      0.28,
    ),
    material(color, 0.7, 0.25),
  );
}

function createHub(
  radius: number,
  color: string,
) {
  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius,
      0.18,
      32,
    ),
    material(color, 0.8, 0.2),
  );

  hub.rotation.x = Math.PI / 2;
  return hub;
}

function createShaft() {
  const group = new THREE.Group();

  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.13,
      0.13,
      2.7,
      32,
    ),
    material(COLORS.peach, 0.8, 0.22),
  );

  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  const endA = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.2,
      0.2,
      0.18,
      32,
    ),
    material('#D9966D', 0.75, 0.25),
  );

  endA.rotation.z = Math.PI / 2;
  endA.position.x = -1.3;

  const endB = endA.clone();
  endB.position.x = 1.3;

  group.add(endA);
  group.add(endB);

  return group;
}

function createPart(part: PartId) {
  const group = new THREE.Group();

  if (part === 'bigGear') {
    group.add(
      createGear(0.68, 12, COLORS.lavender),
    );
    group.add(
      createHub(0.18, COLORS.purple),
    );
  }

  if (part === 'smallGear') {
    group.add(
      createGear(0.48, 10, COLORS.sky),
    );
    group.add(
      createHub(0.14, '#6B9FCF'),
    );
  }

  if (part === 'shaft') {
    group.add(createShaft());
  }

  group.userData.partId = part;
  return group;
}

function createSocket(
  position: Point3,
  radius: number,
  color: string,
) {
  const group = new THREE.Group();

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      radius,
      0.06,
      14,
      56,
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.95,
    }),
  );

  const inner = new THREE.Mesh(
    new THREE.RingGeometry(
      radius * 0.55,
      radius * 0.72,
      40,
    ),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.16,
      side: THREE.DoubleSide,
    }),
  );

  group.add(ring);
  group.add(inner);

  group.position.set(
    position.x,
    position.y,
    position.z,
  );

  return group;
}

function createWorkshop(scene: THREE.Scene) {
  const room = new THREE.Group();

  box(
    room,
    { x: 6.4, y: 3.8, z: 0.24 },
    { x: 0, y: -0.1, z: -0.9 },
    '#F1ECFA',
  );

  box(
    room,
    { x: 6.8, y: 0.22, z: 2.8 },
    { x: 0, y: -1.65, z: 0 },
    '#F8E8DD',
  );

  box(
    room,
    { x: 0.25, y: 3.35, z: 0.32 },
    { x: -3.05, y: -0.05, z: 0 },
    '#EBCFBD',
  );

  box(
    room,
    { x: 0.25, y: 3.35, z: 0.32 },
    { x: 3.05, y: -0.05, z: 0 },
    '#EBCFBD',
  );

  box(
    room,
    { x: 6.1, y: 0.25, z: 0.32 },
    { x: 0, y: 1.58, z: 0 },
    '#EBCFBD',
  );

  box(
    room,
    { x: 6.1, y: 0.25, z: 0.32 },
    { x: 0, y: -1.35, z: 0 },
    '#EBCFBD',
  );

  box(
    room,
    { x: 0.2, y: 2.7, z: 0.3 },
    { x: 0, y: 0.05, z: -0.05 },
    '#DCCFF4',
  );

  box(
    room,
    { x: 1.55, y: 0.22, z: 0.5 },
    { x: -1.35, y: -1.25, z: 0.15 },
    '#DCCFF4',
  );

  box(
    room,
    { x: 1.25, y: 0.22, z: 0.5 },
    { x: 1.25, y: -1.25, z: 0.15 },
    '#DCCFF4',
  );

  scene.add(room);

  const tray = new THREE.Group();

  box(
    tray,
    { x: 6.5, y: 0.12, z: 1.15 },
    { x: 0, y: 2.05, z: 0.15 },
    '#EEE7FA',
  );

  box(
    tray,
    { x: 6.5, y: 0.15, z: 0.18 },
    { x: 0, y: 2.62, z: 0.2 },
    '#E8DDE7',
  );

  scene.add(tray);
}

export default function ManufacturingScreen() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [placed, setPlaced] =
    useState<Record<PartId, boolean>>({
      bigGear: false,
      smallGear: false,
      shaft: false,
    });
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(
    LEVELS[0].lesson,
  );

  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef =
    useRef<THREE.WebGLRenderer | null>(null);
  const objectsRef =
    useRef<Partial<Record<PartId, THREE.Group>>>({});
  const targetsRef =
    useRef<Partial<Record<PartId, THREE.Group>>>({});
  const raycasterRef =
    useRef(new THREE.Raycaster());
  const pointerRef =
    useRef(new THREE.Vector2());
  const dragPartRef =
    useRef<PartId | null>(null);
  const dragPlaneRef =
    useRef(new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      0,
    ));
  const dragOffsetRef =
    useRef(new THREE.Vector3());
  const viewportRef =
    useRef({ width: 1, height: 1 });
  const placedRef = useRef(placed);
  const runningRef = useRef(running);

  const level = LEVELS[levelIndex];

  useEffect(() => {
    placedRef.current = placed;
  }, [placed]);

  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  const resetObjects = () => {
    (
      Object.keys(TRAY_POSITIONS) as PartId[]
    ).forEach((part) => {
      const object = objectsRef.current[part];

      if (!object) return;

      object.position.set(
        TRAY_POSITIONS[part].x,
        TRAY_POSITIONS[part].y,
        TRAY_POSITIONS[part].z,
      );

      object.rotation.set(0, 0, 0);
      object.visible =
        level.parts.includes(part);
    });

    (
      Object.keys(TARGETS) as PartId[]
    ).forEach((part) => {
      const target = targetsRef.current[part];

      if (!target) return;

      target.visible =
        level.parts.includes(part);
    });
  };

  useEffect(() => {
    const empty = {
      bigGear: false,
      smallGear: false,
      shaft: false,
    };

    setPlaced(empty);
    placedRef.current = empty;
    setRunning(false);
    runningRef.current = false;
    setMessage(level.lesson);

    requestAnimationFrame(resetObjects);
  }, [levelIndex]);

  const onContextCreate = async (gl: any) => {
    const width = gl.drawingBufferWidth;
    const height = gl.drawingBufferHeight;

    viewportRef.current = {
      width,
      height,
    };

    const scene = new THREE.Scene();
    scene.background =
      new THREE.Color(COLORS.background);

    const camera =
      new THREE.PerspectiveCamera(
        48,
        width / height,
        0.1,
        100,
      );

    camera.position.set(
      0,
      0.25,
      10.5,
    );

    camera.lookAt(0, 0.45, 0);
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

    renderer.setPixelRatio(1);
    rendererRef.current = renderer;

    scene.add(
      new THREE.HemisphereLight(
        '#FFFFFF',
        '#D9CBE8',
        2.4,
      ),
    );

    const directional =
      new THREE.DirectionalLight(
        '#FFFFFF',
        3.2,
      );

    directional.position.set(
      -4,
      6,
      8,
    );

    scene.add(directional);

    const point =
      new THREE.PointLight(
        COLORS.purple,
        3.5,
        14,
      );

    point.position.set(
      0,
      2.5,
      5,
    );

    scene.add(point);

    createWorkshop(scene);

    (
      Object.keys(TRAY_POSITIONS) as PartId[]
    ).forEach((part) => {
      const object = createPart(part);

      const position =
        TRAY_POSITIONS[part];

      object.position.set(
        position.x,
        position.y,
        position.z,
      );

      object.visible =
        LEVELS[0].parts.includes(part);

      scene.add(object);
      objectsRef.current[part] = object;
    });

    (
      Object.keys(TARGETS) as PartId[]
    ).forEach((part) => {
      const radius =
        part === 'shaft'
          ? 0.85
          : part === 'bigGear'
            ? 0.78
            : 0.57;

      const target = createSocket(
        TARGETS[part],
        radius,
        part === 'shaft'
          ? COLORS.peach
          : COLORS.purple,
      );

      target.visible =
        LEVELS[0].parts.includes(part);

      scene.add(target);
      targetsRef.current[part] = target;
    });

    const installedBig = new THREE.Group();
    installedBig.add(
      createGear(
        0.82,
        12,
        COLORS.lavender,
      ),
    );
    installedBig.add(
      createHub(0.2, COLORS.purple),
    );
    installedBig.position.set(
      TARGETS.bigGear.x,
      TARGETS.bigGear.y,
      TARGETS.bigGear.z,
    );
    installedBig.visible = false;
    scene.add(installedBig);

    const installedSmall = new THREE.Group();
    installedSmall.add(
      createGear(
        0.57,
        10,
        COLORS.sky,
      ),
    );
    installedSmall.add(
      createHub(
        0.15,
        '#6B9FCF',
      ),
    );
    installedSmall.position.set(
      TARGETS.smallGear.x,
      TARGETS.smallGear.y,
      TARGETS.smallGear.z,
    );
    installedSmall.visible = false;
    scene.add(installedSmall);

    const installedShaft =
      createShaft();

    installedShaft.position.set(
      TARGETS.shaft.x,
      TARGETS.shaft.y,
      TARGETS.shaft.z,
    );

    installedShaft.visible = false;
    scene.add(installedShaft);

    const installed: Record<
      PartId,
      THREE.Group
    > = {
      bigGear: installedBig,
      smallGear: installedSmall,
      shaft: installedShaft,
    };

    const animate = () => {
      requestAnimationFrame(animate);

      const now = performance.now();

      (
        Object.keys(TRAY_POSITIONS) as PartId[]
      ).forEach((part) => {
        const object =
          objectsRef.current[part];

        if (
          !object ||
          placedRef.current[part]
        ) {
          return;
        }

        if (
          !level.parts.includes(part)
        ) {
          object.visible = false;
          return;
        }

        object.visible = true;

        const base =
          TRAY_POSITIONS[part];

        object.position.y =
          base.y +
          Math.sin(
            now / 500 +
            (
              Object.keys(
                TRAY_POSITIONS,
              ) as PartId[]
            ).indexOf(part),
          ) * 0.045;
      });

      (
        Object.keys(TARGETS) as PartId[]
      ).forEach((part) => {
        const target =
          targetsRef.current[part];

        if (!target) return;

        if (
          placedRef.current[part] ||
          !level.parts.includes(part)
        ) {
          target.visible = false;
          return;
        }

        target.visible = true;

        const pulse =
          1 +
          Math.sin(now / 180) *
          0.08;

        target.scale.set(
          pulse,
          pulse,
          pulse,
        );

        target.rotation.z =
          now / 1800;
      });

      if (runningRef.current) {
        installed.bigGear.rotation.z += 0.028;
        installed.smallGear.rotation.z -= 0.041;
        installed.shaft.rotation.x += 0.06;
      }

      renderer.render(scene, camera);
      gl.endFrameEXP();
    };

    animate();
  };

  const screenToRay = (
    x: number,
    y: number,
  ) => {
    const camera = cameraRef.current;
    const { width, height } =
      viewportRef.current;

    if (
      !camera ||
      width <= 0 ||
      height <= 0
    ) {
      return null;
    }

    pointerRef.current.set(
      (x / width) * 2 - 1,
      -(y / height) * 2 + 1,
    );

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    return raycasterRef.current;
  };

  const pointerPosition = (
    event: any,
  ) => {
    const native =
      event?.nativeEvent ?? event;

    return {
      x:
        native?.locationX ??
        native?.offsetX ??
        native?.clientX ??
        native?.pageX ??
        0,
      y:
        native?.locationY ??
        native?.offsetY ??
        native?.clientY ??
        native?.pageY ??
        0,
    };
  };

  const findPart = (
    object: THREE.Object3D,
  ): PartId | null => {
    const parts =
      level.parts;

    for (const part of parts) {
      const root =
        objectsRef.current[part];

      if (!root) continue;

      let current:
        | THREE.Object3D
        | null = object;

      while (current) {
        if (current === root) {
          return part;
        }

        current = current.parent;
      }
    }

    return null;
  };

  const handleTouchStart = (
    event: any,
  ) => {
    const { x, y } =
      pointerPosition(event);

    const ray = screenToRay(x, y);

    if (!ray) return;

    const objects =
      level.parts
        .map(
          (part) =>
            objectsRef.current[part],
        )
        .filter(
          (
            object,
          ): object is THREE.Group =>
            Boolean(object),
        )
        .filter(
          (object) => object.visible,
        );

    const hits =
      ray.intersectObjects(
        objects,
        true,
      );

    if (!hits.length) {
      dragPartRef.current = null;
      return;
    }

    const part =
      findPart(hits[0].object);

    if (!part) return;

    const object =
      objectsRef.current[part];

    if (!object) return;

    dragPartRef.current = part;

    const camera =
      cameraRef.current;

    if (!camera) return;

    const normal =
      new THREE.Vector3();

    camera.getWorldDirection(normal);

    dragPlaneRef.current
      .setFromNormalAndCoplanarPoint(
        normal,
        object.position,
      );

    const hitPoint =
      new THREE.Vector3();

    if (
      ray.ray.intersectPlane(
        dragPlaneRef.current,
        hitPoint,
      )
    ) {
      dragOffsetRef.current
        .copy(object.position)
        .sub(hitPoint);
    }

    setMessage(
      `Move ${PART_LABELS[part]} to its socket.`,
    );
  };

  const handleTouchMove = (
    event: any,
  ) => {
    const part =
      dragPartRef.current;

    if (!part) return;

    const { x, y } =
      pointerPosition(event);

    const ray = screenToRay(x, y);

    if (!ray) return;

    const point =
      new THREE.Vector3();

    if (
      !ray.ray.intersectPlane(
        dragPlaneRef.current,
        point,
      )
    ) {
      return;
    }

    const object =
      objectsRef.current[part];

    if (!object) return;

    object.position.copy(point);
    object.position.add(
      dragOffsetRef.current,
    );
  };

  const handleTouchEnd = (
    event: any,
  ) => {
    const part =
      dragPartRef.current;

    dragPartRef.current = null;

    if (!part) return;

    const { x, y } =
      pointerPosition(event);

    const ray = screenToRay(x, y);
    const object =
      objectsRef.current[part];

    if (!ray || !object) return;

    const point =
      new THREE.Vector3();

    const hit =
      ray.ray.intersectPlane(
        dragPlaneRef.current,
        point,
      );

    const target =
      TARGETS[part];

    const distance =
      hit
        ? point.distanceTo(
            new THREE.Vector3(
              target.x,
              target.y,
              target.z,
            ),
          )
        : Infinity;

    if (distance < 1.35) {
      object.position.set(
        target.x,
        target.y,
        target.z,
      );

      object.rotation.set(0, 0, 0);

      setPlaced((current) => ({
        ...current,
        [part]: true,
      }));

      placedRef.current = {
        ...placedRef.current,
        [part]: true,
      };

      const completed =
        level.parts.every(
          (item) =>
            placedRef.current[item],
        );

      if (completed) {
        setMessage(
          'Build complete! Press RUN MACHINE.',
        );
      } else {
        setMessage(
          'Good! Grab the next part.',
        );
      }
    } else {
      const tray =
        TRAY_POSITIONS[part];

      object.position.set(
        tray.x,
        tray.y,
        tray.z,
      );

      object.rotation.set(0, 0, 0);

      setMessage(
        'Try the glowing socket.',
      );
    }
  };

  const runMachine = () => {
    const complete =
      level.parts.every(
        (part) => placed[part],
      );

    if (!complete) {
      setMessage(
        'Finish the build first.',
      );
      return;
    }

    runningRef.current = true;
    setRunning(true);
    setMessage(
      'Machine running! Watch the motion.',
    );
  };

  const resetLevel = () => {
    const empty = {
      bigGear: false,
      smallGear: false,
      shaft: false,
    };

    setPlaced(empty);
    placedRef.current = empty;
    runningRef.current = false;
    setRunning(false);
    setMessage(level.lesson);

    (
      Object.keys(TRAY_POSITIONS) as PartId[]
    ).forEach((part) => {
      const object =
        objectsRef.current[part];

      if (!object) return;

      const position =
        TRAY_POSITIONS[part];

      object.position.set(
        position.x,
        position.y,
        position.z,
      );

      object.rotation.set(0, 0, 0);
      object.visible =
        level.parts.includes(part);
    });

    (
      Object.keys(TARGETS) as PartId[]
    ).forEach((part) => {
      const target =
        targetsRef.current[part];

      if (!target) return;

      target.visible =
        level.parts.includes(part);
    });
  };

  const nextLevel = () => {
    if (
      levelIndex <
      LEVELS.length - 1
    ) {
      setLevelIndex(
        (current) => current + 1,
      );
      return;
    }

    setMessage(
      'You completed the Tech Lab!',
    );
  };

  const previousLevel = () => {
    if (levelIndex > 0) {
      setLevelIndex(
        (current) => current - 1,
      );
    }
  };

  const placedCount =
    level.parts.filter(
      (part) => placed[part],
    ).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>
              TECH LAB
            </Text>

            <Text style={styles.title}>
              {level.title}
            </Text>
          </View>

          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>
              {level.id}/5
            </Text>
          </View>
        </View>

        <View style={styles.lessonBar}>
          <View style={styles.lessonDot} />
          <Text style={styles.lessonText}>
            {level.lesson}
          </Text>
        </View>

        <View
          style={styles.sceneWrapper}
          onLayout={(event) => {
            viewportRef.current = {
              width:
                event.nativeEvent.layout.width,
              height:
                event.nativeEvent.layout.height,
            };
          }}
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
              handleTouchStart
            }
            onResponderMove={
              handleTouchMove
            }
            onResponderRelease={
              handleTouchEnd
            }
            onResponderTerminate={
              handleTouchEnd
            }
          />

          <View
            pointerEvents="none"
            style={styles.sceneHint}
          >
            <Text style={styles.sceneHintText}>
              {message}
            </Text>
          </View>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {placedCount}/{level.parts.length} parts
          </Text>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width:
                    `${Math.max(
                      0,
                      Math.min(
                        100,
                        (placedCount /
                          level.parts.length) *
                          100,
                      ),
                    )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.controls}>
          <Pressable
            onPress={runMachine}
            style={[
              styles.runButton,
              placedCount !==
                level.parts.length &&
                styles.disabledButton,
            ]}
          >
            <Text style={styles.runText}>
              {running
                ? '⚙  RUNNING'
                : '▶  RUN MACHINE'}
            </Text>
          </Pressable>

          <View style={styles.secondaryRow}>
            <Pressable
              onPress={previousLevel}
              disabled={levelIndex === 0}
              style={[
                styles.smallButton,
                levelIndex === 0 &&
                  styles.disabledSmallButton,
              ]}
            >
              <Text style={styles.smallButtonText}>
                ←
              </Text>
            </Pressable>

            <Pressable
              onPress={resetLevel}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>
                RESET
              </Text>
            </Pressable>

            <Pressable
              onPress={nextLevel}
              disabled={
                placedCount !==
                level.parts.length
              }
              style={[
                styles.smallButton,
                placedCount !==
                  level.parts.length &&
                  styles.disabledSmallButton,
              ]}
            >
              <Text style={styles.smallButtonText}>
                {levelIndex ===
                LEVELS.length - 1
                  ? '✓'
                  : '→'}
              </Text>
            </Pressable>
          </View>
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
    paddingHorizontal: 14,
    paddingTop: 6,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    marginBottom: 8,
  },

  headerText: {
    flex: 1,
  },

  kicker: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },

  title: {
    color: COLORS.charcoal,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 2,
  },

  levelBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor:
      COLORS.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginLeft: 10,
  },

  levelBadgeText: {
    color: COLORS.purpleDark,
    fontSize: 15,
    fontWeight: '900',
  },

  lessonBar: {
    height: 34,
    borderRadius: 17,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 7,
  },

  lessonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor:
      COLORS.purple,
    marginRight: 8,
  },

  lessonText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  sceneWrapper: {
    flex: 1,
    minHeight: 300,
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor:
      COLORS.background,
  },

  gl: {
    flex: 1,
  },

  sceneHint: {
    position: 'absolute',
    left: 12,
    right: 12,
    top: 12,
    alignItems: 'center',
  },

  sceneHintText: {
    backgroundColor:
      'rgba(255,253,251,0.94)',
    color: COLORS.charcoal,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 15,
    fontSize: 11,
    fontWeight: '800',
    overflow: 'hidden',
    textAlign: 'center',
  },

  progressRow: {
    paddingTop: 8,
    paddingBottom: 3,
  },

  progressText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    marginBottom: 4,
  },

  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor:
      COLORS.softPurple,
    overflow: 'hidden',
  },

  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor:
      COLORS.purple,
  },

  controls: {
    paddingTop: 6,
    paddingBottom: 6,
  },

  runButton: {
    height: 50,
    borderRadius: 17,
    backgroundColor:
      COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  runText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },

  smallButton: {
    width: 46,
    height: 34,
    borderRadius: 12,
    backgroundColor:
      COLORS.softPurple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  disabledSmallButton: {
    opacity: 0.35,
  },

  smallButtonText: {
    color: COLORS.purpleDark,
    fontSize: 18,
    fontWeight: '900',
  },

  resetButton: {
    height: 34,
    flex: 1,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resetText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
