import * as THREE from "three";

export class CGWeather {
  constructor(scene, config, cityWidth, cityHeight, count) {
    this.scene = scene;
    this.config = config;
    this.cityWidth = cityWidth;
    this.cityHeight = cityHeight;
    this.count = count;
    this.gen = false;
  }

  generateWeather(mode) {
    if (mode == 0)
      this.generateSnow();
    else if (mode == 1)
      this.generateRain();
  }

  generateSnow() {
    this.gen = true;
    this.speed = 5;
    this.drawRange = 3;
    this.size = 5;
    // Geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const count = this.count;

    // each count is a spatial position (x, y, z) for a particle
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.dirs = new Float32Array(count * 3);

    /**
     * x: [-0.5 * cityWidth, 0.5 * cityWidth]
     * z: [-0.5 * cityWidth, 0.5 * cityWidth]
     * y: [0, cityHeight]
     * */
    for (let i = 0; i < count * 3; i = i + 3)
    {
      // x
      positions[i] = (Math.random() - 0.5) * this.cityWidth;
      // z
      positions[i + 2] = (Math.random() - 0.5) * this.cityWidth;
      // y
      positions[i + 1] = this.cityHeight;

      // color
      colors[i] = 1;
      colors[i + 1] = 1;
      colors[i + 2] = 1;

      // direction
      const dir = new THREE.Vector3(Math.random() - 0.5, -1, Math.random() - 0.5);
      dir.normalize();
      this.dirs[i] = dir.x;
      this.dirs[i + 1] = dir.y;
      this.dirs[i + 2] = dir.z;
    }

    // Create the Three.js BufferAttribute and specify that each information is composed of 3 values
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))


    // Textures
    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load('/textures/particles/1.png');

    // Material
    const particlesMaterial = new THREE.PointsMaterial();
    particlesMaterial.size = this.size;
    particlesMaterial.sizeAttenuation = true;
    particlesMaterial.map = particleTexture;
    particlesMaterial.transparent = true;
    particlesMaterial.alphaMap = particleTexture;
    particlesMaterial.depthWrite = false;
    particlesMaterial.blending = THREE.AdditiveBlending;
    particlesMaterial.vertexColors = true;

    // Particles
    particlesGeometry.setDrawRange(0, this.drawRange/3);
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.addToScene(this.particles);
  }

  generateRain() {
    this.gen = true;
    this.speed = 10;
    this.drawRange = 3;
    this.size = 25;
    // Geometry
    const particlesGeometry = new THREE.BufferGeometry();
    const count = this.count;

    // each count is a spatial position (x, y, z) for a particle
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    this.dirs = new Float32Array(count * 3);

    /**
     * x: [-0.5 * cityWidth, 0.5 * cityWidth]
     * z: [-0.5 * cityWidth, 0.5 * cityWidth]
     * y: [0, cityHeight]
     * */
    for (let i = 0; i < count * 3; i = i + 3) {
      // x
      positions[i] = (Math.random() - 0.5) * this.cityWidth;
      // z
      positions[i + 2] = (Math.random() - 0.5) * this.cityWidth;
      // y
      positions[i + 1] = this.cityHeight;

      // color
      colors[i] = 1;
      colors[i + 1] = 1;
      colors[i + 2] = 1;

      // direction
      this.dirs[i] = 0;
      this.dirs[i + 1] = -1;
      this.dirs[i + 2] = 0;
    }

    // Create the Three.js BufferAttribute and specify that each information is composed of 3 values
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))


    // Textures
    const textureLoader = new THREE.TextureLoader();
    const particleTexture = textureLoader.load('/textures/particles/14.png');


    // Material
    const particlesMaterial = new THREE.PointsMaterial();
    particlesMaterial.size = this.size;
    particlesMaterial.sizeAttenuation = true;
    particlesMaterial.map = particleTexture;
    particlesMaterial.transparent = true;
    particlesMaterial.alphaMap = particleTexture;
    particlesMaterial.depthWrite = false;
    particlesMaterial.blending = THREE.AdditiveBlending;
    particlesMaterial.vertexColors = true;

    // Particles
    particlesGeometry.setDrawRange(0, this.drawRange / 3);
    this.particles = new THREE.Points(particlesGeometry, particlesMaterial);
    this.addToScene(this.particles);
  }

  destoryWeather() {
    if (this.gen) {
      this.gen = false;
      this.particles.geometry.dispose();
      this.particles.material.dispose();
      this.scene.remove(this.particles);
    }
  }

  addToScene(object) {
    this.scene.add(object);
  }

  update(elapsedTime) {
    // Update particles
    const count = this.count;
    for (let i = 0; i < this.drawRange; i = i + 3) {
      if (Math.random() > 10.98) {
        let dir = new THREE.Vector3(Math.random() - 0.5, -1, Math.random() - 0.5);
        dir.normalize();
        this.dirs[i] = dir.x;
        this.dirs[i + 1] = dir.y;
        this.dirs[i + 2] = dir.z;
      }
      // x
      this.particles.geometry.attributes.position.array[i] += this.dirs[i] * elapsedTime * Math.random() * this.speed;
      // z
      this.particles.geometry.attributes.position.array[i + 2] += this.dirs[i + 2] * elapsedTime * Math.random() * this.speed;
      // y
      this.particles.geometry.attributes.position.array[i + 1] += this.dirs[i + 1] * elapsedTime * Math.random() * this.speed;

      if (Math.abs(this.particles.geometry.attributes.position.array[i]) > this.cityWidth/2)
        this.particles.geometry.attributes.position.array[i] = -this.particles.geometry.attributes.position.array[i];

      if (Math.abs(this.particles.geometry.attributes.position.array[i + 2]) > this.cityWidth/2)
        this.particles.geometry.attributes.position.array[i + 2] = -this.particles.geometry.attributes.position.array[i + 2];

      if (this.particles.geometry.attributes.position.array[i + 1] < 0)
        this.particles.geometry.attributes.position.array[i + 1] = this.cityHeight;
    }
    if (this.drawRange > this.count * 3) {
      this.particles.geometry.setDrawRange(0, this.count);
    }
    else {
      this.particles.geometry.setDrawRange(0, this.drawRange/3);
      this.drawRange += 3;
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
