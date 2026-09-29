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
  border: '#E8DDE7',
  softPurple: '#EEE7FA',
  softBlue: '#E8F2FC',
};

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

    let radius = outerRadius;

    if (phase === 0 || phase === 3) {
      radius = innerRadius;
    }

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (i === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
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

function makeMaterial(
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

function addBox(
  parent: THREE.Object3D,
  size: Point3,
  position: Point3,
  color: string,
  radius = 0,
) {
  const geometry = new THREE.BoxGeometry(
    size.x,
    size.y,
    size.z,
  );

  const mesh = new THREE.Mesh(
    geometry,
    makeMaterial(color, 0.08, 0.6),
  );

  mesh.position.set(
    position.x,
    position.y,
    position.z,
  );

  if (radius > 0) {
    mesh.scale.set(
      1,
      1,
      1,
    );
  }

  parent.add(mesh);

  return mesh;
}

function createGear(
  radius: number,
  teeth: number,
  color: string,
) {
  const geometry = createGearGeometry(
    radius,
    radius * 0.78,
    teeth,
    0.28,
  );

  const gear = new THREE.Mesh(
    geometry,
    makeMaterial(color, 0.7, 0.25),
  );

  gear.rotation.x = 0;

  return gear;
}

function createGearHub(
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
    makeMaterial(color, 0.8, 0.2),
  );

  hub.rotation.x = Math.PI / 2;

  return hub;
}

function createTargetRing(
  position: Point3,
  color: string,
  radius: number,
) {
  const group = new THREE.Group();

  const outer = new THREE.Mesh(
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

  group.add(outer);

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

  group.add(inner);

  group.position.set(
    position.x,
    position.y,
    position.z,
  );

  return group;
}

function createMachine(scene: THREE.Scene) {
  const machine = new THREE.Group();

  // Soft workshop panel.
  addBox(
    machine,
    { x: 6.4, y: 3.8, z: 0.24 },
    { x: 0, y: -0.1, z: -0.9 },
    '#F1ECFA',
  );

  // Workshop floor.
  addBox(
    machine,
    { x: 6.8, y: 0.22, z: 2.8 },
    { x: 0, y: -1.65, z: 0 },
    '#F8E8DD',
  );

  // Left frame.
  addBox(
    machine,
    { x: 0.25, y: 3.35, z: 0.32 },
    { x: -3.05, y: -0.05, z: 0 },
    '#EBCFBD',
  );

  // Right frame.
  addBox(
    machine,
    { x: 0.25, y: 3.35, z: 0.32 },
    { x: 3.05, y: -0.05, z: 0 },
    '#EBCFBD',
  );

  // Top frame.
  addBox(
    machine,
    { x: 6.1, y: 0.25, z: 0.32 },
    { x: 0, y: 1.58, z: 0 },
    '#EBCFBD',
  );

  // Bottom frame.
  addBox(
    machine,
    { x: 6.1, y: 0.25, z: 0.32 },
    { x: 0, y: -1.35, z: 0 },
    '#EBCFBD',
  );

  // Central support.
  addBox(
    machine,
    { x: 0.2, y: 2.7, z: 0.3 },
    { x: 0, y: 0.05, z: -0.05 },
    '#DCCFF4',
  );

  // Machine base blocks.
  addBox(
    machine,
    { x: 1.55, y: 0.22, z: 0.5 },
    { x: -1.35, y: -1.25, z: 0.15 },
    '#DCCFF4',
  );

  addBox(
    machine,
    { x: 1.25, y: 0.22, z: 0.5 },
    { x: 1.25, y: -1.25, z: 0.15 },
    '#DCCFF4',
  );

  scene.add(machine);

  return machine;
}

function createTray(scene: THREE.Scene) {
  const tray = new THREE.Group();

  addBox(
    tray,
    { x: 6.5, y: 0.12, z: 1.15 },
    { x: 0, y: 2.05, z: 0.15 },
    '#EEE7FA',
  );

  addBox(
    tray,
    { x: 6.5, y: 0.15, z: 0.18 },
    { x: 0, y: 2.62, z: 0.2 },
    '#E8DDE7',
  );

  scene.add(tray);

  return tray;
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
    makeMaterial(
      COLORS.peach,
      0.8,
      0.22,
    ),
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
    makeMaterial(
      '#D9966D',
      0.75,
      0.25,
    ),
  );

  endA.rotation.z = Math.PI / 2;
  endA.position.x = -1.3;

  const endB = endA.clone();
  endB.position.x = 1.3;

  group.add(endA);
  group.add(endB);

  return group;
}

function createTrayPart(
  part: PartId,
) {
  const group = new THREE.Group();

  if (part === 'bigGear') {
    const gear = createGear(
      0.68,
      12,
      COLORS.lavender,
    );

    group.add(gear);

    const hub = createGearHub(
      0.18,
      COLORS.purple,
    );

    group.add(hub);
  }

  if (part === 'smallGear') {
    const gear = createGear(
      0.48,
      10,
      COLORS.sky,
    );

    group.add(gear);

    const hub = createGearHub(
      0.14,
      '#6B9FCF',
    );

    group.add(hub);
  }

  if (part === 'shaft') {
    group.add(createShaft());
  }

  return group;
}

export default function ManufacturingScreen() {
  const [selectedPart, setSelectedPart] =
    useState<PartId | null>(null);

  const [placed, setPlaced] =
    useState<Record<PartId, boolean>>({
      bigGear: false,
      smallGear: false,
      shaft: false,
    });

  const [running, setRunning] =
    useState(false);

  const [message, setMessage] =
    useState(
      'Press and drag a 3D part into the machine.',
    );

  const selectedRef =
    useRef<PartId | null>(null);

  const dragPartRef =
    useRef<PartId | null>(null);

  const dragPlaneRef =
    useRef<THREE.Plane>(
      new THREE.Plane(
        new THREE.Vector3(0, 0, 1),
        0,
      ),
    );

  const dragOffsetRef =
    useRef(
      new THREE.Vector3(),
    );

  const raycasterRef =
    useRef(
      new THREE.Raycaster(),
    );

  const pointerRef =
    useRef(
      new THREE.Vector2(),
    );

  const cameraRef =
    useRef<THREE.PerspectiveCamera | null>(
      null,
    );

  const sceneRef =
    useRef<THREE.Scene | null>(
      null,
    );

  const rendererRef =
    useRef<THREE.WebGLRenderer | null>(
      null,
    );

  const placedRef =
    useRef(placed);

  const runningRef =
    useRef(false);

  const viewportRef =
    useRef({
      width: 1,
      height: 1,
    });

  const objectsRef =
    useRef<{
      bigGear?: THREE.Group;
      smallGear?: THREE.Group;
      shaft?: THREE.Group;
      targets: Record<
        PartId,
        THREE.Group
      >;
    }>({
      targets: {
        bigGear:
          new THREE.Group(),
        smallGear:
          new THREE.Group(),
        shaft:
          new THREE.Group(),
      },
    });

  useEffect(() => {
    selectedRef.current =
      selectedPart;
  }, [selectedPart]);

  useEffect(() => {
    placedRef.current =
      placed;
  }, [placed]);

  useEffect(() => {
    runningRef.current =
      running;
  }, [running]);

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

      scene.background =
        new THREE.Color(
          COLORS.background,
        );

      sceneRef.current =
        scene;

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

      camera.lookAt(
        0,
        0.45,
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

      const hemisphere =
        new THREE.HemisphereLight(
          '#FFFFFF',
          '#D9CBE8',
          2.4,
        );

      scene.add(
        hemisphere,
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

      scene.add(
        directional,
      );

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

      createTray(scene);
      createMachine(scene);

      /*
       * Three-dimensional parts.
       *
       * These are NOT hidden.
       * They physically sit inside
       * the 3D parts tray.
       */
      (
        Object.keys(
          TRAY_POSITIONS,
        ) as PartId[]
      ).forEach((part) => {
        const object =
          createTrayPart(part);

        const position =
          TRAY_POSITIONS[part];

        object.position.set(
          position.x,
          position.y,
          position.z,
        );

        scene.add(object);

        objectsRef.current[
          part
        ] = object;
      });

      /*
       * Glowing machine sockets.
       */
      (
        Object.keys(
          TARGETS,
        ) as PartId[]
      ).forEach((part) => {
        const radius =
          part === 'shaft'
            ? 0.85
            : part === 'bigGear'
              ? 0.78
              : 0.57;

        const color =
          part === 'shaft'
            ? COLORS.peach
            : COLORS.purple;

        const target =
          createTargetRing(
            TARGETS[part],
            color,
            radius,
          );

        scene.add(target);

        objectsRef.current.targets[
          part
        ] = target;
      });

      /*
       * Installed machine gears.
       * Start invisible until dragged from
       * the tray and installed.
       */
      const bigGear =
        new THREE.Group();

      bigGear.add(
        createGear(
          0.82,
          12,
          COLORS.lavender,
        ),
      );

      bigGear.add(
        createGearHub(
          0.2,
          COLORS.purple,
        ),
      );

      bigGear.position.set(
        TARGETS.bigGear.x,
        TARGETS.bigGear.y,
        TARGETS.bigGear.z,
      );

      bigGear.visible =
        false;

      scene.add(bigGear);

      const smallGear =
        new THREE.Group();

      smallGear.add(
        createGear(
          0.57,
          10,
          COLORS.sky,
        ),
      );

      smallGear.add(
        createGearHub(
          0.15,
          '#6B9FCF',
        ),
      );

      smallGear.position.set(
        TARGETS.smallGear.x,
        TARGETS.smallGear.y,
        TARGETS.smallGear.z,
      );

      smallGear.visible =
        false;

      scene.add(
        smallGear,
      );

      const shaft =
        createShaft();

      shaft.position.set(
        TARGETS.shaft.x,
        TARGETS.shaft.y,
        TARGETS.shaft.z,
      );

      shaft.visible =
        false;

      scene.add(shaft);

      objectsRef.current.bigGear =
        bigGear;

      objectsRef.current.smallGear =
        smallGear;

      objectsRef.current.shaft =
        shaft;

      const animate =
        () => {
          requestAnimationFrame(
            animate,
          );

          const now =
            performance.now();

          (
            Object.keys(
              TRAY_POSITIONS,
            ) as PartId[]
          ).forEach((part) => {
            const object =
              objectsRef.current[
                part
              ];

            if (
              !object ||
              placedRef.current[
                part
              ]
            ) {
              return;
            }

            /*
             * Floating 3D parts in the tray.
             */
            const base =
              TRAY_POSITIONS[
                part
              ];

            object.position.y =
              base.y +
              Math.sin(
                now / 500 +
                  Object.keys(
                    TRAY_POSITIONS,
                  ).indexOf(part),
              ) *
                0.045;

            object.rotation.z =
              now / 2200;
          });

          (
            Object.keys(
              TARGETS,
            ) as PartId[]
          ).forEach((part) => {
            const target =
              objectsRef.current.targets[
                part
              ];

            if (
              placedRef.current[
                part
              ]
            ) {
              target.visible =
                false;

              return;
            }

            target.visible =
              true;

            const active =
              selectedRef.current ===
              part;

            const pulse =
              1 +
              Math.sin(
                now / 180,
              ) *
                0.08;

            const scale =
              active
                ? 1.12 * pulse
                : pulse;

            target.scale.set(
              scale,
              scale,
              scale,
            );

            target.rotation.z =
              now / 1800;
          });

          /*
           * Machine animation.
           */
          if (
            runningRef.current
          ) {
            if (
              objectsRef.current
                .bigGear
            ) {
              objectsRef.current.bigGear.rotation.z +=
                0.028;
            }

            if (
              objectsRef.current
                .smallGear
            ) {
              objectsRef.current.smallGear.rotation.z -=
                0.041;
            }

            if (
              objectsRef.current
                .shaft
            ) {
              objectsRef.current.shaft.rotation.x +=
                0.06;
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

  const screenToRay = (
    locationX: number,
    locationY: number,
  ) => {
    const camera =
      cameraRef.current;

    if (!camera) {
      return null;
    }

    const {
      width,
      height,
    } =
      viewportRef.current;

    if (
      !width ||
      !height
    ) {
      return null;
    }

    pointerRef.current.set(
      (locationX / width) *
        2 -
        1,
      -(locationY / height) *
        2 +
        1,
    );

    raycasterRef.current.setFromCamera(
      pointerRef.current,
      camera,
    );

    return raycasterRef.current;
  };

  const findPartFromObject = (
    object: THREE.Object3D,
  ): PartId | null => {
    const parts: PartId[] = [
      'bigGear',
      'smallGear',
      'shaft',
    ];

    for (
      const part of parts
    ) {
      const partObject =
        objectsRef.current[
          part
        ];

      if (!partObject) {
        continue;
      }

      let current:
        | THREE.Object3D
        | null =
        object;

      while (current) {
        if (
          current ===
          partObject
        ) {
          return part;
        }

        current =
          current.parent;
      }
    }

    return null;
  };

  const getPointerPosition = (
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

  const handleTouchStart = (
    event: any,
  ) => {
    const { x, y } =
      getPointerPosition(event);

    const ray =
      screenToRay(x, y);

    if (!ray) {
      return;
    }

    const draggableObjects =
      (
        Object.keys(
          TRAY_POSITIONS,
        ) as PartId[]
      )
        .map(
          (part) =>
            objectsRef.current[
              part
            ],
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
        draggableObjects,
        true,
      );

    if (!hits.length) {
      dragPartRef.current =
        null;

      return;
    }

    const part =
      findPartFromObject(
        hits[0].object,
      );

    if (!part) {
      return;
    }

    if (
      placedRef.current[
        part
      ]
    ) {
      return;
    }

    const object =
      objectsRef.current[
        part
      ];

    if (!object) {
      return;
    }

    dragPartRef.current =
      part;

    selectedRef.current =
      part;

    setSelectedPart(
      part,
    );

    /*
     * Keep the dragged object
     * at the same depth as the
     * machine.
     */
    const camera =
      cameraRef.current;

    if (!camera) {
      return;
    }

    const normal =
      new THREE.Vector3();

    camera.getWorldDirection(
      normal,
    );

    dragPlaneRef.current.setFromNormalAndCoplanarPoint(
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
      `Dragging ${PART_LABELS[part]} — put it on the glowing socket.`,
    );
  };

  const handleTouchMove = (
    event: any,
  ) => {
    const part =
      dragPartRef.current;

    if (!part) {
      return;
    }

    const { x, y } =
      getPointerPosition(event);

    const ray =
      screenToRay(x, y);

    if (!ray) {
      return;
    }

    const hitPoint =
      new THREE.Vector3();

    if (
      !ray.ray.intersectPlane(
        dragPlaneRef.current,
        hitPoint,
      )
    ) {
      return;
    }

    const object =
      objectsRef.current[
        part
      ];

    if (!object) {
      return;
    }

    object.position.copy(
      hitPoint,
    );

    object.position.add(
      dragOffsetRef.current,
    );

  };

  const finishDrag = (
    x: number,
    y: number,
  ) => {
    const part =
      dragPartRef.current;

    if (!part) {
      return;
    }

    const ray =
      screenToRay(x, y);

    const object =
      objectsRef.current[
        part
      ];

    const target =
      objectsRef.current.targets[
        part
      ];

    if (
      ray &&
      object &&
      target
    ) {
      const targetWorld =
        new THREE.Vector3();

      target.getWorldPosition(
        targetWorld,
      );

      const dropPoint =
        new THREE.Vector3();

      const hit =
        ray.ray.intersectPlane(
          dragPlaneRef.current,
          dropPoint,
        );

      const distance =
        hit
          ? dropPoint.distanceTo(
              targetWorld,
            )
          : Infinity;

      if (
        distance < 1.35
      ) {
        const start =
          object.position.clone();

        const destination =
          new THREE.Vector3(
            TARGETS[part].x,
            TARGETS[part].y,
            TARGETS[part].z,
          );

        const startTime =
          performance.now();

        const snap =
          (time: number) => {
            const progress =
              Math.min(
                1,
                (time -
                  startTime) /
                  320,
              );

            const eased =
              1 -
              Math.pow(
                1 -
                  progress,
                3,
              );

            object.position.lerpVectors(
              start,
              destination,
              eased,
            );

            object.rotation.z +=
              0.08;

            if (
              progress < 1
            ) {
              requestAnimationFrame(
                snap,
              );
            } else {
              object.position.copy(
                destination,
              );

              object.rotation.set(
                0,
                0,
                0,
              );

              /*
               * Convert the tray part
               * into the installed part.
               */
              setPlaced(
                (current) => ({
                  ...current,
                  [part]: true,
                }),
              );

              placedRef.current = {
                ...placedRef.current,
                [part]: true,
              };

              selectedRef.current =
                null;

              setSelectedPart(
                null,
              );

              const installed =
                Object.values(
                  placedRef.current,
                ).filter(
                  Boolean,
                ).length;

              if (
                installed ===
                3
              ) {
                setMessage(
                  'All parts installed! Press RUN MACHINE.',
                );
              } else {
                setMessage(
                  'Great! Grab the next 3D part.',
                );
              }
            }
          };

        /*
         * Hide the original tray object
         * after the snap animation.
         */
        object.visible = true;

        requestAnimationFrame(
          snap,
        );
      } else {
        const trayPosition =
          TRAY_POSITIONS[part];

        object.position.set(
          trayPosition.x,
          trayPosition.y,
          trayPosition.z,
        );

        object.rotation.set(
          0,
          0,
          0,
        );

        setMessage(
          'Not quite — try placing it on the glowing socket.',
        );
      }

      target.scale.set(
        1,
        1,
        1,
      );
    }

    dragPartRef.current =
      null;

    selectedRef.current =
      null;

    setSelectedPart(
      null,
    );
  };

  const handleTouchEnd = (
    event: any,
  ) => {
    const { x, y } =
      getPointerPosition(event);

    finishDrag(x, y);
  };

  const runMachine = () => {
    const complete =
      Object.values(
        placed,
      ).every(Boolean);

    if (!complete) {
      setMessage(
        'Install all three parts first.',
      );

      return;
    }

    runningRef.current =
      true;

    setRunning(true);

    setMessage(
      'Machine running! Watch the gears turn.',
    );
  };

  const resetMachine = () => {
    runningRef.current =
      false;

    selectedRef.current =
      null;

    dragPartRef.current =
      null;

    setRunning(false);

    setSelectedPart(
      null,
    );

    const resetPlaced = {
      bigGear: false,
      smallGear: false,
      shaft: false,
    };

    setPlaced(
      resetPlaced,
    );

    placedRef.current =
      resetPlaced;

    (
      Object.keys(
        TRAY_POSITIONS,
      ) as PartId[]
    ).forEach((part) => {
      const object =
        objectsRef.current[
          part
        ];

      if (!object) {
        return;
      }

      object.position.set(
        TRAY_POSITIONS[part].x,
        TRAY_POSITIONS[part].y,
        TRAY_POSITIONS[part].z,
      );

      object.rotation.set(
        0,
        0,
        0,
      );

      object.visible =
        true;
    });

    (
      Object.keys(
        TARGETS,
      ) as PartId[]
    ).forEach((part) => {
      const targetObject =
        objectsRef.current[
          part
        ];

      if (!targetObject) {
        return;
      }

      targetObject.visible =
        true;

      targetObject.position.set(
        TARGETS[part].x,
        TARGETS[part].y,
        TARGETS[part].z,
      );

      targetObject.rotation.set(
        0,
        0,
        0,
      );
    });

    setMessage(
      'Press and drag a 3D part into the machine.',
    );
  };

  const placedCount =
    Object.values(
      placed,
    ).filter(Boolean)
      .length;

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
            style={styles.headerText}
          >
            <Text style={styles.kicker}>
              TECH LAB
            </Text>

            <Text style={styles.title}>
              Build the machine
            </Text>
          </View>

          <View
            style={styles.counter}
          >
            <Text
              style={styles.counterText}
            >
              {placedCount}/3
            </Text>
          </View>
        </View>

        <View style={styles.instruction}>
          <Text style={styles.instructionText}>
            Drag a part onto its matching socket
          </Text>
        </View>

        <View
          style={styles.sceneWrapper}
          onLayout={(event) => {
            const {
              width,
              height,
            } =
              event.nativeEvent.layout;

            viewportRef.current = {
              width,
              height,
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

        <View
          style={styles.bottom}
        >
          <Pressable
            onPress={runMachine}
            style={[
              styles.runButton,
              placedCount !== 3 &&
                styles.runButtonDisabled,
            ]}
          >
            <Text
              style={styles.runText}
            >
              {running
                ? '⚙  RUNNING'
                : '▶  RUN MACHINE'}
            </Text>
          </Pressable>

          <Pressable
            onPress={resetMachine}
            style={styles.resetButton}
          >
            <Text
              style={styles.resetText}
            >
              RESET BUILD
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
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
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'space-between',
      marginBottom: 8,
    },

    headerText: {
      flex: 1,
    },

    kicker: {
      color:
        COLORS.purple,
      fontSize: 10,
      fontWeight:
        '900',
      letterSpacing: 1.4,
    },

    title: {
      color: COLORS.charcoal,
      fontSize: 21,
      fontWeight: '900',
      marginTop: 2,
    },

    counter: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor:
        COLORS.softPurple,
      alignItems:
        'center',
      justifyContent:
        'center',
      borderWidth: 1,
      borderColor:
        COLORS.border,
      marginLeft: 10,
    },

    counterText: {
      color:
        COLORS.purpleDark,
      fontSize: 16,
      fontWeight:
        '900',
    },

    instruction: {
      height: 32,
      borderRadius: 16,
      backgroundColor:
        COLORS.paper,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      flexDirection:
        'row',
      alignItems:
        'center',
      justifyContent:
        'center',
      gap: 7,
      marginBottom: 7,
    },

    instructionDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor:
        COLORS.purple,
    },

    instructionText: {
      color:
        COLORS.muted,
      fontSize: 9,
      fontWeight:
        '900',
      letterSpacing: 0.5,
    },

    instructionArrow: {
      color:
        COLORS.purple,
      fontSize: 15,
      fontWeight:
        '900',
    },

    sceneWrapper: {
      flex: 1,
      minHeight: 300,
      borderRadius: 25,
      overflow:
        'hidden',
      borderWidth: 1,
      borderColor:
        COLORS.border,
      backgroundColor:
        COLORS.background,
    },

    gl: {
      flex: 1,
    },

    sceneTopLabel: {
      position:
        'absolute',
      top: 8,
      left: 14,
    },

    sceneTopLabelText: {
      color:
        COLORS.purpleDark,
      fontSize: 9,
      fontWeight:
        '900',
      letterSpacing: 1,
    },

    sceneHint: {
      position:
        'absolute',
      left: 12,
      right: 12,
      top: 26,
      alignItems:
        'center',
    },

    sceneHintText: {
      backgroundColor:
        'rgba(255,253,251,0.94)',
      color:
        COLORS.charcoal,
      paddingHorizontal:
        13,
      paddingVertical: 7,
      borderRadius: 15,
      fontSize: 11,
      fontWeight:
        '800',
      overflow:
        'hidden',
      textAlign:
        'center',
    },

    machineLabel: {
      position:
        'absolute',
      left: 14,
      bottom: 10,
      backgroundColor:
        'rgba(255,253,251,0.9)',
      paddingHorizontal:
        10,
      paddingVertical: 5,
      borderRadius: 10,
    },

    machineLabelText: {
      color:
        COLORS.muted,
      fontSize: 8,
      fontWeight:
        '900',
      letterSpacing: 1,
    },

    bottom: {
      paddingTop: 8,
      paddingBottom: 6,
      gap: 5,
    },

    runButton: {
      height: 50,
      borderRadius: 17,
      backgroundColor:
        COLORS.purple,
      alignItems:
        'center',
      justifyContent:
        'center',
      shadowOpacity: 0.08,
      shadowRadius: 8,
      shadowOffset: {
        width: 0,
        height: 3,
      },
    },

    runButtonDisabled: {
      opacity: 0.45,
    },

    runText: {
      color:
        '#FFFFFF',
      fontSize: 13,
      fontWeight:
        '900',
      letterSpacing: 0.4,
    },

    resetButton: {
      height: 27,
      alignItems:
        'center',
      justifyContent:
        'center',
    },

    resetText: {
      color:
        COLORS.muted,
      fontSize: 10,
      fontWeight:
        '900',
      letterSpacing: 0.5,
    },
  });
