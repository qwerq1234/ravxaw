'use strict'
let w = window;


function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("RESIZ")
}

function init() {
    /* Init scene */
    w.scene = new THREE.Scene();
    w.aspect = window.innerWidth / window.innerHeight;
    w.camera = new THREE.PerspectiveCamera( 45, aspect, 1, 4000 );
    //w.camera.lookAt(new THREE.Vector3(0, 0,0) )

    /* Init renerer */
    w.renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize( window.innerWidth-0, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    /* Init stats */
    w.renderStats = new THREEx.RendererStats()
    w.renderStats.domElement.style.position = 'absolute';
    w.renderStats.domElement.style.left = '0px';
    w.renderStats.domElement.style.bottom = '0px';
    document.body.appendChild(renderStats.domElement);

    w.fpsStats = new Stats();
    w.fpsStats.showPanel(0);
    document.body.appendChild(fpsStats.dom)

    w.clock = new THREE.Clock();

    /* 
    w.controls = new THREE.OrbitControls(camera, renderer.domElement)
    controls.minDistance = 5;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;
    */ 

    
    w.controls = new THREE.FirstPersonControls(camera);
    controls.movementSpeed = 0.0;
    controls.lookSpeed = 0.075;
    controls.target = new THREE.Vector3(0, 100, 0);
    controls.lon = -90.0; 

    camera.position.y = 70;

    window.addEventListener('resize', resize, false);

    w.audioLoaded = false;

    initAudio();
    loadTextures();
    loadSkybox();
    initGeometry();
}

function initGeometry() {

    w._vx_shdr = new THREE.ShaderMaterial( {
        uniforms: {
            time: {value: 1.0},
            resolution: {value: new THREE.Vector2() },
            textures: {value: w.txtsLoaded},
            soundData: {value: [0, 0, 0, 0, 0, 0, 0, 0] }
        },
        vertexShader: document.getElementById('vx_shader').textContent,
        fragmentShader: document.getElementById('fg_shader').textContent,
        side: THREE.DoubleSide,
    });
   
    w.setInterval(function() {
        var arr = Array.from(anal.getFrequencyData()); 
        var ara = []; 
        var s = 0.0; 
        for(var i=0,j=0;i<arr.length;++i) { 
            arr[i]  /= 256.0;
        }
        
        for(var i=0;i<8;++i) {
            var q = 0;
            for(var j=0;j<64;++j) 
                q += arr[i*64 + j]
            ara[i] = q;
        }

        _vx_shdr.uniforms.soundData.value = ara;

    }, 100);

    w.terrain = new Tunnel(new THREE.Vector3(0.0, 0), 3 * 21, 3 * 21);

}

function loadTextures() {
    w.texLoader = new THREE.TextureLoader();
    texLoader.crossOrigin = '';

    var r = 'textures/';
    var txts = [
        r + 'flower_scale.jpg',
        r + 'rose_scale.jpg',
        r + 'cat1_scale.jpg',
        r + 'train_win_scale.jpg'
    ];
    w.txtsLoaded = [];
    for(var i=0;i<txts.length;++i) {
        txtsLoaded.push(w.texLoader.load(txts[i]));
    }
}

function initAudio() {
    w.listener = new THREE.AudioListener();
    w.camera.add(listener);

    w.snd = new THREE.Audio(w.listener);

    w.audioLoader = new THREE.AudioLoader();
    w.audioLoader.crossOrigin = '';
    w.audioLoader.load('music/RMS.mp3', function(buffer) {
            console.log('Loaded...');
            w.audioLoaded = true; 
            w.snd.setBuffer(buffer);
            w.snd.setLoop(false);
            w.snd.setVolume(0.5);        
            w.snd.play();
        }
    );

    w.anal = new THREE.AudioAnalyser(w.snd, 2048);
        
}

function loadSkybox() {
    //var r = "http://127.0.0.1:8887/skybox/pn_"
    var r = 'skybox/pn_'; 
    var urls = [r+"rt.png", r+"lf.png",
                r+"up.png", r+"dn.png",
                r+"bk.png", r+"ft.png"];

    w.cubeTexLoader = new THREE.CubeTextureLoader();
    w.cubeTexLoader.crossOrigin = '';

    cubeTexLoader.format = THREE.RGBFormat;

    w.skyTexCube = w.cubeTexLoader.load(urls,
        function(q){console.log('Loaded sky');},
        function(w){},
        function(e){console.log('sky load error')}); 

    w.scene.background = w.skyTexCube;
}

class Tunnel {
    constructor(posCenter, sizeX, sizeZ) {
        this.center = posCenter;
        this.sX = sizeX, this.sZ = sizeZ;
        this.pointCount = (sizeX) * (sizeZ);

        this.geometry = new THREE.BufferGeometry();

        this.verticesAttr = new THREE.BufferAttribute(new Float32Array(this.pointCount*3), 3);

        //console.log('pc:', this.pointCount);
        //console.log(this.offsetsAttr.count);

        this.generateTerrain();
    }

    generateTerrain() {
        var xDist = 8.0, zDist = 8.0;

        var xBegin = (-(this.sX/2.0) * xDist);        
        var zBegin = (-(this.sZ/2.0) * zDist);

        for(var x=0,i=0;x<this.sX;++x) {
            for(var z=0;z<this.sZ;++z, i+=1) {
                this.verticesAttr.setXYZ(i, xBegin + xDist*(x),
                                            0.0,
                                            zBegin + zDist*(z) ); 
            }
        }

        if(i != this.pointCount) {
            console.log("Hmm, this may be overflow! :x");
            throw '';
        }


        this.geometry.addAttribute('position', this.verticesAttr);

        
        for(var z=0;z<256;++z) {
            var meshFloor = new THREE.Points(this.geometry, _vx_shdr);
            var meshWallR = new THREE.Points(this.geometry, _vx_shdr);
            var meshWallL = new THREE.Points(this.geometry, _vx_shdr);

            meshFloor.position.z = -512 + -512 * z;

            meshWallR.position.z = -512 + -512 * z;
            meshWallR.position.x = 450;
            meshWallR.rotation.z = THREE.Math.degToRad(60.0);
            meshWallR.position.y = 200;
            
            meshWallL.position.z = -512 + -512 * z;
            meshWallL.position.x = -450;
            meshWallL.rotation.z = THREE.Math.degToRad(-60.0);
            meshWallL.position.y = 200;

            scene.add(meshFloor);
            scene.add(meshWallL);
            scene.add(meshWallR);
        }
         

    }

};

function render() {
    fpsStats.begin();
    requestAnimationFrame( render );

    
    controls.update(clock.getDelta())
    _vx_shdr.uniforms.time.value = clock.getElapsedTime();

    w._t = clock.getElapsedTime();

    if(w.audioLoaded) 
        camera.position.z -= 5.5;

    w.renderer.render(scene, camera);

    renderStats.update(renderer);
    fpsStats.end();
};

