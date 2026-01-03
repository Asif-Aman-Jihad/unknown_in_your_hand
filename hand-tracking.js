class HandTracker {
    constructor() {
        this.detector = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.stream = null;
        this.isTracking = false;
        this.lastHandPosition = null;
        this.pinchDistance = 0;
        this.isPinching = false;
        
        this.initialize();
    }

    async initialize() {
        // Create video and canvas elements for hand tracking
        this.video = document.createElement('video');
        this.video.style.display = 'none';
        document.body.appendChild(this.video);
        
        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        // Load hand pose model
        await this.loadModel();
    }

    async loadModel() {
        try {
            // Import hand pose detection
            const model = handPoseDetection.SupportedModels.MediaPipeHands;
            const detectorConfig = {
                runtime: 'tfjs',
                modelType: 'full',
                maxHands: 1
            };
            
            this.detector = await handPoseDetection.createDetector(model, detectorConfig);
            console.log('Hand detection model loaded');
        } catch (error) {
            console.error('Error loading hand detection model:', error);
        }
    }

    async start(stream) {
        this.stream = stream;
        this.video.srcObject = stream;
        
        await this.video.play();
        
        // Set canvas dimensions to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        
        this.isTracking = true;
        this.detectHands();
    }

    async detectHands() {
        if (!this.isTracking || !this.detector) return;
        
        try {
            // Draw video frame to canvas
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Detect hands
            const hands = await this.detector.estimateHands(this.canvas);
            
            if (hands.length > 0) {
                this.processHandData(hands[0]);
            } else {
                this.handleNoHandDetected();
            }
        } catch (error) {
            console.error('Hand detection error:', error);
        }
        
        // Continue detection
        requestAnimationFrame(() => this.detectHands());
    }

    processHandData(hand) {
        const landmarks = hand.keypoints;
        
        // Update hand status UI
        document.getElementById('hand-status').textContent = 'Hand detected';
        document.getElementById('hand-icon').className = 'fas fa-hand-paper tracking-active';
        
        // Calculate hand center for rotation
        const wrist = landmarks[0];
        const middleBase = landmarks[9];
        
        const handCenter = {
            x: (wrist.x + middleBase.x) / 2,
            y: (wrist.y + middleBase.y) / 2
        };
        
        // Handle rotation based on hand movement
        if (this.lastHandPosition) {
            const deltaX = handCenter.x - this.lastHandPosition.x;
            const deltaY = handCenter.y - this.lastHandPosition.y;
            
            // Only rotate if movement is significant
            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                this.handleRotation(deltaX, deltaY);
            }
        }
        
        this.lastHandPosition = handCenter;
        
        // Check for pinch gesture (thumb and index finger)
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        
        const pinchDist = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) + 
            Math.pow(thumbTip.y - indexTip.y, 2)
        );
        
        this.handlePinchGesture(pinchDist);
        
        // Check for pointing gesture (selection)
        this.handlePointingGesture(landmarks);
    }

    handleRotation(deltaX, deltaY) {
        // Highlight rotate gesture
        document.getElementById('rotate-gesture').classList.add('active');
        setTimeout(() => {
            document.getElementById('rotate-gesture').classList.remove('active');
        }, 200);
        
        // Rotate the current model
        if (window.visualizer && window.visualizer.models[window.visualizer.currentModel]) {
            const model = window.visualizer.models[window.visualizer.currentModel];
            model.rotation.y += deltaX * 0.01;
            model.rotation.x += deltaY * 0.01;
        }
    }

    handlePinchGesture(distance) {
        const pinchThreshold = 50;
        
        if (distance < pinchThreshold) {
            // Pinch detected
            if (!this.isPinching) {
                this.isPinching = true;
                this.pinchDistance = distance;
                
                // Highlight zoom gesture
                document.getElementById('zoom-gesture').classList.add('active');
            } else {
                // Zoom based on pinch distance change
                const zoomDelta = (this.pinchDistance - distance) * 0.01;
                
                if (window.visualizer && window.visualizer.camera) {
                    window.visualizer.camera.position.z += zoomDelta;
                    
                    // Clamp zoom
                    window.visualizer.camera.position.z = Math.max(1, Math.min(20, window.visualizer.camera.position.z));
                }
                
                this.pinchDistance = distance;
            }
        } else {
            if (this.isPinching) {
                this.isPinching = false;
                document.getElementById('zoom-gesture').classList.remove('active');
            }
        }
    }

    handlePointingGesture(landmarks) {
        const indexTip = landmarks[8];
        const indexPip = landmarks[6];
        const middleTip = landmarks[12];
        const middlePip = landmarks[10];
        
        // Check if index finger is extended and other fingers are closed
        const isIndexExtended = indexTip.y < indexPip.y;
        const isMiddleClosed = middleTip.y > middlePip.y;
        
        if (isIndexExtended && isMiddleClosed) {
            // Pointing gesture detected
            document.getElementById('select-gesture').classList.add('active');
            
            // You could implement object selection here
            // For example, raycasting to select parts of the model
        } else {
            document.getElementById('select-gesture').classList.remove('active');
        }
    }

    handleNoHandDetected() {
        document.getElementById('hand-status').textContent = 'Move hand into view';
        document.getElementById('hand-icon').className = 'fas fa-hand-paper';
        
        this.lastHandPosition = null;
        this.isPinching = false;
        
        // Remove all gesture highlights
        document.querySelectorAll('.gesture').forEach(gesture => {
            gesture.classList.remove('active');
        });
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
    }
}

// Initialize hand tracker when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.handTracker = new HandTracker();
    
    // Update visualizer's hand tracking method
    if (window.visualizer) {
        window.visualizer.startHandTracking = function(stream) {
            window.handTracker.start(stream);
        };
    }
});