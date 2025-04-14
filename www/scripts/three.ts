// three.js
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

import {Group,Tween,Easing} from '../tween/tween.esm.js'

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { EffectComposer, RenderPass, EffectPass, SSAOEffect } from 'postprocessing';


// physics
import { AmmoPhysics, ExtendedMesh, PhysicsLoader } from '@enable3d/ammo-physics'
import Ammo from "../ammo/ammo.wasm.js";

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
  var tween_scale, tween_pos
  var group = new Group();

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
  controls.enableZoom = false
  controls.enablePan = false
  //controls.dampingFactor = 0.001
  controls.target.set(-1, 0, 0)


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
  var rotateCylinder = false;
  var cubeBody
  // Create a central sphere at (0,0,0)
  const centralSphere = physics.add.sphere({ x: -0.75, y: 0, z: 0, radius: 0.05, mass: 0 });
  centralSphere.visible = false;



  const loader = new GLTFLoader();
  loader.load('./assets/shapes.glb', (gltf) => {
    model = gltf.scene;


  
    // Enable shadows on all objects in the model
    model.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;  // Object will cast shadows
        child.receiveShadow = true; // Object will receive shadows

        child.scale.set(0, 0, 0);

        //child.material.normalScale.set(0.1, 0.1);
        
      }

      
    }); 



    scene.add(model); 
  }); 



  function popInRandomChildren(model) {
    const children = model.children;
    const totalChildren = children.length;
    const chosenIndices = new Set();

    // Ensure we select 15 unique children (or all if there are fewer than 15)
    while (chosenIndices.size < Math.min(20, totalChildren)) {
        chosenIndices.add(Math.floor(Math.random() * totalChildren));
    }

    // Iterate over selected children and trigger popInObject at a random time
    chosenIndices.forEach((childIndex: number) => {
      const delay = Math.random() * 5000; // Random delay between 0 and 4 seconds
      setTimeout(() => {
          popInObject(children[childIndex]);  // `childIndex` is used correctly
      }, delay);
  });

  
}

  setTimeout(() => {

popInRandomChildren(model);

  }
  , 1500);

  

  function addPhysicsToModel(child){
  physics.add.existing(child, {
    shape: 'convex',
    mass: 100,
    collisionFlags: 0,
  });

  //child.body.setFriction(1);
  //child.body.setRestitution(1)
  //child.body.setAngularFactor(0);
  //child.body.setBounciness(0);

  physics.add.constraints.spring(child.body, centralSphere.body, {
    //stiffness: 5,
    //damping: 200000,
    //center: true
});


        
// Enable collision response
child.body.collisionResponse = true;

child.body.setDamping(0.95, 0.95);


   
}




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
      x: 1.2,
      y: 1.2,
      z: 1.2,
    };

    // Define target scale and duration
    tween_scale = new Tween(from,false)
        .to(to, 100) // Scale up in 1 second
        .easing(Easing.Quadratic.InOut) // Elastic bounce effect
        .onUpdate(function () {
            

          object.scale.set(from.x,from.y,from.z); 

        })
        .onComplete(function () {

          addPhysicsToModel(object);

        })
        .start();


    var from_pos = {x:0,y:0,z:0};
    var to_pos = {x: object.position.x, y: object.position.y, z: object.position.z};

    // Define target scale and duration
    tween_pos = new Tween(from_pos,false)
        .to(to_pos, 300) // Scale up in 1 second
        .easing(Easing.Quadratic.InOut) // Elastic bounce effect
        .onUpdate(function () {
            

          object.position.set(from_pos.x,from_pos.y,from_pos.z); 

        })
        .onComplete(function () {

          //addPhysicsToModel(object);

        })
        .start();

        group.add(tween_scale)
        group.add(tween_pos)
  }








const ambient = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 0.05 );
scene.add( ambient );



//// ADD SHADOW-CASTING SPOTLIGHT (Fake Shadow for Area Light)
// Create SpotLight
const spotLight = new THREE.SpotLight(0xffffff, 25);
spotLight.position.set(3, 3, 3);
spotLight.lookAt(0, 0, 0);
spotLight.angle = Math.PI / 8; // Spotlight cone angle
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



//




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






  let scrollFactor = 0; // Tracks total scroll amount

  function onScroll(event) {


    if(scrollFactor >= 0){
      scrollFactor += event.deltaY * 0.001; // Adjust sensitivity
  
      model.children.forEach(object => {

        console.log(object.body)
          if (object.body) {
              physics.destroy(object); // Remove physics
          }
          
          if(object != model.children[7]){
          let newScale = Math.max(0, 1 - scrollFactor * 10); // Prevent negative scale
          object.scale.set(newScale, newScale, newScale);
          }
          model.children[7].scale.set(1,1,1);
          model.children[7].material.color = new THREE.Color().setRGB( 1-scrollFactor, 1-scrollFactor, 1 );
      });

      if(scrollFactor > 0.2){
        rotateCylinder = true;
      }
      else{
        rotateCylinder = false;
      }


    }
    else{
      scrollFactor = 0;
      rotateCylinder = false;
    }
  }
  
  // Listen for scroll events
  window.addEventListener('wheel', onScroll);



  //touch
  let lastTouchY = 0;

function onTouchMove(event) {
    if (event.touches.length > 0) {
        let touchY = event.touches[0].clientY;
        let deltaY = lastTouchY - touchY; // Scroll direction
        lastTouchY = touchY;

        onScroll({ deltaY }); // Reuse the scroll function
    }
}

// Add event listener for touch devices
window.addEventListener('touchstart', (event) => {
  controls.dispose()
    if (event.touches.length > 0) lastTouchY = event.touches[0].clientY;
});
window.addEventListener('touchmove', onTouchMove);


  // clock
  const clock = new THREE.Clock()

  // loop
  const animate = (time) => {

    if(tween_scale){
        group.update(time)
      //tween_scale.update(time)
    }

    if(rotateCylinder){
      model.children[7].rotation.y += 0.01;
    }


    physics.update(clock.getDelta() * 1000)
    //physics.updateDebugger()

    
    spotLight.position.x = camera.position.x
    spotLight.position.y = camera.position.y
    spotLight.position.z = camera.position.z
    
    
    //spotLight.target.position.copy(camera.getWorldDirection(new THREE.Vector3())); // Point the light in the camera's direction

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
