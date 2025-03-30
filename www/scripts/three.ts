// three.js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import {Tween,Easing} from '../tween/tween.esm.js'

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer, RenderPass, EffectPass, SSAOEffect } from 'postprocessing';


// physics
import { AmmoPhysics, ExtendedMesh, PhysicsLoader } from '@enable3d/ammo-physics'

// CSG
import { CSG } from '@enable3d/three-graphics/dist/csg'

// Flat
import { TextTexture, TextSprite } from '@enable3d/three-graphics/dist/flat'
import { VERSION } from 'enable3d'



const MainScene = () => {
  // sizes
  const width = window.innerWidth
  const height = window.innerHeight

  // scene
  const scene = new THREE.Scene()
  scene.background = new THREE.Color("#000000")

  // camera
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  camera.position.set(2,0,-0.2)
  camera.lookAt(0, 0, 0)

  // you can access Ammo directly if you want
  // new Ammo.btVector3(1, 2, 3).y()

  // 2d camera/2d scene
  const scene2d = new THREE.Scene()
  const camera2d = new THREE.OrthographicCamera(0, width, height, 0, 1, 1000)
  camera2d.position.setZ(10)

  //tween  
  var tween_scale

  // renderer
  const renderer = new THREE.WebGLRenderer({antialias: true})
  renderer.setSize(width, height)
  renderer.autoClear = false
  document.body.appendChild(renderer.domElement)

  renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows

  // csg
  const mat = new THREE.MeshNormalMaterial()


  /*
// Load HDR Environment Map
const rgbeLoader = new RGBELoader();
rgbeLoader.load('./assets/small_empty_room_3_4k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture; // Set environment for reflections
  
});
*/


  // add 2d text
  const text = new TextTexture('We are PO2', { fontWeight: 'bold', fontSize: 48 })
  const sprite = new TextSprite(text)
  const scale = 0.5
  sprite.setScale(scale)
  sprite.setPosition(0 + (text.width * scale) / 2 + 12, height - (text.height * scale) / 2 - 12)
  scene2d.add(sprite)

  // dpr
  const DPR = window.devicePixelRatio
  renderer.setPixelRatio(Math.min(2, DPR))

  // orbit controls
  var controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  //controls.dampingFactor = 0.001



  // physics
  const physics = new AmmoPhysics(scene as any)
  physics.debug?.enable()

  // extract the object factory from physics
  // the factory will make/add object without physics
  const { factory } = physics



  // static ground
  //physics.add.ground({ width: 20, height: 20 })

  physics.setGravity(0, 0, 0);



  //


  var model;
  var cubeBody
  // Create a central sphere at (0,0,0)
  const centralSphere = physics.add.sphere({ x: -0.75, y: 0, z: 0, radius: 0.05, mass: 0 });

  const loader = new GLTFLoader();
  loader.load('./assets/shapes.glb', (gltf) => {
    model = gltf.scene;


  
    // Enable shadows on all objects in the model
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;  // Object will cast shadows
        child.receiveShadow = true; // Object will receive shadows

        if(child.name == "cube1"){  

          console.log(child);

          cubeBody = physics.add.existing(child, {
            shape: 'convex',
            mass: 100,
            collisionFlags: 0,
          });
  
          physics.add.constraints.spring(child.body, centralSphere.body, {
            stiffness: 500,
            damping: 200,
            center: true
        });
  
  
                
        // Enable collision response
        child.body.collisionResponse = true;

        }
        else{
        
        
        physics.add.existing(child, {
          shape: 'convex',
          mass: 100,
          collisionFlags: 0,
        });

        physics.add.constraints.spring(child.body, centralSphere.body, {
          stiffness: 500,
          damping: 200,
          center: true
      });


              
      // Enable collision response
      child.body.collisionResponse = true;
    }

      

        
        //child.body.applyForce((Math.random() * 0.001 - 0.0005), (Math.random() * 0.001 - 0.0005), (Math.random() * 0.001 - 0.0005));  
        
         
      }



      
    }); 
    // physics.add.constraints.spring(model.children[0].body, model.children[1].body, {
    //   damping: 0.1
    // })

    scene.add(model); 
  }); 

  setTimeout(() => {
    physics.destroy(cubeBody);
    console.log(cubeBody)
  }
  , 2000);

  

  //tween to scale gradually
  function popInObject(object) {

    // Start scale at zero
    //object.scale.set(0, 0, 0);

    var from = {
      x: object.scale.x,
      y: object.scale.y,
      z: object.scale.z
    };

    var to = {
      x: 30,
      y: 30,
      z: 30,
    };

    // Define target scale and duration
    tween_scale = new Tween(from,false)
        .to(to, 1000) // Scale up in 1 second
        .easing(Easing.Quadratic.InOut) // Elastic bounce effect
        .onUpdate(function () {
          updatePhysicsScale(object, from.x);    
          //object.scale.set(from.x,from.y,from.z); 
  
          //object.body.needsUpdate = true;  
        })
        .start();
  }



// Function to update physics body while scaling
function updatePhysicsScale(object, newScale) {
  if (!object.body) return;


  // Destroy old physics body
  physics.destroy(object.body);
  console.log(object.body);
  object.body.needsUpdate = true;

  // Update Three.js visual scale
  object.scale.set(newScale, newScale, newScale);

  // Recreate the physics body with the new scale
  //physics.add.existing(object, { shape: 'convex', mass: 1 });

}

const ambient = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 0.05 );
scene.add( ambient );



//// ADD SHADOW-CASTING SPOTLIGHT (Fake Shadow for Area Light)
// Create SpotLight
const spotLight = new THREE.SpotLight(0xffffff, 85);
spotLight.position.set(3, 3, 3);
spotLight.lookAt(0, 0, 0);
spotLight.angle = Math.PI / 6; // Spotlight cone angle
spotLight.penumbra =1; // Soft edge
spotLight.castShadow = true;

spotLight.shadow.mapSize.width = 2048;
spotLight.shadow.mapSize.height = 2048;
spotLight.shadow.camera.near = 1;
spotLight.shadow.camera.far = 10;
spotLight.shadow.focus = 1;
scene.add(spotLight);

// Create SpotLight Helper
const spotLightHelper = new THREE.SpotLightHelper(spotLight);
//scene.add(spotLightHelper);

//

  //applyMagneticForce(magnet1, magnet2);

  // Add a force to the magnets
  function applyMagneticForce(obj1, obj2) {
    let direction = new THREE.Vector3().subVectors(obj2.position, obj1.position);
    let distance = direction.length();
    let minDistance = 0.1; // Prevents excessive force when very close

    if (distance > minDistance) {
        direction.normalize();

        // Simulate inverse square law for magnetic attraction
        let forceStrength = 50 / (distance * distance); // Adjust this for strength
        let force = direction.multiplyScalar(forceStrength);

        obj1.body.applyForce(force.x, force.y, force.z);
        obj2.body.applyForce(-force.x, -force.y, -force.z);
    }
}

//


var attractionPoint = new THREE.Vector3(0.1, 0.4, 0);


// applyAttractionForce(magnet1, attractionPoint);
// applyAttractionForce(magnet2, attractionPoint);
// applyAttractionForce(magnet3, attractionPoint);
// applyAttractionForce(magnet4, attractionPoint);
// applyAttractionForce(magnet5, attractionPoint);
// applyAttractionForce(magnet6, attractionPoint);


function applyAttractionForce(obj, target) {
  let direction = new THREE.Vector3().subVectors(target, obj.position);
  let distance = direction.length();
  let minDistance = 1.0;

  if (distance > minDistance) {
      direction.normalize();

      // ✅ Attraction Force Formula (Inverse Square Law)
      let forceStrength = 1000 / (distance * distance);
      let force = direction.multiplyScalar(forceStrength);

      obj.body.applyForce(-force.x, force.y, force.z);


      
  }

  
}


window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Update camera aspect ratio
  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  // Update renderer size
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limits pixel ratio for performance
});



  // post processing
/*

// Post-Processing Setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

// SSAO Effect
const ssaoEffect = new SSAOEffect(camera, renderer, {
  samples: 32, // Higher is better but expensive
  radius: 0.5, // Radius of occlusion
  intensity: 1.5, // AO strength
  bias: 0.025 // Reduces artifacts
});

const effectPass = new EffectPass(camera, ssaoEffect);
effectPass.renderToScreen = true;
composer.addPass(effectPass);
*/
  //

  // clock
  const clock = new THREE.Clock()

  // loop
  const animate = (time) => {

    if(tween_scale){
        
      tween_scale.update(time)
    }

    physics.update(clock.getDelta() * 1000)
    //physics.updateDebugger()

    // you have to clear and call render twice because there are 2 scenes
    // one 3d scene and one 2d scene
    renderer.clear()
    renderer.render(scene, camera)
    renderer.clearDepth()
    renderer.render(scene2d, camera2d)
    //composer.render() 

    controls.update(clock.getDelta() * 1000)

    requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
}

// '/ammo' is the folder where all ammo file are
PhysicsLoader('/ammo', () => MainScene())
