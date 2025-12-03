export const COLORS = [
    0x3498db, 0x2ecc71, 0xe74c3c, 0xf39c12, 0x9b59b6,
    0x1abc9c, 0xe67e22, 0x34495e, 0x16a085, 0x27ae60,
    0x2980b9, 0x8e44ad, 0xd35400, 0xc0392b, 0x16a085,
    0x2ecc71, 0x3498db, 0xe74c3c, 0xf39c12, 0x9b59b6,
    0x1abc9c, 0xe67e22, 0x34495e, 0x16a085, 0x27ae60,
    0x2980b9, 0x8e44ad, 0xd35400, 0xc0392b, 0x16a085,
    0x2ecc71, 0x3498db, 0xe74c3c, 0xf39c12
];

export const CAMERA_CONFIG = {
    fov: 60,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 10, z: 15 },
    minDistance: 5,
    maxDistance: 30,
    maxPolarAngle: Math.PI / 2
};

export const PROVINCE_CONFIG = {
    extrudeHeight: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2
};

export const ANIMATION_CONFIG = {
    zoomSpeed: 0.03,
    resetSpeed: 0.03
};