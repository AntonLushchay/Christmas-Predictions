import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class Globe3D {
    constructor(container) {
        this.container = container;
        this.width = container.clientWidth;
        this.height = container.clientHeight;

        // Detect mobile device
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
        );
        this.isTablet = this.width > 600 && this.width < 1024;

        // Инициализация сцены
        this.scene = new THREE.Scene();
        this.scene.background = null; // Прозрачный фон!
        this.scene.fog = null;

        // Камера с адаптивным масштабом для мобильных
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        // Zoom out on mobile for better fit
        this.camera.position.z = this.isMobile ? 3.5 : 2.5;

        // Рендер с прозрачностью
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: false,
        });
        this.renderer.setClearColor(0x000000, 0); // Полностью прозрачный
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        // Убедиться что dom элемент имеет прозрачный фон
        this.renderer.domElement.style.background = 'transparent';
        this.renderer.domElement.style.border = 'none';
        this.renderer.domElement.style.display = 'block';
        container.appendChild(this.renderer.domElement);

        // Постпроцессинг - Bloom эффект с сохранением прозрачности
        // const renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
        //     format: THREE.RGBAFormat,
        //     stencilBuffer: false,
        // });
        // this.composer = new EffectComposer(this.renderer, renderTarget);
        // this.composer.renderToScreen = true;
        // const renderPass = new RenderPass(this.scene, this.camera);
        // renderPass.clear = true;
        // renderPass.clearColor = new THREE.Color(0, 0, 0);
        // renderPass.clearAlpha = 0;  // Сохраняем альфу
        // this.composer.addPass(renderPass);

        // const bloomPass = new UnrealBloomPass(
        //     new THREE.Vector2(this.width, this.height),
        //     1.2,  // уменьшили strength
        //     0.4,  // radius
        //     0.85  // threshold
        // );
        // this.composer.addPass(bloomPass);

        // Глобус
        this.globe = null;
        this.snowContainer = null;

        // Анимация
        this.isShaking = false;
        this.rotationVelocity = { x: 0, y: 0, z: 0 };

        // Создание environment map для отражений (загружаем фон)
        this.createEnvironmentMap();

        // Создание сцены (createGlobe использует this.scene.environment)
        this.createLights();
        this.createGlobe();
        this.createSnowContainer();

        // Обработка resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Запуск анимационного цикла
        this.animate();
    }

    createEnvironmentMap() {
        // Загружаем фоновое изображение и готовим его для отражений через PMREM
        const textureLoader = new THREE.TextureLoader();
        const pmremGenerator = new THREE.PMREMGenerator(this.renderer);

        textureLoader.load('/background_festive.png', (texture) => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;

            // Генерируем сглаженную окружение-карту для корректных отражений
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            pmremGenerator.dispose();
            texture.dispose();

            this.environmentMap = envMap;
            this.scene.environment = envMap; // отражения
            // background оставляем прозрачным, чтобы видеть CSS-фон страницы

            if (this.globe && this.globe.material) {
                this.globe.material.envMap = envMap;
                this.globe.material.needsUpdate = true;
            }
        });
    }

    createLights() {
        // Минимальный рассеянный свет
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Очень яркие направленные источники для сильных бликов
        const keyLight = new THREE.DirectionalLight(0xffffff, 3.0);
        keyLight.position.set(5, 8, 5);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xaaccff, 2.0);
        fillLight.position.set(-5, 3, -3);
        this.scene.add(fillLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 1.5);
        backLight.position.set(0, -2, -5);
        this.scene.add(backLight);

        // Очень яркий точечный свет для акцента
        const spotLight = new THREE.PointLight(0xffffff, 4.0);
        spotLight.position.set(2, 2, 4);
        this.scene.add(spotLight);

        // Дополнительный точечный свет сбоку
        const sideLight = new THREE.PointLight(0xffffee, 3.0);
        sideLight.position.set(-3, 0, 2);
        this.scene.add(sideLight);
    }

    createGlobe() {
        // Adaptive geometry based on device
        let widthSegments = 128;
        let heightSegments = 128;

        if (this.isMobile) {
            // Mobile: significantly reduce geometry for performance
            widthSegments = 32;
            heightSegments = 32;
        } else if (this.isTablet) {
            // Tablet: medium quality
            widthSegments = 64;
            heightSegments = 64;
        }

        const geometry = new THREE.SphereGeometry(1, widthSegments, heightSegments);

        // Реалистичный стеклянный материал
        const material = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            metalness: 0,
            roughness: 0,
            transmission: 1, // Отключаем сложную трансмиссию
            transparent: true,
            ior: 1.5,
            thickness: 0.2,
            opacity: 0.4, // Просто прозрачность
            side: THREE.DoubleSide,
            envMap: this.environmentMap || null,
            envMapIntensity: 2.0, // Усиливаем отражения
            clearcoat: 1,
            clearcoatRoughness: 0.1,
        });

        this.globe = new THREE.Mesh(geometry, material);
        this.globe.castShadow = true;
        this.globe.receiveShadow = true;

        // Добавить в сцену
        this.scene.add(this.globe);
    }

    createSnowContainer() {
        // Контейнер для снежинок
        this.snowContainer = new THREE.Group();
        this.snowContainer.name = 'snow-container';
        this.globe.add(this.snowContainer);

        // Создание снежинок
        this.createSnowflakes();
    }

    createSnowflakes(count) {
        // Adaptive snowflake count based on device
        if (count === undefined) {
            count = this.isMobile ? 50 : 150; // Reduce on mobile
        }
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const velocities = [];

        for (let i = 0; i < count; i++) {
            // Позиции внутри сферы
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = 0.7 + Math.random() * 0.25;

            positions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta) - 0.1,
                radius * Math.cos(phi),
            );

            // Очень медленная скорость падения в покое
            velocities.push(
                (Math.random() - 0.5) * 0.003,
                -Math.random() * 0.002 - 0.0005,
                (Math.random() - 0.5) * 0.003,
            );
        }

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(new Float32Array(positions), 3),
        );

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02, // уменьшили размер
            sizeAttenuation: true,
            transparent: true,
            opacity: 0.6, // уменьшили яркость
            sizeAttenuation: true,
        });

        const snowflakes = new THREE.Points(geometry, material);
        snowflakes.userData.velocities = velocities;
        this.snowContainer.add(snowflakes);
    }

    shake() {
        if (this.isShaking) return;

        this.isShaking = true;

        // Сильное вращение при встряхивании
        this.rotationVelocity = {
            x: (Math.random() - 0.5) * 0.15, // Увеличено в 3 раза!
            y: (Math.random() - 0.5) * 0.15, // Увеличено в 3 раза!
            z: (Math.random() - 0.5) * 0.08, // Увеличено в 4 раза!
        };

        // ВОЛШЕБНЫЙ ЭФФЕКТ: разлёт снежинок во все стороны
        this.snowContainer.children.forEach((snowflakes) => {
            if (snowflakes.userData.velocities) {
                snowflakes.userData.velocities.forEach((vel, i) => {
                    // Случайное направление разлёта
                    const direction = Math.random() - 0.5;
                    snowflakes.userData.velocities[i] = direction * 0.3; // Большая скорость!
                });
            }
        });

        // Прекратить встряхивание через время
        setTimeout(() => {
            this.isShaking = false;
            this.rotationVelocity = { x: 0, y: 0, z: 0 };
        }, 1000);
    }

    updateSnowflakes() {
        this.snowContainer.children.forEach((snowflakes) => {
            if (!snowflakes.userData.velocities) return;

            const positions = snowflakes.geometry.attributes.position.array;
            const velocities = snowflakes.userData.velocities;

            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += velocities[i];
                positions[i + 1] += velocities[i + 1];
                positions[i + 2] += velocities[i + 2];

                // Затухание скорости - медленнее
                velocities[i] *= 0.96;
                velocities[i + 1] *= 0.96;
                velocities[i + 2] *= 0.96;

                // Отскок от границ сферы
                const dist = Math.sqrt(
                    positions[i] * positions[i] +
                        positions[i + 1] * positions[i + 1] +
                        positions[i + 2] * positions[i + 2],
                );
                if (dist > 0.95) {
                    // Вернуть обратно внутрь с небольшой скоростью
                    const scale = 0.8 / dist;
                    positions[i] *= scale;
                    positions[i + 1] *= scale;
                    positions[i + 2] *= scale;

                    // Отскок - медленнее восстанавливается
                    velocities[i] *= -0.4;
                    velocities[i + 1] *= -0.4;
                    velocities[i + 2] *= -0.4;
                }
            }

            snowflakes.geometry.attributes.position.needsUpdate = true;
        });
    }

    animate = () => {
        requestAnimationFrame(this.animate);

        // Вращение при встряхивании
        this.globe.rotation.x += this.rotationVelocity.x;
        this.globe.rotation.y += this.rotationVelocity.y;
        this.globe.rotation.z += this.rotationVelocity.z;

        // Затухание вращения
        this.rotationVelocity.x *= 0.95;
        this.rotationVelocity.y *= 0.95;
        this.rotationVelocity.z *= 0.95;

        // Очень лёгкое автоматическое вращение для живости
        if (!this.isShaking) {
            this.globe.rotation.y += 0.0003; // Еле заметное вращение
        }

        // Обновление снежинок
        this.updateSnowflakes();

        // Рендер сцены
        this.renderer.render(this.scene, this.camera);
    };

    onWindowResize = () => {
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        // this.composer.setSize(this.width, this.height);
    };

    dispose() {
        // Очистка ресурсов
        this.composer.dispose();
        this.renderer.dispose();
        this.scene.children.forEach((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((m) => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
}
