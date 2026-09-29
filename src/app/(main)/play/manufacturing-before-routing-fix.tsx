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

type Level = 1 | 2 | 3 | 4 | 5;

type PartId = string;

type PartDefinition = {
  id: PartId;
  label: string;
  color: number;
  tray: THREE.Vector3;
  target: THREE.Vector3;
  kind:
    | 'gear'
    | 'shaft'
    | 'wheel'
    | 'frame'
    | 'handle'
    | 'seat'
    | 'pedal'
    | 'motor'
    | 'base'
    | 'body'
    | 'arm'
    | 'joint'
    | 'gripper'
    | 'head';
  size?: number;
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
  mint: '#86CDB1',
  sky: '#82B8E8',
  yellow: '#F2C96D',
  border: '#E8DDE7',
  softPurple: '#EEE7FA',
};

const LEVEL_INFO: Record<
  Level,
  {
    title: string;
    subtitle: string;
    message: string;
  }
> = {
  1: {
    title: 'Gear Machine',
    subtitle: 'GEARS · MOTION',
    message: 'Drag the real parts onto their faint outlines.',
  },
  2: {
    title: 'Build a Cycle',
    subtitle: 'CYCLE · ASSEMBLY',
    message: 'Assemble the cycle, then see it move.',
  },
  3: {
    title: 'Motor + Gear',
    subtitle: 'MOTOR · MOTION',
    message: 'Build the motor machine and make the gear turn.',
  },
  4: {
    title: 'Motorcycle',
    subtitle: 'MOTORCYCLE · ASSEMBLY',
    message: 'Put the motorcycle together, then ride it.',
  },
  5: {
    title: 'Robot',
    subtitle: 'ROBOT · ASSEMBLY',
    message: 'Assemble the robot and bring it to life.',
  },
};

const LEVEL_PARTS: Record<Level, PartDefinition[]> = {
  1: [
    {
      id: 'bigGear',
      label: 'BIG GEAR',
      color: 0xdccff4,
      tray: new THREE.Vector3(-2.35, -2.35, 0.8),
      target: new THREE.Vector3(-0.9, 0.35, 0.8),
      kind: 'gear',
      size: 0.78,
    },
    {
      id: 'smallGear',
      label: 'SMALL GEAR',
      color: 0xf2b38f,
      tray: new THREE.Vector3(0, -2.35, 0.8),
      target: new THREE.Vector3(0.9, 0.35, 0.8),
      kind: 'gear',
      size: 0.5,
    },
    {
      id: 'shaft',
      label: 'SHAFT',
      color: 0x9b83d7,
      tray: new THREE.Vector3(2.35, -2.35, 0.8),
      target: new THREE.Vector3(0, -0.95, 0.8),
      kind: 'shaft',
    },
  ],

  2: [
    {
      id: 'cycleWheel1',
      label: 'WHEEL',
      color: 0x34313a,
      tray: new THREE.Vector3(-2.5, -2.35, 0.8),
      target: new THREE.Vector3(-1.25, -0.2, 0.8),
      kind: 'wheel',
      size: 0.62,
    },
    {
      id: 'cycleWheel2',
      label: 'WHEEL',
      color: 0x34313a,
      tray: new THREE.Vector3(-1.25, -2.35, 0.8),
      target: new THREE.Vector3(1.25, -0.2, 0.8),
      kind: 'wheel',
      size: 0.62,
    },
    {
      id: 'cycleFrame',
      label: 'FRAME',
      color: 0x9b83d7,
      tray: new THREE.Vector3(0, -2.35, 0.8),
      target: new THREE.Vector3(0, 0.25, 0.8),
      kind: 'frame',
    },
    {
      id: 'cycleHandle',
      label: 'HANDLE',
      color: 0x82b8e8,
      tray: new THREE.Vector3(1.25, -2.35, 0.8),
      target: new THREE.Vector3(1.05, 0.95, 0.8),
      kind: 'handle',
    },
    {
      id: 'cycleSeat',
      label: 'SEAT',
      color: 0x34313a,
      tray: new THREE.Vector3(2.5, -2.35, 0.8),
      target: new THREE.Vector3(-0.35, 1.0, 0.8),
      kind: 'seat',
    },
    {
      id: 'cyclePedal',
      label: 'PEDALS',
      color: 0xf2c96d,
      tray: new THREE.Vector3(0, -1.85, 0.8),
      target: new THREE.Vector3(0, -0.35, 0.8),
      kind: 'pedal',
    },
  ],

  3: [
    {
      id: 'motor',
      label: 'MOTOR',
      color: 0x82b8e8,
      tray: new THREE.Vector3(-2.3, -2.35, 0.8),
      target: new THREE.Vector3(-0.9, 0.15, 0.8),
      kind: 'motor',
    },
    {
      id: 'motorGear',
      label: 'GEAR',
      color: 0xf2b38f,
      tray: new THREE.Vector3(-0.75, -2.35, 0.8),
      target: new THREE.Vector3(0.7, 0.4, 0.8),
      kind: 'gear',
      size: 0.58,
    },
    {
      id: 'motorShaft',
      label: 'SHAFT',
      color: 0x9b83d7,
      tray: new THREE.Vector3(0.8, -2.35, 0.8),
      target: new THREE.Vector3(0.7, -0.65, 0.8),
      kind: 'shaft',
    },
    {
      id: 'motorBase',
      label: 'BASE',
      color: 0xebcfbd,
      tray: new THREE.Vector3(2.25, -2.35, 0.8),
      target: new THREE.Vector3(0, -0.95, 0.8),
      kind: 'base',
    },
  ],

  4: [
    {
      id: 'bikeFrame',
      label: 'FRAME',
      color: 0x9b83d7,
      tray: new THREE.Vector3(-2.5, -2.35, 0.8),
      target: new THREE.Vector3(0, 0, 0.8),
      kind: 'frame',
    },
    {
      id: 'bikeWheel1',
      label: 'FRONT WHEEL',
      color: 0x34313a,
      tray: new THREE.Vector3(-1.25, -2.35, 0.8),
      target: new THREE.Vector3(1.25, -0.75, 0.8),
      kind: 'wheel',
      size: 0.68,
    },
    {
      id: 'bikeWheel2',
      label: 'BACK WHEEL',
      color: 0x34313a,
      tray: new THREE.Vector3(0, -2.35, 0.8),
      target: new THREE.Vector3(-1.25, -0.75, 0.8),
      kind: 'wheel',
      size: 0.68,
    },
    {
      id: 'bikeHandle',
      label: 'HANDLE',
      color: 0x82b8e8,
      tray: new THREE.Vector3(1.25, -2.35, 0.8),
      target: new THREE.Vector3(1.25, 0.55, 0.8),
      kind: 'handle',
    },
    {
      id: 'bikeSeat',
      label: 'SEAT',
      color: 0x34313a,
      tray: new THREE.Vector3(2.5, -2.35, 0.8),
      target: new THREE.Vector3(-0.35, 0.7, 0.8),
      kind: 'seat',
    },
    {
      id: 'bikeMotor',
      label: 'MOTOR',
      color: 0xf2b38f,
      tray: new THREE.Vector3(0, -1.85, 0.8),
      target: new THREE.Vector3(0, -0.25, 0.8),
      kind: 'motor',
    },
  ],

  5: [
    {
      id: 'robotBase',
      label: 'BASE',
      color: 0x9b83d7,
      tray: new THREE.Vector3(-2.5, -2.35, 0.8),
      target: new THREE.Vector3(0, -0.85, 0.8),
      kind: 'base',
    },
    {
      id: 'robotBody',
      label: 'BODY',
      color: 0x82b8e8,
      tray: new THREE.Vector3(-1.25, -2.35, 0.8),
      target: new THREE.Vector3(0, 0.05, 0.8),
      kind: 'body',
    },
    {
      id: 'robotJoint1',
      label: 'JOINT',
      color: 0xf2c96d,
      tray: new THREE.Vector3(0, -2.35, 0.8),
      target: new THREE.Vector3(-0.75, 0.65, 0.8),
      kind: 'joint',
    },
    {
      id: 'robotArm',
      label: 'ARM',
      color: 0xf2b38f,
      tray: new THREE.Vector3(1.25, -2.35, 0.8),
      target: new THREE.Vector3(-1.05, 0.25, 0.8),
      kind: 'arm',
    },
    {
      id: 'robotJoint2',
      label: 'JOINT',
      color: 0xf2c96d,
      tray: new THREE.Vector3(2.5, -2.35, 0.8),
      target: new THREE.Vector3(1.05, 0.65, 0.8),
      kind: 'joint',
    },
    {
      id: 'robotGripper',
      label: 'GRIPPER',
      color: 0x86cdb1,
      tray: new THREE.Vector3(0, -1.85, 0.8),
      target: new THREE.Vector3(-1.45, 0.05, 0.8),
      kind: 'gripper',
    },
    {
      id: 'robotHead',
      label: 'HEAD',
      color: 0xdccff4,
      tray: new THREE.Vector3(1.25, -1.85, 0.8),
      target: new THREE.Vector3(0, 1.0, 0.8),
      kind: 'head',
    },
  ],
};

function makeGear(
  radius: number,
  teeth: number,
  depth: number,
  color: number,
) {
  const shape = new THREE.Shape();

  const innerRadius = radius * 0.76;
  const points = teeth * 4;

  for (let i = 0; i <= points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    const phase = i % 4;
    const r =
      phase === 1 || phase === 2
        ? radius
        : innerRadius;

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

  const geometry = new THREE.ExtrudeGeometry(
    shape,
    {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: radius * 0.035,
      bevelThickness: radius * 0.035,
      curveSegments: 2,
    },
  );

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

function makeShaft(color = 0x9b83d7) {
  const group = new THREE.Group();

  const material =
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.32,
      metalness: 0.7,
    });

  const shaft =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.13,
        0.13,
        2.25,
        32,
      ),
      material,
    );

  shaft.rotation.z = Math.PI / 2;

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
      material,
    );

  left.rotation.z = Math.PI / 2;
  left.position.x = -1.05;

  const right =
    new THREE.Mesh(
      capGeometry,
      material,
    );

  right.rotation.z = Math.PI / 2;
  right.position.x = 1.05;

  group.add(left);
  group.add(right);

  group.userData.isPart = true;

  return group;
}

function makeWheel(
  radius: number,
  color: number,
) {
  const group = new THREE.Group();

  const tire =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        radius,
        radius * 0.14,
        16,
        32,
      ),
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
      }),
    );

  tire.rotation.x = Math.PI / 2;

  group.add(tire);

  const hub =
    new THREE.Mesh(
      new THREE.CylinderGeometry(
        radius * 0.12,
        radius * 0.12,
        0.22,
        20,
      ),
      new THREE.MeshStandardMaterial({
        color: 0x9b83d7,
        metalness: 0.5,
      }),
    );

  hub.rotation.x = Math.PI / 2;

  group.add(hub);

  group.userData.isPart = true;

  return group;
}

function makePart(
  part: PartDefinition,
) {
  let object: THREE.Object3D;

  switch (part.kind) {
    case 'gear':
      object = makeGear(
        part.size ?? 0.6,
        part.size && part.size > 0.6 ? 16 : 12,
        0.24,
        part.color,
      );
      break;

    case 'shaft':
      object = makeShaft(part.color);
      break;

    case 'wheel':
      object = makeWheel(
        part.size ?? 0.6,
        part.color,
      );
      break;

    case 'frame': {
      const group = new THREE.Group();

      const material =
        new THREE.MeshStandardMaterial({
          color: part.color,
          roughness: 0.42,
          metalness: 0.2,
        });

      const bars = [
        [0, 0, 1.9, 0.12],
        [-0.55, 0.15, 1.0, 0.11],
        [0.55, 0.15, 1.0, 0.11],
        [0, 0.65, 0.8, 0.1],
      ];

      bars.forEach(
        ([x, y, length, thickness]) => {
          const bar =
            new THREE.Mesh(
              new THREE.BoxGeometry(
                length,
                thickness,
                0.18,
              ),
              material,
            );

          bar.position.set(x, y, 0);

          group.add(bar);
        },
      );

      group.rotation.z = 0.02;
      object = group;
      break;
    }

    case 'handle': {
      const group = new THREE.Group();

      const metal =
        new THREE.MeshStandardMaterial({
          color: part.color,
          metalness: 0.35,
          roughness: 0.4,
        });

      const stem =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.12,
            0.75,
            0.16,
          ),
          metal,
        );

      group.add(stem);

      const bar =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.9,
            0.12,
            0.16,
          ),
          metal,
        );

      bar.position.y = 0.36;

      group.add(bar);

      object = group;
      break;
    }

    case 'seat':
      object =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.65,
            0.18,
            0.3,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            roughness: 0.5,
          }),
        );
      break;

    case 'pedal': {
      const group = new THREE.Group();

      const crank =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.16,
            0.16,
            0.18,
            24,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            metalness: 0.4,
          }),
        );

      crank.rotation.x = Math.PI / 2;

      group.add(crank);

      const arm =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.7,
            0.09,
            0.12,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
          }),
        );

      group.add(arm);

      object = group;
      break;
    }

    case 'motor': {
      const group = new THREE.Group();

      const body =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.42,
            0.42,
            0.85,
            24,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            metalness: 0.35,
            roughness: 0.35,
          }),
        );

      body.rotation.z = Math.PI / 2;

      group.add(body);

      const cap =
        new THREE.Mesh(
          new THREE.CylinderGeometry(
            0.25,
            0.25,
            0.18,
            24,
          ),
          new THREE.MeshStandardMaterial({
            color: 0x34313a,
            metalness: 0.5,
          }),
        );

      cap.rotation.z = Math.PI / 2;
      cap.position.x = 0.48;

      group.add(cap);

      object = group;
      break;
    }

    case 'base':
      object =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.8,
            0.45,
            0.3,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            roughness: 0.55,
          }),
        );
      break;

    case 'body':
      object =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.1,
            1.15,
            0.3,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            roughness: 0.4,
            metalness: 0.2,
          }),
        );
      break;

    case 'arm':
      object =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            1.45,
            0.25,
            0.28,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            roughness: 0.42,
            metalness: 0.2,
          }),
        );
      break;

    case 'joint':
      object =
        new THREE.Mesh(
          new THREE.SphereGeometry(
            0.24,
            24,
            24,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            metalness: 0.35,
            roughness: 0.35,
          }),
        );
      break;

    case 'gripper': {
      const group = new THREE.Group();

      const palm =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.35,
            0.28,
            0.25,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
          }),
        );

      group.add(palm);

      const finger1 =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.5,
            0.1,
            0.12,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
          }),
        );

      finger1.position.x = -0.35;
      finger1.position.y = 0.15;

      group.add(finger1);

      const finger2 =
        finger1.clone();

      finger2.position.y = -0.15;

      group.add(finger2);

      object = group;
      break;
    }

    case 'head':
      object =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.72,
            0.62,
            0.32,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
            roughness: 0.38,
          }),
        );
      break;

    default:
      object =
        new THREE.Mesh(
          new THREE.BoxGeometry(
            0.7,
            0.7,
            0.25,
          ),
          new THREE.MeshStandardMaterial({
            color: part.color,
          }),
        );
  }

  object.userData.isPart = true;
  object.userData.partId = part.id;

  return object;
}

function makeGhost(
  part: PartDefinition,
) {
  const ghost =
    makePart({
      ...part,
      color: 0x9b83d7,
    });

  ghost.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material =
        child.material as THREE.MeshStandardMaterial;

      material.transparent = true;
      material.opacity = 0.08;
      material.depthWrite = false;
      material.depthTest = true;
      material.emissive =
        new THREE.Color(0x9b83d7);
      material.emissiveIntensity = 0.05;

      child.renderOrder = -10;
    }
  });

  ghost.renderOrder = -10;

  return ghost;
}

function addWorkshop(
  scene: THREE.Scene,
) {
  scene.background =
    new THREE.Color(
      COLORS.background,
    );

  scene.add(
    new THREE.HemisphereLight(
      0xfff8f3,
      0x817985,
      2.5,
    ),
  );

  const light =
    new THREE.DirectionalLight(
      0xffffff,
      3.6,
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
      1.2,
    );

  sideLight.position.set(
    5,
    2,
    5,
  );

  scene.add(sideLight);

  const floor =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        7,
        0.2,
        2.8,
      ),
      new THREE.MeshStandardMaterial({
        color: 0xf3dfd2,
        roughness: 0.65,
      }),
    );

  floor.position.set(
    0,
    -1.65,
    0,
  );

  scene.add(floor);

  const back =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        6.7,
        4.3,
        0.18,
      ),
      new THREE.MeshStandardMaterial({
        color: 0xf1ecfa,
      }),
    );

  back.position.set(
    0,
    0.4,
    -0.7,
  );

  scene.add(back);

  const table =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        5.5,
        2.7,
        0.28,
      ),
      new THREE.MeshStandardMaterial({
        color: 0xebcfbd,
        roughness: 0.65,
      }),
    );

  table.position.set(
    0,
    0.05,
    0.1,
  );

  scene.add(table);

  const tableTop =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        5.15,
        2.35,
        0.12,
      ),
      new THREE.MeshStandardMaterial({
        color: 0xfffdfb,
        roughness: 0.7,
      }),
    );

  tableTop.position.set(
    0,
    0.05,
    0.32,
  );

  scene.add(tableTop);

  const tray =
    new THREE.Mesh(
      new THREE.BoxGeometry(
        6.5,
        0.5,
        1.25,
      ),
      new THREE.MeshStandardMaterial({
        color: 0xfffdfb,
        roughness: 0.6,
      }),
    );

  tray.position.set(
    0,
    -2.38,
    0.35,
  );

  scene.add(tray);
}

export default function ManufacturingScreen() {
  const router =
    useRouter();

  const [level, setLevel] =
    useState<Level>(1);

  const [placed, setPlaced] =
    useState<Record<string, boolean>>({});

  const [running, setRunning] =
    useState(false);

  const [message, setMessage] =
    useState(
      LEVEL_INFO[1].message,
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
      Record<string, THREE.Object3D | null>
    >({});

  const placedRef =
    useRef<Record<string, boolean>>({});

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
      id: string;
      offset: THREE.Vector3;
    } | null>(null);

  const definitions =
    LEVEL_PARTS[level];

  const allPlaced =
    definitions.length > 0 &&
    definitions.every(
      (part) => placed[part.id],
    );

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
      )
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
            !placedRef.current[id]
          ) {
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
          }
        },
      );

      const hits =
        raycaster.current.intersectObjects(
          objects,
          true,
        );

      if (!hits.length) {
        return null;
      }

      let current:
        | THREE.Object3D
        | null =
        hits[0].object;

      while (current) {
        if (
          current.userData?.partId
        ) {
          return current.userData
            .partId as string;
        }

        current =
          current.parent;
      }

      return null;
    };

  const startDrag =
    (event: any) => {
      if (runningRef.current) {
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
        `Move the ${id.replace(
          /([A-Z])/g,
          ' $1',
        ).toLowerCase()} to its outline.`,
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
        partsRef.current[drag.id];

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
        -3,
        Math.min(3, next.x),
      );

      next.y = Math.max(
        -2.7,
        Math.min(2.05, next.y),
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
        partsRef.current[drag.id];

      const definition =
        definitions.find(
          (part) =>
            part.id === drag.id,
        );

      if (
        !object ||
        !definition
      ) {
        return;
      }

      const distance =
        object.position.distanceTo(
          definition.target,
        );

      if (distance < 0.85) {
        object.position.copy(
          definition.target,
        );

        placedRef.current[
          drag.id
        ] = true;

        setPlaced({
          ...placedRef.current,
        });

        const complete =
          definitions.every(
            (part) =>
              placedRef.current[
                part.id
              ],
          );

        setMessage(
          complete
            ? 'READY! You built it. Now run it.'
            : `${definition.label} snapped into place.`,
        );
      } else {
        object.position.copy(
          definition.tray,
        );

        setMessage(
          'Look at the faint outline and try again.',
        );
      }
    };

  const runLevel =
    () => {
      if (
        !allPlaced ||
        runningRef.current
      ) {
        return;
      }

      runningRef.current = true;
      setRunning(true);

      if (level === 1) {
        setMessage(
          'The gears transfer motion!',
        );
      } else if (level === 2) {
        setMessage(
          'The cycle is moving!',
        );
      } else if (level === 3) {
        setMessage(
          'The motor is turning the gear!',
        );
      } else if (level === 4) {
        setMessage(
          'The motorcycle is ready to ride!',
        );
      } else {
        setMessage(
          'The robot is alive!',
        );
      }
    };

  const reset =
    () => {
      runningRef.current = false;
      setRunning(false);

      definitions.forEach(
        (definition) => {
          const object =
            partsRef.current[
              definition.id
            ];

          if (object) {
            object.position.copy(
              definition.tray,
            );

            object.rotation.set(
              0,
              0,
              0,
            );
          }
        },
      );

      placedRef.current = {};

      setPlaced({});

      setMessage(
        LEVEL_INFO[level].message,
      );
    };

  const changeLevel =
    (nextLevel: Level) => {
      setLevel(nextLevel);
      setRunning(false);
      runningRef.current = false;
      setPlaced({});
      placedRef.current = {};
      partsRef.current = {};
      setMessage(
        LEVEL_INFO[nextLevel].message,
      );
    };

  const setupLevel =
    (scene: THREE.Scene) => {
      partsRef.current = {};

      definitions.forEach(
        (definition) => {
          const ghost =
            makeGhost(definition);

          ghost.position.copy(
            definition.target,
          );

          /*
           * IMPORTANT:
           * Ghosts stay behind real parts.
           * Real parts use z=0.8.
           * Ghosts use z=0.42.
           */
          ghost.position.z = 0.42;

          scene.add(ghost);

          const object =
            makePart(definition);

          object.position.copy(
            definition.tray,
          );

          object.position.z = 0.8;

          object.traverse(
            (child) => {
              child.renderOrder = 5;
            },
          );

          scene.add(object);

          partsRef.current[
            definition.id
          ] = object;
        },
      );
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

      sceneRef.current = scene;

      addWorkshop(scene);
      setupLevel(scene);

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
            if (level === 1) {
              const big =
                partsRef.current[
                  'bigGear'
                ];

              const small =
                partsRef.current[
                  'smallGear'
                ];

              const shaft =
                partsRef.current[
                  'shaft'
                ];

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

            if (level === 2) {
              Object.entries(
                partsRef.current,
              ).forEach(
                ([id, object]) => {
                  if (
                    !object ||
                    !id.startsWith(
                      'cycleWheel',
                    )
                  ) {
                    return;
                  }

                  object.rotation.z -=
                    delta * 3.2;
                },
              );

              const time =
                clock.elapsedTime;

              const x =
                Math.sin(time * 0.75) *
                2.15;

              definitions.forEach(
                (definition) => {
                  const object =
                    partsRef.current[
                      definition.id
                    ];

                  if (object) {
                    object.position.x =
                      definition.target.x +
                      x;
                  }
                },
              );
            }

            if (level === 3) {
              const motor =
                partsRef.current[
                  'motor'
                ];

              const gear =
                partsRef.current[
                  'motorGear'
                ];

              const shaft =
                partsRef.current[
                  'motorShaft'
                ];

              if (motor) {
                motor.rotation.z +=
                  delta * 4;
              }

              if (gear) {
                gear.rotation.z -=
                  delta * 2.4;
              }

              if (shaft) {
                shaft.rotation.x +=
                  delta * 3;
              }
            }

            if (level === 4) {
              const time =
                clock.elapsedTime;

              const x =
                Math.sin(time * 0.65) *
                2.1;

              definitions.forEach(
                (definition) => {
                  const object =
                    partsRef.current[
                      definition.id
                    ];

                  if (object) {
                    object.position.x =
                      definition.target.x +
                      x;
                  }
                },
              );

              const front =
                partsRef.current[
                  'bikeWheel1'
                ];

              const back =
                partsRef.current[
                  'bikeWheel2'
                ];

              if (front) {
                front.rotation.z -=
                  delta * 3;
              }

              if (back) {
                back.rotation.z -=
                  delta * 3;
              }
            }

            if (level === 5) {
              const arm =
                partsRef.current[
                  'robotArm'
                ];

              const joint =
                partsRef.current[
                  'robotJoint1'
                ];

              const gripper =
                partsRef.current[
                  'robotGripper'
                ];

              const head =
                partsRef.current[
                  'robotHead'
                ];

              if (arm) {
                arm.rotation.z =
                  Math.sin(
                    clock.elapsedTime *
                      2,
                  ) * 0.5;
              }

              if (joint) {
                joint.position.y =
                  0.65 +
                  Math.sin(
                    clock.elapsedTime *
                      2,
                  ) *
                    0.12;
              }

              if (gripper) {
                gripper.position.x =
                  -1.45 +
                  Math.sin(
                    clock.elapsedTime *
                      2,
                  ) *
                    0.15;
              }

              if (head) {
                head.rotation.z =
                  Math.sin(
                    clock.elapsedTime,
                  ) * 0.15;
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
              style={styles.back}
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
                TECH · LEVEL {level}
              </Text>

              <Text
                style={styles.title}
              >
                {LEVEL_INFO[level].title}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={reset}
            style={styles.reset}
          >
            <Text
              style={styles.resetText}
            >
              RESET
            </Text>
          </Pressable>
        </View>

        <View
          style={styles.levelRow}
        >
          {(
            [
              1,
              2,
              3,
              4,
              5,
            ] as Level[]
          ).map(
            (item) => (
              <Pressable
                key={item}
                onPress={() =>
                  changeLevel(item)
                }
                style={[
                  styles.levelButton,
                  item === level &&
                    styles.levelButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.levelNumber,
                    item === level &&
                      styles.levelNumberActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ),
          )}
        </View>

        <View
          style={styles.instruction}
        >
          <Text
            style={styles.instructionTitle}
          >
            {LEVEL_INFO[level].subtitle}
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
            {definitions.map(
              (definition) => (
                <View
                  key={definition.id}
                  style={styles.status}
                >
                  <View
                    style={[
                      styles.dot,
                      placed[
                        definition.id
                      ] &&
                        styles.dotDone,
                    ]}
                  />

                  <Text
                    style={styles.statusText}
                  >
                    {definition.label}
                  </Text>
                </View>
              ),
            )}
          </View>

          <Pressable
            disabled={
              !allPlaced ||
              running
            }
            onPress={runLevel}
            style={[
              styles.run,
              (!allPlaced ||
                running) &&
                styles.runDisabled,
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
                ? 'RUNNING...'
                : allPlaced
                  ? level === 1
                    ? 'RUN MACHINE'
                    : level === 2
                      ? 'RUN CYCLE'
                      : level === 3
                        ? 'RUN MOTOR'
                        : level === 4
                          ? 'RUN MOTORCYCLE'
                          : 'RUN ROBOT'
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
    minHeight: 66,
    paddingHorizontal: 18,
    paddingTop: 7,
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
    fontSize: 21,
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

  levelRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 7,
  },

  levelButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      COLORS.paper,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  levelButtonActive: {
    backgroundColor:
      COLORS.purple,
    borderColor:
      COLORS.purple,
  },

  levelNumber: {
    color: COLORS.muted,
    fontSize: 12,
    fontWeight: '900',
  },

  levelNumberActive: {
    color: '#FFFFFF',
  },

  instruction: {
    marginHorizontal: 18,
    marginBottom: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 17,
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
    fontSize: 12,
    lineHeight: 17,
  },

  game: {
    flex: 1,
    minHeight: 270,
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
      'rgba(255,253,251,0.84)',
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
    paddingTop: 7,
    paddingBottom: 10,
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 8,
  },

  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  dot: {
    width: 7,
    height: 7,
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
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.35,
  },

  run: {
    height: 50,
    borderRadius: 18,
    backgroundColor:
      COLORS.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },

  runDisabled: {
    backgroundColor:
      '#E8E1EC',
  },

  runText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
  },

  runTextDisabled: {
    color: COLORS.muted,
  },
});
