const backgroundConfigs = [{
    nr: 1,
    mouseEffect: 1,
    distortionAmount: 0.15,
    shapeAmount: 0.5,
    noiseOpacity: 1,
    widthMultiplier: 0.8,
    heightMultiplier: 3,
    position: {
        x: -0.1,
        y: 0.2
    },
    rotation: 1.3,
    speedMultiplier: 1,
    timeStart: 0,
    background: 15724527
}];

// Функция для проверки, является ли устройство мобильным
function isMobile() {
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// Функция для обновления параметров фона в зависимости от типа устройства
function updateBackgroundForMobile() {
    const screenWidth = window.innerWidth;
    console.log('Screen width:', screenWidth); // Для отладки

    // Если устройство мобильное
    if (isMobile()) {
        console.log('Mobile screen detected!'); // Проверка для мобильного устройства
        backgroundConfigs[0].distortionAmount = 0.2; // Увеличиваем искажения
        backgroundConfigs[0].shapeAmount = 0.7; // Увеличиваем форму
        backgroundConfigs[0].widthMultiplier = 1.2; // Увеличиваем ширину
        backgroundConfigs[0].heightMultiplier = 3; // Уменьшаем высоту
        backgroundConfigs[0].position = {
            x: -0.1,
            y: 0.1
        }; // Меняем положение
        backgroundConfigs[0].rotation = 0.7; // Увеличиваем вращение
        backgroundConfigs[0].speedMultiplier = 1.2; // Увеличиваем скорость
    } else {
        console.log('Desktop screen detected!'); // Проверка для десктопа
        console.log('Mobile screen detected!'); // Проверка для мобильного устройства
        backgroundConfigs[0].distortionAmount = 0.2; // Увеличиваем искажения
        backgroundConfigs[0].shapeAmount = 0.7; // Увеличиваем форму
        backgroundConfigs[0].widthMultiplier = 0.9; // Увеличиваем ширину
        backgroundConfigs[0].heightMultiplier = 3; // Уменьшаем высоту
        backgroundConfigs[0].position = {
            x: -0.1,
            y: 0.1
        }; // Меняем положение
        backgroundConfigs[0].rotation = 0.7; // Увеличиваем вращение
        backgroundConfigs[0].speedMultiplier = 1.2; // Увеличиваем скорость
    }

    // Применяем изменения (можно добавить конкретное обновление визуала)
    applyBackgroundChanges();
}

// Функция, которая обновляет фон на основе конфигураций
function applyBackgroundChanges() {
    // Логирование для проверки изменения значений
    console.log('Updated backgroundConfigs:', backgroundConfigs);

    // Здесь обновляйте визуальные параметры, например:
    // document.body.style.background = backgroundConfigs[0].background;
    // И другие обновления, зависящие от этих параметров
}

// Вызываем функцию при изменении размера окна
window.addEventListener('resize', updateBackgroundForMobile);

// Вызываем функцию сразу для начальной настройки
updateBackgroundForMobile();

const colors = ["#FFDAB9", "#ed1c27", "#FF6F00", "#D84315", "#F4511E", "#BF360C"];
const threeColors = colors.map(color => new THREE.Color(color));

// Classic Perlin Noise shader
const noiseShader = `
    vec2 fade(vec2 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}

    float cnoise21(vec2 P){
        vec4 Pi = floor(P.xyxy) + vec4(0.0, 0.0, 1.0, 1.0);
        vec4 Pf = fract(P.xyxy) - vec4(0.0, 0.0, 1.0, 1.0);
        Pi = mod(Pi, 289.0);
        vec4 ix = Pi.xzxz;
        vec4 iy = Pi.yyww;
        vec4 fx = Pf.xzxz;
        vec4 fy = Pf.yyww;
        vec4 i = permute(permute(ix) + iy);
        vec4 gx = 2.0 * fract(i * 0.0243902439) - 1.0;
        vec4 gy = abs(gx) - 0.5;
        vec4 tx = floor(gx + 0.5);
        gx = gx - tx;
        vec2 g00 = vec2(gx.x,gy.x);
        vec2 g10 = vec2(gx.y,gy.y);
        vec2 g01 = vec2(gx.z,gy.z);
        vec2 g11 = vec2(gx.w,gy.w);
        vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11));
        g00 *= norm.x;
        g01 *= norm.y;
        g10 *= norm.z;
        g11 *= norm.w;
        float n00 = dot(g00, vec2(fx.x, fy.x));
        float n10 = dot(g10, vec2(fx.y, fy.y));
        float n01 = dot(g01, vec2(fx.z, fy.z));
        float n11 = dot(g11, vec2(fx.w, fy.w));
        vec2 fade_xy = fade(Pf.xy);
        vec2 n_x = mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x);
        float n_xy = mix(n_x.x, n_x.y, fade_xy.y);
        return 2.3 * n_xy;
    }
`;

class WebGLBackground {
    constructor(options) {
        this.container = options.dom;
        this.darkBackground = options.darkBackground;
        this.scrollTriggerOpacity = options.scrollTriggerOpacity;
        this.activeBackground = backgroundConfigs[0];

        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupMaterial();
        this.setupGeometry();
        this.setupEvents();

        this.render();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.time = this.activeBackground.timeStart;
        this.uTime = 0.1;
        this.reverseUTime = false;
        this.uMouse = new THREE.Vector2(0, 0);
        this.rayMouse = new THREE.Vector2(1, 1);
        this.allowRayMouse = false;
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 10, 10000);
        this.positionZ = 4000;
        this.camera.position.z = this.positionZ;
        this.camera.fov = 2 * Math.atan((this.height / 2) / this.positionZ) * (180 / Math.PI);
        this.camera.updateProjectionMatrix();
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(this.width, this.height);
        this.renderer.setClearColor(this.darkBackground ? 0x000000 : 0xFFFFFF);
        this.container.appendChild(this.renderer.domElement);
    }

    setupMaterial() {
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uNoiseAmount: { value: 0 },
                uRayMouse: { value: this.uMouse },
                uAmount: { value: this.activeBackground.shapeAmount },
                uPow: { value: 10 },
                uAlpha: { value: 0 },
                uColor: { value: threeColors },
                uMouseEffect: { value: this.activeBackground.mouseEffect },
                uVelocity: { value: 0 },
                uRatio: { value: 1 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec2 uPos;
                uniform vec2 uRayMouse;
                uniform float uMouseEffect;
                uniform float uRatio;

                void main() {
                    vUv = uv;
                    vec2 direction = normalize(position.xy - uRayMouse);
                    float distanceToMouse = length(position.xy - uRayMouse);
                    float falloff = smoothstep(0., 0.15, distanceToMouse);
                    float displacement = uMouseEffect * 0.1 * falloff;
                    vec3 newPosition = vec3(position.xy - direction * displacement / 2., position.z);
                    uPos = direction * displacement * 2.;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float uTime;
                uniform vec2 uRayMouse;
                uniform float uMouseEffect;
                uniform float uNoiseAmount;
                uniform float uAmount;
                uniform float uPow;
                uniform float uAlpha;
                varying vec2 vUv;
                varying vec2 uPos;
                uniform vec3 uColor[6];
                ${noiseShader}

                void main() {
                    vec3 firstColor = uColor[0];
                    vec2 seed = (vUv * -uPos) * mix(vUv, uPos, 30. * uAmount);
                    float ml = pow(1., 0.5) * -0.01;
                    float n = cnoise21(seed) + 1. * uTime;
                    vec3 color = mix(firstColor, firstColor, cnoise21(seed) / 1000.);

                    for (int i = 1; i < 5; i++) {
                        float amount = (float(i) + 1.) * 0.09;
                        float n2 = smoothstep(amount * uTime + ml, amount * uTime + ml + amount * uTime, n * uTime);
                        color = mix(color, uColor[i], n2);
                    }

                    float alpha = uAlpha * pow(sin(vUv.x * 3.14159), uPow);
                    alpha *= pow(sin(vUv.y * 3.14159), uPow);
                    gl_FragColor = vec4(color, alpha);
                }
            `,
            transparent: true,
            side: THREE.DoubleSide
        });
    }

    setupGeometry() {
        this.geometry = new THREE.PlaneGeometry(1, 1, 128, 128);
        this.plane = new THREE.Mesh(this.geometry, this.material);
        this.plane.scale.x = this.activeBackground.widthMultiplier * this.width;
        this.plane.scale.y = this.activeBackground.heightMultiplier * (1.25 * this.height);
        this.camera.rotation.z = this.activeBackground.rotation;
        this.scene.add(this.plane);
    }

    setupEvents() {
        window.addEventListener('resize', this.resize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));

        // Animate in
        gsap.to(this.material.uniforms.uPow, {
            value: 1.5,
            duration: 2,
            delay: 0.5,
            ease: "power4.out"
        });

        gsap.to(this.material.uniforms.uAlpha, {
            value: 1,
            duration: 2,
            delay: 0.5,
            ease: "power4.out"
        });
    }

    onMouseMove(event) {
        this.uMouse.x = (event.clientX / this.width - 0.5);
        this.uMouse.y = (event.clientY / this.height - 0.5);

        if (this.allowRayMouse) {
            this.rayMouse.x = (event.clientX / this.width) * 2 - 1;
            this.rayMouse.y = -(event.clientY / this.height) * 2 + 1;
        }
    }

    resize() {
        this.width = this.container.offsetWidth;
        this.height = this.container.offsetHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.fov = 2 * Math.atan((this.height / 2) / this.positionZ) * (180 / Math.PI);
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);

        this.plane.scale.x = this.activeBackground.widthMultiplier * this.width;
        this.plane.scale.y = this.activeBackground.heightMultiplier * (1.25 * this.height);
    }

    render() {
        this.time += 0.01;

        if (this.reverseUTime) {
            this.uTime -= 0.001;
            if (this.uTime < 0.2) this.reverseUTime = false;
        } else {
            this.uTime += 0.001;
            if (this.uTime > 0.7) this.reverseUTime = true;
        }

        this.material.uniforms.uTime.value = this.uTime;
        this.material.uniforms.uRayMouse.value = this.rayMouse;

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.render.bind(this));
    }

    destroy() {
        window.removeEventListener('resize', this.resize.bind(this));
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));

        this.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();

        if (this.container.contains(this.renderer.domElement)) {
            this.container.removeChild(this.renderer.domElement);
        }
    }
}

// Initialize
window.addEventListener('load', () => {
    const container = document.querySelector('.webgl-background_container__Ojc1v');
    const background = new WebGLBackground({
        dom: container,
        darkBackground: false,
        scrollTriggerOpacity: 0.5
    });
});