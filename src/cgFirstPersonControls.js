import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";


export class CGFirstPersonControls {
    constructor(camera, canvas, config, lockCallback = null, unlockCallback = null) {
        this.camera = camera;
        this.config = config;
        this.lockCallback = lockCallback;
        this.unlockCallback = unlockCallback;

        this.pointerLockControls = new PointerLockControls(camera, canvas);
        this.pointerLockControls.enabled = false;

        this.cityWidth = this.config.gridSize * this.config.blockWidth + (this.config.gridSize - 1) * this.config.roadWidth;
        this.minHeight = this.config.groundBaseHeight + this.config.roadHeight + 3;
        this.movementSpeed = 8;
        this.upwardsVelocity = 0;
        this.jumpSpeed = 15;
        this.gravity = 2.5;

        this.pointerLockControls.addEventListener( 'lock', () => {
            this.onLock();
        } );
        
        this.pointerLockControls.addEventListener( 'unlock', () => {
            this.onUnlock();
        } );
    }

    enable() {
        this.pointerLockControls.enabled = true;
        this.pointerLockControls.lock();
    }

    isEnabled() {
        return this.pointerLockControls.enabled;
    }

    onLock() {
        this.camera.position.x = 15;
        this.camera.position.y = this.minHeight;
        this.camera.position.z = 15;
        this.camera.far = this.cityWidth * 1.5;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(new THREE.Vector3(15, this.minHeight, 0)); 

        this.lockCallback();
    }

    onUnlock() {
        this.camera.position.x = 500;
        this.camera.position.y = 500;
        this.camera.position.z = 500;
        this.camera.far = 5000;
        this.camera.updateProjectionMatrix();
        this.camera.lookAt(new THREE.Vector3(0, 0, 0));

        this.pointerLockControls.enabled = false;
        this.unlockCallback();
    }

    updatePosition(keyDict, deltaTimeMs) {
        if (!this.pointerLockControls.enabled) {
            return;
        }

        if (keyDict['w']) {
            this.pointerLockControls.moveForward(this.movementSpeed*deltaTimeMs);
        }
        if (keyDict['a']) {
            this.pointerLockControls.moveRight(-this.movementSpeed*deltaTimeMs);
        }
        if (keyDict['s']) {
            this.pointerLockControls.moveForward(-this.movementSpeed*deltaTimeMs);
        }
        if (keyDict['d']) {
            this.pointerLockControls.moveRight(this.movementSpeed*deltaTimeMs);
        }
        if (keyDict[' '] && this.camera.position.y == this.minHeight) {
            this.upwardsVelocity = this.jumpSpeed;
        }

        // physics
        this.camera.position.y += (this.upwardsVelocity*deltaTimeMs);

        if (this.camera.position.y < this.minHeight) {
            this.camera.position.y = this.minHeight;
            this.upwardsVelocity = 0;
        }

        if (this.camera.position != this.minHeight) {
            this.upwardsVelocity -= this.gravity;
        }
    }

}