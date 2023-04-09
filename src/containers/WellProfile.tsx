import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { csvFile, calcWellPathFromCsv } from "./utils";
const Papa = require("papaparse");

function WellPath(props: { path: any; wellPad: [number, number, number] }) {
  const { path } = props;
  const mesh = useRef();
  const tubeRef = useRef();

  const [curve] = useState(() => {
    // Create an empty array to stores the points
    let points = [];

    // Define points along Z axis
    for (const point of path) {
      points.push(
        new THREE.Vector3(
          point[0] + props.wellPad[0],
          point[1] + props.wellPad[1],
          -point[2] + props.wellPad[2] // vertical depth +ve but in scene needs to be -ve on Z,
        )
      );
    }

    return new THREE.CatmullRomCurve3(points);
  });

  return (
    <mesh {...props} ref={mesh} scale={1}>
      {/* {geometry} */}
      <tubeGeometry ref={tubeRef} args={[curve, path.length, 5, 10, false]} />

      <meshBasicMaterial />
    </mesh>
  );
}

function exampleLineCalc(
  dataPoint: [number, number, number, number],
  lithoTubeRadius: number,
  radX: number
) {
  const [x, y, z, density] = dataPoint;
  const margin = 10; // to have margin between tube boundary and line, set 0 to attach line to tube boundary
  const r = lithoTubeRadius / 2 + density * 10 + margin;

  const calcedPos = [x + r * Math.cos(radX), y + r * Math.sin(radX), -z];
  return calcedPos;
}

function LineGraph(props: {
  wellPad: [number, number, number];
  path: [number, number, number, number][];
  wellTD: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lithoTubeRadius = 5;

  var points = props.path.map(
    (point: any) =>
      new THREE.Vector3(...exampleLineCalc(point, lithoTubeRadius, 0))
  );
  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
  useFrame((state) => {
    if (controlsRef.current) {
      state.camera.position.z = -props.wellTD / 2;
      controlsRef.current.target.set(0, 0, -props.wellTD / 2);
      controlsRef.current.update();

      const radX = controlsRef.current.getAzimuthalAngle();
      for (let i = 0; i < points.length; i++) {
        const pos = exampleLineCalc(props.path[i], lithoTubeRadius, radX);
        const [x, y, z] = pos;
        points[i].set(x, y, z);
      }
      lineGeometry.setFromPoints(points);
    }
  });

  var x_axis_points = [
    new THREE.Vector3(-400, 0, -props.wellTD - 20),
    new THREE.Vector3(400, 0, -props.wellTD - 20),
  ];
  const x_axis = new THREE.BufferGeometry().setFromPoints(x_axis_points);
  var y_axis_points = [
    new THREE.Vector3(0, -400, -props.wellTD - 20),
    new THREE.Vector3(0, 400, -props.wellTD - 20),
  ];
  const y_axis = new THREE.BufferGeometry().setFromPoints(y_axis_points);
  var z_axis_points = [
    new THREE.Vector3(0, 0, -props.wellTD - 20),
    new THREE.Vector3(0, 0, 0),
  ];
  const z_axis = new THREE.BufferGeometry().setFromPoints(z_axis_points);

  return (
    <>
      <OrbitControls
        ref={controlsRef}
        autoRotate={true}
        target={[0, 0, -500]}
        enablePan={false}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
      />
      <mesh {...props}>
        {/* @ts-ignore */}
        <line geometry={lineGeometry}>
          <lineBasicMaterial
            vertexColors={false}
            color={"#FFDA29"}
            attach={"material"}
          />
        </line>
      </mesh>
      <mesh {...props}>
        {/* @ts-ignore */}
        <line geometry={x_axis}>
          <lineBasicMaterial
            vertexColors={false}
            color={"#FF0000"}
            attach={"material"}
          />
        </line>
      </mesh>
      <mesh {...props}>
        {/* @ts-ignore */}
        <line geometry={y_axis}>
          <lineBasicMaterial
            vertexColors={false}
            color={"#00FF00"}
            attach={"material"}
          />
        </line>
      </mesh>
      <mesh {...props}>
        {/* @ts-ignore */}
        <line geometry={z_axis}>
          <lineBasicMaterial
            vertexColors={false}
            color={"#0000FF"}
            attach={"material"}
          />
        </line>
      </mesh>
    </>
  );
}

function WellProfile() {
  const [csvData, setCsvData] = useState<{}[]>([]);
  const wellPad: [number, number, number] = [0, 0, 0];
  const [wellPath, setWellPath] = useState<
    null | [number, number, number, number][]
  >(null);
  const wellTD = (wellPath && wellPath.at(-1)?.[2]) || 500;
  THREE.Object3D.DefaultUp.set(0, 0, 1);

  useEffect(() => {
    if (csvData.length > 0) {
      const wellPath = calcWellPathFromCsv(csvData);
      setWellPath(wellPath);
    }
  }, [csvData]);

  useEffect(() => {
    Papa.parse(csvFile, {
      header: true,
      download: true,
      dynamicTyping: true,

      complete: (result: any) => {
        setCsvData(result.data);
      },
    });
  }, []);

  return (
    <>
      <div>
        {wellPath ? (
          <Canvas className="wellprofile-canvas" frameloop="demand">
            <PerspectiveCamera
              fov={75}
              near={0.1}
              far={5000}
              makeDefault
              position={[700, 700, -1000]}
            />
            <ambientLight />
            <pointLight position={[100, -100, 0]} />
            <gridHelper
              args={[1000, 25]}
              position={[0, 0, -wellTD - 20]}
              rotation={[Math.PI / 2, 0, 0]}
            />

            <WellPath path={wellPath} wellPad={wellPad} />
            <LineGraph
              path={wellPath.map((point) => [
                point[0],
                point[1],
                point[2],
                point[3],
              ])}
              wellPad={wellPad}
              wellTD={wellTD}
            />
          </Canvas>
        ) : (
          <p>loading...</p>
        )}
      </div>
    </>
  );
}

export default WellProfile;
