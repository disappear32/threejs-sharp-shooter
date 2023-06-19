import Dice from './Dice.js'
const { PointsMaterial, BufferGeometry, BufferAttribute, Points } = THREE

export default class Game extends THREE.Scene {
    constructor(camera, renderer) {
        super()

        this.camera = camera
        this.renderer = renderer

        this.cubeEdgeLength = 50

        this.initialCubePositions = {}
        this.removedCubes = []

        this.rotationDirection = 1
        this.rotationLimit = 0.15

        this.materialsArray = []

        this.dealerHp = 3
    }

    async load() {
        // Создание текстур с номером для точек
        const textureUrls = [
            { url: '../assets/1-red.png' },
            { url: '../assets/2-red.png' },
            { url: '../assets/3-red.png' },
            { url: '../assets/4-red.png' },
            { url: '../assets/5-red.png' },
            { url: '../assets/6-red.png' },
            { url: '../assets/1-blue.png' },
            { url: '../assets/2-blue.png' },
            { url: '../assets/3-blue.png' },
            { url: '../assets/4-blue.png' },
            { url: '../assets/5-blue.png' },
            { url: '../assets/6-blue.png' }
        ]

        const loader = new THREE.TextureLoader()

        const materialsPromises = []
        textureUrls.forEach((textureData) => {
            const url = textureData.url
            const promise = new Promise((resolve) => {
                loader.load(url, (texture) => {
                    //resolve({ name, texture })
                    let material = new THREE.MeshStandardMaterial({
                        map: texture,
                        alphaTest: 0.5,
                    })
                    resolve(material)
                })
            })
            materialsPromises.push(promise);
        })

        this.materialsArray = await Promise.all(materialsPromises)
    }

    async initialize() {
        this.load().then(() => {
            // Вычисление смещения для центрирования рядов
            const numRows = 3;
            const rowOffset = (numRows - 1) * this.cubeEdgeLength;

            // Вычисление вертикального смещения для центрирования рядов
            const verticalOffset = 100;

            //Массивы для хранения кубов
            this.blueCubes = []
            this.redCubes = []

            // Создание 3 красных кубов в первом ряду
            for (let i = 0; i < 3; i++) {
                const dice = new Dice(
                    this,
                    i * this.cubeEdgeLength * 2 - rowOffset,
                    3 * verticalOffset,
                    0,
                    this.cubeEdgeLength,
                    'red',
                    this.materialsArray.slice(0, 6)
                )
                this.redCubes.push(dice) // Add the cube to the redCubes array
            }

            // Создание 9 синих кубов во втором, третьем и четвертом рядах
            for (let row = 0; row < numRows; row++) {
                for (let col = 0; col < 3; col++) {
                    const dice = new Dice(
                        this,
                        col * this.cubeEdgeLength * 2 - rowOffset,
                        row * verticalOffset,
                        0,
                        this.cubeEdgeLength,
                        'blue',
                        this.materialsArray.slice(6, 12)
                    )
                    this.blueCubes.push(dice) // Add the cube to the blueCubes array
                    dice.visible = false
                }
            }

            // Сохранение исходных позиций всех синих и красных кубов
            this.blueCubes.forEach((cube, index) => {
                this.initialCubePositions[`blueCube${index}`] = cube.position.clone();
            });
            this.redCubes.forEach((cube, index) => {
                this.initialCubePositions[`redCube${index}`] = cube.position.clone();
            });
        })

        // Установка фона сцены
        this.background = new THREE.Color(0x886688);

        // Создание освещения
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8) // Цвет и яркость освещения
        this.add(ambientLight)

        // Create the GUI container
        const guiContainer = document.createElement('div')
        guiContainer.id = 'gui-container'
        document.body.appendChild(guiContainer)

        // Create the GUI
        const gui = new dat.GUI({ autoPlace: false });
        guiContainer.appendChild(gui.domElement);

        // Position and style the GUI container
        guiContainer.style.position = 'absolute'
        guiContainer.style.bottom = '0px'
        guiContainer.style.left = '50%'
        guiContainer.style.transform = 'translateX(-50%)'
        guiContainer.style.width = 'fit-content'
        guiContainer.style.padding = '20px'
        guiContainer.style.background = 'rgba(255, 255, 255, 0.5)'
        guiContainer.style.borderRadius = '10px'

        // Create the GUI data object
        const guiData = {
            start: () => {
                //this.startCrashAnimation();
                this.startGame()
            },
            refresh: () => {
                this.refreshCubes()
            }
        }

        // Add buttons to the GUI
        const startButton = gui.add(guiData, 'start').name('Старт')
        const refreshButton = gui.add(guiData, 'refresh').name('Обновить')

        this.screenShake = this.ScreenShake()
    }

    update() {
        TWEEN.update();

        if (this.redCubes) this.rotateCubesAnimation()

        this.screenShake.update(this.camera)


    }

    rotateCubesAnimation() {
        this.redCubes.forEach((cube) => {
            cube.rotation.x += 0.001 * this.rotationDirection;
            cube.rotation.y += 0.001 * this.rotationDirection;
        })

        // Проверка и изменение направления вращения и ограничения
        if (this.rotationDirection === 1 && this.redCubes[0].rotation.x >= this.rotationLimit) {
            this.rotationDirection = -1
        } else if (this.rotationDirection === -1 && this.redCubes[0].rotation.x <= -this.rotationLimit) {
            this.rotationDirection = 1
        }

    }

    startGame() {
        // Функция для анимации вращения ряда кубов
        const rotateRow = (rowCubes, onComplete) => {
            const duration = 1500 // Длительность анимации в миллисекундах
            const rotations = 4 // Количество вращений

            new TWEEN.Tween({ rotationX: 0, rotationY: 0 })
                .to({ rotationX: Math.PI * 2 * rotations, rotationY: Math.PI * 2 * rotations }, duration)
                .easing(TWEEN.Easing.Quartic.Out)
                .onUpdate((object) => {
                    const rotationX = object.rotationX
                    const rotationY = object.rotationY

                    rowCubes.forEach(cube => {
                        cube.rotation.x = rotationX
                        cube.rotation.y = rotationY
                    })
                })
                .onComplete(() => {
                    const matchedCubes = [];

                    rowCubes.forEach((blueCube) => {
                        const redCubeIndex = this.redCubes.findIndex(redCube => redCube.faceValue === blueCube.faceValue && !redCube.removed);
                        if (redCubeIndex !== -1) {
                            const redCube = this.redCubes[redCubeIndex];
                            matchedCubes.push({ blueCube, redCube });
                            redCube.removed = true;
                        }
                    })

                    console.log(matchedCubes)

                    const animateCrashAnimationsSequentially = (index) => {
                        if (index < matchedCubes.length) {
                            const { blueCube, redCube } = matchedCubes[index];

                            this.startCrashAnimation(blueCube, redCube, () => {
                                console.log('Значения совпали');

                                animateCrashAnimationsSequentially(index + 1);
                            });
                        } else {
                            onComplete();
                        }
                    };

                    animateCrashAnimationsSequentially(0);
                })
                .start()
        };

        // Функция для последовательного запуска анимаций вращения рядов
        const animateRowsSequentially = index => {
            if (index < this.blueCubes.length / 3) {
                const startNextAnimation = () => {
                    animateRowsSequentially(index + 1)
                }

                // Отображение синих кубов перед анимацией текущего ряда
                const start = (this.blueCubes.length / 3 - index - 1) * 3;
                const end = start + 3;

                for (let i = start; i < end; i++) {
                    this.blueCubes[i].visible = true
                }

                // Анимация вращения текущего ряда
                rotateRow(this.blueCubes.slice(start, end), startNextAnimation)
            }
        };

        // Запуск анимации первого ряда синих кубов
        animateRowsSequentially(0);
    }

    startCrashAnimation(blueCube, redCube, onComplete) {
        // Создание ограничивающих объемов для кубов
        const marginCollide = 40 - this.cubeEdgeLength
        const blueCubeBounds = new THREE.Box3().setFromObject(blueCube).expandByScalar(marginCollide)
        const redCubeBounds = new THREE.Box3().setFromObject(redCube).expandByScalar(marginCollide)

        // Позиция синего куба до начала анимации
        const initialPosition = blueCube.position.clone()

        // Позиция красного куба
        const targetPosition = redCube.position.clone()

        // Сохранение ссылок на синий и красный кубы перед удалением
        this.removedCubes.push(blueCube)
        this.removedCubes.push(redCube)

        // Используем объект initialPositionWithZ для обновления позиции targetPositionWithZ
        const initialPositionWithZ = { x: initialPosition.x, y: initialPosition.y, z: initialPosition.z };
        const targetPositionWithZ = { x: targetPosition.x, y: targetPosition.y, z: targetPosition.z };

        //Время для анимации
        const animTime = 1000

        // Создание новой анимации TWEEN для движения вдоль оси z
        new TWEEN.Tween(targetPositionWithZ)
            .to({ z: 200 }, animTime / 2)
            .easing(TWEEN.Easing.Quadratic.Out)
            .yoyo(true)
            .repeat(1)
            .start()

        // Создание новой анимации TWEEN для движения к кубу
        const tween = new TWEEN.Tween(initialPositionWithZ)
            .to(targetPositionWithZ, animTime) // Установка конечной позиции и времени анимации (2 секунды)
            .dynamic(true)
            .easing(TWEEN.Easing.Back.Out) // Установка типа интерполяции (квадратичная)
            .onUpdate(() => {
                // Обновление позиции синего куба на каждом шаге анимации
                blueCube.position.copy(initialPositionWithZ);

                // Обновление позиций ограничивающих объемов для кубов
                blueCubeBounds.setFromObject(blueCube).expandByScalar(marginCollide);
                redCubeBounds.setFromObject(redCube).expandByScalar(marginCollide);

                // Проверка на пересечение ограничивающих объемов кубов
                if (blueCubeBounds.intersectsBox(redCubeBounds)) {
                    // Удаление синего и красного кубов из сцены
                    this.remove(blueCube);
                    this.remove(redCube);

                    redCube.removed = true

                    this.hitDealerHP()

                    tween.stop();

                    this.animateParticles(redCube)

                    this.screenShake.shake(this.camera, new THREE.Vector3(0, 0, 75), 250)
                    onComplete()
                }
            })
            .start(); // Запуск анимации
    }

    hitDealerHP() {
        const hpBarZones = document.querySelectorAll('.hp-bar-zone')
        const hpBarZone = hpBarZones[this.dealerHp - 1]

        this.dealerHp -= 1

        hpBarZone.classList.add('transition');

        // Удаление красного цвета с некоторой задержкой
        setTimeout(() => {
            hpBarZone.style.backgroundColor = 'transparent';
        }, 500); // Задержка в миллисекундах
    }

    refreshCubes() {
        console.log('refresh')

        // Восстановление позиций всех синих и красных кубов
        this.blueCubes.forEach((cube, index) => {
            cube.position.copy(this.initialCubePositions[`blueCube${index}`]);
        });
        this.redCubes.forEach((cube, index) => {
            cube.position.copy(this.initialCubePositions[`redCube${index}`]);
        });

        // Добавление синих и красных кубов обратно на сцену, если они были удалены
        this.removedCubes.forEach((cube) => {
            if (!this.children.includes(cube)) {
                this.add(cube)
                cube.removed = false
            }
        });

        // Очистка массива удаленных кубов
        this.removedCubes = [];

        this.blueCubes.forEach((cube) => {
            cube.visible = false
        });
    }

    animateParticles(redCube) {
        // Capture the "this" context
        const self = this;

        // Create particle material
        const particleMaterial = new PointsMaterial({
            color: 0xff0000, // Yellow color
            size: 7,
            //blending: AdditiveBlending,
            transparent: true,
        });

        // Create particle geometry and positions
        const particleGeometry = new BufferGeometry();
        const numParticles = 150;
        const positions = [];
        for (let i = 0; i < numParticles; i++) {
            const position = redCube.position.clone();
            positions.push(position.x, position.y, position.z);
        }
        particleGeometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));

        // Create particle system
        const particleSystem = new Points(particleGeometry, particleMaterial);
        self.add(particleSystem);

        // Animate particles
        const particlePositions = particleSystem.geometry.attributes.position.array;
        const particleAnimationDuration = 600; // Duration in milliseconds
        let particleAnimationTime = 0;
        let prevTime = performance.now();

        function animateParticles() {
            const currentTime = performance.now();
            const delta = currentTime - prevTime;

            for (let i = 0; i < numParticles; i++) {
                const position = new THREE.Vector3().fromArray(particlePositions, i * 3);
                const direction = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize().multiplyScalar(10.5)

                const speed = Math.random() * 0.8;
                position.add(direction.multiplyScalar(speed));

                particlePositions[i * 3] = position.x;
                particlePositions[i * 3 + 1] = position.y;
                particlePositions[i * 3 + 2] = position.z;
            }

            particleSystem.geometry.attributes.position.needsUpdate = true;


            particleAnimationTime += delta;

            if (particleAnimationTime < particleAnimationDuration) {
                requestAnimationFrame(animateParticles);
            } else {
                // Remove the particle system when animation is complete
                self.remove(particleSystem);
            }

            prevTime = currentTime;
        }

        animateParticles();
    }

    ScreenShake() {

        return {

            // When a function outside ScreenShake handle the camera, it should
            // always check that ScreenShake.enabled is false before.
            enabled: false,

            _timestampStart: undefined,

            _timestampEnd: undefined,

            _startPoint: undefined,

            _endPoint: undefined,


            // update(camera) must be called in the loop function of the renderer,
            // it will repositioned the camera according to the requested shaking.
            update: function update(camera) {
                if (this.enabled == true) {
                    const now = Date.now();
                    if (this._timestampEnd > now) {
                        let interval = (Date.now() - this._timestampStart) /
                            (this._timestampEnd - this._timestampStart);
                        this.computePosition(camera, interval);
                    } else {
                        camera.position.copy(this._startPoint);
                        this.enabled = false;
                    };
                };
            },


            // This initialize the values of the shaking.
            // vecToAdd param is the offset of the camera position at the climax of its wave.
            shake: function shake(camera, vecToAdd, milliseconds) {
                this.enabled = true;
                this._timestampStart = Date.now();
                this._timestampEnd = this._timestampStart + milliseconds;
                this._startPoint = new THREE.Vector3().copy(camera.position);
                this._endPoint = new THREE.Vector3().addVectors(camera.position, vecToAdd);
            },


            computePosition: function computePosition(camera, interval) {

                // This creates the wavy movement of the camera along the interval.
                // The first bloc call this.getQuadra() with a positive indice between
                // 0 and 1, then the second call it again with a negative indice between
                // 0 and -1, etc. Variable position will get the sign of the indice, and
                // get wavy.
                if (interval < 0.4) {
                    var position = this.getQuadra(interval / 0.4);
                } else if (interval < 0.7) {
                    var position = this.getQuadra((interval - 0.4) / 0.3) * -0.6;
                } else if (interval < 0.9) {
                    var position = this.getQuadra((interval - 0.7) / 0.2) * 0.3;
                } else {
                    var position = this.getQuadra((interval - 0.9) / 0.1) * -0.1;
                }

                // Here the camera is positioned according to the wavy 'position' variable.
                camera.position.lerpVectors(this._startPoint, this._endPoint, position);
            },

            // This is a quadratic function that return 0 at first, then return 0.5 when t=0.5,
            // then return 0 when t=1 ;
            getQuadra: function getQuadra(t) {
                return 9.436896e-16 + (4 * t) - (4 * (t * t));
            }

        };

    };
}