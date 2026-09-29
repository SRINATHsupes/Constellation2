import { GLView } from 'expo-gl';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as THREE from 'three';

type Level = 1 | 2 | 3 | 4 | 5;

type PartId =
  | 'bigGear'
  | 'smallGear'
  | 'shaft'
  | 'wheelFront'
  | 'wheelRear'
  | 'frame'
  | 'handle'
  | 'pedals'
  | 'seat'
  | 'motor'
  | 'motorGear'
  | 'motorShaft'
  | 'motorBase'
  | 'bikeFrame'
  | 'bikeFrontWheel'
  | 'bikeRearWheel'
  | 'bikeHandle'
  | 'bikeSeat'
  | 'bikeEngine'
  | 'bikeExhaust'
  | 'robotBase'
  | 'robotBody'
  | 'robotLeftArm'
  | 'robotRightArm'
  | 'robotHead'
  | 'robotGripper';

type PartDefinition = {
  id: PartId;
  label: string;
  target: THREE.Vector3;
  create: () => THREE.Group;
  snapDistance?: number;
};

const COLORS = {
  background: '#FFF9F5',
  paper: '#FFFDFB',
  charcoal: '#34313A',
  muted: '#817985',
  purple: '#8B6FC7',
  purpleDark: '#7655B5',
  lavender: '#9B83D7',
  pink: '#E98FA3',
  peach: '#F2B38F',
  mint: '#86CDB1',
  sky: '#82B8E8',
  yellow: '#F2C96D',
  metal: '#B8BCC5',
  darkMetal: '#555B66',
  rubber: '#34353B',
  steel: '#7B8490',
  green: '#69B99A',
  red: '#D96D78',
  border: '#E8DDE7',
  softPurple: '#EEE7FA',
};

const LEVEL_INFO: Record<
  Level,
  {
    title: string;
    instruction: string;
    run: string;
    lesson: string;
  }
> = {
  1: {
    title: 'GEAR MACHINE',
    instruction: 'Build the gear transmission.',
    run: 'RUN MACHINE',
    lesson: 'Gears transfer rotational motion.',
  },
  2: {
    title: 'BICYCLE LAB',
    instruction: 'Assemble the bicycle.',
    run: 'RUN CYCLE',
    lesson: 'Parts work together to create movement.',
  },
  3: {
    title: 'ELECTRIC MOTOR',
    instruction: 'Build the motor drive.',
    run: 'RUN MOTOR',
    lesson: 'Electrical energy becomes mechanical motion.',
  },
  4: {
    title: 'MOTORCYCLE LAB',
    instruction: 'Assemble the motorcycle.',
    run: 'RUN MOTORCYCLE',
    lesson: 'A machine combines many moving systems.',
  },
  5: {
    title: 'ROBOT LAB',
    instruction: 'Build the robot.',
    run: 'RUN ROBOT',
    lesson: 'Robots combine structure, joints and control.',
  },
};

const LEVEL_PARTS = (level: Level): PartDefinition[] => {
  if (level === 1) {
    return [
      {
        id: 'bigGear',
        label: 'BIG GEAR',
        target: new THREE.Vector3(-1.15, 0.45, 0.65),
        create: () => makeGear(1.05, 14, COLORS.sky),
      },
      {
        id: 'smallGear',
        label: 'SMALL GEAR',
        target: new THREE.Vector3(1.05, 0.45, 0.65),
        create: () => makeGear(0.62, 12, COLORS.yellow),
      },
      {
        id: 'shaft',
        label: 'SHAFT',
        target: new THREE.Vector3(0, -0.95, 0.65),
        create: () => makeShaft(),
      },
    ];
  }

  if (level === 2) {
    return [
      {
        id: 'wheelRear',
        label: 'REAR WHEEL',
        target: new THREE.Vector3(-1.25, 0.05, 0.75),
        create: () => makeBicycleWheel(),
        snapDistance: 0.8,
      },
      {
        id: 'wheelFront',
        label: 'FRONT WHEEL',
        target: new THREE.Vector3(1.45, 0.05, 0.75),
        create: () => makeBicycleWheel(),
        snapDistance: 0.8,
      },
      {
        id: 'frame',
        label: 'FRAME',
        target: new THREE.Vector3(0.05, 0.55, 0.72),
        create: () => makeBicycleFrame(),
        snapDistance: 0.85,
      },
      {
        id: 'handle',
        label: 'HANDLEBAR',
        target: new THREE.Vector3(1.45, 1.18, 0.72),
        create: () => makeBicycleHandle(),
        snapDistance: 0.8,
      },
      {
        id: 'pedals',
        label: 'PEDALS',
        target: new THREE.Vector3(-0.15, 0.15, 0.9),
        create: () => makePedals(),
        snapDistance: 0.65,
      },
      {
        id: 'seat',
        label: 'SEAT',
        target: new THREE.Vector3(-0.55, 1.05, 0.75),
        create: () => makeSeat(),
        snapDistance: 0.65,
      },
    ];
  }

  if (level === 3) {
    return [
      {
        id: 'motorBase',
        label: 'MOTOR BASE',
        target: new THREE.Vector3(0, -1.05, 0.65),
        create: () => makeMotorBase(),
      },
      {
        id: 'motor',
        label: 'MOTOR',
        target: new THREE.Vector3(-0.65, 0.45, 0.75),
        create: () => makeElectricMotor(),
        snapDistance: 0.8,
      },
      {
        id: 'motorShaft',
        label: 'SHAFT',
        target: new THREE.Vector3(0.9, 0.45, 0.8),
        create: () => makeMotorShaft(),
      },
      {
        id: 'motorGear',
        label: 'DRIVE GEAR',
        target: new THREE.Vector3(1.55, 0.45, 0.8),
        create: () => makeGear(0.55, 12, COLORS.yellow),
      },
    ];
  }

  if (level === 4) {
    return [
      {
        id: 'bikeRearWheel',
        label: 'REAR WHEEL',
        target: new THREE.Vector3(-1.35, 0, 0.75),
        create: () => makeMotorcycleWheel(),
        snapDistance: 0.85,
      },
      {
        id: 'bikeFrontWheel',
        label: 'FRONT WHEEL',
        target: new THREE.Vector3(1.35, 0, 0.75),
        create: () => makeMotorcycleWheel(),
        snapDistance: 0.85,
      },
      {
        id: 'bikeFrame',
        label: 'FRAME',
        target: new THREE.Vector3(0, 0.62, 0.75),
        create: () => makeMotorcycleFrame(),
        snapDistance: 0.85,
      },
      {
        id: 'bikeEngine',
        label: 'ENGINE',
        target: new THREE.Vector3(-0.15, 0.2, 0.95),
        create: () => makeMotorcycleEngine(),
        snapDistance: 0.75,
      },
      {
        id: 'bikeHandle',
        label: 'HANDLEBAR',
        target: new THREE.Vector3(1.25, 1.35, 0.75),
        create: () => makeMotorcycleHandle(),
        snapDistance: 0.8,
      },
      {
        id: 'bikeSeat',
        label: 'SEAT',
        target: new THREE.Vector3(-0.65, 1.12, 0.78),
        create: () => makeMotorcycleSeat(),
        snapDistance: 0.7,
      },
      {
        id: 'bikeExhaust',
        label: 'EXHAUST',
        target: new THREE.Vector3(-1.0, 0.15, 0.65),
        create: () => makeExhaust(),
        snapDistance: 0.75,
      },
    ];
  }

  return [
    {
      id: 'robotBase',
      label: 'ROBOT BASE',
      target: new THREE.Vector3(0, -1.0, 0.7),
      create: () => makeRobotBase(),
      snapDistance: 0.75,
    },
    {
      id: 'robotBody',
      label: 'ROBOT BODY',
      target: new THREE.Vector3(0, 0.15, 0.75),
      create: () => makeRobotBody(),
      snapDistance: 0.8,
    },
    {
      id: 'robotHead',
      label: 'ROBOT HEAD',
      target: new THREE.Vector3(0, 1.35, 0.75),
      create: () => makeRobotHead(),
      snapDistance: 0.7,
    },
    {
      id: 'robotLeftArm',
      label: 'LEFT ARM',
      target: new THREE.Vector3(-1.15, 0.35, 0.75),
      create: () => makeRobotArm(-1),
      snapDistance: 0.8,
    },
    {
      id: 'robotRightArm',
      label: 'RIGHT ARM',
      target: new THREE.Vector3(1.15, 0.35, 0.75),
      create: () => makeRobotArm(1),
      snapDistance: 0.8,
    },
    {
      id: 'robotGripper',
      label: 'GRIPPER',
      target: new THREE.Vector3(1.65, -0.2, 0.75),
      create: () => makeGripper(),
      snapDistance: 0.7,
    },
  ];
};

function material(
  color: string,
  metalness = 0.15,
  roughness = 0.55,
) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness,
    roughness,
  });
}

function box(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  color: string,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material(color),
  );
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(
  radius: number,
  height: number,
  color: string,
  radial = 24,
) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, radial),
    material(color, 0.45, 0.38),
  );
}

function makeGear(
  radius: number,
  teeth: number,
  color: string,
) {
  const group = new THREE.Group();

  const points: THREE.Vector2[] = [];

  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? radius : radius * 0.78;
    points.push(new THREE.Vector2(Math.cos(a) * r, Math.sin(a) * r));
  }

  const shape = new THREE.Shape(points);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.035,
    bevelThickness: 0.035,
  });

  const gear = new THREE.Mesh(
    geometry,
    material(color, 0.3, 0.4),
  );

  gear.rotation.x = Math.PI / 2;
  gear.position.z = -0.12;

  group.add(gear);

  const hub = cylinder(0.25, 0.32, COLORS.darkMetal);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  const center = cylinder(0.11, 0.38, COLORS.metal);
  center.rotation.x = Math.PI / 2;
  group.add(center);

  group.userData.kind = 'gear';

  return group;
}

function makeShaft() {
  const group = new THREE.Group();

  const shaft = cylinder(0.12, 2.2, COLORS.steel);
  shaft.rotation.z = Math.PI / 2;

  group.add(shaft);

  const collar1 = cylinder(0.2, 0.16, COLORS.yellow);
  collar1.rotation.z = Math.PI / 2;
  collar1.position.x = -0.7;
  group.add(collar1);

  const collar2 = cylinder(0.2, 0.16, COLORS.yellow);
  collar2.rotation.z = Math.PI / 2;
  collar2.position.x = 0.7;
  group.add(collar2);

  group.userData.kind = 'shaft';

  return group;
}

function makeBicycleWheel() {
  const group = new THREE.Group();

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.105, 12, 36),
    material(COLORS.rubber, 0.05, 0.75),
  );

  group.add(tire);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.57, 0.035, 8, 32),
    material(COLORS.metal, 0.75, 0.25),
  );

  group.add(rim);

  const hub = cylinder(0.105, 0.18, COLORS.darkMetal);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  for (let i = 0; i < 10; i++) {
    const spoke = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.54, 6),
      material('#9DA3AD', 0.6, 0.35),
    );

    const a = (i / 10) * Math.PI * 2;
    spoke.rotation.z = a;
    spoke.position.set(
      Math.cos(a) * 0.27,
      Math.sin(a) * 0.27,
      0,
    );

    group.add(spoke);
  }

  group.userData.kind = 'bicycleWheel';

  return group;
}

function makeTube(
  a: THREE.Vector3,
  b: THREE.Vector3,
  radius: number,
  color: string,
) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const length = direction.length();

  const mesh = cylinder(radius, length, color, 12);

  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );

  return mesh;
}

function makeBicycleFrame() {
  const group = new THREE.Group();

  const rear = new THREE.Vector3(-1.15, 0.05, 0);
  const crank = new THREE.Vector3(-0.05, 0.12, 0);
  const seat = new THREE.Vector3(-0.58, 0.92, 0);
  const front = new THREE.Vector3(1.25, 0.18, 0);
  const top = new THREE.Vector3(0.45, 0.92, 0);

  const bars = [
    [rear, crank],
    [crank, seat],
    [seat, top],
    [top, crank],
    [crank, front],
    [seat, rear],
    [top, front],
  ];

  bars.forEach(([a, b]) => {
    group.add(
      makeTube(
        a,
        b,
        0.075,
        COLORS.purple,
      ),
    );
  });

  const chainRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.035, 8, 24),
    material(COLORS.yellow, 0.5, 0.35),
  );

  chainRing.position.copy(crank);
  group.add(chainRing);

  group.userData.kind = 'bicycleFrame';

  return group;
}

function makeBicycleHandle() {
  const group = new THREE.Group();

  group.add(
    makeTube(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -0.72, 0),
      0.055,
      COLORS.darkMetal,
    ),
  );

  group.add(
    makeTube(
      new THREE.Vector3(-0.25, 0, 0),
      new THREE.Vector3(0.25, 0, 0),
      0.055,
      COLORS.darkMetal,
    ),
  );

  const grips = [
    [-0.32, 0, 0],
    [0.32, 0, 0],
  ];

  grips.forEach(([x, y, z]) => {
    const grip = cylinder(0.065, 0.18, COLORS.rubber);
    grip.rotation.z = Math.PI / 2;
    grip.position.set(x, y, z);
    group.add(grip);
  });

  return group;
}

function makePedals() {
  const group = new THREE.Group();

  const crank = cylinder(0.09, 0.14, COLORS.darkMetal);
  crank.rotation.x = Math.PI / 2;
  group.add(crank);

  const arm1 = box(0.38, 0, 0, 0.48, 0.055, 0.055, COLORS.darkMetal);
  arm1.rotation.z = 0.25;
  group.add(arm1);

  const pedal1 = box(0.14, 0, 0, 0.18, 0.06, 0.1, COLORS.rubber);
  pedal1.position.x = 0.28;
  group.add(pedal1);

  const arm2 = box(-0.38, 0, 0, 0.48, 0.055, 0.055, COLORS.darkMetal);
  arm2.rotation.z = 0.25;
  group.add(arm2);

  group.userData.kind = 'pedals';

  return group;
}

function makeSeat() {
  const group = new THREE.Group();

  group.add(
    box(
      0,
      0,
      0,
      0.48,
      0.12,
      0.25,
      COLORS.rubber,
    ),
  );

  const post = cylinder(0.045, 0.45, COLORS.darkMetal);
  post.position.y = -0.27;
  group.add(post);

  return group;
}

function makeMotorBase() {
  const group = new THREE.Group();

  group.add(
    box(
      0,
      0,
      0,
      3.5,
      0.28,
      1.0,
      COLORS.darkMetal,
    ),
  );

  const foot1 = box(-1.35, -0.22, 0, 0.45, 0.18, 0.65, COLORS.metal);
  const foot2 = box(1.35, -0.22, 0, 0.45, 0.18, 0.65, COLORS.metal);

  group.add(foot1, foot2);

  return group;
}

function makeElectricMotor() {
  const group = new THREE.Group();

  const body = cylinder(0.62, 1.55, '#68727D', 32);
  body.rotation.z = Math.PI / 2;
  group.add(body);

  for (let i = 0; i < 5; i++) {
    const fin = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.64,
        0.035,
        8,
        32,
      ),
      material(COLORS.darkMetal, 0.7, 0.3),
    );

    fin.rotation.y = Math.PI / 2;
    fin.position.x = -0.48 + i * 0.24;
    group.add(fin);
  }

  const front = cylinder(0.48, 0.18, COLORS.metal);
  front.rotation.z = Math.PI / 2;
  front.position.x = 0.82;
  group.add(front);

  const rotor = cylinder(0.3, 0.12, COLORS.yellow);
  rotor.rotation.z = Math.PI / 2;
  rotor.position.x = 0.96;
  rotor.userData.motorRotor = true;
  group.add(rotor);

  const terminal = box(
    0,
    0.7,
    0,
    0.45,
    0.25,
    0.5,
    COLORS.darkMetal,
  );

  group.add(terminal);

  const post1 = cylinder(0.04, 0.12, COLORS.red);
  post1.position.set(-0.1, 0.87, 0);
  group.add(post1);

  const post2 = cylinder(0.04, 0.12, COLORS.sky);
  post2.position.set(0.1, 0.87, 0);
  group.add(post2);

  group.userData.kind = 'motor';

  return group;
}

function makeMotorShaft() {
  const group = new THREE.Group();

  const shaft = cylinder(0.11, 1.45, COLORS.steel);
  shaft.rotation.z = Math.PI / 2;
  group.add(shaft);

  const coupling = cylinder(0.22, 0.22, COLORS.yellow);
  coupling.rotation.z = Math.PI / 2;
  coupling.position.x = -0.5;
  group.add(coupling);

  group.userData.kind = 'motorShaft';

  return group;
}

function makeMotorcycleWheel() {
  const group = makeBicycleWheel();
  group.scale.setScalar(1.12);
  group.userData.kind = 'motorcycleWheel';
  return group;
}

function makeMotorcycleFrame() {
  const group = new THREE.Group();

  const rear = new THREE.Vector3(-1.15, 0.1, 0);
  const engine = new THREE.Vector3(-0.15, 0.35, 0);
  const seat = new THREE.Vector3(-0.65, 0.95, 0);
  const steering = new THREE.Vector3(0.9, 1.0, 0);
  const front = new THREE.Vector3(1.2, 0.12, 0);

  [
    [rear, engine],
    [engine, seat],
    [seat, steering],
    [steering, engine],
    [engine, front],
    [seat, rear],
  ].forEach(([a, b]) => {
    group.add(
      makeTube(
        a,
        b,
        0.105,
        COLORS.purpleDark,
      ),
    );
  });

  return group;
}

function makeMotorcycleEngine() {
  const group = new THREE.Group();

  const block = box(
    0,
    0,
    0,
    0.9,
    0.7,
    0.65,
    COLORS.darkMetal,
  );

  group.add(block);

  for (let i = 0; i < 4; i++) {
    const fin = box(
      -0.28 + i * 0.18,
      0.38,
      0,
      0.1,
      0.08,
      0.72,
      COLORS.metal,
    );

    group.add(fin);
  }

  const cylinderHead = cylinder(0.27, 0.4, COLORS.metal);
  cylinderHead.position.y = 0.43;
  group.add(cylinderHead);

  return group;
}

function makeMotorcycleHandle() {
  const group = new THREE.Group();

  group.add(
    makeTube(
      new THREE.Vector3(0, -0.65, 0),
      new THREE.Vector3(0, 0, 0),
      0.065,
      COLORS.darkMetal,
    ),
  );

  group.add(
    makeTube(
      new THREE.Vector3(-0.34, 0, 0),
      new THREE.Vector3(0.34, 0, 0),
      0.065,
      COLORS.darkMetal,
    ),
  );

  return group;
}

function makeMotorcycleSeat() {
  const group = new THREE.Group();

  group.add(
    box(
      0,
      0,
      0,
      0.95,
      0.18,
      0.4,
      COLORS.rubber,
    ),
  );

  const post = cylinder(
    0.05,
    0.38,
    COLORS.darkMetal,
  );

  post.position.y = -0.25;

  group.add(post);

  return group;
}

function makeExhaust() {
  const group = new THREE.Group();

  const pipe = cylinder(0.08, 1.35, COLORS.metal);
  pipe.rotation.z = Math.PI / 2;
  group.add(pipe);

  const muffler = cylinder(0.16, 0.65, COLORS.darkMetal);
  muffler.rotation.z = Math.PI / 2;
  muffler.position.x = -0.42;
  group.add(muffler);

  return group;
}

function makeRobotBase() {
  const group = new THREE.Group();

  const base = cylinder(0.7, 0.35, COLORS.darkMetal);
  group.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.62,
      0.055,
      10,
      32,
    ),
    material(COLORS.purple),
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.2;

  group.add(ring);

  return group;
}

function makeRobotBody() {
  const group = new THREE.Group();

  group.add(
    box(
      0,
      0,
      0,
      0.95,
      1.15,
      0.65,
      '#68727D',
    ),
  );

  const chest = box(
    0,
    0.15,
    0.34,
    0.55,
    0.38,
    0.06,
    COLORS.sky,
  );

  group.add(chest);

  const waist = cylinder(0.35, 0.25, COLORS.darkMetal);
  waist.position.y = -0.63;
  group.add(waist);

  group.userData.kind = 'robotBody';

  return group;
}

function makeRobotHead() {
  const group = new THREE.Group();

  group.add(
    box(
      0,
      0,
      0,
      0.78,
      0.62,
      0.62,
      COLORS.metal,
    ),
  );

  const eye1 = cylinder(0.055, 0.06, COLORS.green);
  eye1.rotation.x = Math.PI / 2;
  eye1.position.set(-0.18, 0.05, 0.34);

  const eye2 = cylinder(0.055, 0.06, COLORS.green);
  eye2.rotation.x = Math.PI / 2;
  eye2.position.set(0.18, 0.05, 0.34);

  group.add(eye1, eye2);

  const neck = cylinder(0.14, 0.25, COLORS.darkMetal);
  neck.position.y = -0.42;
  group.add(neck);

  return group;
}

function makeRobotArm(side: -1 | 1) {
  const group = new THREE.Group();

  const upper = makeTube(
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, -0.55, 0),
    0.12,
    COLORS.purple,
  );

  const elbow = cylinder(
    0.15,
    0.18,
    COLORS.yellow,
  );

  elbow.rotation.x = Math.PI / 2;
  elbow.position.y = -0.58;

  const lower = makeTube(
    new THREE.Vector3(0, -0.62, 0),
    new THREE.Vector3(side * 0.18, -1.05, 0),
    0.105,
    COLORS.metal,
  );

  group.add(upper, elbow, lower);

  group.userData.kind = 'robotArm';

  return group;
}

function makeGripper() {
  const group = new THREE.Group();

  const palm = box(
    0,
    0,
    0,
    0.28,
    0.2,
    0.25,
    COLORS.darkMetal,
  );

  group.add(palm);

  const finger1 = box(
    -0.12,
    -0.2,
    0,
    0.07,
    0.32,
    0.08,
    COLORS.metal,
  );

  const finger2 = box(
    0.12,
    -0.2,
    0,
    0.07,
    0.32,
    0.08,
    COLORS.metal,
  );

  group.add(finger1, finger2);

  group.userData.kind = 'gripper';

  return group;
}

function addWorkshop(scene: THREE.Scene) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 8),
    material('#E9E3DF', 0, 0.9),
  );

  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.8;
  floor.position.z = -0.7;
  scene.add(floor);

  const back = box(
    0,
    1.2,
    -2,
    14,
    6,
    0.2,
    '#F1EAE7',
  );

  scene.add(back);

  // Workbench
  const benchTop = box(
    0,
    -1.45,
    -0.2,
    8.8,
    0.3,
    2.2,
    '#B98F72',
  );

  scene.add(benchTop);

  const legs = [-3.7, 3.7];

  legs.forEach((x) => {
    scene.add(
      box(
        x,
        -1.95,
        -0.2,
        0.28,
        0.9,
        1.7,
        '#765C4B',
      ),
    );
  });

  // Pegboard
  const pegboard = box(
    -3.9,
    1.1,
    -1.85,
    2.1,
    2.8,
    0.12,
    '#D7C8C0',
  );

  scene.add(pegboard);

  for (let y = 0.1; y <= 2.1; y += 0.5) {
    for (let x = -4.5; x <= -3.3; x += 0.5) {
      const peg = cylinder(
        0.035,
        0.08,
        COLORS.darkMetal,
        10,
      );

      peg.rotation.x = Math.PI / 2;
      peg.position.set(x, y, -1.75);
      scene.add(peg);
    }
  }

  // Small lab shelves
  scene.add(
    box(
      3.7,
      1.25,
      -1.8,
      1.8,
      0.12,
      0.55,
      '#C9B5A9',
    ),
  );

  scene.add(
    box(
      3.7,
      0.25,
      -1.8,
      1.8,
      0.12,
      0.55,
      '#C9B5A9',
    ),
  );

  // Tool silhouettes
  scene.add(
    box(
      3.25,
      1.65,
      -1.65,
      0.08,
      0.7,
      0.08,
      COLORS.purple,
    ),
  );

  scene.add(
    box(
      3.65,
      1.65,
      -1.65,
      0.12,
      0.5,
      0.12,
      COLORS.yellow,
    ),
  );

  // Work area outline
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(
      new THREE.BoxGeometry(7.4, 3.3, 0.02),
    ),
    new THREE.LineBasicMaterial({
      color: '#CFC2BC',
    }),
  );

  outline.position.set(0, 0, -0.95);
  scene.add(outline);

  // Status light
  const status = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    material(COLORS.green, 0, 0.35),
  );

  status.position.set(3.25, 1.85, -1.55);
  status.userData.statusLight = true;

  scene.add(status);
}

function makeGhost(definition: PartDefinition) {
  const ghost = definition.create();

  ghost.position.copy(definition.target);

  ghost.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const ghostMaterial = child.material.clone();

      ghostMaterial.transparent = true;
      ghostMaterial.opacity = 0.13;
      ghostMaterial.depthWrite = false;

      child.material = ghostMaterial;
      child.renderOrder = 1;
    }
  });

  ghost.userData.isGhost = true;

  return ghost;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();

      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
}

export default function ManufacturingScreen() {
  const router = useRouter();

  const [level, setLevel] = useState<Level>(1);
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(
    LEVEL_INFO[1].instruction,
  );

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const definitionsRef = useRef<PartDefinition[]>(
    LEVEL_PARTS(1),
  );

  const actualPartsRef =
    useRef<Record<string, THREE.Group>>({});

  const ghostPartsRef =
    useRef<Record<string, THREE.Group>>({});

  const placedRef =
    useRef<Record<string, boolean>>({});

  const runningRef = useRef(false);

  const frameRef = useRef<number | null>(null);

  const levelRef = useRef<Level>(1);

  const raycasterRef = useRef(new THREE.Raycaster());

  const pointerRef = useRef(
    new THREE.Vector2(),
  );

  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const rebuildScene = (
    scene: THREE.Scene,
    nextLevel: Level,
  ) => {
    while (scene.children.length > 0) {
      const child = scene.children[0];

      scene.remove(child);

      if (
        child instanceof THREE.Mesh ||
        child instanceof THREE.Group
      ) {
        disposeObject(child);
      }
    }

    addWorkshop(scene);

    const definitions = LEVEL_PARTS(nextLevel);

    definitionsRef.current = definitions;

    actualPartsRef.current = {};
    ghostPartsRef.current = {};

    definitions.forEach((definition) => {
      const ghost = makeGhost(definition);

      scene.add(ghost);

      ghostPartsRef.current[definition.id] =
        ghost;

      const actual = definition.create();

      actual.position.set(
        -3.3 +
          Object.keys(actualPartsRef.current)
            .length *
            1.25,
        -1.0,
        0.75,
      );

      actual.userData.partId = definition.id;

      actual.traverse((child) => {
        child.userData.partId =
          definition.id;

        if (child instanceof THREE.Mesh) {
          child.renderOrder = 10;
        }
      });

      scene.add(actual);

      actualPartsRef.current[definition.id] =
        actual;
    });
  };

  const onContextCreate = async (
    gl: any,
  ) => {
    const scene = new THREE.Scene();

    scene.background = new THREE.Color(
      COLORS.background,
    );

    const camera =
      new THREE.PerspectiveCamera(
        52,
        gl.drawingBufferWidth /
          gl.drawingBufferHeight,
        0.1,
        100,
      );

    camera.position.set(0, 0.25, 10);
    camera.lookAt(0, 0, 0);

    const renderer =
      new THREE.WebGLRenderer({
        context: gl,
        antialias: true,
      });

    renderer.setSize(
      gl.drawingBufferWidth,
      gl.drawingBufferHeight,
      false,
    );

    renderer.setPixelRatio(1);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    const ambient =
      new THREE.HemisphereLight(
        '#FFFFFF',
        '#BBAAA0',
        2.2,
      );

    scene.add(ambient);

    const keyLight =
      new THREE.DirectionalLight(
        '#FFFFFF',
        2.4,
      );

    keyLight.position.set(
      3,
      7,
      8,
    );

    scene.add(keyLight);

    const fillLight =
      new THREE.DirectionalLight(
        '#D9CCFF',
        1.2,
      );

    fillLight.position.set(
      -5,
      2,
      4,
    );

    scene.add(fillLight);

    rebuildScene(
      scene,
      levelRef.current,
    );

    const clock = new THREE.Clock();

    const animate = () => {
      frameRef.current =
        requestAnimationFrame(animate);

      const elapsed =
        clock.getElapsedTime();

      if (runningRef.current) {
        animateCurrentLevel(
          levelRef.current,
          elapsed,
        );
      }

      renderer.render(
        scene,
        camera,
      );

      // Critical for Expo GL animation.
      gl.endFrameEXP();
    };

    animate();
  };

  const animateCurrentLevel = (
    currentLevel: Level,
    time: number,
  ) => {
    const parts =
      actualPartsRef.current;

    if (currentLevel === 1) {
      const big = parts.bigGear;
      const small = parts.smallGear;
      const shaft = parts.shaft;

      if (big) {
        big.rotation.z =
          time * 1.8;
      }

      if (small) {
        small.rotation.z =
          -time * 3.0;
      }

      if (shaft) {
        shaft.rotation.x =
          time * 2.5;
      }

      return;
    }

    if (currentLevel === 2) {
      const rear =
        parts.wheelRear;

      const front =
        parts.wheelFront;

      const frame =
        parts.frame;

      const handle =
        parts.handle;

      const pedals =
        parts.pedals;

      const seat =
        parts.seat;

      const travel =
        Math.sin(time * 0.7) * 1.65;

      [
        frame,
        handle,
        pedals,
        seat,
      ].forEach((part) => {
        if (part) {
          part.position.x =
            part.userData.baseX ??
            0;

          part.position.x +=
            travel;
        }
      });

      if (rear) {
        rear.position.x =
          -1.25 + travel;

        rear.rotation.z =
          -travel * 0.55;
      }

      if (front) {
        front.position.x =
          1.45 + travel;

        front.rotation.z =
          -travel * 0.55;
      }

      return;
    }

    if (currentLevel === 3) {
      const motor =
        parts.motor;

      const shaft =
        parts.motorShaft;

      const gear =
        parts.motorGear;

      if (motor) {
        motor.rotation.x =
          time * 3;
      }

      if (shaft) {
        shaft.rotation.x =
          time * 4;
      }

      if (gear) {
        gear.rotation.z =
          -time * 4;
      }

      return;
    }

    if (currentLevel === 4) {
      const travel =
        Math.sin(time * 0.65) * 1.65;

      const rear =
        parts.bikeRearWheel;

      const front =
        parts.bikeFrontWheel;

      Object.entries(parts).forEach(
        ([id, part]) => {
          if (
            id !== 'bikeRearWheel' &&
            id !== 'bikeFrontWheel'
          ) {
            const base =
              part.userData.baseX;

            if (
              typeof base ===
              'number'
            ) {
              part.position.x =
                base + travel;
            }
          }
        },
      );

      if (rear) {
        const base =
          rear.userData.baseX ??
          -1.35;

        rear.position.x =
          base + travel;

        rear.rotation.z =
          -travel * 0.6;
      }

      if (front) {
        const base =
          front.userData.baseX ??
          1.35;

        front.position.x =
          base + travel;

        front.rotation.z =
          -travel * 0.6;
      }

      const engine =
        parts.bikeEngine;

      if (engine) {
        engine.rotation.y =
          Math.sin(time * 12) *
          0.025;
      }

      return;
    }

    // ROBOT
    const body =
      parts.robotBody;

    const head =
      parts.robotHead;

    const leftArm =
      parts.robotLeftArm;

    const rightArm =
      parts.robotRightArm;

    const gripper =
      parts.robotGripper;

    if (body) {
      body.rotation.y =
        Math.sin(time * 1.2) *
        0.22;
    }

    if (head) {
      head.rotation.y =
        Math.sin(time * 1.5) *
        0.3;
    }

    if (leftArm) {
      leftArm.rotation.z =
        -0.45 +
        Math.sin(time * 2) *
          0.25;
    }

    if (rightArm) {
      rightArm.rotation.z =
        0.45 +
        Math.sin(time * 2 + 1) *
          0.25;
    }

    if (gripper) {
      gripper.rotation.z =
        Math.sin(time * 3) *
        0.2;
    }
  };

  const getPointerPosition = (
    event: any,
  ) => {
    const {
      locationX,
      locationY,
    } = event.nativeEvent;

    const glViewWidth =
      event.nativeEvent.targetWidth ||
      1;

    const glViewHeight =
      event.nativeEvent.targetHeight ||
      1;

    pointerRef.current.set(
      (locationX / glViewWidth) * 2 -
        1,
      -(locationY / glViewHeight) * 2 +
        1,
    );
  };

  const findPart = (
    object: THREE.Object3D,
  ): {
    id: string;
    object: THREE.Group;
  } | null => {
    let current:
      | THREE.Object3D
      | null = object;

    while (current) {
      if (
        current.userData.partId
      ) {
        const id =
          current.userData.partId;

        const part =
          actualPartsRef.current[id];

        if (part) {
          return {
            id,
            object: part,
          };
        }
      }

      current =
        current.parent;
    }

    return null;
  };

  const pointerDown = (
    event: any,
  ) => {
    if (runningRef.current) {
      return;
    }

    const camera =
      cameraRef.current;

    if (!camera) {
      return;
    }

    getPointerPosition(event);

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    const objects =
      Object.values(
        actualPartsRef.current,
      );

    const hits =
      raycasterRef.current.intersectObjects(
        objects,
        true,
      );

    if (!hits.length) {
      return;
    }

    const found =
      findPart(hits[0].object);

    if (!found) {
      return;
    }

    const object =
      found.object;

    dragRef.current = {
      id: found.id,
      offsetX:
        object.position.x,
      offsetY:
        object.position.y,
    };

    object.userData.dragging =
      true;
  };

  const pointerMove = (
    event: any,
  ) => {
    const drag =
      dragRef.current;

    const camera =
      cameraRef.current;

    if (
      !drag ||
      !camera ||
      runningRef.current
    ) {
      return;
    }

    getPointerPosition(event);

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    const direction =
      raycasterRef.current.ray.direction;

    const origin =
      raycasterRef.current.ray.origin;

    const planeZ = 0.75;

    const distance =
      (planeZ - origin.z) /
      direction.z;

    if (
      !Number.isFinite(distance)
    ) {
      return;
    }

    const point =
      origin
        .clone()
        .add(
          direction
            .clone()
            .multiplyScalar(distance),
        );

    const part =
      actualPartsRef.current[
        drag.id
      ];

    if (!part) {
      return;
    }

    part.position.x =
      point.x;

    part.position.y =
      point.y;
  };

  const pointerUp = () => {
    const drag =
      dragRef.current;

    if (!drag) {
      return;
    }

    const part =
      actualPartsRef.current[
        drag.id
      ];

    const definition =
      definitionsRef.current.find(
        (item) =>
          item.id === drag.id,
      );

    if (
      part &&
      definition
    ) {
      const distance =
        part.position.distanceTo(
          definition.target,
        );

      const snapDistance =
        definition.snapDistance ??
        0.7;

      if (
        distance <=
        snapDistance
      ) {
        part.position.copy(
          definition.target,
        );

        part.userData.baseX =
          definition.target.x;

        part.userData.baseY =
          definition.target.y;

        placedRef.current[
          drag.id
        ] = true;

        setPlaced({
          ...placedRef.current,
        });

        setMessage(
          `${definition.label} installed.`,
        );

        const allPlaced =
          definitionsRef.current.every(
            (item) =>
              placedRef.current[
                item.id
              ],
          );

        if (allPlaced) {
          setMessage(
            `Machine complete. Press ${LEVEL_INFO[levelRef.current].run}.`,
          );
        }
      } else {
        part.position.set(
          -3.3 +
            definitionsRef.current.findIndex(
              (item) =>
                item.id === drag.id,
            ) *
              1.25,
          -1.0,
          0.75,
        );

        setMessage(
          'Not quite. Try the highlighted position.',
        );
      }
    }

    if (part) {
      part.userData.dragging =
        false;
    }

    dragRef.current = null;
  };

  const changeLevel = (
    nextLevel: Level,
  ) => {
    levelRef.current =
      nextLevel;

    setLevel(nextLevel);

    runningRef.current =
      false;

    setRunning(false);

    placedRef.current = {};

    setPlaced({});

    setMessage(
      LEVEL_INFO[nextLevel]
        .instruction,
    );

    if (sceneRef.current) {
      rebuildScene(
        sceneRef.current,
        nextLevel,
      );
    }
  };

  const runMachine = () => {
    const complete =
      definitionsRef.current.every(
        (definition) =>
          placedRef.current[
            definition.id
          ],
      );

    if (!complete) {
      setMessage(
        'Build the complete machine first.',
      );

      return;
    }

    runningRef.current = true;

    setRunning(true);

    setMessage(
      LEVEL_INFO[levelRef.current]
        .lesson,
    );
  };

  const resetMachine = () => {
    runningRef.current =
      false;

    setRunning(false);

    placedRef.current = {};

    setPlaced({});

    if (sceneRef.current) {
      rebuildScene(
        sceneRef.current,
        levelRef.current,
      );
    }

    setMessage(
      LEVEL_INFO[levelRef.current]
        .instruction,
    );
  };

  const placedCount =
    Object.values(placed).filter(
      Boolean,
    ).length;

  const total =
    definitionsRef.current.length;

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

        <View style={styles.titleBox}>
          <Text style={styles.kicker}>
            TECH LAB
          </Text>

          <Text style={styles.title}>
            {LEVEL_INFO[level].title}
          </Text>
        </View>

        <View style={styles.progress}>
          <Text
            style={styles.progressText}
          >
            {placedCount}/{total}
          </Text>
        </View>
      </View>

      <View style={styles.canvasWrap}>
        <GLView
          style={styles.canvas}
          onContextCreate={
            onContextCreate
          }
          onTouchStart={
            pointerDown
          }
          onTouchMove={
            pointerMove
          }
          onTouchEnd={
            pointerUp
          }
        />

        <View
          pointerEvents="none"
          style={styles.labLabel}
        >
          <Text style={styles.labLabelText}>
            PRACTICAL WORKSHOP
          </Text>

          <Text style={styles.labSubtext}>
            Drag the parts into the faint
            outlines.
          </Text>
        </View>

        <View
          pointerEvents="none"
          style={styles.message}
        >
          <Text style={styles.messageText}>
            {message}
          </Text>
        </View>
      </View>

      <View style={styles.levelRow}>
        {(
          [1, 2, 3, 4, 5] as Level[]
        ).map((item) => (
          <Pressable
            key={item}
            onPress={() =>
              changeLevel(item)
            }
            style={[
              styles.levelButton,
              level === item &&
                styles.levelButtonActive,
            ]}
          >
            <Text
              style={[
                styles.levelNumber,
                level === item &&
                  styles.levelNumberActive,
              ]}
            >
              {item}
            </Text>

            <Text
              style={[
                styles.levelName,
                level === item &&
                  styles.levelNameActive,
              ]}
            >
              {item === 1
                ? 'GEARS'
                : item === 2
                ? 'CYCLE'
                : item === 3
                ? 'MOTOR'
                : item === 4
                ? 'BIKE'
                : 'ROBOT'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.controls}>
        <Pressable
          onPress={runMachine}
          style={[
            styles.runButton,
            running &&
              styles.runButtonRunning,
          ]}
        >
          <Text style={styles.runText}>
            {running
              ? '● RUNNING'
              : LEVEL_INFO[level]
                  .run}
          </Text>
        </Pressable>

        <Pressable
          onPress={resetMachine}
          style={styles.resetButton}
        >
          <Text style={styles.resetText}>
            RESET
          </Text>
        </Pressable>
      </View>

      <View style={styles.lesson}>
        <View style={styles.lessonDot} />

        <View style={styles.lessonTextBox}>
          <Text style={styles.lessonTitle}>
            WHAT YOU DISCOVER
          </Text>

          <Text style={styles.lessonBody}>
            {LEVEL_INFO[level].lesson}
          </Text>
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

  header: {
    height: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    backgroundColor:
      COLORS.paper,
  },

  back: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.softPurple,
  },

  backText: {
    fontSize: 34,
    lineHeight: 36,
    color: COLORS.purpleDark,
  },

  titleBox: {
    flex: 1,
    marginLeft: 12,
  },

  kicker: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    color: COLORS.purple,
  },

  title: {
    marginTop: 2,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.charcoal,
  },

  progress: {
    minWidth: 48,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 16,
    alignItems: 'center',
    backgroundColor:
      COLORS.softPurple,
  },

  progressText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.purpleDark,
  },

  canvasWrap: {
    flex: 1,
    margin: 10,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor:
      COLORS.border,
    backgroundColor:
      COLORS.background,
  },

  canvas: {
    flex: 1,
  },

  labLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor:
      'rgba(255,253,251,0.90)',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  labLabelText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
    color: COLORS.purpleDark,
  },

  labSubtext: {
    marginTop: 2,
    fontSize: 10,
    color: COLORS.muted,
  },

  message: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 16,
    backgroundColor:
      'rgba(255,253,251,0.94)',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  messageText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.charcoal,
  },

  levelRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 8,
    gap: 7,
  },

  levelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  levelButtonActive: {
    backgroundColor:
      COLORS.softPurple,
    borderColor:
      COLORS.lavender,
  },

  levelNumber: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
  },

  levelNumberActive: {
    color: COLORS.purpleDark,
  },

  levelName: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
  },

  levelNameActive: {
    color: COLORS.purpleDark,
  },

  controls: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 8,
    gap: 8,
  },

  runButton: {
    flex: 1,
    minHeight: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.purple,
  },

  runButtonRunning: {
    backgroundColor:
      COLORS.green,
  },

  runText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: '#FFFFFF',
  },

  resetButton: {
    width: 92,
    minHeight: 52,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  resetText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.charcoal,
  },

  lesson: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 17,
    backgroundColor:
      COLORS.softPurple,
  },

  lessonDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor:
      COLORS.purple,
    marginRight: 10,
  },

  lessonTextBox: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.purpleDark,
  },

  lessonBody: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.charcoal,
  },
});
