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
  | 'shaft'
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
  title: string;
  subtitle: string;
  parts: PartId[];
};

const MISSIONS: Mission[] = [
  {
    title: 'GEAR MACHINE',
    subtitle: 'Transfer motion from one gear to another',
    parts: ['bigGear', 'smallGear', 'shaft'],
  },
  {
    title: 'BICYCLE WORKSHOP',
    subtitle: 'Build a bicycle from separate parts',
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
    title: 'MOTOR LAB',
    subtitle: 'Turn electrical energy into mechanical motion',
    parts: [
      'motor',
      'motorGear',
      'motorShaft',
      'motorHousing',
    ],
  },
  {
    title: 'MOTORCYCLE WORKSHOP',
    subtitle: 'Assemble a complete working machine',
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
    title: 'ADVANCED ROBOT LAB',
    subtitle: 'Build an articulated robotic machine',
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
  bigGear: new THREE.Vector3(-2.65, 1.55, 0.5),
  smallGear: new THREE.Vector3(2.65, 1.55, 0.5),
  shaft: new THREE.Vector3(2.65, 0.25, 0.5),

  cycleFrame: new THREE.Vector3(-2.55, 1.45, 0.5),
  cycleRearWheel: new THREE.Vector3(-2.55, 0.15, 0.5),
  cycleFrontWheel: new THREE.Vector3(-2.55, -1.05, 0.5),
  cycleHandle: new THREE.Vector3(2.55, 1.45, 0.5),
  cycleSeat: new THREE.Vector3(2.55, 0.25, 0.5),
  cyclePedal: new THREE.Vector3(2.55, -0.95, 0.5),

  motor: new THREE.Vector3(-2.55, 1.45, 0.5),
  motorGear: new THREE.Vector3(-2.55, 0.15, 0.5),
  motorShaft: new THREE.Vector3(-2.55, -1.05, 0.5),
  motorHousing: new THREE.Vector3(2.55, 0.7, 0.5),

  bikeFrame: new THREE.Vector3(-2.55, 1.45, 0.5),
  bikeRearWheel: new THREE.Vector3(-2.55, 0.15, 0.5),
  bikeFrontWheel: new THREE.Vector3(-2.55, -1.05, 0.5),
  bikeHandle: new THREE.Vector3(2.55, 1.45, 0.5),
  bikeSeat: new THREE.Vector3(2.55, 0.25, 0.5),
  bikeEngine: new THREE.Vector3(2.55, -0.55, 0.5),
  bikeExhaust: new THREE.Vector3(2.55, -1.35, 0.5),

  robotBase: new THREE.Vector3(-2.55, 1.45, 0.5),
  robotTorso: new THREE.Vector3(-2.55, 0.15, 0.5),
  robotShoulder: new THREE.Vector3(-2.55, -1.05, 0.5),
  robotUpperArm: new THREE.Vector3(2.55, 1.45, 0.5),
  robotForearm: new THREE.Vector3(2.55, 0.65, 0.5),
  robotWrist: new THREE.Vector3(2.55, -0.15, 0.5),
  robotHead: new THREE.Vector3(2.55, -0.95, 0.5),
  robotGripper: new THREE.Vector3(2.55, -1.65, 0.5),
};

const TARGET: Record<PartId, THREE.Vector3> = {
  bigGear: new THREE.Vector3(-0.75, 0.35, 0.5),
  smallGear: new THREE.Vector3(0.75, 0.35, 0.5),
  shaft: new THREE.Vector3(0, -0.9, 0.5),

  cycleFrame: new THREE.Vector3(0, -0.05, 0.5),
  cycleRearWheel: new THREE.Vector3(-0.9, -0.45, 0.5),
  cycleFrontWheel: new THREE.Vector3(0.95, -0.45, 0.5),
  cycleHandle: new THREE.Vector3(0.92, 0.78, 0.5),
  cycleSeat: new THREE.Vector3(-0.3, 0.78, 0.5),
  cyclePedal: new THREE.Vector3(0.05, -0.25, 0.5),

  motor: new THREE.Vector3(-0.35, 0.3, 0.5),
  motorGear: new THREE.Vector3(0.85, 0.3, 0.5),
  motorShaft: new THREE.Vector3(0.82, -0.25, 0.5),
  motorHousing: new THREE.Vector3(-0.05, -0.75, 0.5),

  bikeFrame: new THREE.Vector3(0, 0.0, 0.5),
  bikeRearWheel: new THREE.Vector3(-0.9, -0.55, 0.5),
  bikeFrontWheel: new THREE.Vector3(0.95, -0.55, 0.5),
  bikeHandle: new THREE.Vector3(0.88, 0.78, 0.5),
  bikeSeat: new THREE.Vector3(-0.25, 0.78, 0.5),
  bikeEngine: new THREE.Vector3(0, -0.3, 0.5),
  bikeExhaust: new THREE.Vector3(0.38, -0.65, 0.5),

  robotBase: new THREE.Vector3(0, -0.95, 0.5),
  robotTorso: new THREE.Vector3(0, -0.05, 0.5),
  robotShoulder: new THREE.Vector3(0.55, 0.45, 0.5),
  robotUpperArm: new THREE.Vector3(0.95, 0.1, 0.5),
  robotForearm: new THREE.Vector3(1.15, -0.35, 0.5),
  robotWrist: new THREE.Vector3(1.15, -0.8, 0.5),
  robotHead: new THREE.Vector3(0, 0.78, 0.5),
  robotGripper: new THREE.Vector3(1.15, -1.18, 0.5),
};

const LABEL: Record<PartId, string> = {
  bigGear: 'BIG GEAR',
  smallGear: 'SMALL GEAR',
  shaft: 'SHAFT',

  cycleFrame: 'FRAME',
  cycleRearWheel: 'REAR WHEEL',
  cycleFrontWheel: 'FRONT WHEEL',
  cycleHandle: 'HANDLE',
  cycleSeat: 'SEAT',
  cyclePedal: 'PEDALS',

  motor: 'MOTOR',
  motorGear: 'MOTOR GEAR',
  motorShaft: 'MOTOR SHAFT',
  motorHousing: 'HOUSING',

  bikeFrame: 'FRAME',
  bikeRearWheel: 'REAR WHEEL',
  bikeFrontWheel: 'FRONT WHEEL',
  bikeHandle: 'HANDLE',
  bikeSeat: 'SEAT',
  bikeEngine: 'ENGINE',
  bikeExhaust: 'EXHAUST',

  robotBase: 'BASE',
  robotTorso: 'TORSO',
  robotShoulder: 'SHOULDER',
  robotUpperArm: 'UPPER ARM',
  robotForearm: 'FOREARM',
  robotWrist: 'WRIST',
  robotHead: 'HEAD',
  robotGripper: 'GRIPPER',
};

function mat(color: number, metal = 0.2) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: metal,
  });
}

function makeGear(
  radius: number,
  teeth: number,
  depth: number,
  color: number,
) {
  const shape = new THREE.Shape();
  const inner = radius * 0.76;
  const points = teeth * 4;

  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const phase = i % 4;
    const r =
      phase === 1 || phase === 2
        ? radius
        : inner;

    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
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

  const geometry = new THREE.ExtrudeGeometry(
    shape,
    {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: radius * 0.035,
      bevelThickness: radius * 0.035,
    },
  );

  geometry.center();

  const gear = new THREE.Mesh(
    geometry,
    mat(color, 0.35),
  );

  gear.userData.isPart = true;

  return gear;
}

function makeCylinder(
  radius: number,
  height: number,
  color: number,
) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(
      radius,
      radius,
      height,
      32,
    ),
    mat(color, 0.5),
  );
}

function makeBox(
  size: THREE.Vector3,
  color: number,
) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(
      size.x,
      size.y,
      size.z,
    ),
    mat(color, 0.2),
  );
}

function makeWheel(radius: number, color: number) {
  const wheel = new THREE.Group();

  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(
      radius,
      radius * 0.13,
      12,
      32,
    ),
    mat(color, 0.15),
  );

  wheel.add(tire);

  const hub = makeCylinder(
    radius * 0.18,
    0.18,
    0x9b83d7,
  );

  hub.rotation.x = Math.PI / 2;
  wheel.add(hub);

  return wheel;
}

function makeFrame(color: number) {
  const g = new THREE.Group();

  const top = makeBox(
    new THREE.Vector3(1.65, 0.11, 0.18),
    color,
  );
  top.rotation.z = -0.12;
  top.position.set(0, 0.3, 0);
  g.add(top);

  const down = makeBox(
    new THREE.Vector3(1.15, 0.11, 0.18),
    color,
  );
  down.rotation.z = -0.9;
  down.position.set(-0.12, -0.08, 0);
  g.add(down);

  const rear = makeBox(
    new THREE.Vector3(0.95, 0.1, 0.16),
    color,
  );
  rear.rotation.z = 0.55;
  rear.position.set(-0.58, -0.18, 0);
  g.add(rear);

  const front = makeBox(
    new THREE.Vector3(0.9, 0.1, 0.16),
    color,
  );
  front.rotation.z = 1.0;
  front.position.set(0.58, -0.18, 0);
  g.add(front);

  return g;
}

function makeHandle(color: number) {
  const g = new THREE.Group();

  const stem = makeBox(
    new THREE.Vector3(0.1, 0.75, 0.14),
    color,
  );
  stem.rotation.z = -0.18;
  stem.position.y = -0.28;
  g.add(stem);

  const bar = makeBox(
    new THREE.Vector3(0.65, 0.11, 0.14),
    color,
  );
  bar.rotation.z = 0.1;
  bar.position.set(0.08, 0.05, 0);
  g.add(bar);

  return g;
}

function makePedal() {
  const g = new THREE.Group();

  const crank = makeCylinder(
    0.11,
    0.18,
    0xf2c96d,
  );
  crank.rotation.x = Math.PI / 2;
  g.add(crank);

  const arm = makeBox(
    new THREE.Vector3(0.58, 0.08, 0.12),
    0xf2c96d,
  );
  arm.position.x = 0.25;
  g.add(arm);

  const pedal = makeBox(
    new THREE.Vector3(0.25, 0.1, 0.18),
    0x34313a,
  );
  pedal.position.x = 0.55;
  g.add(pedal);

  return g;
}

function makeMotor() {
  const g = new THREE.Group();

  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(
      0.48,
      0.48,
      1.15,
      32,
    ),
    mat(0x82b8e8, 0.55),
  );

  body.rotation.z = Math.PI / 2;
  g.add(body);

  for (let i = -2; i <= 2; i += 1) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.49,
        0.035,
        8,
        24,
      ),
      mat(0x5d7896, 0.6),
    );

    ring.rotation.y = Math.PI / 2;
    ring.position.x = i * 0.18;
    g.add(ring);
  }

  return g;
}

function makeMotorHousing() {
  const g = new THREE.Group();

  const base = makeBox(
    new THREE.Vector3(1.65, 0.28, 0.85),
    0xdccff4,
  );

  g.add(base);

  const support = makeBox(
    new THREE.Vector3(0.22, 0.75, 0.65),
    0x9b83d7,
  );

  support.position.y = 0.45;
  g.add(support);

  return g;
}

function makeMotorcycleFrame() {
  const g = new THREE.Group();

  const main = makeBox(
    new THREE.Vector3(2.0, 0.16, 0.2),
    0x7655b5,
  );
  main.rotation.z = -0.08;
  g.add(main);

  const down = makeBox(
    new THREE.Vector3(1.15, 0.16, 0.2),
    0x8b6fc7,
  );
  down.rotation.z = -0.9;
  down.position.set(-0.05, -0.38, 0);
  g.add(down);

  const rear = makeBox(
    new THREE.Vector3(0.95, 0.14, 0.18),
    0x7655b5,
  );
  rear.rotation.z = 0.35;
  rear.position.set(-0.65, -0.3, 0);
  g.add(rear);

  const front = makeBox(
    new THREE.Vector3(1.0, 0.14, 0.18),
    0x7655b5,
  );
  front.rotation.z = 1.05;
  front.position.set(0.65, -0.2, 0);
  g.add(front);

  return g;
}

function makeEngine() {
  const g = new THREE.Group();

  const block = makeBox(
    new THREE.Vector3(0.8, 0.7, 0.55),
    0x82b8e8,
  );
  g.add(block);

  const cylinderHead = makeCylinder(
    0.34,
    0.62,
    0x5d7896,
  );
  cylinderHead.rotation.z = Math.PI / 2;
  cylinderHead.position.y = 0.18;
  g.add(cylinderHead);

  return g;
}

function makeExhaust() {
  const g = new THREE.Group();

  const pipe = makeBox(
    new THREE.Vector3(1.25, 0.13, 0.13),
    0x817985,
  );
  pipe.rotation.z = -0.18;
  g.add(pipe);

  const muffler = makeCylinder(
    0.16,
    0.55,
    0x34313a,
  );
  muffler.rotation.z = Math.PI / 2;
  muffler.position.x = 0.48;
  muffler.position.y = -0.15;
  g.add(muffler);

  return g;
}

function makeRobotBase() {
  const g = new THREE.Group();

  const base = makeCylinder(
    0.72,
    0.3,
    0x7655b5,
  );
  g.add(base);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(
      0.62,
      0.07,
      12,
      32,
    ),
    mat(0xf2c96d, 0.6),
  );
  g.add(ring);

  return g;
}

function makeRobotTorso() {
  const g = new THREE.Group();

  const body = makeBox(
    new THREE.Vector3(0.9, 1.0, 0.6),
    0x82b8e8,
  );
  g.add(body);

  const chest = makeBox(
    new THREE.Vector3(0.62, 0.42, 0.08),
    0x34313a,
  );
  chest.position.z = 0.34;
  g.add(chest);

  return g;
}

function makeRobotShoulder() {
  const g = new THREE.Group();

  const joint = makeCylinder(
    0.27,
    0.3,
    0xf2c96d,
  );
  joint.rotation.x = Math.PI / 2;
  g.add(joint);

  const housing = makeBox(
    new THREE.Vector3(0.5, 0.34, 0.48),
    0x7655b5,
  );
  housing.position.x = 0.22;
  g.add(housing);

  return g;
}

function makeRobotArm(length: number) {
  const g = new THREE.Group();

  const arm = makeBox(
    new THREE.Vector3(
      0.18,
      length,
      0.3,
    ),
    0x82b8e8,
  );

  g.add(arm);

  const joint = makeCylinder(
    0.22,
    0.28,
    0xf2c96d,
  );
  joint.rotation.x = Math.PI / 2;
  joint.position.y =
    -length / 2;
  g.add(joint);

  return g;
}

function makeRobotWrist() {
  const g = new THREE.Group();

  const joint = makeCylinder(
    0.2,
    0.28,
    0xf2c96d,
  );
  joint.rotation.x = Math.PI / 2;
  g.add(joint);

  const connector = makeBox(
    new THREE.Vector3(0.2, 0.45, 0.25),
    0x7655b5,
  );
  connector.position.y = -0.25;
  g.add(connector);

  return g;
}

function makeRobotHead() {
  const g = new THREE.Group();

  const head = makeBox(
    new THREE.Vector3(0.7, 0.6, 0.55),
    0x82b8e8,
  );
  g.add(head);

  const visor = makeBox(
    new THREE.Vector3(0.46, 0.16, 0.06),
    0x34313a,
  );
  visor.position.z = 0.3;
  g.add(visor);

  const antenna = makeCylinder(
    0.055,
    0.35,
    0xf2c96d,
  );
  antenna.position.y = 0.45;
  g.add(antenna);

  const light = makeCylinder(
    0.1,
    0.08,
    0xf2c96d,
  );
  light.rotation.x = Math.PI / 2;
  light.position.set(0, 0.63, 0);
  g.add(light);

  return g;
}

function makeGripper() {
  const g = new THREE.Group();

  const palm = makeBox(
    new THREE.Vector3(0.32, 0.28, 0.28),
    0x7655b5,
  );
  g.add(palm);

  const finger1 = makeBox(
    new THREE.Vector3(0.12, 0.42, 0.14),
    0x82b8e8,
  );
  finger1.position.set(
    -0.13,
    -0.3,
    0,
  );
  finger1.rotation.z = -0.35;
  g.add(finger1);

  const finger2 = finger1.clone();
  finger2.position.x = 0.13;
  finger2.rotation.z = 0.35;
  g.add(finger2);

  return g;
}

function createPart(id: PartId) {
  switch (id) {
    case 'bigGear':
      return makeGear(
        0.78,
        16,
        0.24,
        0xdccff4,
      );

    case 'smallGear':
      return makeGear(
        0.5,
        12,
        0.24,
        0xf2b38f,
      );

    case 'shaft': {
      const g = new THREE.Group();

      const shaft = makeCylinder(
        0.13,
        2.1,
        0x9b83d7,
      );
      shaft.rotation.z = Math.PI / 2;
      g.add(shaft);

      return g;
    }

    case 'cycleFrame':
      return makeFrame(0x8b6fc7);

    case 'cycleRearWheel':
    case 'cycleFrontWheel':
      return makeWheel(0.58, 0x34313a);

    case 'cycleHandle':
      return makeHandle(0x7655b5);

    case 'cycleSeat': {
      const g = new THREE.Group();

      const post = makeBox(
        new THREE.Vector3(0.09, 0.45, 0.1),
        0x817985,
      );
      post.position.y = -0.2;
      g.add(post);

      const seat = makeBox(
        new THREE.Vector3(0.55, 0.14, 0.3),
        0x34313a,
      );
      seat.position.y = 0.08;
      g.add(seat);

      return g;
    }

    case 'cyclePedal':
      return makePedal();

    case 'motor':
      return makeMotor();

    case 'motorGear':
      return makeGear(
        0.38,
        12,
        0.2,
        0xf2b38f,
      );

    case 'motorShaft':
      return makeCylinder(
        0.1,
        0.95,
        0x9b83d7,
      );

    case 'motorHousing':
      return makeMotorHousing();

    case 'bikeFrame':
      return makeMotorcycleFrame();

    case 'bikeRearWheel':
    case 'bikeFrontWheel':
      return makeWheel(0.68, 0x34313a);

    case 'bikeHandle':
      return makeHandle(0x7655b5);

    case 'bikeSeat': {
      const g = new THREE.Group();

      const post = makeBox(
        new THREE.Vector3(0.1, 0.42, 0.1),
        0x817985,
      );
      post.position.y = -0.18;
      g.add(post);

      const seat = makeBox(
        new THREE.Vector3(0.68, 0.16, 0.3),
        0x34313a,
      );
      seat.position.y = 0.05;
      g.add(seat);

      return g;
    }

    case 'bikeEngine':
      return makeEngine();

    case 'bikeExhaust':
      return makeExhaust();

    case 'robotBase':
      return makeRobotBase();

    case 'robotTorso':
      return makeRobotTorso();

    case 'robotShoulder':
      return makeRobotShoulder();

    case 'robotUpperArm':
      return makeRobotArm(0.75);

    case 'robotForearm':
      return makeRobotArm(0.68);

    case 'robotWrist':
      return makeRobotWrist();

    case 'robotHead':
      return makeRobotHead();

    case 'robotGripper':
      return makeGripper();
  }
}

function ghostify(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const original =
        child.material as THREE.MeshStandardMaterial;

      const ghost =
        original.clone();

      ghost.transparent = true;
      ghost.opacity = 0.14;
      ghost.depthWrite = false;
      ghost.emissive =
        new THREE.Color(0x9b83d7);
      ghost.emissiveIntensity = 0.12;

      child.material = ghost;
    }
  });
}

function buildWorkshop(scene: THREE.Scene) {
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

  // Floor only.
  // Parts remain visible around the central assembly.
  const floor = makeBox(
    new THREE.Vector3(
      7,
      0.18,
      2.8,
    ),
    0xf3dfd2,
  );

  floor.position.set(
    0,
    -2.55,
    0,
  );

  scene.add(floor);

  const back = makeBox(
    new THREE.Vector3(
      7,
      5.2,
      0.18,
    ),
    0xf1ecfa,
  );

  back.position.set(
    0,
    0,
    -1.0,
  );

  scene.add(back);

  // Assembly platform.
  const platform = makeBox(
    new THREE.Vector3(
      3.5,
      0.16,
      1.5,
    ),
    0xfffdfb,
  );

  platform.position.set(
    0,
    -1.75,
    0,
  );

  scene.add(platform);
}

function createGhost(id: PartId) {
  const ghost = createPart(id);
  ghostify(ghost);
  return ghost;
}

function getTargetsForMission(
  index: number,
) {
  const mission =
    MISSIONS[index];

  const result:
    Partial<Record<
      PartId,
      THREE.Vector3
    >> = {};

  mission.parts.forEach(
    (id) => {
      result[id] =
        TARGET[id].clone();
    },
  );

  return result;
}

export default function ManufacturingScreen() {
  const router = useRouter();

  const [placed, setPlaced] =
    useState<
      Partial<Record<PartId, boolean>>
    >({});

  const [running, setRunning] =
    useState(false);

  const [message, setMessage] =
    useState(
      'Drag each part onto its faint outline.',
    );

  const sceneRef =
    useRef<THREE.Scene | null>(null);

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
      Map<
        PartId,
        THREE.Object3D
      >
    >(new Map());

  const placedRef =
    useRef<
      Partial<Record<PartId, boolean>>
    >({});

  const missionRef =
    useRef(0);

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

  const targetObjectsRef =
    useRef<
      Map<
        PartId,
        THREE.Object3D
      >
    >(new Map());

  const rebuildScene =
    (scene: THREE.Scene) => {
      while (scene.children.length) {
        scene.remove(
          scene.children[0],
        );
      }

      buildWorkshop(scene);

      partsRef.current.clear();
      targetObjectsRef.current.clear();

      const mission =
        MISSIONS[
          missionRef.current
        ];

      const targets =
        getTargetsForMission(
          missionRef.current,
        );

      mission.parts.forEach(
        (id, index) => {
          const object =
            createPart(id);

          const home =
            TRAY[id].clone();

          object.position.copy(
            home,
          );

          object.userData.partId =
            id;

          scene.add(object);

          partsRef.current.set(
            id,
            object,
          );

          const target =
            targets[id];

          if (!target) return;

          const ghost =
            createGhost(id);

          ghost.position.copy(
            target,
          );

          scene.add(ghost);

          targetObjectsRef.current.set(
            id,
            ghost,
          );

          void index;
        },
      );

      const ring =
        new THREE.Mesh(
          new THREE.TorusGeometry(
            1.75,
            0.025,
            8,
            64,
          ),
          mat(0xe8d8f5, 0),
        );

      ring.position.set(
        0,
        -0.15,
        0.05,
      );

      ring.rotation.x =
        Math.PI / 2;

      scene.add(ring);

      const initial:
        Partial<Record<PartId, boolean>> =
        {};

      mission.parts.forEach(
        (id) => {
          initial[id] = false;
        },
      );

      placedRef.current =
        initial;

      setPlaced(initial);
      setRunning(false);
      runningRef.current = false;

      setMessage(
        'Drag each part onto its faint outline.',
      );
    };

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

      if (!camera) return null;

      updatePointer(event);

      raycaster.current.setFromCamera(
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

      return raycaster.current.ray.intersectPlane(
        plane,
        point,
      );
    };

  const findPart =
    (event: any) => {
      const camera =
        cameraRef.current;

      if (!camera) return null;

      updatePointer(event);

      raycaster.current.setFromCamera(
        pointer.current,
        camera,
      );

      const objects:
        THREE.Object3D[] =
        [];

      partsRef.current.forEach(
        (object, id) => {
          if (
            placedRef.current[id]
          ) {
            return;
          }

          object.traverse(
            (child) => {
              if (
                child instanceof THREE.Mesh
              ) {
                child.userData.partId =
                  id;

                objects.push(child);
              }
            },
          );
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
        THREE.Object3D | null =
        hits[0].object;

      while (current) {
        const id =
          current.userData?.partId;

        if (id) {
          return id as PartId;
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

      if (!id) return;

      const object =
        partsRef.current.get(id);

      if (!object) return;

      const point =
        screenToWorld(
          event,
          object.position.z,
        );

      if (!point) return;

      dragRef.current = {
        id,
        offset:
          object.position
            .clone()
            .sub(point),
      };

      setMessage(
        `Move the ${LABEL[id].toLowerCase()} into its outline.`,
      );
    };

  const moveDrag =
    (event: any) => {
      const drag =
        dragRef.current;

      if (!drag) return;

      const object =
        partsRef.current.get(
          drag.id,
        );

      if (!object) return;

      const point =
        screenToWorld(
          event,
          object.position.z,
        );

      if (!point) return;

      const next =
        point
          .clone()
          .add(drag.offset);

      next.x = Math.max(
        -3.0,
        Math.min(3.0, next.x),
      );

      next.y = Math.max(
        -2.1,
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

      if (!drag) return;

      dragRef.current = null;

      const object =
        partsRef.current.get(
          drag.id,
        );

      if (!object) return;

      const target =
        TARGET[drag.id];

      const distance =
        object.position.distanceTo(
          target,
        );

      if (distance < 0.72) {
        object.position.copy(
          target,
        );

        placedRef.current[
          drag.id
        ] = true;

        setPlaced({
          ...placedRef.current,
        });

        const complete =
          MISSIONS[
            missionRef.current
          ].parts.every(
            (id) =>
              placedRef.current[id],
          );

        if (complete) {
          setMessage(
            'MACHINE COMPLETE! Press RUN MACHINE.',
          );
        } else {
          setMessage(
            `${LABEL[drag.id]} placed correctly.`,
          );
        }
      } else {
        object.position.copy(
          TRAY[drag.id],
        );

        setMessage(
          'Not quite. Try matching the faint outline.',
        );
      }
    };

  const runMachine =
    () => {
      const complete =
        MISSIONS[
          missionRef.current
        ].parts.every(
          (id) =>
            placedRef.current[id],
        );

      if (
        !complete ||
        runningRef.current
      ) {
        return;
      }

      runningRef.current = true;
      setRunning(true);

      setMessage(
        'WATCH THE MACHINE MOVE!',
      );

      setTimeout(() => {
        runningRef.current = false;
        setRunning(false);

        setMessage(
          'MACHINE WORKS! LEVEL COMPLETE ⭐',
        );

        router.replace(
          '/games/manufacturing?completed=1',
        );
      }, 3000);
    };

  const reset =
    () => {
      const scene =
        sceneRef.current;

      if (scene) {
        rebuildScene(scene);
      }
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

      rebuildScene(scene);

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
            const mission =
              MISSIONS[
                missionRef.current
              ];

            if (
              mission.parts.includes(
                'bigGear',
              )
            ) {
              partsRef.current
                .get('bigGear')!
                .rotation.z +=
                delta * 1.8;

              partsRef.current
                .get('smallGear')!
                .rotation.z -=
                delta * 2.8;
            }

            if (
              mission.parts.includes(
                'cycleRearWheel',
              )
            ) {
              partsRef.current
                .get('cycleRearWheel')!
                .rotation.z +=
                delta * 2.4;

              partsRef.current
                .get('cycleFrontWheel')!
                .rotation.z +=
                delta * 2.4;

              partsRef.current
                .get('cyclePedal')!
                .rotation.z +=
                delta * 2.5;
            }

            if (
              mission.parts.includes(
                'motor',
              )
            ) {
              partsRef.current
                .get('motor')!
                .rotation.x +=
                delta * 1.8;

              partsRef.current
                .get('motorGear')!
                .rotation.z -=
                delta * 3.2;

              partsRef.current
                .get('motorShaft')!
                .rotation.y +=
                delta * 4;
            }

            if (
              mission.parts.includes(
                'bikeRearWheel',
              )
            ) {
              partsRef.current
                .get('bikeRearWheel')!
                .rotation.z +=
                delta * 2.2;

              partsRef.current
                .get('bikeFrontWheel')!
                .rotation.z +=
                delta * 2.2;

              const engine =
                partsRef.current.get(
                  'bikeEngine',
                );

              if (engine) {
                engine.position.y =
                  TARGET.bikeEngine.y +
                  Math.sin(
                    performance.now() *
                      0.012,
                  ) *
                    0.025;
              }
            }

            if (
              mission.parts.includes(
                'robotShoulder',
              )
            ) {
              const t =
                performance.now() *
                0.002;

              const shoulder =
                partsRef.current.get(
                  'robotShoulder',
                );

              const upper =
                partsRef.current.get(
                  'robotUpperArm',
                );

              const forearm =
                partsRef.current.get(
                  'robotForearm',
                );

              const wrist =
                partsRef.current.get(
                  'robotWrist',
                );

              if (shoulder) {
                shoulder.rotation.z =
                  Math.sin(t) *
                  0.35;
              }

              if (upper) {
                upper.rotation.z =
                  Math.sin(t + 0.4) *
                  0.45;
              }

              if (forearm) {
                forearm.rotation.z =
                  Math.sin(t + 0.8) *
                  0.55;
              }

              if (wrist) {
                wrist.rotation.z =
                  Math.sin(t + 1.1) *
                  0.65;
              }
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

  const mission =
    MISSIONS[0];

  const allPlaced =
    mission.parts.every(
      (id) => placed[id],
    );

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
                style={styles.title}
              >
                {mission.title}
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
            {mission.subtitle}
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
              DRAG THE PARTS INTO PLACE
            </Text>
          </View>
        </View>

        <View
          style={styles.bottom}
        >
          <Text
            style={styles.progress}
          >
            {mission.parts.filter(
              (id) => placed[id],
            ).length}{' '}
            / {mission.parts.length} PARTS PLACED
          </Text>

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
    minHeight: 68,
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    flexShrink: 1,
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
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },

  title: {
    color: COLORS.charcoal,
    fontSize: 20,
    fontWeight: '900',
  },

  reset: {
    height: 36,
    minWidth: 68,
    paddingHorizontal: 12,
    borderRadius: 18,
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
    fontSize: 9,
    fontWeight: '900',
  },

  pressed: {
    transform: [
      {
        scale: 0.95,
      },
    ],
  },

  levels: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 7,
  },

  level: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  levelActive: {
    backgroundColor:
      COLORS.purple,
    borderColor:
      COLORS.purple,
  },

  levelText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '900',
  },

  levelTextActive: {
    color: '#FFFFFF',
  },

  instruction: {
    marginHorizontal: 18,
    marginBottom: 7,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor:
      COLORS.softPurple,
    borderWidth: 1,
    borderColor:
      '#E2D8F2',
  },

  instructionTitle: {
    color: COLORS.charcoal,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },

  instructionText: {
    color: COLORS.muted,
    fontSize: 11,
    lineHeight: 15,
  },

  game: {
    flex: 1,
    minHeight: 290,
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
    top: 10,
    alignSelf: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 11,
    backgroundColor:
      'rgba(255,253,251,0.9)',
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  hintText: {
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  bottom: {
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 11,
  },

  progress: {
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 7,
  },

  run: {
    height: 50,
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
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },

  runTextDisabled: {
    color: COLORS.muted,
  },
});
