import * as THREE from "three";

export class CGSky {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;

        this.skyLoaded = false;
        this.skyType = -1;
    }

    updateSkyType(skyType) {
        this.skyType = skyType;
        if (this.skyLoaded) {
            this.scene.remove(this.skyMesh);
            this.showSky();
        }
    }

    showSky() {
        if (!this.skyGeometry) {
            let cityWidth = this.config.gridSize * this.config.blockWidth + (this.config.gridSize - 1) * this.config.roadWidth;
            this.skyGeometry = new THREE.SphereGeometry(cityWidth * 0.75);
        }
        
        let skyTexturePath = "textures/sky/clearSky.png";
        switch (this.skyType) {
            case -1:
                skyTexturePath = "textures/sky/clearSky.png";
                break;
            case 0:
                skyTexturePath = "textures/sky/snowySky.png";
                break;
            case 1:
                skyTexturePath = "textures/sky/rainySky.png";
                break;        
        }

        let loader = new THREE.TextureLoader(), texture = loader.load( skyTexturePath );

        this.skyMaterial = new THREE.MeshBasicMaterial({ map: texture });
        this.skyMaterial.side = THREE.BackSide;
        this.skyMesh = new THREE.Mesh(this.skyGeometry, this.skyMaterial);        

        this.scene.add(this.skyMesh); 
        this.skyLoaded = true;
    }

    hideSky() {
        if (this.skyLoaded) {
            this.skyMaterial.dispose();
            this.scene.remove(this.skyMesh)
            this.skyLoaded = false;
        }
    }
}