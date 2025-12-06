import * as THREE from 'three';

export class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Movement settings - realistic speeds (m/s)
        this.walkSpeed = 5.0; // Walking speed
        this.runSpeed = 10.0; // Running speed
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.isRunning = false;
        this.canJump = true;
        
        // Physics
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.verticalVelocity = 0;
        this.isOnGround = true;
        
        // Physics constants
        this.gravity = 20.0; // Gravity acceleration
        this.jumpStrength = 8.0; // Jump velocity
        this.acceleration = 40.0; // How fast we reach max speed
        this.friction = 8.0; // Ground friction (deceleration)
        this.airFriction = 2.0; // Air resistance
        
        // Head bob for realism
        this.bobPhase = 0;
        this.bobSpeed = 8.0; // Slower bob speed
        this.bobAmount = 0.015; // Much smaller bob amount to reduce shake
        
        // Camera rotation
        this.rotateLeft = false;
        this.rotateRight = false;
        this.rotateUp = false;
        this.rotateDown = false;
        this.rotationSpeed = 2.0; // radians per second
        this.pitch = 0; // Up/down rotation
        this.yaw = 0; // Left/right rotation
        this.maxPitch = Math.PI / 3; // 60 degrees up/down limit
        
        // Platform boundaries (radius 12)
        this.platformRadius = 11.5;
        this.cameraHeight = 0.5; // Eye level height - much smaller, human scale
        this.groundLevel = 0.2; // Platform surface level
        
        // Collision detection
        this.collisionRadius = 0.2; // Player collision radius - smaller for easier navigation
        this.modelObjects = []; // Will be set externally
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Keyboard events only
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
    }
    
    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'KeyD':
                this.moveRight = true;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isRunning = true;
                break;
            case 'Space':
                event.preventDefault(); // Prevent page scroll
                if (this.canJump && this.isOnGround) {
                    this.verticalVelocity = this.jumpStrength;
                    this.isOnGround = false;
                }
                break;
            case 'ArrowLeft':
                this.rotateLeft = true;
                break;
            case 'ArrowRight':
                this.rotateRight = true;
                break;
            case 'ArrowUp':
                this.rotateUp = true;
                break;
            case 'ArrowDown':
                this.rotateDown = true;
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'KeyD':
                this.moveRight = false;
                break;
            case 'ShiftLeft':
            case 'ShiftRight':
                this.isRunning = false;
                break;
            case 'ArrowLeft':
                this.rotateLeft = false;
                break;
            case 'ArrowRight':
                this.rotateRight = false;
                break;
            case 'ArrowUp':
                this.rotateUp = false;
                break;
            case 'ArrowDown':
                this.rotateDown = false;
                break;
        }
    }
    
    update(delta) {
        // Update camera rotation based on arrow keys
        if (this.rotateLeft) this.yaw += this.rotationSpeed * delta;
        if (this.rotateRight) this.yaw -= this.rotationSpeed * delta;
        if (this.rotateUp) this.pitch += this.rotationSpeed * delta;
        if (this.rotateDown) this.pitch -= this.rotationSpeed * delta;
        
        // Clamp pitch to prevent over-rotation
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
        
        // Apply rotation to camera
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;
        
        // Calculate input direction
        this.direction.z = Number(this.moveBackward) - Number(this.moveForward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        
        const isMoving = this.direction.length() > 0;
        
        if (isMoving) {
            this.direction.normalize();
            
            // Get camera forward and right vectors
            const forward = new THREE.Vector3();
            const right = new THREE.Vector3();
            
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();
            
            right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
            right.normalize();
            
            // Calculate target velocity direction
            const targetDir = new THREE.Vector3();
            targetDir.addScaledVector(forward, -this.direction.z);
            targetDir.addScaledVector(right, this.direction.x);
            
            // Target speed based on running state
            const targetSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
            const targetVelocity = targetDir.multiplyScalar(targetSpeed);
            
            // Smooth acceleration towards target velocity
            this.velocity.x += (targetVelocity.x - this.velocity.x) * this.acceleration * delta;
            this.velocity.z += (targetVelocity.z - this.velocity.z) * this.acceleration * delta;
        } else {
            // Apply friction when not moving
            const frictionToUse = this.isOnGround ? this.friction : this.airFriction;
            this.velocity.x -= this.velocity.x * frictionToUse * delta;
            this.velocity.z -= this.velocity.z * frictionToUse * delta;
            
            // Stop completely if velocity is very small
            if (Math.abs(this.velocity.x) < 0.01) this.velocity.x = 0;
            if (Math.abs(this.velocity.z) < 0.01) this.velocity.z = 0;
        }
        
        // Apply gravity
        this.verticalVelocity -= this.gravity * delta;
        
        // Update horizontal position
        const newX = this.camera.position.x + this.velocity.x * delta;
        const newZ = this.camera.position.z + this.velocity.z * delta;
        
        // Check collision with models
        const hasCollision = this.checkCollision(newX, newZ);
        
        // Check platform boundaries
        const distanceFromCenter = Math.sqrt(newX * newX + newZ * newZ);
        
        if (!hasCollision && distanceFromCenter <= this.platformRadius) {
            // Safe to move
            this.camera.position.x = newX;
            this.camera.position.z = newZ;
        } else if (hasCollision) {
            // Stop velocity on collision
            this.velocity.x = 0;
            this.velocity.z = 0;
        } else {
            // Clamp to platform edge and stop horizontal velocity
            const angle = Math.atan2(newZ, newX);
            this.camera.position.x = Math.cos(angle) * this.platformRadius;
            this.camera.position.z = Math.sin(angle) * this.platformRadius;
            this.velocity.x = 0;
            this.velocity.z = 0;
        }
        
        // Update vertical position
        this.camera.position.y += this.verticalVelocity * delta;
        
        // Ground collision
        const groundY = this.groundLevel + this.cameraHeight;
        if (this.camera.position.y <= groundY) {
            this.camera.position.y = groundY;
            this.verticalVelocity = 0;
            this.isOnGround = true;
            this.canJump = true; // Reset jump when touching ground
        } else {
            this.isOnGround = false;
            this.canJump = false; // Prevent double jump in air
        }
        
        // Head bob when walking on ground
        if (isMoving && this.isOnGround) {
            const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z);
            this.bobPhase += delta * this.bobSpeed * (currentSpeed / this.walkSpeed);
            const bobOffset = Math.sin(this.bobPhase) * this.bobAmount;
            this.camera.position.y += bobOffset;
        } else {
            // Smoothly reset bob phase when not moving
            this.bobPhase *= 0.9;
        }
    }
    
    dispose() {
        document.removeEventListener('keydown', this.onKeyDown);
        document.removeEventListener('keyup', this.onKeyUp);
    }
    
    setModelObjects(models) {
        this.modelObjects = models;
    }
    
    checkCollision(newX, newZ) {
        // Check collision with each model
        for (const model of this.modelObjects) {
            if (!model || !model.position) continue;
            
            const dx = newX - model.position.x;
            const dz = newZ - model.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // Get model's approximate radius based on its scale - use tighter radius
            let modelRadius = 0.3; // Much smaller default radius
            if (model.userData && model.userData.originalScale) {
                // Use actual scale but with smaller multiplier for tighter collision
                modelRadius = model.userData.originalScale * 0.4;
            } else if (model.scale) {
                const avgScale = (model.scale.x + model.scale.z) / 2;
                modelRadius = avgScale * 0.4;
            }
            
            // Check if too close
            if (distance < this.collisionRadius + modelRadius) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }
}
