'use client';

import { useEffect, useRef, useState } from 'react';
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
  Quaternion,
  Matrix
} from '@babylonjs/core';

const BabylonScene = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [orientation, setOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 });
  const [permissionGranted, setPermissionGranted] = useState(false);


  useEffect(() => {
    if (!canvasRef.current || !permissionGranted) return;

    const engine = new Engine(canvasRef.current, true);
    const scene = new Scene(engine);

    const camera = new FreeCamera('camera', new Vector3(0, 1.6, 0), scene);
    camera.attachControl(canvasRef.current, true);
    camera.speed = 0.2;
    camera.rotationQuaternion = Quaternion.Identity();

    MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);

    const makeBox = (name: string, color: Color3, pos: Vector3) => {
      const box = MeshBuilder.CreateBox(name, { size: 20 }, scene);
      const mat = new StandardMaterial(`${name}-mat`, scene);
      mat.diffuseColor = color;
      box.material = mat;
      box.position = pos;
    };

    makeBox('front', Color3.Red(), new Vector3(0, 0, 30));
    makeBox('right', Color3.Green(), new Vector3(30, 0, 0));
    makeBox('left', Color3.Yellow(), new Vector3(-30, 0, 0));
    makeBox('back', Color3.Blue(), new Vector3(0, 0, -30));
    makeBox('top', Color3.White(), new Vector3(0, 30, 0));

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
    light.intensity = 2.0;

    const enemies: Mesh[] = [];
    const radius = 10;
    for (let i = 0; i < 30; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.random() * Math.PI;

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      const enemy = MeshBuilder.CreateSphere(`enemy-${i}`, { diameter: 1 }, scene);
      enemy.position = new Vector3(x, y, z);

      const mat = new StandardMaterial(`enemy-mat-${i}`, scene);
      mat.diffuseColor = Color3.Red();
      enemy.material = mat;
      enemies.push(enemy);
    }

    const inputMap: Record<string, boolean> = {};
    scene.actionManager = new ActionManager(scene);
    scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      inputMap[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
    });

    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null && event.beta !== null && event.gamma !== null) {
        const alpha = Tools.ToRadians(event.alpha); // yaw
        const beta = Tools.ToRadians(event.beta);   // pitch
        const gamma = Tools.ToRadians(event.gamma); // roll

        let rotationMatrix;
        
        const fixedBeta = parseFloat(beta.toFixed(1));

        if (fixedBeta > 85 && fixedBeta < 95) {
          rotationMatrix= Matrix.RotationYawPitchRoll(
            0,
            -beta + Math.PI / 2,
            alpha * 0.01
          );
        camera.rotationQuaternion = Quaternion.FromRotationMatrix(rotationMatrix);

        }
        else{
          rotationMatrix= Matrix.RotationYawPitchRoll(
            gamma * 1.5,
            -beta + Math.PI / 2,
            alpha * 0.01
          );
        camera.rotationQuaternion = Quaternion.FromRotationMatrix(rotationMatrix);

        }

        setOrientation({
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        });
      }
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    scene.onBeforeRenderObservable.add(() => {
      const forward = camera.getDirection(Vector3.Forward());
      const right = camera.getDirection(Vector3.Right());

      if (inputMap['w']) camera.position.addInPlace(forward.scale(camera.speed));
      if (inputMap['s']) camera.position.addInPlace(forward.scale(-camera.speed));
      if (inputMap['a']) camera.position.addInPlace(right.scale(-camera.speed));
      if (inputMap['d']) camera.position.addInPlace(right.scale(camera.speed));

      for (const enemy of enemies) {
        if (Vector3.Distance(enemy.position, camera.position) < 1.0) {
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
  }, [permissionGranted]);

  const requestPermission = async () => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        const result = await (DeviceOrientationEvent as any).requestPermission();
        if (result === 'granted') {
          setPermissionGranted(true);
        } else {
          alert('センサーの使用が拒否されました。');
        }
      } catch (err) {
        console.error('Permission error:', err);
        alert('センサーの許可に失敗しました。');
      }
    } else {
      setPermissionGranted(true);
    }
  };

  return (
    <>
      {!permissionGranted && (
        <button
          onClick={requestPermission}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '1em 2em',
            fontSize: '16px',
            zIndex: 20
          }}
        >
          センサーを有効にする
        </button>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100vh', display: 'block' }} />
      <div
        style={{
          position: 'fixed',
          top: 10,
          right: 10,
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '10px',
          fontSize: '14px',
          borderRadius: '8px',
          zIndex: 10
        }}
      >
        <div>Alpha（ヨー）: {orientation.alpha.toFixed(1)}°</div>
        <div>Beta（ピッチ）: {orientation.beta.toFixed(1)}°</div>
        <div>Gamma（ロール）: {orientation.gamma.toFixed(1)}°</div>
        <hr style={{ margin: '8px 0', borderColor: '#444' }} />
      </div>
    </>
  );
};

export default BabylonScene;
