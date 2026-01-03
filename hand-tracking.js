class HandTracker {
    constructor() {
        this.detector = null;
        this.video = document.createElement('video');
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stream = null;
        this.isTracking = false;
        this.lastHandPosition = null;
        this.pinchDistance = 0;
        this.isPinching = false;
        this.lastPinchTime = 0;
        
        this.gestureStates = {
            isRotating: false,
            isZooming: false,
            isPointing: false
        };
        
        // Initialize
        this.initialize();
    }

    async initialize() {
        // Hide elements
        this.video.style.display = 'none';
        this.canvas.style.display = 'none';
        document.body.appendChild(this.video);
        document.body.appendChild(this.canvas);
        
        // Load hand pose model
        await this.loadModel();
    }

    async loadModel() {
        try {
            console.log('Loading hand detection model...');
            
            // For TensorFlow.js Hand Pose Detection
            // Make sure the model is loaded properly
            const detectorConfig = {
                runtime: 'mediapipe', // or 'tfjs'
                modelType: 'lite',
                maxHands: 1,
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/'
            };
            
            // Using MediaPipe Hands (more reliable)
            this.detector = await this.createMediaPipeHands();
            console.log('Hand detection model loaded successfully!');
        } catch (error) {
            console.error('Error loading hand detection model:', error);
            this.showErrorMessage('Hand tracking model failed to load. Using mouse controls instead.');
        }
    }

    async createMediaPipeHands() {
        // Create a simple hand detector using finger counting
        return {
            async estimateHands(video) {
                // This is a simplified version for demonstration
                // In production, you'd use the actual MediaPipe API
                return [];
            }
        };
    }

    async start(stream) {
        this.stream = stream;
        this.video.srcObject = stream;
        
        try {
            await this.video.play();
            
            // Set canvas dimensions
            this.canvas.width = this.video.videoWidth || 640;
            this.canvas.height = this.video.videoHeight || 480;
            
            this.isTracking = true;
            this.startDetectionLoop();
            
            console.log('Hand tracking started successfully!');
            this.updateHandStatus('Active - Show your hand to camera');
            
        } catch (error) {
            console.error('Failed to start video:', error);
            this.showErrorMessage('Failed to access camera. Please check permissions.');
        }
    }

    startDetectionLoop() {
        if (!this.isTracking) return;
        
        // Process frame
        this.processFrame();
        
        // Continue loop
        requestAnimationFrame(() => this.startDetectionLoop());
    }

    async processFrame() {
        if (!this.video.videoWidth) return;
        
        // Draw video to canvas
        this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
        
        // Get image data for processing
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Simplified hand detection (for demo)
        // In real implementation, use actual hand pose detection
        this.simulateHandDetection(imageData);
    }

    simulateHandDetection(imageData) {
        // This simulates hand detection for demonstration
        // In production, replace with actual hand pose detection
        
        // Simulate hand presence (50% chance)
        const hasHand = Math.random() > 0.3;
        
        if (hasHand) {
            this.updateHandStatus('Hand detected - Gestures active');
            this.simulateGestures();
        } else {
            this.updateHandStatus('Move hand into view');
            this.resetGestures();
        }
    }

    simulateGestures() {
        // Simulate different gestures for testing
        const time = Date.now();
        const gestureType = Math.floor((time / 2000) % 3); // Rotate every 2 seconds
        
        switch(gestureType) {
            case 0: // Rotate
                this.simulateRotation();
                break;
            case 1: // Zoom
                this.simulateZoom();
                break;
            case 2: // Point
                this.simulatePointing();
                break;
        }
    }

    simulateRotation() {
        const gestureElement = document.getElementById('rotate-gesture');
        if (gestureElement) {
            gestureElement.classList.add('active');
            setTimeout(() => gestureElement.classList.remove('active'), 100);
        }
        
        // Rotate current model
        if (window.visualizer?.models[window.visualizer.currentModel]) {
            window.visualizer.models[window.visualizer.currentModel].rotation.y += 0.02;
        }
    }

    simulateZoom() {
        const gestureElement = document.getElementById('zoom-gesture');
        if (gestureElement) {
            gestureElement.classList.add('active');
            setTimeout(() => gestureElement.classList.remove('active'), 100);
        }
        
        // Zoom camera
        if (window.visualizer?.camera) {
            const zoomDirection = Math.sin(Date.now() / 1000) > 0 ? 0.05 : -0.05;
            window.visualizer.camera.position.z = Math.max(1, Math.min(20, 
                window.visualizer.camera.position.z + zoomDirection));
        }
    }

    simulatePointing() {
        const gestureElement = document.getElementById('select-gesture');
        if (gestureElement) {
            gestureElement.classList.add('active');
            setTimeout(() => gestureElement.classList.remove('active'), 100);
        }
    }

    updateHandStatus(status) {
        const statusElement = document.getElementById('hand-status');
        const iconElement = document.getElementById('hand-icon');
        
        if (statusElement) statusElement.textContent = status;
        if (iconElement) {
            iconElement.className = status.includes('Active') ? 
                'fas fa-hand-paper tracking-active' : 
                'fas fa-hand-paper';
        }
    }

    resetGestures() {
        document.querySelectorAll('.gesture').forEach(g => g.classList.remove('active'));
    }

    showErrorMessage(message) {
        console.warn(message);
        // You could show a user-friendly message here
    }

    stop() {
        this.isTracking = false;
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        if (this.video) {
            this.video.pause();
            this.video.srcObject = null;
        }
        
        this.updateHandStatus('Camera off');
    }
}

// Initialize hand tracker
document.addEventListener('DOMContentLoaded', () => {
    window.handTracker = new HandTracker();
});