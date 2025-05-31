'use client';

import { useEffect, useRef } from 'react';
import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ActionManager,
  KeyboardEventTypes,
  Mesh,
  Tools,
} from '@babylonjs/core';

const BabylonScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera('camera', new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;

    // 矢印（Cylinder）を生成する関数
    const createArrow = (name: string, direction: Vector3, color: Color3) => {
      const arrow = MeshBuilder.CreateCylinder(name, {
        height: 1,
        diameterTop: 0,
        diameterBottom: 0.1,
      }, scene);

      const material = new StandardMaterial(`${name}-mat`, scene);
      material.diffuseColor = color;
      arrow.material = material;

      // 回転方向を矢印に合わせる
      arrow.rotation = Vector3.RotationFromAxis(direction, Vector3.Up(), Vector3.Right());
      arrow.position = direction.normalize().scale(1.5); // カメラ中心から少し離す
      arrow.parent = camera; // カメラに追従させる

      return arrow;
    };

    // 上下左右の矢印を作成
    createArrow('arrow-forward', Vector3.Forward(), Color3.Blue());   // 前方
    createArrow('arrow-backward', Vector3.Backward(), Color3.Red()); // 後方
    createArrow('arrow-left', Vector3.Left(), Color3.Green());       // 左
    createArrow('arrow-right', Vector3.Right(), Color3.Yellow());    // 右


    new HemisphericLight('light', new Vector3(0, 1, 0), scene);

    // 敵生成
    const enemyCount = 30;
    const radius = 10;
    const enemies: Mesh[] = [];

    for (let i = 0; i < enemyCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.random() * Math.PI;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const enemy = MeshBuilder.CreateSphere(`enemy-${i}`, { diameter: 1 }, scene);
      enemy.position = new Vector3(x, y, z);

      const mat = new StandardMaterial(`mat-${i}`, scene);
      mat.diffuseColor = Color3.Red();
      enemy.material = mat;

      enemies.push(enemy);
    }

    // キー入力
    const inputMap: Record<string, boolean> = {};
    scene.actionManager = new ActionManager(scene);

    scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
        inputMap[key] = true;
      } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
        inputMap[key] = false;
      }
    });

    // デバイスの方向に基づくカメラの回転
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        const alpha = Tools.ToRadians(event.alpha); // Yaw
        const beta = Tools.ToRadians(event.beta);   // Pitch
        const gamma = Tools.ToRadians(event.gamma); // Roll

        // yaw (左右) と pitch (上下) を camera.rotation に適用
        camera.rotation.y = alpha;
        camera.rotation.x = beta - Math.PI / 2; // 調整：デフォルトで真下を見る補正
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    // 毎フレーム処理
    scene.onBeforeRenderObservable.add(() => {
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      if (inputMap['w']) camera.position.addInPlace(forward.scale(camera.speed));
      if (inputMap['s']) camera.position.addInPlace(forward.scale(-camera.speed));
      if (inputMap['a']) camera.position.addInPlace(right.scale(-camera.speed));
      if (inputMap['d']) camera.position.addInPlace(right.scale(camera.speed));

      for (const enemy of enemies) {
        const dist = Vector3.Distance(enemy.position, camera.position);
        if (dist < 1.0) {
          camera.position = new Vector3(0, 1.6, 0);
          alert('敵にぶつかりました！');
          break;
        }
      }
    });

    engine.runRenderLoop(() => {
      scene.render();
    });

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      engine.dispose();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />;
};

export default BabylonScene;
