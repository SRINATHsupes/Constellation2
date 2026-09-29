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

type Mission = 1 | 2 | 3 | 4 | 5;

type PartId =
  | 'bigGear'
  | 'smallGear'
  | 'shaft'
  | 'cycleFrame'
  | 'cycleWheelFront'
  | 'cycleWheelBack'
  | 'cycleHandle'
  | 'cycleSeat'
  | 'cyclePedal'
  | 'motorBody'
  | 'motorGear'
  | 'motorShaft'
  | 'motorHousing'
  | 'bikeFrame'
  | 'bikeWheelFront'
  | 'bikeWheelBack'
  | 'bikeHandle'
  | 'bikeSeat'
  | 'bikeEngine'
  | 'bikeExhaust'
  | 'robotBase'
  | 'robotBody'
  | 'robotJoint'
  | 'robotArm'
  | 'robotHead'
  | 'robotGripper';

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
  softPink: '#FCE9EF',
  softBlue: '#E7F1FB',
  darkMetal: '#4C4652',
  metal: '#A9A3AE',
  rubber: '#393640',
  silver: '#D6D2D9',
};

const MISSION_INFO: Record<
  Mission,
  {
    title: string;
    subtitle: string;
    instruction: string;
    discovery: string;
  }
> = {
  1: {
    title: 'GEAR WORKSHOP',
    subtitle: 'Make motion travel',
    instruction: 'Drag the three machine parts into their glowing places.',
    discovery: 'A gear can transfer rotation from one shaft to another.',
  },
  2: {
    title: 'BICYCLE WORKSHOP',
    subtitle: 'Build something that moves',
    instruction: 'Build the bicycle. The wheels stay still until you test it.',
    discovery: 'A machine works because many parts cooperate.',
  },
  3: {
    title: 'MOTOR LAB',
    subtitle: 'Turn electricity into motion',
    instruction: 'Assemble the motor and connect its moving parts.',
    discovery: 'A motor converts electrical energy into mechanical motion.',
  },
  4: {
    title: 'MOTORCYCLE WORKSHOP',
    subtitle: 'Build a moving machine',
    instruction: 'Put the motorcycle together, then take it for a test ride.',
    discovery: 'An engine, transmission, wheels and controls work as one system.',
  },
  5: {
    title: 'ROBOT LAB',
    subtitle: 'Build a machine that acts',
    instruction: 'Assemble the robot and watch its joints come alive.',
    discovery: 'Robots combine structure, motors and controlled movement.',
  },
};

const PART_LABELS: Record<PartId, string> = {
  bigGear: 'BIG GEAR',
  smallGear: 'SMALL GEAR',
  shaft: 'SHAFT',

  cycleFrame: 'FRAME',
  cycleWheelFront: 'FRONT WHEEL',
  cycleWheelBack: 'BACK WHEEL',
  cycleHandle: 'HANDLE',
  cycleSeat: 'SEAT',
  cyclePedal: 'PEDALS',

  motorBody: 'MOTOR',
  motorGear: 'GEAR',
  motorShaft: 'SHAFT',
  motorHousing: 'HOUSING',

  bikeFrame: 'FRAME',
  bikeWheelFront: 'FRONT WHEEL',
  bikeWheelBack: 'BACK WHEEL',
  bikeHandle: 'HANDLE',
  bikeSeat: 'SEAT',
  bikeEngine: 'ENGINE',
  bikeExhaust: 'EXHAUST',

  robotBase: 'BASE',
  robotBody: 'BODY',
  robotJoint: 'JOINT',
  robotArm: 'ARM',
  robotHead: 'HEAD',
  robotGripper: 'GRIPPER',
};

type PartDefinition = {
  id: PartId;
  position: THREE.Vector3;
  target: THREE.Vector3;
  create: () => THREE.Object3D;
};

type RuntimePart = {
  id: PartId;
  object: THREE.Object3D;
  target: THREE.Vector3;
  placed: boolean;
  basePosition: THREE.Vector3;
  radius: number;
};

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function mat(color: string, roughness = 0.65) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness: color === COLORS.metal || color === COLORS.silver ? 0.65 : 0.05,
  });
}

function basic(color: string) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.22,
    depthTest: false,
  });
}

function box(
  x: number,
  y: number,
  z: number,
  sx: number,
  sy: number,
  sz: number,
  material: THREE.Material,
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material,
  );
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(
  radius: number,
  height: number,
  material: THREE.Material,
  segments = 24,
) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material,
  );
}

function roundedPart(
  size: [number, number, number],
  color: string,
) {
  return box(
    0,
    0,
    0,
    size[0],
    size[1],
    size[2],
    mat(color),
  );
}

function makeGear(
  radius: number,
  teeth: number,
  color: string,
) {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.82, radius * 0.82, 0.24, 32),
    mat(color),
  );

  core.rotation.x = Math.PI / 2;
  group.add(core);

  for (let i = 0; i < teeth; i += 1) {
    const a = (i / teeth) * Math.PI * 2;
    const tooth = box(
      Math.cos(a) * radius * 0.92,
      Math.sin(a) * radius * 0.92,
      0,
      radius * 0.28,
      radius * 0.20,
      0.26,
      mat(color),
    );
    tooth.rotation.z = a;
    group.add(tooth);
  }

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.22, radius * 0.22, 0.30, 20),
    mat(COLORS.silver),
  );

  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  return group;
}

function makeWheel(radius: number) {
  const group = new THREE.Group();

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(radius * 0.84, radius * 0.13, 12, 32),
    mat(COLORS.rubber),
  );

  tire.rotation.x = Math.PI / 2;
  group.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, 0.10, 32),
    mat(COLORS.silver),
  );

  rim.rotation.x = Math.PI / 2;
  group.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.12, radius * 0.12, 0.20, 16),
    mat(COLORS.darkMetal),
  );

  hub.rotation.x = Math.PI / 2;
  group.add(hub);

  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2;
    const spoke = box(
      Math.cos(a) * radius * 0.38,
      Math.sin(a) * radius * 0.38,
      0,
      radius * 0.55,
      0.025,
      0.035,
      mat(COLORS.metal),
    );

    spoke.rotation.z = a;
    group.add(spoke);
  }

  return group;
}

function makeCycleFrame() {
  const group = new THREE.Group();

  const rearPoint = new THREE.Vector3(-0.65, -0.05, 0);
  const crankPoint = new THREE.Vector3(0.05, -0.15, 0);
  const frontPoint = new THREE.Vector3(0.70, 0.10, 0);
  const topPoint = new THREE.Vector3(0.05, 0.72, 0);

  const bars: Array<[THREE.Vector3, THREE.Vector3]> = [
    [rearPoint, crankPoint],
    [crankPoint, frontPoint],
    [rearPoint, topPoint],
    [topPoint, crankPoint],
    [topPoint, frontPoint],
  ];

  bars.forEach(([a, b]) => {
    const mid = new THREE.Vector3()
      .addVectors(a, b)
      .multiplyScalar(0.5);

    const length = a.distanceTo(b);

    const beam = box(
      mid.x,
      mid.y,
      0,
      0.10,
      length,
      0.12,
      mat(COLORS.purple),
    );

    beam.rotation.z =
      Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;

    group.add(beam);
  });

  const crankMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.10,
      0.10,
      0.18,
      20,
    ),
    mat(COLORS.darkMetal),
  );

  crankMesh.rotation.x = Math.PI / 2;
  crankMesh.position.set(0.05, -0.15, 0);

  group.add(crankMesh);

  return group;
}

function makeCycleHandle() {
  const group = new THREE.Group();

  const stem = box(
    0,
    0.22,
    0,
    0.08,
    0.50,
    0.08,
    mat(COLORS.darkMetal),
  );

  stem.rotation.z = -0.15;
  group.add(stem);

  const bar = box(
    0,
    0.47,
    0,
    0.62,
    0.08,
    0.08,
    mat(COLORS.darkMetal),
  );

  group.add(bar);

  return group;
}

function makePedal() {
  const group = new THREE.Group();

  const axle = cylinder(0.08, 0.20, mat(COLORS.darkMetal), 16);
  axle.rotation.x = Math.PI / 2;
  group.add(axle);

  const left = box(
    -0.20,
    0,
    0,
    0.35,
    0.07,
    0.07,
    mat(COLORS.yellow),
  );

  const right = box(
    0.20,
    0,
    0,
    0.35,
    0.07,
    0.07,
    mat(COLORS.yellow),
  );

  group.add(left);
  group.add(right);

  return group;
}

function makeMotor() {
  const group = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.48, 0.48, 1.15, 32),
    mat(COLORS.darkMetal),
  );

  body.rotation.z = Math.PI / 2;
  group.add(body);

  for (let i = -2; i <= 2; i += 1) {
    const fin = box(
      i * 0.16,
      0,
      0,
      0.055,
      0.78,
      0.76,
      mat(COLORS.metal),
    );

    fin.position.x = i * 0.16;
    group.add(fin);
  }

  const front = new THREE.Mesh(
    new THREE.CylinderGeometry(0.40, 0.40, 0.12, 32),
    mat(COLORS.silver),
  );

  front.rotation.z = Math.PI / 2;
  front.position.x = 0.60;
  group.add(front);

  const rotor = new THREE.Group();
  rotor.userData.motorRotor = true;

  const rotorHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.30, 20),
    mat(COLORS.yellow),
  );

  rotorHub.rotation.z = Math.PI / 2;
  rotorHub.position.x = 0.73;
  rotor.add(rotorHub);

  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;

    const blade = box(
      0.73,
      Math.cos(a) * 0.25,
      Math.sin(a) * 0.25,
      0.12,
      0.10,
      0.35,
      mat(COLORS.yellow),
    );

    blade.rotation.x = a;
    rotor.add(blade);
  }

  group.add(rotor);

  const terminal1 = box(
    -0.45,
    0.25,
    0.35,
    0.12,
    0.12,
    0.12,
    mat(COLORS.peach),
  );

  const terminal2 = box(
    -0.45,
    -0.25,
    0.35,
    0.12,
    0.12,
    0.12,
    mat(COLORS.sky),
  );

  group.add(terminal1);
  group.add(terminal2);

  return group;
}

function makeBikeFrame() {
  const group = new THREE.Group();

  const parts: Array<[THREE.Vector3, THREE.Vector3]> = [
    [
      new THREE.Vector3(-0.65, -0.05, 0),
      new THREE.Vector3(0.0, 0.55, 0),
    ],
    [
      new THREE.Vector3(0.0, 0.55, 0),
      new THREE.Vector3(0.65, 0.15, 0),
    ],
    [
      new THREE.Vector3(-0.65, -0.05, 0),
      new THREE.Vector3(0.65, 0.15, 0),
    ],
    [
      new THREE.Vector3(0.0, 0.55, 0),
      new THREE.Vector3(-0.15, 0.05, 0),
    ],
  ];

  parts.forEach(([a, b]) => {
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const length = a.distanceTo(b);

    const beam = box(
      mid.x,
      mid.y,
      0,
      0.13,
      length,
      0.16,
      mat(COLORS.sky),
    );

    beam.rotation.z =
      Math.atan2(b.y - a.y, b.x - a.x) - Math.PI / 2;

    group.add(beam);
  });

  return group;
}

function makeBikeHandle() {
  const group = new THREE.Group();

  const stem = box(
    0,
    0.25,
    0,
    0.10,
    0.52,
    0.10,
    mat(COLORS.darkMetal),
  );

  stem.rotation.z = -0.18;

  const bar = box(
    0,
    0.48,
    0,
    0.72,
    0.10,
    0.10,
    mat(COLORS.darkMetal),
  );

  group.add(stem);
  group.add(bar);

  return group;
}

function makeBikeEngine() {
  const group = new THREE.Group();

  const engine = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.60, 0.55),
    mat(COLORS.darkMetal),
  );

  engine.position.y = -0.05;
  group.add(engine);

  const cylinder1 = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.40, 20),
    mat(COLORS.metal),
  );

  cylinder1.rotation.z = Math.PI / 2;
  cylinder1.position.set(-0.10, 0.25, 0);
  group.add(cylinder1);

  const cylinder2 = cylinder1.clone();
  cylinder2.position.x = 0.20;
  group.add(cylinder2);

  const cover = box(
    0,
    -0.35,
    0,
    0.45,
    0.12,
    0.48,
    mat(COLORS.yellow),
  );

  group.add(cover);

  return group;
}

function makeExhaust() {
  const group = new THREE.Group();

  const pipe = cylinder(
    0.07,
    1.20,
    mat(COLORS.silver),
    20,
  );

  pipe.rotation.z = Math.PI / 2;
  pipe.position.x = 0.35;
  group.add(pipe);

  const muffler = cylinder(
    0.12,
    0.65,
    mat(COLORS.darkMetal),
    20,
  );

  muffler.rotation.z = Math.PI / 2;
  muffler.position.x = 0.78;
  group.add(muffler);

  return group;
}

function makeRobotBase() {
  const group = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.70, 0.78, 0.28, 32),
    mat(COLORS.darkMetal),
  );

  group.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.54, 0.07, 12, 32),
    mat(COLORS.yellow),
  );

  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.16;
  group.add(ring);

  return group;
}

function makeRobotBody() {
  const group = new THREE.Group();

  const torso = roundedPart(
    [0.90, 1.05, 0.55],
    COLORS.sky,
  );

  group.add(torso);

  const chest = box(
    0,
    0.18,
    0.30,
    0.42,
    0.26,
    0.05,
    mat(COLORS.yellow),
  );

  group.add(chest);

  const waist = new THREE.Mesh(
    new THREE.CylinderGeometry(0.28, 0.28, 0.20, 24),
    mat(COLORS.darkMetal),
  );

  waist.position.y = -0.62;
  group.add(waist);

  return group;
}

function makeRobotJoint() {
  const group = new THREE.Group();

  const joint = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 20, 20),
    mat(COLORS.yellow),
  );

  group.add(joint);

  const axle = cylinder(
    0.09,
    0.42,
    mat(COLORS.silver),
    16,
  );

  axle.rotation.z = Math.PI / 2;
  group.add(axle);

  return group;
}

function makeRobotArm() {
  const group = new THREE.Group();

  const upper = box(
    0,
    -0.35,
    0,
    0.24,
    0.70,
    0.24,
    mat(COLORS.metal),
  );

  upper.position.y = -0.35;
  group.add(upper);

  const elbow = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 18, 18),
    mat(COLORS.yellow),
  );

  elbow.position.y = -0.72;
  group.add(elbow);

  const lower = box(
    0,
    -0.35,
    0,
    0.20,
    0.70,
    0.20,
    mat(COLORS.silver),
  );

  lower.position.y = -1.03;
  group.add(lower);

  return group;
}

function makeRobotHead() {
  const group = new THREE.Group();

  const head = roundedPart(
    [0.62, 0.50, 0.52],
    COLORS.purple,
  );

  group.add(head);

  const visor = box(
    0,
    0.03,
    0.27,
    0.40,
    0.16,
    0.04,
    mat(COLORS.charcoal),
  );

  group.add(visor);

  const eye1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 12, 12),
    mat(COLORS.mint),
  );

  const eye2 = eye1.clone();

  eye1.position.set(-0.10, 0.03, 0.30);
  eye2.position.set(0.10, 0.03, 0.30);

  group.add(eye1);
  group.add(eye2);

  return group;
}

function makeRobotGripper() {
  const group = new THREE.Group();

  const wrist = cylinder(
    0.12,
    0.28,
    mat(COLORS.darkMetal),
    16,
  );

  wrist.rotation.x = Math.PI / 2;
  group.add(wrist);

  const palm = box(
    0,
    -0.18,
    0,
    0.30,
    0.18,
    0.18,
    mat(COLORS.silver),
  );

  group.add(palm);

  const finger1 = box(
    -0.12,
    -0.38,
    0,
    0.08,
    0.35,
    0.12,
    mat(COLORS.metal),
  );

  const finger2 = box(
    0.12,
    -0.38,
    0,
    0.08,
    0.35,
    0.12,
    mat(COLORS.metal),
  );

  group.add(finger1);
  group.add(finger2);

  group.userData.finger1 = finger1;
  group.userData.finger2 = finger2;

  return group;
}

function ghostMaterial() {
  return basic(COLORS.purple);
}

function makeGhostGear(radius: number) {
  const g = makeGear(radius, radius > 0.6 ? 14 : 10, COLORS.purple);
  g.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = ghostMaterial();
      child.renderOrder = 1;
    }
  });
  return g;
}

function makeGhostWheel(radius: number) {
  const g = makeWheel(radius);
  g.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = ghostMaterial();
      child.renderOrder = 1;
    }
  });
  return g;
}

function makeGhost(object: THREE.Object3D) {
  const clone = object.clone(true);

  clone.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.material = ghostMaterial();
      child.renderOrder = 1;
    }
  });

  return clone;
}

function addWorkshop(scene: THREE.Scene) {
  // Soft floor — stays behind the machines.
  const floor = box(
    0,
    -2.55,
    -0.65,
    9.0,
    0.18,
    5.2,
    mat('#E9E1D8'),
  );

  scene.add(floor);

  // Very light back wall.
  const backWall = box(
    0,
    1.1,
    -1.4,
    9.0,
    5.8,
    0.18,
    mat('#F8F1EC'),
  );

  scene.add(backWall);

  // Small workshop rail behind the machines.
  for (let i = -3; i <= 3; i += 1) {
    const tool = box(
      i * 0.72,
      1.72,
      -1.0,
      0.45,
      0.06,
      0.06,
      mat(
        i % 2 === 0
          ? COLORS.yellow
          : COLORS.mint,
      ),
    );

    tool.rotation.z = i * 0.08;
    scene.add(tool);
  }

  // Material tray/pad behind loose parts.
  const materialPad = box(
    0,
    -2.05,
    -0.25,
    7.4,
    0.04,
    1.25,
    mat('#F2EAE4'),
  );

  scene.add(materialPad);
}

function definitionsForMission(
  mission: Mission,
): PartDefinition[] {
  if (mission === 1) {
    return [
      {
        id: 'bigGear',
        position: new THREE.Vector3(-2.4, -2.05, 0.6),
        target: new THREE.Vector3(-0.85, 0.25, 0.6),
        create: () => makeGear(0.75, 14, COLORS.purple),
      },
      {
        id: 'smallGear',
        position: new THREE.Vector3(0, -2.05, 0.6),
        target: new THREE.Vector3(0.85, 0.25, 0.6),
        create: () => makeGear(0.48, 10, COLORS.peach),
      },
      {
        id: 'shaft',
        position: new THREE.Vector3(2.4, -2.05, 0.6),
        target: new THREE.Vector3(0, -0.82, 0.6),
        create: () => {
          const s = cylinder(
            0.09,
            1.45,
            mat(COLORS.silver),
            20,
          );
          s.rotation.z = Math.PI / 2;
          return s;
        },
      },
    ];
  }

  if (mission === 2) {
    return [
      {
        id: 'cycleFrame',
        position: new THREE.Vector3(-2.6, -1.75, 0.7),
        target: new THREE.Vector3(-0.05, 0.20, 0.7),
        create: makeCycleFrame,
      },
      {
        id: 'cycleWheelBack',
        position: new THREE.Vector3(-1.6, -2.05, 0.7),
        target: new THREE.Vector3(-0.85, -0.80, 0.7),
        create: () => makeWheel(0.58),
      },
      {
        id: 'cycleWheelFront',
        position: new THREE.Vector3(-0.35, -2.05, 0.7),
        target: new THREE.Vector3(0.85, -0.70, 0.7),
        create: () => makeWheel(0.58),
      },
      {
        id: 'cycleHandle',
        position: new THREE.Vector3(0.9, -2.0, 0.7),
        target: new THREE.Vector3(0.72, 0.88, 0.7),
        create: makeCycleHandle,
      },
      {
        id: 'cycleSeat',
        position: new THREE.Vector3(1.9, -2.0, 0.7),
        target: new THREE.Vector3(-0.05, 1.0, 0.7),
        create: () => {
          const g = new THREE.Group();

          const post = box(
            0,
            -0.15,
            0,
            0.07,
            0.35,
            0.07,
            mat(COLORS.darkMetal),
          );

          const seat = box(
            0,
            0.08,
            0,
            0.45,
            0.13,
            0.22,
            mat(COLORS.rubber),
          );

          g.add(post);
          g.add(seat);

          return g;
        },
      },
      {
        id: 'cyclePedal',
        position: new THREE.Vector3(2.8, -2.0, 0.7),
        target: new THREE.Vector3(0.05, -0.15, 0.75),
        create: makePedal,
      },
    ];
  }

  if (mission === 3) {
    return [
      {
        id: 'motorBody',
        position: new THREE.Vector3(-2.5, -1.8, 0.7),
        target: new THREE.Vector3(0, 0.45, 0.7),
        create: makeMotor,
      },
      {
        id: 'motorGear',
        position: new THREE.Vector3(0, -2.0, 0.7),
        target: new THREE.Vector3(0.85, 0.45, 0.72),
        create: () => makeGear(0.43, 10, COLORS.yellow),
      },
      {
        id: 'motorShaft',
        position: new THREE.Vector3(2.3, -2.0, 0.7),
        target: new THREE.Vector3(0.9, -0.15, 0.72),
        create: () => {
          const s = cylinder(
            0.08,
            1.25,
            mat(COLORS.silver),
            20,
          );
          s.rotation.z = Math.PI / 2;
          return s;
        },
      },
      {
        id: 'motorHousing',
        position: new THREE.Vector3(-1.2, -2.0, 0.7),
        target: new THREE.Vector3(0, -0.65, 0.65),
        create: () => {
          const h = box(
            0,
            0,
            0,
            1.9,
            0.15,
            1.15,
            mat(COLORS.darkMetal),
          );
          return h;
        },
      },
    ];
  }

  if (mission === 4) {
    return [
      {
        id: 'bikeFrame',
        position: new THREE.Vector3(-2.8, -1.7, 0.7),
        target: new THREE.Vector3(-0.05, 0.05, 0.7),
        create: makeBikeFrame,
      },
      {
        id: 'bikeWheelBack',
        position: new THREE.Vector3(-1.8, -2.05, 0.7),
        target: new THREE.Vector3(-0.82, -0.75, 0.7),
        create: () => makeWheel(0.62),
      },
      {
        id: 'bikeWheelFront',
        position: new THREE.Vector3(-0.5, -2.05, 0.7),
        target: new THREE.Vector3(0.92, -0.63, 0.7),
        create: () => makeWheel(0.62),
      },
      {
        id: 'bikeHandle',
        position: new THREE.Vector3(0.8, -2.0, 0.7),
        target: new THREE.Vector3(0.78, 0.95, 0.7),
        create: makeBikeHandle,
      },
      {
        id: 'bikeSeat',
        position: new THREE.Vector3(1.7, -2.0, 0.7),
        target: new THREE.Vector3(-0.12, 0.86, 0.7),
        create: () => {
          const g = new THREE.Group();

          g.add(
            box(
              0,
              -0.14,
              0,
              0.08,
              0.35,
              0.08,
              mat(COLORS.darkMetal),
            ),
          );

          g.add(
            box(
              0,
              0.08,
              0,
              0.48,
              0.13,
              0.25,
              mat(COLORS.rubber),
            ),
          );

          return g;
        },
      },
      {
        id: 'bikeEngine',
        position: new THREE.Vector3(2.5, -1.95, 0.7),
        target: new THREE.Vector3(0, -0.18, 0.75),
        create: makeBikeEngine,
      },
      {
        id: 'bikeExhaust',
        position: new THREE.Vector3(2.7, -1.1, 0.7),
        target: new THREE.Vector3(0.25, -0.48, 0.72),
        create: makeExhaust,
      },
    ];
  }

  return [
    {
      id: 'robotBase',
      position: new THREE.Vector3(-2.6, -1.9, 0.7),
      target: new THREE.Vector3(0, -1.05, 0.7),
      create: makeRobotBase,
    },
    {
      id: 'robotBody',
      position: new THREE.Vector3(-1.3, -1.8, 0.7),
      target: new THREE.Vector3(0, 0.05, 0.7),
      create: makeRobotBody,
    },
    {
      id: 'robotJoint',
      position: new THREE.Vector3(0, -2.0, 0.7),
      target: new THREE.Vector3(-0.58, 0.25, 0.72),
      create: makeRobotJoint,
    },
    {
      id: 'robotArm',
      position: new THREE.Vector3(1.3, -1.8, 0.7),
      target: new THREE.Vector3(-0.62, -0.20, 0.72),
      create: makeRobotArm,
    },
    {
      id: 'robotHead',
      position: new THREE.Vector3(2.5, -1.9, 0.7),
      target: new THREE.Vector3(0, 0.95, 0.72),
      create: makeRobotHead,
    },
    {
      id: 'robotGripper',
      position: new THREE.Vector3(2.5, -0.85, 0.7),
      target: new THREE.Vector3(-0.62, -0.95, 0.75),
      create: makeRobotGripper,
    },
  ];
}

function allPlaced(runtime: Map<PartId, RuntimePart>) {
  for (const p of runtime.values()) {
    if (!p.placed) return false;
  }
  return true;
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

export default function Manufacturing() {
  const router = useRouter();

  const [mission, setMission] = useState<Mission>(1);
  const [placed, setPlaced] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState(
    MISSION_INFO[1].instruction,
  );
  const [completed, setCompleted] = useState(false);

  const missionRef = useRef<Mission>(1);
  const placedRef = useRef<Record<string, boolean>>({});
  const runningRef = useRef(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const glRef = useRef<any>(null);
  const runtimeRef = useRef<Map<PartId, RuntimePart>>(
    new Map(),
  );

  const dragRef = useRef<{
    id: PartId;
    offset: THREE.Vector3;
  } | null>(null);

  const frameRef = useRef<number | null>(null);
  const timeRef = useRef(0);
  const lastTimeRef = useRef(0);

  const viewSizeRef = useRef({
    width: 1,
    height: 1,
  });

  const rebuildScene = (
    scene: THREE.Scene,
    nextMission: Mission,
  ) => {
    while (scene.children.length > 0) {
      const child = scene.children[scene.children.length - 1];

      scene.remove(child);
      disposeObject(child);
    }

    addWorkshop(scene);

    const definitions = definitionsForMission(nextMission);
    const runtime = new Map<PartId, RuntimePart>();

    definitions.forEach((definition) => {
      const ghost = makeGhost(definition.create());
      ghost.position.copy(definition.target);
      ghost.scale.setScalar(1.03);
      scene.add(ghost);

      const object = definition.create();

      object.position.copy(definition.position);
      object.userData.partId = definition.id;

      object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData.partId = definition.id;
          child.renderOrder = 10;
        }
      });

      scene.add(object);

      runtime.set(definition.id, {
        id: definition.id,
        object,
        target: definition.target.clone(),
        placed: false,
        basePosition: definition.position.clone(),
        radius: 0.85,
      });
    });

    runtimeRef.current = runtime;
  };

  const runMachine = () => {
    if (!allPlaced(runtimeRef.current)) {
      setMessage('Put every part in place first.');
      return;
    }

    runningRef.current = !runningRef.current;
    setRunning(runningRef.current);

    if (runningRef.current) {
      timeRef.current = 0;
      lastTimeRef.current = 0;
      setMessage('MACHINE RUNNING — WATCH WHAT HAPPENS!');
    } else {
      setMessage(MISSION_INFO[missionRef.current].instruction);
    }
  };

  const finishMission = () => {
    runningRef.current = false;
    setRunning(false);
    setCompleted(true);
    setMessage(
      MISSION_INFO[missionRef.current].discovery,
    );
  };

  const nextMission = () => {
    if (missionRef.current >= 5) {
      router.back();
      return;
    }

    const next = (missionRef.current + 1) as Mission;

    missionRef.current = next;
    setMission(next);

    placedRef.current = {};
    setPlaced({});
    setCompleted(false);
    runningRef.current = false;
    setRunning(false);

    setMessage(MISSION_INFO[next].instruction);

    if (sceneRef.current) {
      rebuildScene(sceneRef.current, next);
    }
  };

  const handleTouchStart = (event: any) => {
    const camera = cameraRef.current;

    if (!camera) return;

    const { locationX, locationY } = event.nativeEvent;

    const width = Math.max(viewSizeRef.current.width, 1);
    const height = Math.max(viewSizeRef.current.height, 1);

    pointer.x = (locationX / width) * 2 - 1;
    pointer.y = -(locationY / height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const objects: THREE.Object3D[] = [];

    runtimeRef.current.forEach((part) => {
      if (!part.placed) {
        objects.push(part.object);
      }
    });

    const hits = raycaster.intersectObjects(
      objects,
      true,
    );

    if (!hits.length) return;

    let selected: THREE.Object3D | null =
      hits[0].object;

    let id: PartId | undefined;

    while (selected) {
      if (selected.userData.partId) {
        id = selected.userData.partId;
        break;
      }

      selected = selected.parent;
    }

    if (!id) return;

    const runtime = runtimeRef.current.get(id);

    if (!runtime || runtime.placed) return;

    const plane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      -0.65,
    );

    const hitPoint = new THREE.Vector3();

    if (!raycaster.ray.intersectPlane(plane, hitPoint)) {
      return;
    }

    dragRef.current = {
      id,
      offset: runtime.object.position
        .clone()
        .sub(hitPoint),
    };
  };

  const handleTouchMove = (event: any) => {
    if (!dragRef.current) return;

    const camera = cameraRef.current;

    if (!camera) return;

    const { locationX, locationY } = event.nativeEvent;

    const width = Math.max(viewSizeRef.current.width, 1);
    const height = Math.max(viewSizeRef.current.height, 1);

    pointer.x = (locationX / width) * 2 - 1;
    pointer.y = -(locationY / height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const plane = new THREE.Plane(
      new THREE.Vector3(0, 0, 1),
      -0.65,
    );

    const hitPoint = new THREE.Vector3();

    if (!raycaster.ray.intersectPlane(plane, hitPoint)) {
      return;
    }

    const runtime = runtimeRef.current.get(
      dragRef.current.id,
    );

    if (!runtime) return;

    runtime.object.position.copy(
      hitPoint.add(dragRef.current.offset),
    );
  };

  const handleTouchEnd = () => {
    if (!dragRef.current) return;

    const id = dragRef.current.id;
    const runtime = runtimeRef.current.get(id);

    dragRef.current = null;

    if (!runtime) return;

    const distance = runtime.object.position.distanceTo(
      runtime.target,
    );

    if (distance < 0.85) {
      runtime.object.position.copy(runtime.target);
      runtime.placed = true;

      placedRef.current = {
        ...placedRef.current,
        [id]: true,
      };

      setPlaced({
        ...placedRef.current,
      });

      const finished = allPlaced(runtimeRef.current);

      if (finished) {
        setMessage(
          'ASSEMBLY COMPLETE! Press RUN MACHINE.',
        );
      } else {
        setMessage(
          `${PART_LABELS[id]} snapped into place.`,
        );
      }
    } else {
      runtime.object.position.copy(
        runtime.basePosition,
      );

      setMessage(
        'Almost! Move the part closer to its glowing place.',
      );
    }
  };

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      rendererRef.current?.dispose();
    };
  }, []);

  const animate = () => {
    frameRef.current = requestAnimationFrame(animate);

    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    if (!scene || !camera || !renderer) return;

    const now = performance.now();

    if (!lastTimeRef.current) {
      lastTimeRef.current = now;
    }

    const dt = Math.min(
      (now - lastTimeRef.current) / 1000,
      0.05,
    );

    lastTimeRef.current = now;

    if (runningRef.current) {
      timeRef.current += dt;

      const t = timeRef.current;
      const currentMission = missionRef.current;
      const runtime = runtimeRef.current;

      if (currentMission === 1) {
        const big = runtime.get('bigGear');
        const small = runtime.get('smallGear');
        const shaft = runtime.get('shaft');

        if (big) big.object.rotation.z += dt * 1.8;
        if (small) small.object.rotation.z -= dt * 2.8;
        if (shaft) shaft.object.rotation.x += dt * 3.2;

        if (t > 3.5 && !completed) {
          finishMission();
        }
      }

      if (currentMission === 2) {
        const travel =
          Math.sin(t * 0.85) * 1.9;

        runtime.forEach((part) => {
          if (
            part.id !== 'cycleWheelFront' &&
            part.id !== 'cycleWheelBack'
          ) {
            part.object.position.x =
              part.basePosition.x + travel;
          }
        });

        const front = runtime.get('cycleWheelFront');
        const back = runtime.get('cycleWheelBack');
        const pedal = runtime.get('cyclePedal');

        if (front) {
          front.object.position.x =
            front.target.x + travel;
          front.object.rotation.z -= dt * 3.8;
        }

        if (back) {
          back.object.position.x =
            back.target.x + travel;
          back.object.rotation.z -= dt * 3.8;
        }

        if (pedal) {
          pedal.object.position.x =
            pedal.target.x + travel;
          pedal.object.rotation.z -= dt * 5.5;
        }

        if (t > 5 && !completed) {
          finishMission();
        }
      }

      if (currentMission === 3) {
        const motor = runtime.get('motorBody');
        const gear = runtime.get('motorGear');
        const shaft = runtime.get('motorShaft');

        if (motor) {
          motor.object.traverse((child) => {
            if (child.userData.motorRotor) {
              child.rotation.x += dt * 8;
            }
          });
        }

        if (gear) {
          gear.object.rotation.z += dt * 4;
        }

        if (shaft) {
          shaft.object.rotation.x += dt * 6;
        }

        if (t > 4 && !completed) {
          finishMission();
        }
      }

      if (currentMission === 4) {
        const travel =
          Math.sin(t * 0.72) * 2.25;

        runtime.forEach((part) => {
          if (
            part.id !== 'bikeWheelFront' &&
            part.id !== 'bikeWheelBack'
          ) {
            part.object.position.x =
              part.target.x + travel;
          }
        });

        const front = runtime.get('bikeWheelFront');
        const back = runtime.get('bikeWheelBack');

        if (front) {
          front.object.position.x =
            front.target.x + travel;
          front.object.rotation.z -= dt * 4.6;
        }

        if (back) {
          back.object.position.x =
            back.target.x + travel;
          back.object.rotation.z -= dt * 4.6;
        }

        if (t > 6 && !completed) {
          finishMission();
        }
      }

      if (currentMission === 5) {
        const body = runtime.get('robotBody');
        const joint = runtime.get('robotJoint');
        const arm = runtime.get('robotArm');
        const head = runtime.get('robotHead');
        const gripper = runtime.get('robotGripper');

        if (body) {
          body.object.rotation.y =
            Math.sin(t * 1.2) * 0.20;
        }

        if (joint) {
          joint.object.rotation.y =
            Math.sin(t * 1.8) * 0.50;
        }

        if (arm) {
          arm.object.rotation.z =
            -0.35 +
            Math.sin(t * 2.0) * 0.55;
        }

        if (head) {
          head.object.rotation.y =
            Math.sin(t * 1.1) * 0.35;
        }

        if (gripper) {
          const f1 =
            gripper.object.userData.finger1 as
              | THREE.Object3D
              | undefined;

          const f2 =
            gripper.object.userData.finger2 as
              | THREE.Object3D
              | undefined;

          const open =
            Math.sin(t * 2.4) * 0.08;

          if (f1) f1.position.x = -0.12 - open;
          if (f2) f2.position.x = 0.12 + open;

          gripper.object.rotation.z =
            Math.sin(t * 1.8) * 0.25;
        }

        if (t > 5 && !completed) {
          finishMission();
        }
      }
    }

    renderer.render(scene, camera);

    // Expo GL requires this every frame.
    // This is important for visible animation.
    const gl = glRef.current;

    if (gl && typeof gl.endFrameEXP === 'function') {
      gl.endFrameEXP();
    }
  };

  const onContextCreate = async (gl: any) => {
    glRef.current = gl;

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(
      COLORS.background,
    );

    const camera = new THREE.PerspectiveCamera(
      58,
      1,
      0.1,
      100,
    );

    camera.position.set(0, 0.15, 9.5);
    camera.lookAt(0, 0, 0);

    const renderer =
      new THREE.WebGLRenderer({
        context: gl,
        antialias: true,
        alpha: false,
      });

    renderer.setClearColor(
      COLORS.background,
      1,
    );

    renderer.setPixelRatio(1.25);

    const hemi = new THREE.HemisphereLight(
      0xffffff,
      0xD8C9C0,
      2.8,
    );

    scene.add(hemi);

    const key = new THREE.DirectionalLight(
      0xffffff,
      2.4,
    );

    key.position.set(4, 7, 8);
    scene.add(key);

    const fill = new THREE.DirectionalLight(
      0xF5E9FF,
      1.6,
    );

    fill.position.set(-5, 3, 6);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(
      0xDCEEFF,
      1.2,
    );

    rim.position.set(0, 4, -3);
    scene.add(rim);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    rebuildScene(
      scene,
      missionRef.current,
    );

    animate();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              CONSTELLATION · TECH LAB
            </Text>

            <Text style={styles.title}>
              {MISSION_INFO[mission].title}
            </Text>

            <Text style={styles.subtitle}>
              {MISSION_INFO[mission].subtitle}
            </Text>
          </View>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              EXIT
            </Text>
          </Pressable>
        </View>

        <View style={styles.progressRow}>
          <Text style={styles.missionText}>
            MISSION {mission} OF 5
          </Text>

          <Text style={styles.statusText}>
            {running
              ? '● RUNNING'
              : completed
                ? '✓ COMPLETE'
                : `${Object.keys(placed).length} PARTS`}
          </Text>
        </View>

        <View
          style={styles.glContainer}
          onLayout={(event) => {
            const {
              width,
              height,
            } = event.nativeEvent.layout;

            viewSizeRef.current = {
              width,
              height,
            };

            const camera = cameraRef.current;

            if (camera) {
              camera.aspect =
                Math.max(width, 1) /
                Math.max(height, 1);

              camera.updateProjectionMatrix();
            }

            const renderer =
              rendererRef.current;

            if (renderer) {
              renderer.setSize(
                Math.max(width, 1),
                Math.max(height, 1),
                false,
              );
            }
          }}
        >
          <GLView
            style={StyleSheet.absoluteFill}
            onContextCreate={onContextCreate}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />

          <View
            pointerEvents="none"
            style={styles.labLabel}
          >
            <Text style={styles.labLabelText}>
              DRAG PARTS → GLOWING PLACES
            </Text>
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.messageBox}>
            <Text style={styles.message}>
              {message}
            </Text>
          </View>

          {!completed && (
            <Pressable
              style={[
                styles.runButton,
                !allPlaced(runtimeRef.current) &&
                  styles.runDisabled,
              ]}
              onPress={runMachine}
            >
              <Text style={styles.runText}>
                {running
                  ? 'STOP MACHINE'
                  : 'RUN MACHINE'}
              </Text>
            </Pressable>
          )}

          {completed && (
            <View style={styles.discoveryBox}>
              <Text style={styles.discoveryTitle}>
                YOU DISCOVERED
              </Text>

              <Text style={styles.discoveryText}>
                {MISSION_INFO[mission].discovery}
              </Text>

              <Pressable
                style={styles.nextButton}
                onPress={nextMission}
              >
                <Text style={styles.nextText}>
                  {mission === 5
                    ? 'BACK TO TECH LAB'
                    : 'NEXT MISSION →'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
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
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  eyebrow: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },

  title: {
    marginTop: 3,
    color: COLORS.charcoal,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },

  subtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '600',
  },

  backButton: {
    minWidth: 52,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backText: {
    color: COLORS.charcoal,
    fontSize: 11,
    fontWeight: '900',
  },

  progressRow: {
    paddingHorizontal: 18,
    paddingBottom: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  missionText: {
    color: COLORS.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  statusText: {
    color: COLORS.purple,
    fontSize: 10,
    fontWeight: '900',
  },

  glContainer: {
    flex: 1,
    marginHorizontal: 10,
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  labLabel: {
    position: 'absolute',
    left: 16,
    top: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: 'rgba(255,253,251,0.88)',
  },

  labLabelText: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  bottom: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },

  messageBox: {
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: COLORS.paper,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
  },

  message: {
    color: COLORS.charcoal,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  runButton: {
    marginTop: 8,
    minHeight: 50,
    borderRadius: 17,
    backgroundColor: COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  runDisabled: {
    opacity: 0.55,
  },

  runText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  discoveryBox: {
    marginTop: 8,
    padding: 13,
    borderRadius: 18,
    backgroundColor: COLORS.softPurple,
    borderWidth: 1,
    borderColor: '#DCCEF3',
  },

  discoveryTitle: {
    color: COLORS.purpleDark,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
  },

  discoveryText: {
    marginTop: 4,
    color: COLORS.charcoal,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
    textAlign: 'center',
  },

  nextButton: {
    marginTop: 9,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: COLORS.paper,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  nextText: {
    color: COLORS.purpleDark,
    fontSize: 12,
    fontWeight: '900',
  },
});
