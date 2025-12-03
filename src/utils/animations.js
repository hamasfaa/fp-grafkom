import * as THREE from 'three';
import { ANIMATION_CONFIG } from '../config/constants.js';

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function animateCameraToPosition(camera, controls, targetPos, targetLookAt, speed = ANIMATION_CONFIG.zoomSpeed) {
    const startPosition = camera.position.clone();
    const endPosition = targetPos;
    const startTarget = controls.target.clone();
    const endTarget = targetLookAt;

    let progress = 0;

    return new Promise((resolve) => {
        const animate = () => {
            progress += speed;
            if (progress < 1) {
                camera.position.lerpVectors(startPosition, endPosition, easeInOutCubic(progress));
                controls.target.lerpVectors(startTarget, endTarget, easeInOutCubic(progress));
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        };
        animate();
    });
}