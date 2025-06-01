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

    MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);

    const frontBox = MeshBuilder.CreateBox('boxName', { size: 20 }, scene);
    const frontMat = new StandardMaterial('matName', scene);
    frontMat.diffuseColor = Color3.Red(); // 赤色

    frontBox.material = frontMat; // さっき作った box に色を適用
    frontBox.position = new Vector3(0, 0, 30); // X, Y, Z 座標に設置

    const rightBox = MeshBuilder.CreateBox('boxName', { size: 20 }, scene);
    const rightMat = new StandardMaterial('matName', scene);
    rightMat.diffuseColor = Color3.Green(); // 赤色

    rightBox.material = rightMat; // さっき作った box に色を適用
    rightBox.position = new Vector3(30, 0, 0); // X, Y, Z 座標に設置

    const leftBox = MeshBuilder.CreateBox('boxName', { size: 20 }, scene);
    const leftMat = new StandardMaterial('matName', scene);
    leftMat.diffuseColor = Color3.Yellow(); // 赤色

    leftBox.material = leftMat; // さっき作った box に色を適用
    leftBox.position = new Vector3(-30, 0, 0); // X, Y, Z 座標に設置

    const backBox = MeshBuilder.CreateBox('boxName', { size: 20 }, scene);
    const backMat = new StandardMaterial('matName', scene);
    backMat.diffuseColor = Color3.Blue(); // 赤色

    backBox.material = backMat; // さっき作った box に色を適用
    backBox.position = new Vector3(0, 0, -30); // X, Y, Z 座標に設置

    const topBox = MeshBuilder.CreateBox('boxName', { size: 20 }, scene);
    const topMat = new StandardMaterial('matName', scene);
    topMat.diffuseColor = Color3.White(); // 赤色

    topBox.material = topMat; // さっき作った box に色を適用
    topBox.position = new Vector3(0, 30, 0); // X, Y, Z 座標に設置

    const right = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    right.intensity = 2.0
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
