import { useEffect } from "react";
import * as THREE from "three";
import { ARButton } from "three/examples/jsm/webxr/ARButton";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function App() {
  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // AR Button
    document.body.appendChild(ARButton.createButton(renderer));

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    scene.add(light);
    
    const loader = new GLTFLoader();
    let model;
    loader.load("/model.glb", (gltf) => {
      model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5);
      scene.add(model);
    });
    
    let hitTestSource = null;
    let hitTestSourceRequested = false;

    function onXRFrame(time, frame) {
      if (!renderer.xr.isPresenting) return;
      let session = renderer.xr.getSession();
      let referenceSpace = renderer.xr.getReferenceSpace();
      
      if (hitTestSourceRequested === false) {
        session.requestReferenceSpace("viewer").then((refSpace) => {
          session.requestHitTestSource({ space: refSpace }).then((source) => {
            hitTestSource = source;
          });
        });
        hitTestSourceRequested = true;
      }
      
      if (hitTestSource && frame) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          if (model) {
            model.position.set(pose.transform.position.x, pose.transform.position.y, pose.transform.position.z);
          }
        }
      }
      renderer.render(scene, camera);
    }

    renderer.setAnimationLoop(onXRFrame);

    // Resize handling
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

  }, []);

  return null;
}