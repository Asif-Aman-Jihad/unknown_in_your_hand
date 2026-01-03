class CosmicVisualizer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.currentModel = null;
        this.models = {};
        this.isCameraEnabled = false;
        this.handDetector = null;
        this.autoRotate = false;
        this.animationTime = 0;
        
        this.init();
    }

    async init() {
        // Initialize Three.js scene
        this.setupThreeJS();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load models
        await this.loadModels();
        
        // Start animation loop
        this.animate();
        
        // Update loading progress
        this.updateLoadingProgress(100);
        
        // Hide loading screen after 1 second
        setTimeout(() => {
            document.getElementById('loading-screen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('loading-screen').style.display = 'none';
            }, 300);
        }, 1000);
    }

    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // Add stars background
        this.addStars();
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 5;
        
        // Create renderer
        const container = document.getElementById('three-container');
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Add orbit controls for mouse/touch
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.0;
        
        // Add lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
        
        // Initialize clock for animations
        this.clock = new THREE.Clock();
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 10000;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 3000;
            positions[i + 1] = (Math.random() - 0.5) * 3000;
            positions[i + 2] = (Math.random() - 0.5) * 3000;
            
            // Random star colors (mostly white, some blue/red)
            const colorType = Math.random();
            if (colorType < 0.7) {
                colors[i] = 1.0;     // R
                colors[i + 1] = 1.0; // G
                colors[i + 2] = 1.0; // B
            } else if (colorType < 0.85) {
                colors[i] = 0.7;     // R
                colors[i + 1] = 0.8; // G
                colors[i + 2] = 1.0; // B (blue stars)
            } else {
                colors[i] = 1.0;     // R
                colors[i + 1] = 0.8; // G
                colors[i + 2] = 0.8; // B (red giants)
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 1.5,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light (sun-like)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 10, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        this.scene.add(directionalLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-10, 5, -10);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
        rimLight.position.set(0, -10, -10);
        this.scene.add(rimLight);
        
        // Add a subtle point light for local illumination
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 50);
        pointLight.position.set(0, 5, 5);
        this.scene.add(pointLight);
    }

    async loadModels() {
        // Create realistic models
        this.models.earth = this.createEarth();
        this.scene.add(this.models.earth);
        
        this.models.blackhole = this.createBlackHole();
        this.models.blackhole.visible = false;
        this.scene.add(this.models.blackhole);
        
        this.models['human-body'] = this.createHumanBody();
        this.models['human-body'].visible = false;
        this.scene.add(this.models['human-body']);
        
        this.models.supernova = this.createSupernova();
        this.models.supernova.visible = false;
        this.scene.add(this.models.supernova);
        
        this.models.galaxy = this.createGalaxy();
        this.models.galaxy.visible = false;
        this.scene.add(this.models.galaxy);
        
        // Set Earth as current model
        this.currentModel = 'earth';
        
        this.updateLoadingProgress(50);
    }

    createEarth() {
        const group = new THREE.Group();
        
        // High-detail Earth geometry
        const geometry = new THREE.SphereGeometry(1, 128, 128);
        
        // Load Earth textures
        const textureLoader = new THREE.TextureLoader();
        
        // Create Earth material with multiple texture maps
        const earthMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: new THREE.Color(0x111111),
            shininess: 10,
            bumpScale: 0.05
        });
        
        const earth = new THREE.Mesh(geometry, earthMaterial);
        group.add(earth);
        
        // Try to load high-res textures
        textureLoader.load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
            (texture) => {
                earthMaterial.map = texture;
                earthMaterial.needsUpdate = true;
            }
        );
        
        textureLoader.load(
            'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
            (texture) => {
                earthMaterial.normalMap = texture;
                earthMaterial.needsUpdate = true;
            }
        );
        
        // Create realistic atmosphere with shader
        const atmosphereGeometry = new THREE.SphereGeometry(1.03, 64, 64);
        const atmosphereMaterial = new THREE.ShaderMaterial({
            uniforms: {
                glowColor: { value: new THREE.Color(0x00a3ff) },
                viewVector: { value: new THREE.Vector3(0, 0, 1) }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 glowColor;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    gl_FragColor = vec4(glowColor, intensity * 0.3);
                }
            `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        group.add(atmosphere);
        
        // Cloud layer
        const cloudGeometry = new THREE.SphereGeometry(1.01, 64, 64);
        const cloudMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        group.add(clouds);
        
        // Store references for animation
        earth.userData = { rotationSpeed: 0.001 };
        clouds.userData = { rotationSpeed: 0.0005 };
        
        return group;
    }

    createBlackHole() {
        const group = new THREE.Group();
        
        // Black hole core (event horizon)
        const coreGeometry = new THREE.SphereGeometry(0.8, 64, 64);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            side: THREE.BackSide
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);
        
        // Gravitational lensing effect
        const lensGeometry = new THREE.SphereGeometry(1.2, 64, 64);
        const lensMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    float distortion = sin(time + position.y * 10.0) * 0.1;
                    vec3 newPosition = position * (1.0 + distortion);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec3 vPosition;
                void main() {
                    float intensity = sin(time * 2.0 + vPosition.x * 5.0) * 0.5 + 0.5;
                    gl_FragColor = vec4(0.0, intensity * 0.5, intensity, 0.3);
                }
            `,
            transparent: true,
            wireframe: true
        });
        
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        group.add(lens);
        
        // Accretion disk
        const diskGroup = new THREE.Group();
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.RingGeometry(1.0 + i * 0.3, 2.5 + i * 0.5, 128);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: i === 0 ? 0xff3300 : i === 1 ? 0xff6600 : 0xff9900,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.6 - i * 0.15
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ring.rotation.z = i * 0.2;
            diskGroup.add(ring);
        }
        group.add(diskGroup);
        
        // Particle system for matter stream
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const positions = new Float32Array(particlesCount * 3);
        const colors = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i += 3) {
            const radius = 3 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = (Math.random() - 0.5) * 0.5;
            positions[i + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            colors[i] = 1.0;
            colors[i + 1] = 0.5 + Math.random() * 0.5;
            colors[i + 2] = 0.0;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        group.add(particles);
        
        // Store for animation
        diskGroup.userData = { rotationSpeed: 0.005 };
        particles.userData = { rotationSpeed: 0.001 };
        lens.material.uniforms.time = { value: 0 };
        
        return group;
    }

    createHumanBody() {
        const group = new THREE.Group();
        
        // Materials for different body parts
        const materials = {
            skin: new THREE.MeshPhongMaterial({
                color: 0xffcc99,
                shininess: 30,
                specular: 0x111111
            }),
            muscle: new THREE.MeshPhongMaterial({
                color: 0xff6666,
                shininess: 20
            }),
            bone: new THREE.MeshPhongMaterial({
                color: 0xffffcc,
                shininess: 50,
                specular: 0x222222
            })
        };
        
        // Head with detailed geometry
        const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const head = new THREE.Mesh(headGeometry, materials.skin);
        head.position.y = 1.6;
        group.add(head);
        
        // Torso with anatomical shape
        const torsoGeometry = new THREE.CylinderGeometry(0.25, 0.3, 1, 16);
        const torso = new THREE.Mesh(torsoGeometry, materials.muscle);
        torso.position.y = 0.8;
        group.add(torso);
        
        // Detailed arms with joints
        const createArm = (side) => {
            const armGroup = new THREE.Group();
            
            // Upper arm
            const upperArmGeometry = new THREE.CylinderGeometry(0.08, 0.09, 0.4, 12);
            const upperArm = new THREE.Mesh(upperArmGeometry, materials.skin);
            upperArm.position.y = 0.2;
            armGroup.add(upperArm);
            
            // Elbow joint
            const elbowGeometry = new THREE.SphereGeometry(0.09, 16, 16);
            const elbow = new THREE.Mesh(elbowGeometry, materials.skin);
            elbow.position.y = 0;
            armGroup.add(elbow);
            
            // Lower arm
            const lowerArmGeometry = new THREE.CylinderGeometry(0.07, 0.08, 0.4, 12);
            const lowerArm = new THREE.Mesh(lowerArmGeometry, materials.skin);
            lowerArm.position.y = -0.2;
            armGroup.add(lowerArm);
            
            // Hand
            const handGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const hand = new THREE.Mesh(handGeometry, materials.skin);
            hand.position.y = -0.4;
            armGroup.add(hand);
            
            armGroup.position.x = side * 0.4;
            armGroup.position.y = 1.2;
            
            return armGroup;
        };
        
        group.add(createArm(-1)); // Left arm
        group.add(createArm(1));  // Right arm
        
        // Detailed legs
        const createLeg = (side) => {
            const legGroup = new THREE.Group();
            
            // Upper leg
            const upperLegGeometry = new THREE.CylinderGeometry(0.1, 0.11, 0.6, 12);
            const upperLeg = new THREE.Mesh(upperLegGeometry, materials.skin);
            upperLeg.position.y = -0.3;
            legGroup.add(upperLeg);
            
            // Knee
            const kneeGeometry = new THREE.SphereGeometry(0.11, 16, 16);
            const knee = new THREE.Mesh(kneeGeometry, materials.skin);
            knee.position.y = 0;
            legGroup.add(knee);
            
            // Lower leg
            const lowerLegGeometry = new THREE.CylinderGeometry(0.09, 0.1, 0.6, 12);
            const lowerLeg = new THREE.Mesh(lowerLegGeometry, materials.skin);
            lowerLeg.position.y = -0.3;
            legGroup.add(lowerLeg);
            
            // Foot
            const footGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.25);
            const foot = new THREE.Mesh(footGeometry, materials.skin);
            foot.position.y = -0.6;
            foot.position.z = 0.1;
            foot.rotation.x = Math.PI / 6;
            legGroup.add(foot);
            
            legGroup.position.x = side * 0.15;
            legGroup.position.y = 0;
            
            return legGroup;
        };
        
        group.add(createLeg(-0.3)); // Left leg
        group.add(createLeg(0.3));  // Right leg
        
        // Skeletal system visualization
        const skeletonGroup = new THREE.Group();
        
        // Spine
        const spineGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1, 8);
        const spineMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        const spine = new THREE.Mesh(spineGeometry, spineMaterial);
        spine.position.y = 0.8;
        skeletonGroup.add(spine);
        
        // Rib cage
        for (let i = 0; i < 12; i++) {
            const ribGeometry = new THREE.TorusGeometry(0.25, 0.02, 8, 16, Math.PI);
            const rib = new THREE.Mesh(ribGeometry, spineMaterial);
            rib.position.y = 0.7 + i * 0.08;
            rib.rotation.x = Math.PI / 2;
            skeletonGroup.add(rib);
        }
        
        group.add(skeletonGroup);
        
        return group;
    }

    createSupernova() {
        const group = new THREE.Group();
        
        // Supernova core with pulsating effect
        const coreGeometry = new THREE.SphereGeometry(0.6, 64, 64);
        const coreMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 },
                intensity: { value: 1.0 }
            },
            vertexShader: `
                uniform float time;
                varying vec3 vPosition;
                void main() {
                    vPosition = position;
                    float pulse = sin(time * 2.0) * 0.1;
                    vec3 newPosition = position * (1.0 + pulse);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform float intensity;
                varying vec3 vPosition;
                void main() {
                    float d = length(vPosition);
                    float glow = exp(-d * 3.0);
                    
                    vec3 coreColor = mix(
                        mix(vec3(1.0, 1.0, 1.0), vec3(1.0, 1.0, 0.5), d * 2.0),
                        vec3(1.0, 0.5, 0.0),
                        d * 3.0
                    );
                    
                    gl_FragColor = vec4(coreColor * (1.0 + glow * intensity), 1.0);
                }
            `,
            transparent: false
        });
        
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);
        
        // Shockwave rings
        const ringsGroup = new THREE.Group();
        for (let i = 0; i < 8; i++) {
            const ringGeometry = new THREE.RingGeometry(0.8 + i * 0.4, 1.0 + i * 0.4, 64);
            const ringMaterial = new THREE.ShaderMaterial({
                uniforms: {
                    time: { value: 0.0 },
                    ringIndex: { value: i }
                },
                vertexShader: `
                    uniform float time;
                    uniform float ringIndex;
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        float offset = ringIndex * 0.3 + time * 0.5;
                        float wave = sin(offset * 3.0) * 0.05;
                        vec3 pos = position;
                        pos.xz *= 1.0 + wave;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float time;
                    uniform float ringIndex;
                    varying vec2 vUv;
                    void main() {
                        float distance = length(vUv - vec2(0.5, 0.5));
                        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
                        
                        float wave = sin(angle * 10.0 + time * 5.0 + ringIndex) * 0.5 + 0.5;
                        float alpha = (1.0 - distance) * wave * (0.8 - ringIndex * 0.1);
                        
                        vec3 color = mix(
                            vec3(1.0, 1.0, 0.0),
                            vec3(1.0, 0.3, 0.0),
                            ringIndex / 8.0
                        );
                        
                        gl_FragColor = vec4(color, alpha * 0.6);
                    }
                `,
                side: THREE.DoubleSide,
                transparent: true,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            ringsGroup.add(ring);
        }
        group.add(ringsGroup);
        
        // Debris particles
        const debrisGeometry = new THREE.BufferGeometry();
        const debrisCount = 2000;
        const positions = new Float32Array(debrisCount * 3);
        const velocities = new Float32Array(debrisCount * 3);
        const sizes = new Float32Array(debrisCount);
        
        for (let i = 0; i < debrisCount; i++) {
            const radius = 0.5 + Math.random() * 4;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            velocities[i * 3] = positions[i * 3] * 0.01;
            velocities[i * 3 + 1] = positions[i * 3 + 1] * 0.01;
            velocities[i * 3 + 2] = positions[i * 3 + 2] * 0.01;
            
            sizes[i] = 0.02 + Math.random() * 0.08;
        }
        
        debrisGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        debrisGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        debrisGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const debrisMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: `
                attribute vec3 velocity;
                attribute float size;
                uniform float time;
                void main() {
                    vec3 newPosition = position + velocity * time;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                    gl_PointSize = size * 300.0 / gl_Position.w;
                }
            `,
            fragmentShader: `
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (r > 0.5) discard;
                    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
                    gl_FragColor = vec4(1.0, 0.8, 0.2, alpha * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        const debris = new THREE.Points(debrisGeometry, debrisMaterial);
        group.add(debris);
        
        // Store for animation
        core.material.uniforms.time = { value: 0 };
        ringsGroup.children.forEach((ring, i) => {
            ring.material.uniforms.time = { value: 0 };
            ring.material.uniforms.ringIndex = { value: i };
        });
        debris.material.uniforms.time = { value: 0 };
        
        return group;
    }

    createGalaxy() {
        const group = new THREE.Group();
        
        // Galaxy disk with spiral arms
        const diskGeometry = new THREE.CylinderGeometry(4, 4, 0.1, 128);
        const diskMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: `
                uniform float time;
                varying vec2 vUv;
                varying float distance;
                void main() {
                    vUv = uv;
                    distance = length(position.xz);
                    
                    float angle = atan(position.z, position.x);
                    float spiral = sin(angle * 4.0 + distance * 2.0 + time);
                    
                    vec3 newPosition = position;
                    newPosition.y = spiral * 0.2 * exp(-distance * 0.5);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying float distance;
                void main() {
                    vec3 baseColor = vec3(0.2, 0.3, 0.8);
                    
                    float armPattern = sin(atan(vUv.x - 0.5, vUv.y - 0.5) * 4.0 + distance * 10.0 + time) * 0.5 + 0.5;
                    
                    float bulge = exp(-distance * 3.0);
                    
                    vec3 color = mix(baseColor, vec3(1.0, 1.0, 0.8), bulge);
                    color = mix(color, vec3(1.0, 0.9, 0.6), armPattern * 0.3);
                    
                    float alpha = (1.0 - smoothstep(0.0, 4.0, distance)) * 0.6;
                    
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            side: THREE.DoubleSide,
            transparent: true
        });
        
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.rotation.x = Math.PI / 2;
        group.add(disk);
        
        // Stars in the galaxy
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 10000;
        const starPositions = new Float32Array(starsCount * 3);
        const starColors = new Float32Array(starsCount * 3);
        const starSizes = new Float32Array(starsCount);
        
        for (let i = 0; i < starsCount; i++) {
            const arm = Math.floor(Math.random() * 4);
            const distance = Math.random() * 3.5;
            const angle = Math.random() * Math.PI * 2;
            
            const spiralAngle = angle + Math.log(distance + 1) * 2 + (arm * Math.PI / 2);
            
            const height = (Math.random() - 0.5) * 0.3;
            
            starPositions[i * 3] = Math.cos(spiralAngle) * distance;
            starPositions[i * 3 + 1] = height;
            starPositions[i * 3 + 2] = Math.sin(spiralAngle) * distance;
            
            const temperature = Math.random();
            if (temperature < 0.7) {
                starColors[i * 3] = 1.0;
                starColors[i * 3 + 1] = temperature;
                starColors[i * 3 + 2] = temperature * 0.5;
            } else if (temperature < 0.9) {
                starColors[i * 3] = 1.0;
                starColors[i * 3 + 1] = 1.0;
                starColors[i * 3 + 2] = temperature;
            } else {
                starColors[i * 3] = 0.5;
                starColors[i * 3 + 1] = 0.7;
                starColors[i * 3 + 2] = 1.0;
            }
            
            starSizes[i] = 0.01 + Math.random() * 0.03;
        }
        
        // Add central bulge stars
        const bulgeCount = 2000;
        for (let i = 0; i < bulgeCount; i++) {
            const index = starsCount + i;
            const radius = Math.random() * 1.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            starPositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
            starPositions[index * 3 + 1] = radius * Math.cos(phi) * 0.3;
            starPositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            starColors[index * 3] = 1.0;
            starColors[index * 3 + 1] = 1.0;
            starColors[index * 3 + 2] = 0.8;
            
            starSizes[index] = 0.02 + Math.random() * 0.04;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
        starsGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));
        
        const starsMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0.0 }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                uniform float time;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    
                    float twinkle = sin(time * 5.0 + position.x * 100.0) * 0.1 + 0.9;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * 300.0 / gl_Position.w * twinkle;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (r > 0.5) discard;
                    float alpha = 1.0 - smoothstep(0.3, 0.5, r);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            vertexColors: true,
            blending: THREE.AdditiveBlending
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        group.add(stars);
        
        // Central supermassive black hole
        const blackHoleGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const blackHoleMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000
        });
        const blackHole = new THREE.Mesh(blackHoleGeometry, blackHoleMaterial);
        group.add(blackHole);
        
        // Accretion disk around black hole
        const accretionGeometry = new THREE.RingGeometry(0.4, 1.5, 64);
        const accretionMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const accretion = new THREE.Mesh(accretionGeometry, accretionMaterial);
        accretion.rotation.x = Math.PI / 2;
        group.add(accretion);
        
        // Store for animation
        disk.material.uniforms.time = { value: 0 };
        stars.material.uniforms.time = { value: 0 };
        
        return group;
    }

    setupEventListeners() {
        // Model selection
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const model = e.target.closest('.nav-link').dataset.model;
                this.switchModel(model);
            });
        });
        
        document.getElementById('model-select').addEventListener('change', (e) => {
            this.switchModel(e.target.value);
        });
        
        // Control buttons
        document.getElementById('reset-view').addEventListener('click', () => {
            this.resetView();
        });
        
        document.getElementById('auto-rotate').addEventListener('click', (e) => {
            this.toggleAutoRotate(e.target);
        });
        
        // Camera permission
        document.getElementById('allow-camera').addEventListener('click', () => {
            this.requestCameraPermission();
        });
        
        document.getElementById('deny-camera').addEventListener('click', () => {
            this.hideCameraModal();
        });
        
        document.getElementById('toggle-camera').addEventListener('click', () => {
            this.toggleCamera();
        });
        
        // Panel toggle
        document.getElementById('toggle-panel').addEventListener('click', () => {
            this.toggleControlPanel();
        });
        
        // Menu toggle for mobile
        document.getElementById('menu-toggle').addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });
        
        // Update sliders
        document.getElementById('rotation-speed').addEventListener('input', (e) => {
            if (this.controls) {
                this.controls.rotateSpeed = parseFloat(e.target.value);
            }
        });
        
        document.getElementById('zoom-sensitivity').addEventListener('input', (e) => {
            if (this.controls) {
                this.controls.zoomSpeed = parseFloat(e.target.value);
            }
        });
        
        // Close modal when clicking outside
        document.getElementById('camera-modal').addEventListener('click', (e) => {
            if (e.target.id === 'camera-modal') {
                this.hideCameraModal();
            }
        });
    }

    switchModel(modelName) {
        if (this.currentModel === modelName) return;
        
        // Hide current model
        if (this.models[this.currentModel]) {
            this.models[this.currentModel].visible = false;
        }
        
        // Show new model
        this.currentModel = modelName;
        this.models[modelName].visible = true;
        
        // Update UI
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.model === modelName);
        });
        
        document.getElementById('model-select').value = modelName;
        
        // Update information panel
        this.updateInfoPanel(modelName);
        
        // Reset view for new model
        this.resetView();
        
        // Reset animation time
        this.animationTime = 0;
    }

    updateInfoPanel(modelName) {
        const info = {
            'earth': {
                title: 'Earth',
                description: 'Our home planet, the third from the Sun. The only known celestial body to harbor life.',
                facts: [
                    'Diameter: 12,742 km',
                    'Age: 4.54 billion years',
                    'Surface Temperature: -88°C to 58°C',
                    'Atmosphere: 78% Nitrogen, 21% Oxygen',
                    'Orbital Period: 365.25 days'
                ]
            },
            'blackhole': {
                title: 'Black Hole',
                description: 'A region of spacetime where gravity is so strong that nothing can escape from it.',
                facts: [
                    'Types: Stellar, Intermediate, Supermassive',
                    'Event Horizon: Point of no return',
                    'Singularity: Infinite density point',
                    'First Image: Captured in 2019',
                    'Closest: 1,000 light-years away'
                ]
            },
            'human-body': {
                title: 'Human Body',
                description: 'A complex biological system with trillions of cells working in harmony.',
                facts: [
                    'Cells: 37.2 trillion',
                    'Organs: 78 major organs',
                    'Bones: 206 in adults',
                    'DNA Length: 2 meters per cell',
                    'Brain Neurons: 86 billion'
                ]
            },
            'supernova': {
                title: 'Supernova',
                description: 'A powerful and luminous stellar explosion that occurs at the end of a star\'s life.',
                facts: [
                    'Types: Type I and Type II',
                    'Brightness: Can outshine entire galaxies',
                    'Duration: Weeks to months',
                    'Remnants: Neutron stars or black holes',
                    'Last in Milky Way: 1604'
                ]
            },
            'galaxy': {
                title: 'Milky Way Galaxy',
                description: 'Our home galaxy, a barred spiral galaxy containing 100-400 billion stars.',
                facts: [
                    'Diameter: 100,000 light-years',
                    'Stars: 100-400 billion',
                    'Age: 13.61 billion years',
                    'Solar System Location: Orion Arm',
                    'Central Black Hole: Sagittarius A*'
                ]
            }
        };
        
        const modelInfo = info[modelName];
        const infoContent = document.getElementById('info-content');
        
        infoContent.innerHTML = `
            <h5>${modelInfo.title}</h5>
            <p>${modelInfo.description}</p>
            <ul class="info-facts">
                ${modelInfo.facts.map(fact => `<li>${fact}</li>`).join('')}
            </ul>
        `;
    }

    resetView() {
        if (this.controls) {
            this.controls.reset();
        }
        
        // Center camera on model
        if (this.models[this.currentModel]) {
            const box = new THREE.Box3().setFromObject(this.models[this.currentModel]);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            const maxDim = Math.max(size.x, size.y, size.z);
            const cameraDistance = maxDim * 2.0;
            
            this.camera.position.copy(center);
            this.camera.position.z += cameraDistance;
            this.camera.lookAt(center);
            
            if (this.controls) {
                this.controls.target.copy(center);
                this.controls.update();
            }
        }
    }

    toggleAutoRotate(button) {
        this.autoRotate = !this.autoRotate;
        
        if (this.controls) {
            this.controls.autoRotate = this.autoRotate;
        }
        
        button.innerHTML = this.autoRotate ? 
            '<i class="fas fa-pause"></i> Stop Rotation' : 
            '<i class="fas fa-redo-alt"></i> Auto Rotate';
            
        button.classList.toggle('active', this.autoRotate);
    }

    async requestCameraPermission() {
        try {
            const constraints = {
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    frameRate: { ideal: 30 }
                },
                audio: false
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.isCameraEnabled = true;
            this.hideCameraModal();
            
            // Show camera feed in modal
            const video = document.getElementById('camera-feed');
            if (video) {
                video.srcObject = stream;
            }
            
            // Start hand tracking
            if (window.handTracker) {
                await window.handTracker.start(stream);
            }
            
            // Update UI
            document.getElementById('camera-status').textContent = 'Camera: Active';
            document.getElementById('toggle-camera').innerHTML = '<i class="fas fa-video"></i>';
            document.getElementById('toggle-camera').title = 'Turn off camera';
            
            console.log('Camera access granted and hand tracking started');
            
        } catch (error) {
            console.error('Camera access denied:', error);
            
            let errorMessage = 'Camera access is required for hand gesture controls.';
            if (error.name === 'NotAllowedError') {
                errorMessage += '\nPlease allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += '\nNo camera found on your device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += '\nCamera is already in use by another application.';
            }
            
            alert(errorMessage);
            
            // Show fallback instructions
            this.showMouseControlsInstruction();
        }
    }

    showMouseControlsInstruction() {
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.innerHTML = `
                <i class="fas fa-mouse-pointer"></i>
                <span>Using mouse controls: Drag to rotate, Scroll to zoom</span>
            `;
        }
    }

    hideCameraModal() {
        document.getElementById('camera-modal').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('camera-modal').style.display = 'none';
        }, 300);
    }

    toggleCamera() {
        if (this.isCameraEnabled) {
            // Stop camera
            this.isCameraEnabled = false;
            document.getElementById('camera-status').textContent = 'Camera: Off';
            document.getElementById('toggle-camera').innerHTML = '<i class="fas fa-video-slash"></i>';
            document.getElementById('toggle-camera').title = 'Turn on camera';
            
            // Stop hand tracking
            if (window.handTracker) {
                window.handTracker.stop();
            }
        } else {
            // Show camera modal
            document.getElementById('camera-modal').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('camera-modal').style.opacity = '1';
            }, 10);
        }
    }

    toggleControlPanel() {
        const panel = document.querySelector('.control-panel');
        const panelContent = document.querySelector('.panel-content');
        const toggleBtn = document.getElementById('toggle-panel');
        
        if (panelContent.style.display === 'none') {
            panelContent.style.display = 'block';
            panel.style.width = 'var(--control-panel-width)';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            panelContent.style.display = 'none';
            panel.style.width = '60px';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }

    onWindowResize() {
        const container = document.getElementById('three-container');
        if (!container) return;
        
        this.camera.aspect = container.offsetWidth / container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Update animation time
        const delta = this.clock.getDelta();
        this.animationTime += delta;
        
        // Auto rotate current model if enabled
        if (this.autoRotate && this.models[this.currentModel]) {
            this.models[this.currentModel].rotation.y += 0.005;
        }
        
        // Update model-specific animations
        this.updateModelAnimations();
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    updateModelAnimations() {
        const model = this.models[this.currentModel];
        const time = this.animationTime;
        
        if (!model) return;
        
        switch(this.currentModel) {
            case 'earth':
                // Rotate Earth
                model.rotation.y += 0.001;
                
                // Rotate clouds slightly faster
                if (model.children[2]) { // clouds
                    model.children[2].rotation.y += 0.0005;
                }
                break;
                
            case 'blackhole':
                // Rotate accretion disk
                if (model.children[2]) {
                    model.children[2].rotation.y += 0.005;
                    model.children[2].rotation.z += 0.001;
                }
                
                // Update lensing effect
                if (model.children[1]?.material?.uniforms?.time) {
                    model.children[1].material.uniforms.time.value = time;
                }
                
                // Rotate particles
                if (model.children[3]) {
                    model.children[3].rotation.y += 0.001;
                }
                break;
                
            case 'supernova':
                // Pulsate core
                if (model.children[0]?.material?.uniforms) {
                    model.children[0].material.uniforms.time.value = time;
                    model.children[0].material.uniforms.intensity.value = 
                        Math.sin(time * 2) * 0.5 + 1.0;
                }
                
                // Animate shockwaves
                if (model.children[1]) {
                    model.children[1].children.forEach((ring) => {
                        if (ring.material?.uniforms?.time) {
                            ring.material.uniforms.time.value = time;
                        }
                    });
                }
                
                // Animate debris
                if (model.children[2]?.material?.uniforms?.time) {
                    model.children[2].material.uniforms.time.value = time;
                }
                break;
                
            case 'galaxy':
                // Rotate galaxy
                model.rotation.y += 0.0005;
                
                // Animate disk
                if (model.children[0]?.material?.uniforms?.time) {
                    model.children[0].material.uniforms.time.value = time;
                }
                
                // Twinkle stars
                if (model.children[1]?.material?.uniforms?.time) {
                    model.children[1].material.uniforms.time.value = time;
                }
                
                // Rotate accretion disk
                if (model.children[4]) {
                    model.children[4].rotation.y += 0.002;
                }
                break;
                
            case 'human-body':
                // Subtle breathing animation
                const breath = Math.sin(time * 2) * 0.01;
                model.scale.setScalar(1 + breath);
                break;
        }
    }

    updateLoadingProgress(percent) {
        const progressBar = document.querySelector('.progress');
        if (progressBar) {
            progressBar.style.width = `${percent}%`;
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Show camera modal on first load
    setTimeout(() => {
        const modal = document.getElementById('camera-modal');
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.style.opacity = '1';
            }, 10);
        }
    }, 500);
    
    // Create the visualizer
    window.visualizer = new CosmicVisualizer();
    
    // Initialize hand tracker if available
    if (typeof HandTracker !== 'undefined') {
        window.handTracker = new HandTracker();
    }
});