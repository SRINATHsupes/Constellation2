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

type PartId =
  | 'bigGear'
  | 'smallGear'
  | 'gearShaft'
  | 'cycleFrame'
  | 'cycleRearWheel'
  | 'cycleFrontWheel'
  | 'cycleHandle'
  | 'cycleSeat'
  | 'cyclePedal'
  | 'motor'
  | 'motorGear'
  | 'motorShaft'
  | 'motorHousing'
  | 'bikeFrame'
  | 'bikeRearWheel'
  | 'bikeFrontWheel'
  | 'bikeHandle'
  | 'bikeSeat'
  | 'bikeEngine'
  | 'bikeExhaust'
  | 'robotBase'
  | 'robotTorso'
  | 'robotShoulder'
  | 'robotUpperArm'
  | 'robotForearm'
  | 'robotWrist'
  | 'robotHead'
  | 'robotGripper';

type Mission = {
  id: number;
  title: string;
  subtitle: string;
  parts: PartId[];
};

const COLORS = {
  bg: '#FFF9F5',
  panel: '#FFFDFB',
  text: '#34313A',
  muted: '#817985',
  purple: '#8B6FC7',
  purpleDark: '#7655B5',
  blue: '#82B8E8',
  yellow: '#F2C96D',
  mint: '#86CDB1',
  orange: '#E99A65',
  metal: '#A9A3AE',
  silver: '#D9D5DC',
  dark: '#403B45',
  rubber: '#28252C',
  red: '#D96C65',
  green: '#6EAF91',
  border: '#E8DDE7',
};

const MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'GEAR WORKSHOP',
    subtitle: 'Connect gears and transfer motion',
    parts: ['bigGear', 'smallGear', 'gearShaft'],
  },
  {
    id: 2,
    title: 'BICYCLE WORKSHOP',
    subtitle: 'Build a bicycle from real parts',
    parts: [
      'cycleFrame',
      'cycleRearWheel',
      'cycleFrontWheel',
      'cycleHandle',
      'cycleSeat',
      'cyclePedal',
    ],
  },
  {
    id: 3,
    title: 'MOTOR LAB',
    subtitle: 'Turn electrical power into motion',
    parts: ['motor', 'motorGear', 'motorShaft', 'motorHousing'],
  },
  {
    id: 4,
    title: 'MOTORCYCLE WORKSHOP',
    subtitle: 'Assemble a complete machine',
    parts: [
      'bikeFrame',
      'bikeRearWheel',
      'bikeFrontWheel',
      'bikeHandle',
      'bikeSeat',
      'bikeEngine',
      'bikeExhaust',
    ],
  },
  {
    id: 5,
    title: 'ADVANCED ROBOT LAB',
    subtitle: 'Build an articulated robotic arm',
    parts: [
      'robotBase',
      'robotTorso',
      'robotShoulder',
      'robotUpperArm',
      'robotForearm',
      'robotWrist',
      'robotHead',
      'robotGripper',
    ],
  },
];

function material(color: string, metalness = 0, roughness = 0.65) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });
}

function cube(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  color: string,
) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material(color),
  );
  m.position.set(x, y, z);
  return m;
}

function cyl(
  x: number,
  y: number,
  z: number,
  radius: number,
  depth: number,
  color: string,
  rotationX = 0,
  rotationY = 0,
  rotationZ = 0,
) {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, depth, 24),
    material(color, 0.15, 0.45),
  );

  m.position.set(x, y, z);
  m.rotation.set(rotationX, rotationY, rotationZ);

  return m;
}

function torus(
  x: number,
  y: number,
  z: number,
  radius: number,
  tube: number,
  color: string,
  rotationX = Math.PI / 2,
) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 12, 32),
    material(color, 0.1, 0.6),
  );

  m.position.set(x, y, z);
  m.rotation.x = rotationX;

  return m;
}

function gear(
  x: number,
  y: number,
  z: number,
  radius: number,
  teeth: number,
  color: string,
) {
  const group = new THREE.Group();
  group.position.set(x, y, z);

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.22, 32),
    material(color, 0.25, 0.4),
  );
  disc.rotation.x = Math.PI / 2;
  group.add(disc);

  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = cube(
      Math.cos(a) * (radius + 0.10),
      Math.sin(a) * (radius + 0.10),
      0,
      0.18,
      0.25,
      0.24,
      color,
    );
    tooth.rotation.z = a;
    group.add(tooth);
  }

  const hole = new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius * 0.22,
      radius * 0.22,
      0.28,
      20,
    ),
    material(COLORS.dark, 0.4, 0.35),
  );
  hole.rotation.x = Math.PI / 2;
  group.add(hole);

  return group;
}

function wheel(radius = 0.58, tire = 0.12) {
  const group = new THREE.Group();

  const tyre = torus(
    0,
    0,
    0,
    radius,
    tire,
    COLORS.rubber,
  );

  group.add(tyre);

  const hub = cyl(
    0,
    0,
    0,
    0.10,
    0.18,
    COLORS.silver,
    Math.PI / 2,
  );

  group.add(hub);

  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2;

    const spoke = cube(
      Math.cos(a) * radius * 0.48,
      Math.sin(a) * radius * 0.48,
      0,
      radius * 0.78,
      0.018,
      0.018,
      COLORS.silver,
    );

    spoke.rotation.z = a;
    group.add(spoke);
  }

  return group;
}

/* ---------------- GEAR ---------------- */

function makeGearPart(id: PartId, ghost = false) {
  if (id === 'bigGear') {
    return gear(
      0,
      0,
      0,
      0.62,
      12,
      ghost ? '#D7CBE9' : COLORS.purple,
    );
  }

  if (id === 'smallGear') {
    return gear(
      0,
      0,
      0,
      0.38,
      10,
      ghost ? '#D7CBE9' : COLORS.blue,
    );
  }

  return cyl(
    0,
    0,
    0,
    0.10,
    1.35,
    ghost ? '#D7CBE9' : COLORS.metal,
    0,
    Math.PI / 2,
  );
}

/* ---------------- BICYCLE ---------------- */

function bicycleFrame(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.purple;

  const rear = new THREE.Vector3(-0.78, 0, 0);
  const crank = new THREE.Vector3(0.05, 0.05, 0);
  const front = new THREE.Vector3(0.78, 0.18, 0);
  const seat = new THREE.Vector3(-0.30, 0.78, 0);
  const head = new THREE.Vector3(0.52, 0.68, 0);

  const addTube = (
    a: THREE.Vector3,
    b: THREE.Vector3,
    thickness: number,
  ) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const len = a.distanceTo(b);

    const tube = cube(
      mid.x,
      mid.y,
      mid.z,
      thickness,
      len,
      thickness,
      c,
    );

    tube.rotation.z = Math.atan2(
      b.y - a.y,
      b.x - a.x,
    ) - Math.PI / 2;

    g.add(tube);
  };

  addTube(rear, crank, 0.10);
  addTube(crank, seat, 0.10);
  addTube(seat, rear, 0.10);
  addTube(crank, head, 0.10);
  addTube(head, front, 0.10);
  addTube(rear, seat, 0.08);

  return g;
}

function bicycleHandle(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.dark;

  const stem = cube(
    0,
    0,
    0,
    0.07,
    0.58,
    0.07,
    c,
  );

  stem.rotation.z = -0.25;
  g.add(stem);

  const bar = cube(
    0.02,
    0.30,
    0,
    0.58,
    0.07,
    0.07,
    c,
  );

  g.add(bar);

  return g;
}

function bicycleSeat(ghost = false) {
  const g = new THREE.Group();

  g.add(
    cube(
      0,
      0,
      0,
      0.10,
      0.48,
      0.08,
      ghost ? '#D9D0E8' : COLORS.dark,
    ),
  );

  g.add(
    cube(
      0,
      0.24,
      0,
      0.48,
      0.10,
      0.25,
      ghost ? '#D9D0E8' : COLORS.rubber,
    ),
  );

  return g;
}

function bicyclePedal(ghost = false) {
  const g = new THREE.Group();

  g.add(
    cyl(
      0,
      0,
      0,
      0.09,
      0.25,
      ghost ? '#D9D0E8' : COLORS.metal,
      0,
      Math.PI / 2,
    ),
  );

  g.add(
    cube(
      0.20,
      0,
      0,
      0.38,
      0.07,
      0.10,
      ghost ? '#D9D0E8' : COLORS.dark,
    ),
  );

  return g;
}

/* ---------------- MOTOR ---------------- */

function motorPart(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.dark;

  g.add(
    cyl(
      0,
      0,
      0,
      0.42,
      0.85,
      c,
      0,
      Math.PI / 2,
    ),
  );

  for (let i = -2; i <= 2; i += 1) {
    const rib = cube(
      i * 0.13,
      0,
      0,
      0.035,
      0.72,
      0.56,
      ghost ? '#D9D0E8' : COLORS.metal,
    );

    g.add(rib);
  }

  g.add(
    cyl(
      0.48,
      0,
      0,
      0.13,
      0.28,
      ghost ? '#D9D0E8' : COLORS.silver,
      0,
      Math.PI / 2,
    ),
  );

  return g;
}

/* ---------------- MOTORCYCLE ---------------- */

function motorcycleFrame(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.red;

  const add = (
    x: number,
    y: number,
    len: number,
    angle: number,
  ) => {
    const bar = cube(
      x,
      y,
      0,
      0.13,
      len,
      0.13,
      c,
    );

    bar.rotation.z = angle;
    g.add(bar);
  };

  add(-0.45, 0.22, 0.95, -0.45);
  add(0.28, 0.40, 0.80, 0.75);
  add(0.05, -0.12, 0.90, 0.15);
  add(-0.45, -0.05, 0.75, -1.25);

  return g;
}

function motorcycleEngine(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.dark;

  g.add(
    cube(
      0,
      0,
      0,
      0.62,
      0.55,
      0.48,
      c,
    ),
  );

  g.add(
    cyl(
      0,
      0.18,
      0,
      0.22,
      0.52,
      ghost ? '#D9D0E8' : COLORS.metal,
      Math.PI / 2,
    ),
  );

  g.add(
    cube(
      0,
      -0.25,
      0,
      0.45,
      0.08,
      0.55,
      ghost ? '#D9D0E8' : COLORS.silver,
    ),
  );

  return g;
}

function motorcycleExhaust(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.silver;

  const pipe = cyl(
    0,
    0,
    0,
    0.09,
    1.15,
    c,
    0,
    0,
    Math.PI / 2,
  );

  g.add(pipe);

  g.add(
    cyl(
      0.62,
      0,
      0,
      0.16,
      0.38,
      c,
      0,
      0,
      Math.PI / 2,
    ),
  );

  return g;
}

/* ---------------- ADVANCED ROBOT ---------------- */

function robotBase(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.dark;

  g.add(
    cylinderBase(
      0,
      0,
      0,
      0.65,
      0.28,
      c,
    ),
  );

  g.add(
    torus(
      0,
      0.16,
      0,
      0.50,
      0.07,
      ghost ? '#D9D0E8' : COLORS.mint,
      0,
    ),
  );

  return g;
}

function cylinderBase(
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  color: string,
) {
  return cyl(
    x,
    y,
    z,
    r,
    h,
    color,
  );
}

function robotTorso(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.blue;

  g.add(
    cube(
      0,
      0,
      0,
      0.80,
      0.95,
      0.58,
      c,
    ),
  );

  g.add(
    cube(
      0,
      0.08,
      0.31,
      0.38,
      0.48,
      0.05,
      ghost ? '#D9D0E8' : COLORS.dark,
    ),
  );

  return g;
}

function robotShoulder(ghost = false) {
  const g = new THREE.Group();

  g.add(
    cyl(
      0,
      0,
      0,
      0.25,
      0.32,
      ghost ? '#D9D0E8' : COLORS.mint,
      0,
      Math.PI / 2,
    ),
  );

  return g;
}

function robotUpperArm(ghost = false) {
  const g = new THREE.Group();

  g.add(
    cube(
      0,
      -0.38,
      0,
      0.30,
      0.76,
      0.30,
      ghost ? '#D9D0E8' : COLORS.silver,
    ),
  );

  return g;
}

function robotForearm(ghost = false) {
  const g = new THREE.Group();

  g.add(
    cube(
      0,
      -0.38,
      0,
      0.25,
      0.76,
      0.25,
      ghost ? '#D9D0E8' : COLORS.blue,
    ),
  );

  return g;
}

function robotWrist(ghost = false) {
  return cyl(
    0,
    0,
    0,
    0.18,
    0.25,
    ghost ? '#D9D0E8' : COLORS.mint,
    0,
    Math.PI / 2,
  );
}

function robotHead(ghost = false) {
  const g = new THREE.Group();

  g.add(
    cube(
      0,
      0,
      0,
      0.62,
      0.52,
      0.55,
      ghost ? '#D9D0E8' : COLORS.dark,
    ),
  );

  g.add(
    cube(
      0,
      -0.02,
      0.29,
      0.42,
      0.18,
      0.05,
      ghost ? '#D9D0E8' : COLORS.mint,
    ),
  );

  g.add(
    cube(
      -0.15,
      -0.02,
      0.33,
      0.07,
      0.07,
      0.05,
      ghost ? '#D9D0E8' : COLORS.yellow,
    ),
  );

  g.add(
    cube(
      0.15,
      -0.02,
      0.33,
      0.07,
      0.07,
      0.05,
      ghost ? '#D9D0E8' : COLORS.yellow,
    ),
  );

  return g;
}

function robotGripper(ghost = false) {
  const g = new THREE.Group();
  const c = ghost ? '#D9D0E8' : COLORS.silver;

  g.add(
    cube(
      0,
      0,
      0,
      0.20,
      0.30,
      0.20,
      c,
    ),
  );

  const left = cube(
    -0.12,
    -0.22,
    0,
    0.08,
    0.38,
    0.10,
    c,
  );

  left.rotation.z = -0.30;

  const right = cube(
    0.12,
    -0.22,
    0,
    0.08,
    0.38,
    0.10,
    c,
  );

  right.rotation.z = 0.30;

  g.add(left);
  g.add(right);

  return g;
}

/* ---------------- APP ---------------- */

export default function ManufacturingScreen() {
  const router = useRouter();

  const [missionIndex, setMissionIndex] = useState(0);
  const [placedCount, setPlacedCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [complete, setComplete] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef =
    useRef<THREE.WebGLRenderer | null>(null);
  const glRef = useRef<any>(null);

  const runtimeRef =
    useRef<Map<PartId, {
      object: THREE.Object3D;
      home: THREE.Vector3;
      target: THREE.Vector3;
      placed: boolean;
    }>>(new Map());

  const draggingRef =
    useRef<PartId | null>(null);

  const runningRef = useRef(false);
  const missionRef = useRef(0);

  const raycasterRef =
    useRef(new THREE.Raycaster());

  const pointerRef =
    useRef(new THREE.Vector2());

  const viewSizeRef =
    useRef({ width: 1, height: 1 });

  const animationRef =
    useRef<number | null>(null);

  const mission = MISSIONS[missionIndex];

  useEffect(() => {
    missionRef.current = missionIndex;
    rebuildScene();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [missionIndex]);

  function setMission(index: number) {
    runningRef.current = false;
    setRunning(false);
    setComplete(false);
    setPlacedCount(0);
    setMissionIndex(index);
  }

  function createPart(
    id: PartId,
    ghost = false,
  ): THREE.Object3D {
    switch (id) {
      case 'bigGear':
      case 'smallGear':
      case 'gearShaft':
        return makeGearPart(id, ghost);

      case 'cycleFrame':
        return bicycleFrame(ghost);

      case 'cycleRearWheel':
      case 'cycleFrontWheel':
        return wheel(
          0.58,
          0.11,
        );

      case 'cycleHandle':
        return bicycleHandle(ghost);

      case 'cycleSeat':
        return bicycleSeat(ghost);

      case 'cyclePedal':
        return bicyclePedal(ghost);

      case 'motor':
        return motorPart(ghost);

      case 'motorGear':
        return gear(
          0,
          0,
          0,
          0.36,
          10,
          ghost ? '#D9D0E8' : COLORS.yellow,
        );

      case 'motorShaft':
        return cyl(
          0,
          0,
          0,
          0.10,
          1.1,
          ghost ? '#D9D0E8' : COLORS.silver,
          0,
          Math.PI / 2,
        );

      case 'motorHousing':
        return cube(
          0,
          0,
          0,
          1.0,
          0.18,
          0.85,
          ghost ? '#D9D0E8' : COLORS.metal,
        );

      case 'bikeFrame':
        return motorcycleFrame(ghost);

      case 'bikeRearWheel':
      case 'bikeFrontWheel':
        return wheel(
          0.66,
          0.13,
        );

      case 'bikeHandle':
        return bicycleHandle(ghost);

      case 'bikeSeat':
        return bicycleSeat(ghost);

      case 'bikeEngine':
        return motorcycleEngine(ghost);

      case 'bikeExhaust':
        return motorcycleExhaust(ghost);

      case 'robotBase':
        return robotBase(ghost);

      case 'robotTorso':
        return robotTorso(ghost);

      case 'robotShoulder':
        return robotShoulder(ghost);

      case 'robotUpperArm':
        return robotUpperArm(ghost);

      case 'robotForearm':
        return robotForearm(ghost);

      case 'robotWrist':
        return robotWrist(ghost);

      case 'robotHead':
        return robotHead(ghost);

      case 'robotGripper':
        return robotGripper(ghost);

      default:
        return cube(
          0,
          0,
          0,
          0.3,
          0.3,
          0.3,
          COLORS.purple,
        );
    }
  }

  function workshop(
    scene: THREE.Scene,
  ) {
    const floor = cube(
      0,
      -2.58,
      -0.8,
      8.8,
      0.16,
      5.2,
      '#EDE3DC',
    );

    scene.add(floor);

    const back = cube(
      0,
      1.15,
      -1.5,
      8.8,
      5.8,
      0.12,
      '#F8F1EC',
    );

    scene.add(back);

    // Assembly workbench only at the back.
    const benchTop = cube(
      0,
      -1.15,
      -0.75,
      7.2,
      0.16,
      1.0,
      '#C9A789',
    );

    scene.add(benchTop);

    const leftLeg = cube(
      -3.0,
      -1.85,
      -0.75,
      0.16,
      1.35,
      0.55,
      '#A17B60',
    );

    const rightLeg = leftLeg.clone();
    rightLeg.position.x = 3.0;

    scene.add(leftLeg);
    scene.add(rightLeg);

    // Small tools above the bench.
    for (let i = -3; i <= 3; i += 1) {
      const tool = cube(
        i * 0.65,
        1.62,
        -1.38,
        0.34,
        0.055,
        0.055,
        i % 2 === 0
          ? COLORS.yellow
          : COLORS.mint,
      );

      tool.rotation.z = i * 0.12;
      scene.add(tool);
    }
  }

  function targetsForMission(
    id: number,
  ): Partial<Record<PartId, THREE.Vector3>> {
    if (id === 0) {
      return {
        bigGear: new THREE.Vector3(-0.55, 0.05, 0),
        smallGear: new THREE.Vector3(0.48, 0.05, 0),
        gearShaft: new THREE.Vector3(1.15, 0.05, 0),
      };
    }

    if (id === 1) {
      return {
        cycleFrame: new THREE.Vector3(-0.05, 0.00, 0),
        cycleRearWheel: new THREE.Vector3(-0.90, -0.25, 0),
        cycleFrontWheel: new THREE.Vector3(0.88, -0.10, 0),
        cycleHandle: new THREE.Vector3(0.62, 0.88, 0),
        cycleSeat: new THREE.Vector3(-0.30, 0.86, 0),
        cyclePedal: new THREE.Vector3(0.05, -0.05, 0),
      };
    }

    if (id === 2) {
      return {
        motor: new THREE.Vector3(-0.15, 0.25, 0),
        motorGear: new THREE.Vector3(0.78, 0.25, 0),
        motorShaft: new THREE.Vector3(0.88, -0.25, 0),
        motorHousing: new THREE.Vector3(0, -0.72, 0),
      };
    }

    if (id === 3) {
      return {
        bikeFrame: new THREE.Vector3(-0.05, 0.00, 0),
        bikeRearWheel: new THREE.Vector3(-0.88, -0.28, 0),
        bikeFrontWheel: new THREE.Vector3(0.92, -0.12, 0),
        bikeHandle: new THREE.Vector3(0.72, 0.95, 0),
        bikeSeat: new THREE.Vector3(-0.25, 0.83, 0),
        bikeEngine: new THREE.Vector3(0.0, -0.20, 0),
        bikeExhaust: new THREE.Vector3(0.30, -0.48, 0),
      };
    }

    return {
      robotBase: new THREE.Vector3(0, -0.92, 0),
      robotTorso: new THREE.Vector3(0, -0.02, 0),
      robotShoulder: new THREE.Vector3(0.62, 0.35, 0),
      robotUpperArm: new THREE.Vector3(0.92, 0.00, 0),
      robotForearm: new THREE.Vector3(1.18, -0.45, 0),
      robotWrist: new THREE.Vector3(1.18, -0.92, 0),
      robotHead: new THREE.Vector3(0, 0.82, 0),
      robotGripper: new THREE.Vector3(1.18, -1.18, 0),
    };
  }

  function rebuildScene() {
    const scene = sceneRef.current;

    if (!scene) {
      return;
    }

    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    workshop(scene);

    const targets = targetsForMission(
      missionRef.current,
    );

    const currentMission =
      MISSIONS[missionRef.current];

    runtimeRef.current.clear();

    /*
      IMPORTANT:
      Parts stay on the OUTSIDE of the assembly zone.
      The target machine is in the CENTER.
    */

    currentMission.parts.forEach(
      (id, index) => {
        const object = createPart(id);

        const column =
          index % 2 === 0 ? -2.7 : 2.7;

        const row =
          Math.floor(index / 2);

        const x =
          column +
          (index % 2 === 0 ? -0.1 : 0.1);

        const y =
          1.05 -
          row * 0.85;

        object.position.set(
          x,
          y,
          0.35,
        );

        scene.add(object);

        const target = targets[id];

        if (!target) {
          return;
        }

        const ghost =
          createPart(id, true);

        ghost.position.copy(
          target,
        );

        ghost.position.z = 0.0;

        ghost.traverse((child: any) => {
          if (child.material) {
            child.material.transparent = true;
            child.material.opacity = 0.22;
          }
        });

        scene.add(ghost);

        runtimeRef.current.set(id, {
          object,
          home: object.position.clone(),
          target: target.clone(),
          placed: false,
        });
      },
    );

    // Keep the assembled machine clearly separated
    // from the loose parts.
    const assemblyRing = new THREE.Mesh(
      new THREE.RingGeometry(
        1.65,
        1.72,
        48,
      ),
      new THREE.MeshBasicMaterial({
        color: COLORS.purple,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
      }),
    );

    assemblyRing.position.set(
      0,
      -0.20,
      -0.03,
    );

    assemblyRing.rotation.x =
      Math.PI / 2;

    scene.add(assemblyRing);
  }

  function animateMachine() {
    if (!runningRef.current) {
      return;
    }

    const time =
      performance.now() * 0.001;

    if (missionRef.current === 0) {
      const big =
        runtimeRef.current.get(
          'bigGear',
        )?.object;

      const small =
        runtimeRef.current.get(
          'smallGear',
        )?.object;

      const shaft =
        runtimeRef.current.get(
          'gearShaft',
        )?.object;

      if (big) big.rotation.z = time;
      if (small) small.rotation.z = -time * 1.8;
      if (shaft) shaft.rotation.x = time * 2;
    }

    if (missionRef.current === 1) {
      const rear =
        runtimeRef.current.get(
          'cycleRearWheel',
        )?.object;

      const front =
        runtimeRef.current.get(
          'cycleFrontWheel',
        )?.object;

      const pedal =
        runtimeRef.current.get(
          'cyclePedal',
        )?.object;

      const frame =
        runtimeRef.current.get(
          'cycleFrame',
        )?.object;

      if (rear) rear.rotation.z = -time * 2.4;
      if (front) front.rotation.z = -time * 2.4;
      if (pedal) pedal.rotation.z = time * 3;

      if (frame) {
        frame.position.x =
          Math.sin(time * 1.4) * 0.22;
      }
    }

    if (missionRef.current === 2) {
      const motor =
        runtimeRef.current.get(
          'motor',
        )?.object;

      const gearObject =
        runtimeRef.current.get(
          'motorGear',
        )?.object;

      const shaft =
        runtimeRef.current.get(
          'motorShaft',
        )?.object;

      if (motor) {
        motor.rotation.y =
          Math.sin(time * 10) * 0.025;
      }

      if (gearObject) {
        gearObject.rotation.z =
          time * 3;
      }

      if (shaft) {
        shaft.rotation.x =
          time * 7;
      }
    }

    if (missionRef.current === 3) {
      const rear =
        runtimeRef.current.get(
          'bikeRearWheel',
        )?.object;

      const front =
        runtimeRef.current.get(
          'bikeFrontWheel',
        )?.object;

      const engine =
        runtimeRef.current.get(
          'bikeEngine',
        )?.object;

      if (rear) rear.rotation.z = -time * 3;
      if (front) front.rotation.z = -time * 3;

      if (engine) {
        engine.rotation.y =
          Math.sin(time * 18) * 0.04;
      }

      runtimeRef.current.forEach(
        ({ object }) => {
          object.position.x +=
            Math.sin(time * 1.8) *
            0.0009;
        },
      );
    }

    if (missionRef.current === 4) {
      const shoulder =
        runtimeRef.current.get(
          'robotShoulder',
        )?.object;

      const upper =
        runtimeRef.current.get(
          'robotUpperArm',
        )?.object;

      const fore =
        runtimeRef.current.get(
          'robotForearm',
        )?.object;

      const wrist =
        runtimeRef.current.get(
          'robotWrist',
        )?.object;

      if (shoulder) {
        shoulder.rotation.z =
          Math.sin(time * 2) * 0.35;
      }

      if (upper) {
        upper.rotation.z =
          Math.sin(time * 2 + 0.7) *
          0.45;
      }

      if (fore) {
        fore.rotation.z =
          Math.sin(time * 2 + 1.2) *
          0.55;
      }

      if (wrist) {
        wrist.rotation.z =
          Math.sin(time * 3) *
          0.8;
      }
    }
  }

  function animate() {
    const renderer =
      rendererRef.current;

    const scene =
      sceneRef.current;

    const camera =
      cameraRef.current;

    if (
      !renderer ||
      !scene ||
      !camera
    ) {
      return;
    }

    animateMachine();

    renderer.render(
      scene,
      camera,
    );

    const gl =
      glRef.current;

    if (
      gl &&
      typeof gl.endFrameEXP ===
        'function'
    ) {
      gl.endFrameEXP();
    }

    animationRef.current =
      requestAnimationFrame(
        animate,
      );
  }

  function onContextCreate(
    gl: any,
  ) {
    glRef.current = gl;

    const scene =
      new THREE.Scene();

    scene.background =
      new THREE.Color(
        COLORS.bg,
      );

    const camera =
      new THREE.PerspectiveCamera(
        55,
        1,
        0.1,
        100,
      );

    camera.position.set(
      0,
      0.05,
      8.8,
    );

    camera.lookAt(
      0,
      -0.1,
      0,
    );

    const renderer =
      new THREE.WebGLRenderer({
        context: gl,
        antialias: true,
        alpha: false,
      });

    renderer.setClearColor(
      COLORS.bg,
      1,
    );

    renderer.setPixelRatio(1);

    const hemi =
      new THREE.HemisphereLight(
        0xffffff,
        0xD9C9BF,
        2.8,
      );

    scene.add(hemi);

    const key =
      new THREE.DirectionalLight(
        0xffffff,
        2.5,
      );

    key.position.set(
      4,
      6,
      8,
    );

    scene.add(key);

    const fill =
      new THREE.DirectionalLight(
        0xF1E7FF,
        1.4,
      );

    fill.position.set(
      -5,
      3,
      5,
    );

    scene.add(fill);

    sceneRef.current =
      scene;

    cameraRef.current =
      camera;

    rendererRef.current =
      renderer;

    rebuildScene();
    animate();
  }

  function updatePointer(
    x: number,
    y: number,
  ) {
    const {
      width,
      height,
    } = viewSizeRef.current;

    pointerRef.current.x =
      (x / width) * 2 - 1;

    pointerRef.current.y =
      -(y / height) * 2 + 1;
  }

  function findPartAt(
    x: number,
    y: number,
  ): PartId | null {
    const camera =
      cameraRef.current;

    if (!camera) {
      return null;
    }

    updatePointer(x, y);

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    const entries =
      Array.from(
        runtimeRef.current.entries(),
      );

    const objects =
      entries.map(
        ([, value]) =>
          value.object,
      );

    const hits =
      raycasterRef.current.intersectObjects(
        objects,
        true,
      );

    if (!hits.length) {
      return null;
    }

    let hitObject:
      THREE.Object3D | null =
      hits[0].object;

    while (
      hitObject &&
      !entries.some(
        ([, value]) =>
          value.object ===
          hitObject,
      )
    ) {
      hitObject =
        hitObject.parent;
    }

    const found =
      entries.find(
        ([, value]) =>
          value.object ===
          hitObject,
      );

    return found
      ? found[0]
      : null;
  }

  function moveDraggedPart(
    x: number,
    y: number,
  ) {
    const id =
      draggingRef.current;

    if (!id) {
      return;
    }

    const camera =
      cameraRef.current;

    const entry =
      runtimeRef.current.get(
        id,
      );

    if (!camera || !entry) {
      return;
    }

    updatePointer(x, y);

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    const plane =
      new THREE.Plane(
        new THREE.Vector3(
          0,
          0,
          1,
        ),
        -0.0,
      );

    const point =
      new THREE.Vector3();

    raycasterRef.current.ray.intersectPlane(
      plane,
      point,
    );

    if (point) {
      entry.object.position.x =
        point.x;

      entry.object.position.y =
        point.y;

      entry.object.position.z =
        0.35;
    }
  }

  function finishDrag() {
    const id =
      draggingRef.current;

    if (!id) {
      return;
    }

    const entry =
      runtimeRef.current.get(
        id,
      );

    draggingRef.current =
      null;

    if (!entry) {
      return;
    }

    const distance =
      entry.object.position.distanceTo(
        entry.target,
      );

    if (distance < 0.52) {
      entry.object.position.copy(
        entry.target,
      );

      entry.object.position.z =
        0.35;

      if (!entry.placed) {
        entry.placed = true;

        const count =
          Array.from(
            runtimeRef.current.values(),
          ).filter(
            (v) => v.placed,
          ).length;

        setPlacedCount(count);

        if (
          count ===
          MISSIONS[missionRef.current].parts.length
        ) {
          setComplete(true);
        }
      }
    } else {
      entry.object.position.copy(
        entry.home,
      );
    }
  }

  function runMachine() {
    if (!complete) {
      return;
    }

    runningRef.current =
      !runningRef.current;

    setRunning(
      runningRef.current,
    );
  }

  return (
    <SafeAreaView
      style={styles.safe}
    >
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
          style={styles.back}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.kicker}>
            TECH LAB
          </Text>

          <Text style={styles.title}>
            {mission.title}
          </Text>

          <Text style={styles.subtitle}>
            {mission.subtitle}
          </Text>
        </View>

        <View style={styles.progress}>
          <Text style={styles.progressText}>
            {placedCount}/
            {mission.parts.length}
          </Text>
        </View>
      </View>

      <View
        style={styles.levelRow}
      >
        {MISSIONS.map(
          (item, index) => (
            <Pressable
              key={item.id}
              onPress={() =>
                setMission(index)
              }
              style={[
                styles.level,
                index ===
                  missionIndex &&
                  styles.levelActive,
              ]}
            >
              <Text
                style={[
                  styles.levelText,
                  index ===
                    missionIndex &&
                    styles.levelTextActive,
                ]}
              >
                {index + 1}
              </Text>
            </Pressable>
          ),
        )}
      </View>

      <View
        style={styles.gameArea}
        onLayout={(event) => {
          const {
            width,
            height,
          } =
            event.nativeEvent.layout;

          viewSizeRef.current = {
            width,
            height,
          };

          if (
            cameraRef.current
          ) {
            cameraRef.current.aspect =
              width /
              Math.max(height, 1);

            cameraRef.current.updateProjectionMatrix();
          }

          if (
            rendererRef.current
          ) {
            rendererRef.current.setSize(
              width,
              height,
              false,
            );
          }
        }}
      >
        <GLView
          style={StyleSheet.absoluteFill}
          onContextCreate={
            onContextCreate
          }
          onTouchStart={(event) => {
            if (runningRef.current) {
              return;
            }

            const {
              locationX,
              locationY,
            } =
              event.nativeEvent;

            draggingRef.current =
              findPartAt(
                locationX,
                locationY,
              );
          }}
          onTouchMove={(event) => {
            if (runningRef.current) {
              return;
            }

            const {
              locationX,
              locationY,
            } =
              event.nativeEvent;

            moveDraggedPart(
              locationX,
              locationY,
            );
          }}
          onTouchEnd={() => {
            if (runningRef.current) {
              return;
            }

            finishDrag();
          }}
        />

        <View
          pointerEvents="none"
          style={styles.hint}
        >
          <Text style={styles.hintTitle}>
            BUILD IT
          </Text>

          <Text style={styles.hintText}>
            Drag the parts from the sides
            into the glowing assembly positions.
          </Text>
        </View>

        {complete && (
          <View
            pointerEvents="none"
            style={styles.completeBadge}
          >
            <Text
              style={styles.completeText}
            >
              ✓ MACHINE READY
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottom}>
        <View style={styles.instruction}>
          <Text style={styles.instructionTitle}>
            {running
              ? 'MACHINE RUNNING'
              : complete
                ? 'Everything is connected'
                : 'Place every part'}
          </Text>

          <Text style={styles.instructionText}>
            {running
              ? 'Watch what the machine does.'
              : complete
                ? 'Now run it and observe the motion.'
                : 'Loose parts are kept outside the assembly area.'}
          </Text>
        </View>

        <Pressable
          onPress={runMachine}
          disabled={!complete}
          style={[
            styles.runButton,
            !complete &&
              styles.runDisabled,
            running &&
              styles.stopButton,
          ]}
        >
          <Text style={styles.runText}>
            {running
              ? 'STOP'
              : 'RUN MACHINE'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor:
        COLORS.bg,
    },

    header: {
      height: 82,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor:
        COLORS.border,
      backgroundColor:
        COLORS.panel,
    },

    back: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    backText: {
      fontSize: 36,
      color: COLORS.text,
      lineHeight: 40,
    },

    titleWrap: {
      flex: 1,
      paddingHorizontal: 8,
    },

    kicker: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.5,
      color: COLORS.purple,
    },

    title: {
      fontSize: 17,
      fontWeight: '900',
      color: COLORS.text,
    },

    subtitle: {
      fontSize: 11,
      color: COLORS.muted,
      marginTop: 1,
    },

    progress: {
      width: 48,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        '#EEE7FA',
    },

    progressText: {
      color: COLORS.purpleDark,
      fontWeight: '900',
      fontSize: 13,
    },

    levelRow: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      backgroundColor:
        COLORS.panel,
    },

    level: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        '#F0EBF2',
    },

    levelActive: {
      backgroundColor:
        COLORS.purple,
    },

    levelText: {
      fontSize: 12,
      fontWeight: '900',
      color: COLORS.muted,
    },

    levelTextActive: {
      color: '#FFFFFF',
    },

    gameArea: {
      flex: 1,
      marginHorizontal: 12,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor:
        COLORS.bg,
      borderWidth: 1,
      borderColor:
        COLORS.border,
    },

    hint: {
      position: 'absolute',
      top: 12,
      left: 16,
      right: 16,
    },

    hintTitle: {
      fontSize: 11,
      fontWeight: '900',
      color: COLORS.purpleDark,
      letterSpacing: 1,
    },

    hintText: {
      marginTop: 3,
      fontSize: 11,
      color: COLORS.muted,
      maxWidth: 300,
    },

    completeBadge: {
      position: 'absolute',
      top: 14,
      right: 16,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor:
        '#E1F4EA',
    },

    completeText: {
      color: '#477C61',
      fontWeight: '900',
      fontSize: 10,
    },

    bottom: {
      minHeight: 92,
      paddingHorizontal: 16,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor:
        COLORS.panel,
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
    },

    instruction: {
      flex: 1,
    },

    instructionTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: COLORS.text,
    },

    instructionText: {
      marginTop: 3,
      fontSize: 11,
      lineHeight: 16,
      color: COLORS.muted,
    },

    runButton: {
      minWidth: 132,
      height: 48,
      paddingHorizontal: 18,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor:
        COLORS.purple,
    },

    runDisabled: {
      opacity: 0.35,
    },

    stopButton: {
      backgroundColor:
        COLORS.dark,
    },

    runText: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 12,
      letterSpacing: 0.4,
    },
  });
