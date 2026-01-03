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
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(
            document.getElementById('three-container').offsetWidth,
            document.getElementById('three-container').offsetHeight
        );
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('three-container').appendChild(this.renderer.domElement);
        
        // Add orbit controls for mouse/touch
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Add lighting
        this.setupLighting();
        
        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 5000;
        const positions = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 2000;
            positions[i + 1] = (Math.random() - 0.5) * 2000;
            positions[i + 2] = (Math.random() - 0.5) * 2000;
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 1,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);
        
        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);
        
        // Hemisphere light for natural outdoor feel
        const hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x006400, 0.3);
        this.scene.add(hemisphereLight);
    }

    async loadModels() {
        // Create placeholder models for demonstration
        // In a real application, you would load GLTF/GLB models here
        
        // Earth model
        this.models.earth = this.createEarth();
        this.scene.add(this.models.earth);
        
        // Black hole model
        this.models.blackhole = this.createBlackHole();
        this.models.blackhole.visible = false;
        this.scene.add(this.models.blackhole);
        
        // Human body model
        this.models['human-body'] = this.createHumanBody();
        this.models['human-body'].visible = false;
        this.scene.add(this.models['human-body']);
        
        // Supernova model
        this.models.supernova = this.createSupernova();
        this.models.supernova.visible = false;
        this.scene.add(this.models.supernova);
        
        // Galaxy model
        this.models.galaxy = this.createGalaxy();
        this.models.galaxy.visible = false;
        this.scene.add(this.models.galaxy);
        
        // Set Earth as current model
        this.currentModel = 'earth';
        
        this.updateLoadingProgress(50);
    }

    createEarth() {
        const group = new THREE.Group();
        
        // Create Earth sphere
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const texture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            specular: new THREE.Color(0x333333),
            shininess: 5
        });
        
        const earth = new THREE.Mesh(geometry, material);
        group.add(earth);
        
        // Add atmosphere
        const atmosphereGeometry = new THREE.SphereGeometry(1.05, 64, 64);
        const atmosphereMaterial = new THREE.MeshPhongMaterial({
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.1
        });
        const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
        group.add(atmosphere);
        
        // Add orbit ring
        const ringGeometry = new THREE.RingGeometry(1.8, 2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x4444ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.2
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        return group;
    }

    createBlackHole() {
        const group = new THREE.Group();
        
        // Create accretion disk
        const diskGeometry = new THREE.RingGeometry(0.5, 3, 64);
        const diskMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7
        });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.rotation.x = Math.PI / 2;
        group.add(disk);
        
        // Create black hole sphere (event horizon)
        const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphere);
        
        // Add gravitational lensing effect
        const lensGeometry = new THREE.SphereGeometry(0.6, 32, 32);
        const lensMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const lens = new THREE.Mesh(lensGeometry, lensMaterial);
        group.add(lens);
        
        return group;
    }

    createHumanBody() {
        const group = new THREE.Group();
        
        // Create simplified human body using basic geometries
        const materials = {
            skin: new THREE.MeshPhongMaterial({ color: 0xffcc99 }),
            muscle: new THREE.MeshPhongMaterial({ color: 0xff6666 }),
            bone: new THREE.MeshPhongMaterial({ color: 0xffffcc })
        };
        
        // Head
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 32, 32),
            materials.skin
        );
        head.position.y = 1.6;
        group.add(head);
        
        // Body
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.25, 0.3, 1, 8),
            materials.muscle
        );
        body.position.y = 0.8;
        group.add(body);
        
        // Arms
        const leftArm = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8),
            materials.skin
        );
        leftArm.position.set(-0.4, 1.2, 0);
        leftArm.rotation.z = 0.5;
        group.add(leftArm);
        
        const rightArm = leftArm.clone();
        rightArm.position.x = 0.4;
        rightArm.rotation.z = -0.5;
        group.add(rightArm);
        
        // Legs
        const leftLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.1, 0.1, 1, 8),
            materials.skin
        );
        leftLeg.position.set(-0.15, 0, 0);
        group.add(leftLeg);
        
        const rightLeg = leftLeg.clone();
        rightLeg.position.x = 0.15;
        group.add(rightLeg);
        
        return group;
    }

    createSupernova() {
        const group = new THREE.Group();
        
        // Create core
        const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);
        
        // Create shockwave rings
        for (let i = 0; i < 5; i++) {
            const ringGeometry = new THREE.RingGeometry(0.7 + i * 0.5, 0.9 + i * 0.5, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0xff6600,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3 - i * 0.05
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
        }
        
        // Add particles for debris
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const positions = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i += 3) {
            const radius = Math.random() * 3 + 0.5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particlesMaterial = new THREE.PointsMaterial({
            color: 0xffaa00,
            size: 0.05,
            sizeAttenuation: true
        });
        
        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        group.add(particles);
        
        return group;
    }

    createGalaxy() {
        const group = new THREE.Group();
        
        // Create galaxy disk
        const diskGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 64);
        const diskMaterial = new THREE.MeshPhongMaterial({
            color: 0x4466ff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.rotation.x = Math.PI / 2;
        group.add(disk);
        
        // Add stars
        const starsGeometry = new THREE.BufferGeometry();
        const starsCount = 2000;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);
        
        for (let i = 0; i < starsCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 3;
            const height = (Math.random() - 0.5) * 0.5;
            
            positions[i * 3] = Math.cos(angle) * radius;
            positions[i * 3 + 1] = height;
            positions[i * 3 + 2] = Math.sin(angle) * radius;
            
            // Color based on position (blue in center, white in arms)
            const distance = Math.sqrt(positions[i * 3] ** 2 + positions[i * 3 + 2] ** 2);
            const colorIntensity = 1 - (distance / 3);
            
            colors[i * 3] = 0.5 + colorIntensity * 0.5; // Red
            colors[i * 3 + 1] = 0.5 + colorIntensity * 0.5; // Green
            colors[i * 3 + 2] = 1.0; // Blue
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 0.05,
            vertexColors: true,
            sizeAttenuation: true
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        group.add(stars);
        
        // Add central bulge
        const bulgeGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const bulgeMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.8
        });
        const bulge = new THREE.Mesh(bulgeGeometry, bulgeMaterial);
        group.add(bulge);
        
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
            
            this.camera.position.copy(center);
            this.camera.position.z += size.length() * 1.5;
            this.camera.lookAt(center);
            
            if (this.controls) {
                this.controls.target.copy(center);
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
    }

    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            this.isCameraEnabled = true;
            this.hideCameraModal();
            
            // Start hand tracking
            this.startHandTracking(stream);
            
            // Update UI
            document.getElementById('camera-status').textContent = 'Camera: Active';
            document.getElementById('toggle-camera').innerHTML = '<i class="fas fa-video"></i>';
            
        } catch (error) {
            console.error('Camera access denied:', error);
            alert('Camera access is required for hand gesture controls. Please enable camera access in your browser settings.');
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
            
            // Stop hand tracking
            if (this.handDetector && this.handDetector.stream) {
                this.handDetector.stream.getTracks().forEach(track => track.stop());
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
        const toggleBtn = document.getElementById('toggle-panel');
        
        if (panel.style.width === '0px' || !panel.style.width) {
            panel.style.width = 'var(--control-panel-width)';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
        } else {
            panel.style.width = '0';
            toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }

    startHandTracking(stream) {
        // Initialize hand tracking
        // This would be implemented in hand-tracking.js
        console.log('Hand tracking started with stream:', stream);
        
        // Show camera feed for debugging (optional)
        const video = document.getElementById('camera-feed');
        video.srcObject = stream;
        
        // Update hand tracking status
        document.getElementById('hand-status').textContent = 'Hand tracking active';
        document.getElementById('hand-icon').className = 'fas fa-hand-paper tracking-active';
    }

    onWindowResize() {
        const container = document.getElementById('three-container');
        this.camera.aspect = container.offsetWidth / container.offsetHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.offsetWidth, container.offsetHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Auto rotate current model if enabled
        if (this.autoRotate && this.models[this.currentModel]) {
            this.models[this.currentModel].rotation.y += 0.005;
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
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
        document.getElementById('camera-modal').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('camera-modal').style.opacity = '1';
        }, 10);
    }, 500);
    
    // Create the visualizer
    window.visualizer = new CosmicVisualizer();
});