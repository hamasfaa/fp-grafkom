import * as THREE from 'three';

export class FirstPersonControls {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;

        // Movement settings - realistic speeds (m/s)
        this.walkSpeed = 5.0; // Walking speed
        this.runSpeed = 10.0; // Running speed
        this.flySpeed = 15.0; // Flying speed

        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.moveUp = false; // Space when flying
        this.moveDown = false; // Shift when flying
        this.isRunning = false;
        this.canJump = true;

        // Flying mode (Minecraft-style)
        this.isFlying = false;
        this.lastSpaceTap = 0;
        this.doubleTapDelay = 300; // ms for double-tap detection

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

        // Mouse look settings
        this.mouseSensitivity = 0.002; // Mouse sensitivity
        this.pitch = 0; // Up/down rotation
        this.yaw = 0; // Left/right rotation
        this.maxPitch = Math.PI / 2 - 0.1; // Almost 90 degrees up/down limit

        // Pointer lock state
        this.isPointerLocked = false;

        // Platform boundaries (radius 12)
        this.platformRadius = 11.5;
        this.cameraHeight = 0.5; // Eye level height - much smaller, human scale
        this.groundLevel = 0.2; // Platform surface level

        // Collision detection
        this.collisionRadius = 0.2; // Player collision radius - smaller for easier navigation
        this.modelObjects = []; // Will be set externally

        this.setupEventListeners();
        this.setupPointerLock();
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));

        // Mouse movement
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Store click handler for pointer lock (will be added/removed as needed)
        this.pointerLockClickHandler = () => {
            if (!this.isPointerLocked) {
                this.domElement.requestPointerLock();
            }
        };
    }

    // Enable pointer lock (call when entering province mode)
    enable() {
        this.domElement.addEventListener('click', this.pointerLockClickHandler);
        this.showPointerLockInstructions(true);
    }

    // Disable pointer lock (call when exiting province mode)
    disable() {
        this.domElement.removeEventListener('click', this.pointerLockClickHandler);
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
        this.showPointerLockInstructions(false);
    }

    setupPointerLock() {
        // Pointer lock change event
        const pointerLockChange = () => {
            this.isPointerLocked = document.pointerLockElement === this.domElement;

            if (this.isPointerLocked) {
                this.showPointerLockInstructions(false);
            } else {
                this.showPointerLockInstructions(true);
            }
        };

        document.addEventListener('pointerlockchange', pointerLockChange);
        document.addEventListener('mozpointerlockchange', pointerLockChange);
        document.addEventListener('webkitpointerlockchange', pointerLockChange);
    }

    showPointerLockInstructions(show) {
        let instruction = document.getElementById('pointer-lock-instruction');

        if (show && !instruction) {
            instruction = document.createElement('div');
            instruction.id = 'pointer-lock-instruction';
            instruction.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 2rem 3rem;
                border-radius: 1rem;
                text-align: center;
                z-index: 1000;
                font-size: 1.2rem;
                border: 2px solid #3b82f6;
                box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
            `;
            instruction.innerHTML = `
                <div style="font-size: 2rem; margin-bottom: 1rem;">🖱️</div>
                <div style="font-weight: 600; margin-bottom: 0.5rem;">Click to start</div>
                <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">
                    Use mouse to look around<br>
                    Double-tap Space to fly
                </div>
            `;
            document.body.appendChild(instruction);
        } else if (!show && instruction) {
            instruction.remove();
        }
    }

    onMouseMove(event) {
        if (!this.isPointerLocked) return;

        const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

        // Update yaw (left/right) and pitch (up/down)
        this.yaw -= movementX * this.mouseSensitivity;
        this.pitch -= movementY * this.mouseSensitivity;

        // Clamp pitch to prevent camera flipping
        this.pitch = Math.max(-this.maxPitch, Math.min(this.maxPitch, this.pitch));
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
                if (this.isFlying) {
                    this.moveDown = true; // Descend when flying
                } else {
                    this.isRunning = true; // Run when on ground
                }
                break;
            case 'Space':
                event.preventDefault(); // Prevent page scroll

                // Double-tap detection for fly toggle
                const currentTime = Date.now();
                if (currentTime - this.lastSpaceTap < this.doubleTapDelay) {
                    // Double-tap detected - toggle fly mode
                    this.isFlying = !this.isFlying;
                    this.verticalVelocity = 0; // Reset vertical velocity
                    this.showFlyModeNotification(this.isFlying);
                }
                this.lastSpaceTap = currentTime;

                if (this.isFlying) {
                    this.moveUp = true; // Ascend when flying
                } else if (this.canJump && this.isOnGround) {
                    // Jump when on ground
                    this.verticalVelocity = this.jumpStrength;
                    this.isOnGround = false;
                }
                break;
        }
    }

    showFlyModeNotification(isFlying) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${isFlying ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-weight: 600;
            font-size: 1.2rem;
            z-index: 9999;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
            animation: fadeInOut 1.5s ease-in-out;
        `;
        notification.textContent = isFlying ? '✈️ Flying Mode ON' : '🚶 Flying Mode OFF';

        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeInOut {
                0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
                10%, 90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
            style.remove();
        }, 1500);
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
                this.moveDown = false;
                break;
            case 'Space':
                this.moveUp = false;
                break;
        }
    }

    update(delta) {
        // Apply rotation to camera (now controlled by mouse)
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

        // Handle vertical movement
        if (this.isFlying) {
            // Flying mode - direct vertical control
            const verticalSpeed = this.flySpeed;

            if (this.moveUp) {
                this.camera.position.y += verticalSpeed * delta;
            }
            if (this.moveDown) {
                this.camera.position.y -= verticalSpeed * delta;
            }

            // No gravity when flying
            this.verticalVelocity = 0;
            this.isOnGround = false;
        } else {
            // Normal mode - apply gravity
            this.verticalVelocity -= this.gravity * delta;
        }

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

        // Update vertical position (only for normal mode, flying is handled above)
        if (!this.isFlying) {
            this.camera.position.y += this.verticalVelocity * delta;

            // Ground collision (only when not flying)
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
