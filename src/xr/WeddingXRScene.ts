import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { formatVenueDisplay, formatWeddingTime } from '../config/weddingConfig';
import { WeddingConfig } from '../types';

export type SanctuaryEnvironmentPreset = 'sunset-sea' | 'starlight-garden' | 'lavender-chapel';

interface FireflyData {
  baseX: number;
  baseY: number;
  baseZ: number;
  speed: number;
  phase: number;
  radius: number;
}

// Pre-allocated math helpers to guarantee zero GC in the render loop
const _pointerNdc = new THREE.Vector2();
const _dummyMatrix = new THREE.Matrix4();
const _dummyPos = new THREE.Vector3();
const _dummyScale = new THREE.Vector3();
const _dummyQuat = new THREE.Quaternion();
const _camTargetPos = new THREE.Vector3();
const _lookAtTarget = new THREE.Vector3();

/**
 * Experiencia 3D interactiva en una IGLESIA CRISTIANA EVANGÉLICA NUPCIAL para Bryan & Lyndel.
 *
 * Incluye:
 * 1. Interior arquitectónico contemporáneo de Iglesia Evangélica en 3D:
 *    - Plataforma / Escenario amplio en madera cálida y piedra crema con escalinata.
 *    - Fondo acústico de listones de madera cálida (wood slats), cruz cristiana sencilla
 *      retroiluminada con luz cálida y arco floral nupcial en el centro del altar.
 *    - Púlpito / Atril moderno en madera y acrílico con Biblia abierta y micrófono.
 *    - Área de Alabanza y Adoración en el escenario (piano/teclado, guitarra acústica en soporte
 *      y pedestales de micrófono para el tiempo de adoración).
 *    - Auditorio con filas de sillas acolchadas de iglesia y bancas contemporáneas de madera,
 *      además de mesas redondas vestidas con sillas para el banquete y comunión.
 *    - Ventanales amplios de luz clara (sin vitrales góticos ni iconografía católica) y
 *      luminarias colgantes modernas cálidas.
 * 2. Dos anillos de boda en oro de 24k entrelazados (con diamante solitario) sobre la mesa central.
 * 3. Carta decorativa 3D en papel mate verde #0F2A24 (sin exceso de brillo y sin líneas doradas
 *    en las páginas) con sello de cera dorado B & L, que al abrirse muestra "¡Te esperamos!".
 */
export class Wedding3DExperience {
  private container: HTMLElement;
  private config: WeddingConfig;
  private isOpen = false;

  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private controls: OrbitControls | null = null;
  private raycaster = new THREE.Raycaster();
  private clock = new THREE.Clock();
  private rafId: number | null = null;

  // Estado interactivo de la carta y la cámara
  private isLetterOpen = false;
  private letterOpenProgress = 0; // 0 = cerrada, 1 = completamente abierta ("¡Te esperamos!")
  private cameraMode: 'overview' | 'letter' | 'rings' | 'church' = 'overview';
  private envPreset: SanctuaryEnvironmentPreset = 'sunset-sea';
  private isDockCollapsed = false;

  // Grupos 3D animados
  private rootSanctuaryGroup: THREE.Group | null = null;
  private ringsMasterGroup: THREE.Group | null = null;
  private groomRingGroup: THREE.Group | null = null;
  private brideRingGroup: THREE.Group | null = null;
  private diamondMesh: THREE.Mesh | null = null;

  private envelopeAssemblyGroup: THREE.Group | null = null;
  private topFlapHingeGroup: THREE.Group | null = null;
  private waxSealGroup: THREE.Group | null = null;
  private risingCardGroup: THREE.Group | null = null;
  private cardLeftCoverHinge: THREE.Group | null = null;

  // Materiales de la carta para actualizar texturas si cambia la configuración
  private frontPocketMat: THREE.MeshStandardMaterial | null = null;
  private insideCardMat: THREE.MeshStandardMaterial | null = null;
  private coverFrontMat: THREE.MeshStandardMaterial | null = null;
  private coverInsideMat: THREE.MeshStandardMaterial | null = null;

  private skyDomeMat: THREE.ShaderMaterial | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private hemiLight: THREE.HemisphereLight | null = null;
  private pointLightWarm: THREE.PointLight | null = null;
  private naveLightWarm: THREE.PointLight | null = null;

  private firefliesInstanced: THREE.InstancedMesh | null = null;
  private firefliesData: FireflyData[] = [];

  private interactiveTargets: THREE.Object3D[] = [];
  private createdTextures: THREE.Texture[] = [];

  private pointerDownPos = { x: 0, y: 0 };

  constructor(container: HTMLElement, config: WeddingConfig) {
    this.container = container;
    this.config = config;
  }

  public updateConfig(config: WeddingConfig): void {
    this.config = config;
    if (this.isOpen) {
      this.rebuildLetterTextures();
    }
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.isLetterOpen = false;
    this.letterOpenProgress = 0;
    this.cameraMode = 'overview';
    document.body.style.overflow = 'hidden';

    this.renderOverlayDOM();
    this.initThreeScene();
    this.bindDOMEvents();

    // Después de 950 ms abrimos automáticamente la carta en el altar para que se lea "¡Te esperamos!"
    window.setTimeout(() => {
      if (this.isOpen && !this.isLetterOpen) {
        this.setLetterOpenState(true);
      }
    }, 950);
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    document.body.style.overflow = '';
    this.disposeThreeScene();
    this.container.innerHTML = '';
  }

  private renderOverlayDOM(): void {
    this.container.innerHTML = `
      <div
        id="wedding-3d-modal"
        class="w3d-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Iglesia Cristiana Evangélica 3D — ${this.config.couple.displayTitle}"
      >
        <!-- Lienzo WebGL 3D aislado -->
        <div id="w3d-canvas-mount" class="w3d-canvas-mount"></div>

        <!-- Insignia superior discreta y botón de salida -->
        <header class="w3d-top-header">
          <div class="w3d-title-badge">
            <span class="w3d-title-badge__kicker">IGLESIA EVANGÉLICA Y ALTAR 3D · ${this.config.date.displayDate.toUpperCase()}</span>
            <span class="w3d-title-badge__names">${this.config.couple.displayTitle} — ¡Te esperamos!</span>
          </div>

          <button
            type="button"
            id="w3d-close-btn"
            class="w3d-exit-btn"
            aria-label="Volver a la invitación principal"
          >
            Volver a la invitación
          </button>
        </header>

        <!-- Dock inferior colapsable -->
        <div id="w3d-bottom-dock-wrapper" class="w3d-dock-wrapper">
          <button
            type="button"
            id="w3d-toggle-dock-btn"
            class="w3d-dock-collapse-tab"
            aria-label="Ocultar o mostrar controles 3D"
          >
            ▾ Ocultar controles
          </button>

          <div class="w3d-dock" id="w3d-dock-panel">
            <!-- Acción principal: Abrir / Cerrar la carta 3D -->
            <div class="w3d-dock-group">
              <button
                type="button"
                id="w3d-toggle-letter-btn"
                class="w3d-action-btn w3d-action-btn--gold"
              >
                Abrir carta (“¡Te esperamos!”)
              </button>
            </div>

            <div class="w3d-dock-divider" aria-hidden="true"></div>

            <!-- Vistas de cámara dentro de la Iglesia Evangélica -->
            <div class="w3d-dock-group" role="group" aria-label="Vista de cámara">
              <span class="w3d-dock-label">Vista:</span>
              <button type="button" data-cam-mode="overview" class="w3d-chip-btn w3d-chip-btn--active">
                Altar y Plataforma
              </button>
              <button type="button" data-cam-mode="church" class="w3d-chip-btn">
                Iglesia, Mesas y Sillas
              </button>
              <button type="button" data-cam-mode="letter" class="w3d-chip-btn">
                Carta (“¡Te esperamos!”)
              </button>
              <button type="button" data-cam-mode="rings" class="w3d-chip-btn">
                Dos Anillos
              </button>
            </div>

            <div class="w3d-dock-divider" aria-hidden="true"></div>

            <!-- Iluminación de la Iglesia -->
            <div class="w3d-dock-group" role="group" aria-label="Iluminación de la iglesia">
              <span class="w3d-dock-label">Ambiente:</span>
              <button type="button" data-env-preset="sunset-sea" class="w3d-chip-btn w3d-chip-btn--active">
                Luz Cálida de Ceremonia
              </button>
              <button type="button" data-env-preset="starlight-garden" class="w3d-chip-btn">
                Noche de Adoración
              </button>
              <button type="button" data-env-preset="lavender-chapel" class="w3d-chip-btn">
                Luz Suave Lavanda
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private bindDOMEvents(): void {
    const closeBtn = this.container.querySelector<HTMLButtonElement>('#w3d-close-btn');
    const toggleLetterBtn = this.container.querySelector<HTMLButtonElement>('#w3d-toggle-letter-btn');
    const toggleDockBtn = this.container.querySelector<HTMLButtonElement>('#w3d-toggle-dock-btn');
    const dockWrapper = this.container.querySelector<HTMLElement>('#w3d-bottom-dock-wrapper');
    const canvasMount = this.container.querySelector<HTMLElement>('#w3d-canvas-mount');

    closeBtn?.addEventListener('click', () => this.close());

    toggleLetterBtn?.addEventListener('click', () => {
      this.setLetterOpenState(!this.isLetterOpen);
      if (this.isLetterOpen) {
        this.setCameraMode('letter');
      }
    });

    toggleDockBtn?.addEventListener('click', () => {
      this.isDockCollapsed = !this.isDockCollapsed;
      if (dockWrapper) {
        dockWrapper.classList.toggle('w3d-dock-wrapper--collapsed', this.isDockCollapsed);
      }
      if (toggleDockBtn) {
        toggleDockBtn.textContent = this.isDockCollapsed
          ? '▴ Mostrar controles'
          : '▾ Ocultar controles';
      }
    });

    this.container.querySelectorAll<HTMLButtonElement>('[data-cam-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-cam-mode') as
          | 'overview'
          | 'letter'
          | 'rings'
          | 'church';
        if (mode) {
          this.setCameraMode(mode);
        }
      });
    });

    this.container.querySelectorAll<HTMLButtonElement>('[data-env-preset]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-env-preset') as SanctuaryEnvironmentPreset;
        if (preset) {
          this.applyEnvironmentPreset(preset);
          this.container.querySelectorAll<HTMLButtonElement>('[data-env-preset]').forEach((b) => {
            b.classList.toggle('w3d-chip-btn--active', b === btn);
          });
        }
      });
    });

    if (canvasMount) {
      canvasMount.addEventListener('pointerdown', (e) => {
        this.pointerDownPos.x = e.clientX;
        this.pointerDownPos.y = e.clientY;
      });

      canvasMount.addEventListener('pointerup', (e) => {
        const dx = e.clientX - this.pointerDownPos.x;
        const dy = e.clientY - this.pointerDownPos.y;
        if (Math.hypot(dx, dy) < 9) {
          this.handleCanvasClick(e);
        }
      });
    }

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      this.close();
    } else if (e.key.toLowerCase() === 'h') {
      const toggleDockBtn = this.container.querySelector<HTMLButtonElement>('#w3d-toggle-dock-btn');
      toggleDockBtn?.click();
    }
  };

  private handleResize = (): void => {
    if (!this.renderer || !this.camera) return;
    const mount = this.container.querySelector<HTMLElement>('#w3d-canvas-mount');
    const width = mount?.clientWidth || window.innerWidth;
    const height = mount?.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private setLetterOpenState(open: boolean): void {
    this.isLetterOpen = open;
    const toggleBtn = this.container.querySelector<HTMLButtonElement>('#w3d-toggle-letter-btn');
    if (toggleBtn) {
      toggleBtn.textContent = open
        ? 'Cerrar carta'
        : 'Abrir carta (“¡Te esperamos!”)';
    }
  }

  private setCameraMode(mode: 'overview' | 'letter' | 'rings' | 'church'): void {
    this.cameraMode = mode;
    if (this.camera && this.controls) {
      if (mode === 'church') {
        this.camera.position.set(0, 2.35, 6.2);
      } else if (mode === 'overview') {
        this.camera.position.set(0, 1.85, 3.65);
      } else if (mode === 'letter') {
        this.camera.position.set(0.24, 1.4, 1.88);
      } else if (mode === 'rings') {
        this.camera.position.set(-0.46, 1.36, 1.48);
      }
    }
    this.container.querySelectorAll<HTMLButtonElement>('[data-cam-mode]').forEach((btn) => {
      btn.classList.toggle('w3d-chip-btn--active', btn.getAttribute('data-cam-mode') === mode);
    });
  }

  private handleCanvasClick(event: PointerEvent): void {
    if (!this.camera || !this.scene || !this.renderer) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    _pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(_pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveTargets, true);
    if (hits.length === 0) return;

    let obj: THREE.Object3D | null = hits[0].object;
    while (obj) {
      if (obj.userData?.interactionRole === 'letter') {
        this.setLetterOpenState(!this.isLetterOpen);
        if (this.isLetterOpen) {
          this.setCameraMode('letter');
        }
        return;
      }
      if (obj.userData?.interactionRole === 'rings') {
        this.setCameraMode(this.cameraMode === 'rings' ? 'overview' : 'rings');
        return;
      }
      obj = obj.parent;
    }
  }

  private initThreeScene(): void {
    const mount = this.container.querySelector<HTMLElement>('#w3d-canvas-mount');
    if (!mount) return;

    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;
    const isHeadless = navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // Exposición equilibrada y suave (0.94) para que la carta se lea nítida y sin exceso de brillo
    renderer.toneMappingExposure = 0.94;
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);
    this.renderer = renderer;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x1f2824, 0.018);
    this.scene = scene;

    // Mapa de reflejos para los dos anillos de oro 24k
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 120);
    camera.position.set(0, 1.88, 3.75);
    this.camera = camera;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.minPolarAngle = 0.2;
    controls.minDistance = 1.25;
    controls.maxDistance = 8.5;
    controls.target.set(0, 1.02, 0);
    this.controls = controls;

    this.setupLighting(scene);
    this.buildEvangelicalWeddingChurch(scene);
    this.buildWeddingRingsShowcase(scene);
    this.buildDecorative3DLetter(scene);
    this.buildFloatingFireflies(scene);
    this.applyEnvironmentPreset(this.envPreset);

    renderer.compile(scene, camera);

    this.clock.start();
    const animate = () => {
      if (!this.isOpen) return;
      this.rafId = requestAnimationFrame(animate);
      this.updateFrame();
      renderer.render(scene, camera);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  private setupLighting(scene: THREE.Scene): void {
    const hemiLight = new THREE.HemisphereLight(0xfaf5eb, 0x2c3830, 1.15);
    scene.add(hemiLight);
    this.hemiLight = hemiLight;

    const keyLight = new THREE.DirectionalLight(0xfff2d6, 1.65);
    keyLight.position.set(3.4, 6.8, 4.5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 22;
    const d = 5.5;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);
    this.keyLight = keyLight;

    const rimLight = new THREE.DirectionalLight(0xe2d8e8, 0.95);
    rimLight.position.set(-4.2, 4.8, -3.5);
    scene.add(rimLight);

    // Luz suave sobre la mesa central del altar (calibrada para no quemar ni dar brillo excesivo a la carta)
    const pointLightWarm = new THREE.PointLight(0xffe2a8, 1.05, 9, 1.6);
    pointLightWarm.position.set(-0.35, 2.55, 0.85);
    scene.add(pointLightWarm);
    this.pointLightWarm = pointLightWarm;

    // Luz cálida general sobre el auditorio (sillas, bancas y mesas de banquete)
    const naveLightWarm = new THREE.PointLight(0xffe5ad, 1.65, 15, 1.3);
    naveLightWarm.position.set(0, 4.3, 3.8);
    scene.add(naveLightWarm);
    this.naveLightWarm = naveLightWarm;
  }

  /**
   * Construye el interior completo de una IGLESIA CRISTIANA EVANGÉLICA moderna y elegante en 3D:
   * - Plataforma amplia en madera cálida y piedra crema con escalones iluminados
   * - Pared frontal con paneles acústicos de listones de madera cálida (wood slats),
   *   cruz cristiana sencilla de madera/luz cálida y arco floral nupcial
   * - Púlpito / Atril cristiano contemporáneo (madera y acrílico esmerilado con Biblia abierta)
   * - Área de Alabanza y Adoración en el escenario (Piano de cola/teclado, guitarra acústica en soporte,
   *   pedestales de micrófono y monitores)
   * - Sillas acolchadas de iglesia evangélica, bancas modernas y mesas redondas vestidas para la cena
   */
  private buildEvangelicalWeddingChurch(scene: THREE.Scene): void {
    const church = new THREE.Group();
    this.rootSanctuaryGroup = church;
    scene.add(church);

    // Materiales arquitectónicos cálidos y contemporáneos
    const warmWallMat = new THREE.MeshStandardMaterial({
      color: 0xf6f2e6,
      roughness: 0.72,
      metalness: 0.02,
    });
    const creamFloorMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7ef,
      roughness: 0.42,
      metalness: 0.04,
    });
    const sageCarpetTileMat = new THREE.MeshStandardMaterial({
      color: 0xdfe6d7,
      roughness: 0.68,
      metalness: 0.02,
    });
    const emeraldFabricMat = new THREE.MeshStandardMaterial({
      color: 0x0f2a24,
      roughness: 0.65,
      metalness: 0.04,
    });
    const warmWoodStageMat = new THREE.MeshStandardMaterial({
      color: 0x7b5233,
      roughness: 0.52,
      metalness: 0.05,
    });
    const acousticSlatWoodMat = new THREE.MeshStandardMaterial({
      color: 0x8f623d,
      roughness: 0.48,
      metalness: 0.06,
    });
    const darkWalnutWoodMat = new THREE.MeshStandardMaterial({
      color: 0x462d1b,
      roughness: 0.46,
      metalness: 0.06,
    });
    const brushedBrassMat = new THREE.MeshStandardMaterial({
      color: 0xc5a365,
      roughness: 0.34,
      metalness: 0.72,
    });
    const matteBlackMetalMat = new THREE.MeshStandardMaterial({
      color: 0x1e2220,
      roughness: 0.45,
      metalness: 0.55,
    });
    const whiteLinenMat = new THREE.MeshStandardMaterial({
      color: 0xfbf8ef,
      roughness: 0.78,
      metalness: 0.01,
    });
    const foliageMat = new THREE.MeshStandardMaterial({
      color: 0x3b543c,
      roughness: 0.68,
      metalness: 0.02,
    });
    const creamRoseMat = new THREE.MeshStandardMaterial({
      color: 0xfaf7ef,
      roughness: 0.55,
      metalness: 0.02,
    });
    const lavenderFlowerMat = new THREE.MeshStandardMaterial({
      color: 0xe2d8e8,
      roughness: 0.55,
      metalness: 0.02,
    });

    // 1. Cúpula de cielo suave exterior
    const skyGeo = new THREE.SphereGeometry(55, 32, 24);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uTopColor: { value: new THREE.Color(0x162420) },
        uMidColor: { value: new THREE.Color(0x3a4d45) },
        uHorizonColor: { value: new THREE.Color(0xd8b48a) },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vWorldPos;
        uniform vec3 uTopColor;
        uniform vec3 uMidColor;
        uniform vec3 uHorizonColor;
        void main() {
          float h = normalize(vWorldPos).y;
          float t1 = smoothstep(-0.05, 0.25, h);
          float t2 = smoothstep(0.22, 0.85, h);
          vec3 col = mix(uHorizonColor, uMidColor, t1);
          col = mix(col, uTopColor, t2);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.skyDomeMat = skyMat;
    church.add(new THREE.Mesh(skyGeo, skyMat));

    // 2. PISO DEL AUDITORIO DE LA IGLESIA Y ALFOMBRA CENTRAL NUPCIAL
    const churchFloor = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 0.16, 18),
      creamFloorMat,
    );
    churchFloor.position.set(0, -0.16, 2.2);
    churchFloor.receiveShadow = true;
    church.add(churchFloor);

    for (const side of [-1, 1]) {
      const sideFloor = new THREE.Mesh(
        new THREE.BoxGeometry(5.2, 0.01, 16.5),
        sageCarpetTileMat,
      );
      sideFloor.position.set(side * 4.1, -0.075, 2.2);
      sideFloor.receiveShadow = true;
      church.add(sideFloor);
    }

    // Pasillo nupcial central limpio en crema cálido con borde verde profundo #0F2A24
    const runnerOuter = new THREE.Mesh(
      new THREE.BoxGeometry(1.74, 0.014, 13.5),
      emeraldFabricMat,
    );
    runnerOuter.position.set(0, -0.07, 3.2);
    runnerOuter.receiveShadow = true;
    church.add(runnerOuter);

    const runnerInnerCream = new THREE.Mesh(
      new THREE.BoxGeometry(1.54, 0.018, 13.5),
      whiteLinenMat,
    );
    runnerInnerCream.position.set(0, -0.066, 3.2);
    runnerInnerCream.receiveShadow = true;
    church.add(runnerInnerCream);

    // 3. PLATAFORMA / ESCENARIO EVANGÉLICO AMPLIO EN MADERA CÁLIDA Y PIEDRA CREMA
    const stageStep1 = new THREE.Mesh(
      new THREE.BoxGeometry(10.2, 0.12, 5.1),
      warmWoodStageMat,
    );
    stageStep1.position.set(0, -0.02, -1.25);
    stageStep1.receiveShadow = true;
    church.add(stageStep1);

    const stageStep2 = new THREE.Mesh(
      new THREE.BoxGeometry(9.4, 0.12, 4.45),
      warmWoodStageMat,
    );
    stageStep2.position.set(0, 0.06, -1.42);
    stageStep2.receiveShadow = true;
    church.add(stageStep2);

    // Alfombra crema central sobre la plataforma para el altar de matrimonio
    const stageCenterRug = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.012, 3.2),
      creamFloorMat,
    );
    stageCenterRug.position.set(0, 0.125, -0.95);
    stageCenterRug.receiveShadow = true;
    church.add(stageCenterRug);

    // Tira de luz cálida arquitectónica en el frente de la plataforma
    const stageLedStrip = new THREE.Mesh(
      new THREE.BoxGeometry(9.35, 0.018, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffe5a3 }),
    );
    stageLedStrip.position.set(0, 0.08, 0.81);
    church.add(stageLedStrip);

    // 4. MURO FRONTAL DEL ESCENARIO EVANGÉLICO: PANELES ACÚSTICOS DE LISTONES DE MADERA Y CRUZ SENCILLA RETROILUMINADA
    const stageBackWallGroup = new THREE.Group();
    stageBackWallGroup.position.set(0, 0.08, -3.45);
    church.add(stageBackWallGroup);

    const mainBackWall = new THREE.Mesh(
      new THREE.BoxGeometry(11.4, 6.8, 0.32),
      warmWallMat,
    );
    mainBackWall.position.set(0, 3.3, -0.2);
    mainBackWall.receiveShadow = true;
    stageBackWallGroup.add(mainBackWall);

    // Panel central arquitectónico en verde profundo #0F2A24 mate
    const centerBackdropPanel = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 5.2, 0.08),
      emeraldFabricMat,
    );
    centerBackdropPanel.position.set(0, 2.75, 0.0);
    stageBackWallGroup.add(centerBackdropPanel);

    // Paneles acústicos de listones verticales de madera cálida (muy característicos de iglesias evangélicas modernas)
    const slatGeo = new THREE.BoxGeometry(0.085, 5.0, 0.09);
    const slatPositionsX: number[] = [];
    for (const side of [-1, 1]) {
      for (let s = 0; s < 14; s++) {
        slatPositionsX.push(side * (1.92 + s * 0.21));
      }
    }
    const slatsInst = new THREE.InstancedMesh(
      slatGeo,
      acousticSlatWoodMat,
      slatPositionsX.length,
    );
    for (let i = 0; i < slatPositionsX.length; i++) {
      _dummyPos.set(slatPositionsX[i], 2.75, 0.02);
      _dummyQuat.identity();
      _dummyScale.set(1, 1, 1);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      slatsInst.setMatrixAt(i, _dummyMatrix);
    }
    slatsInst.computeBoundingSphere();
    stageBackWallGroup.add(slatsInst);

    // Cruz Cristiana Evangélica Sencilla (limpia, sin Cristo ni halo católico, en madera nogal con luz cálida detrás)
    const crossGlowBackV = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 1.62, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffe8ad }),
    );
    crossGlowBackV.position.set(0, 3.55, 0.05);
    const crossGlowBackH = new THREE.Mesh(
      new THREE.BoxGeometry(1.06, 0.22, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffe8ad }),
    );
    crossGlowBackH.position.set(0, 3.82, 0.05);

    const crossWoodV = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 1.52, 0.06),
      darkWalnutWoodMat,
    );
    crossWoodV.position.set(0, 3.55, 0.09);
    crossWoodV.castShadow = true;

    const crossWoodH = new THREE.Mesh(
      new THREE.BoxGeometry(0.96, 0.13, 0.06),
      darkWalnutWoodMat,
    );
    crossWoodH.position.set(0, 3.82, 0.09);
    crossWoodH.castShadow = true;

    stageBackWallGroup.add(crossGlowBackV, crossGlowBackH, crossWoodV, crossWoodH);

    // 5. ARCO FLORAL NUPCIAL EN LA PLATAFORMA CENTRAL
    const archGroup = new THREE.Group();
    archGroup.position.set(0, 0.12, -2.05);
    church.add(archGroup);

    const archRadius = 1.62;
    const archTube = new THREE.Mesh(
      new THREE.TorusGeometry(archRadius, 0.05, 20, 64, Math.PI),
      brushedBrassMat,
    );
    archTube.position.y = 1.62;
    archTube.castShadow = true;
    archGroup.add(archTube);

    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.06, 1.64, 20),
        brushedBrassMat,
      );
      pillar.position.set(side * archRadius, 0.82, 0);
      pillar.castShadow = true;
      archGroup.add(pillar);

      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.18, 0.32),
        warmWallMat,
      );
      plinth.position.set(side * archRadius, 0.09, 0);
      plinth.receiveShadow = true;
      archGroup.add(plinth);
    }

    // Flores y follaje natural sobre el arco nupcial
    const leafGeo = new THREE.SphereGeometry(0.11, 10, 8);
    leafGeo.scale(1.4, 0.65, 0.9);
    const flowerGeo = new THREE.DodecahedronGeometry(0.075, 1);
    const numArchClusters = 28;
    const leavesInst = new THREE.InstancedMesh(leafGeo, foliageMat, numArchClusters);
    const flowersCreamInst = new THREE.InstancedMesh(flowerGeo, creamRoseMat, numArchClusters);
    const flowersLavInst = new THREE.InstancedMesh(flowerGeo, lavenderFlowerMat, numArchClusters);

    for (let i = 0; i < numArchClusters; i++) {
      const angle = (i / (numArchClusters - 1)) * Math.PI;
      const cx = Math.cos(angle) * archRadius;
      const cy = 1.62 + Math.sin(angle) * archRadius;

      _dummyPos.set(
        cx + Math.sin(i * 3.1) * 0.05,
        cy + Math.cos(i * 2.7) * 0.05,
        0.05,
      );
      _dummyQuat.setFromEuler(new THREE.Euler(i * 0.4, i * 0.7, angle));
      _dummyScale.setScalar(0.85 + (i % 3) * 0.22);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      leavesInst.setMatrixAt(i, _dummyMatrix);

      _dummyPos.z += 0.05;
      _dummyScale.setScalar(0.75 + (i % 2) * 0.3);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      flowersCreamInst.setMatrixAt(i, _dummyMatrix);

      _dummyPos.x += i % 2 === 0 ? 0.06 : -0.06;
      _dummyPos.y += 0.04;
      _dummyScale.setScalar(0.65 + ((i + 1) % 3) * 0.2);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      flowersLavInst.setMatrixAt(i, _dummyMatrix);
    }
    leavesInst.computeBoundingSphere();
    flowersCreamInst.computeBoundingSphere();
    flowersLavInst.computeBoundingSphere();
    archGroup.add(leavesInst, flowersCreamInst, flowersLavInst);

    // 6. PÚLPITO / ATRIL EVANGÉLICO CONTEMPORÁNEO (CON BIBLIA ABIERTA Y MICRÓFONO)
    const pulpitGroup = this.createEvangelicalPulpit(
      darkWalnutWoodMat,
      brushedBrassMat,
      whiteLinenMat,
      matteBlackMetalMat,
    );
    pulpitGroup.position.set(0, 0.12, -1.25);
    church.add(pulpitGroup);

    // 7. ÁREA DE ALABANZA Y ADORACIÓN EN LA PLATAFORMA (PIANO/TECLADO, GUITARRA ACÚSTICA Y MICRÓFONOS)
    const worshipPiano = this.createWorshipPiano(
      darkWalnutWoodMat,
      whiteLinenMat,
      matteBlackMetalMat,
      brushedBrassMat,
    );
    worshipPiano.position.set(-2.95, 0.12, -1.55);
    worshipPiano.rotation.y = 0.38;
    church.add(worshipPiano);

    const worshipGuitarAndMics = this.createWorshipGuitarAndMics(
      acousticSlatWoodMat,
      darkWalnutWoodMat,
      matteBlackMetalMat,
      brushedBrassMat,
    );
    worshipGuitarAndMics.position.set(2.85, 0.12, -1.5);
    worshipGuitarAndMics.rotation.y = -0.35;
    church.add(worshipGuitarAndMics);

    // 8. MESA CENTRAL DE CEREMONIA (DONDE ESTÁN LOS DOS ANILLOS Y LA CARTA "¡TE ESPERAMOS!")
    const mainAltarGroup = new THREE.Group();
    mainAltarGroup.position.set(0, 0.08, 0);
    church.add(mainAltarGroup);

    const altarBase = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.12, 1.12),
      warmWoodStageMat,
    );
    altarBase.position.y = 0.06;
    altarBase.receiveShadow = true;
    mainAltarGroup.add(altarBase);

    const altarBody = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 0.58, 0.94),
      whiteLinenMat,
    );
    altarBody.position.y = 0.42;
    altarBody.castShadow = true;
    altarBody.receiveShadow = true;
    mainAltarGroup.add(altarBody);

    // Camino frontal de tela #0F2A24 mate sin exceso de dorado
    const frontalEmerald = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 0.59, 0.96),
      emeraldFabricMat,
    );
    frontalEmerald.position.y = 0.425;
    mainAltarGroup.add(frontalEmerald);

    const altarTopSlab = new THREE.Mesh(
      new THREE.BoxGeometry(2.14, 0.07, 1.12),
      whiteLinenMat,
    );
    altarTopSlab.position.y = 0.745;
    altarTopSlab.castShadow = true;
    altarTopSlab.receiveShadow = true;
    mainAltarGroup.add(altarTopSlab);

    const altarVelvetMat = new THREE.Mesh(
      new THREE.BoxGeometry(1.88, 0.018, 0.92),
      emeraldFabricMat,
    );
    altarVelvetMat.position.y = 0.785;
    altarVelvetMat.receiveShadow = true;
    mainAltarGroup.add(altarVelvetMat);

    // Arreglos florales laterales sobre la plataforma y sillones de los novios
    for (const side of [-1, 1]) {
      const floralPedestal = this.createDecoratedCeremonialTable(
        creamFloorMat,
        whiteLinenMat,
        emeraldFabricMat,
        brushedBrassMat,
        foliageMat,
        creamRoseMat,
        lavenderFlowerMat,
      );
      floralPedestal.position.set(side * 1.95, 0.12, -0.78);
      church.add(floralPedestal);

      const brideGroomChair = this.createWeddingChair(brushedBrassMat, whiteLinenMat, true);
      brideGroomChair.position.set(side * 1.25, 0.12, -0.35);
      brideGroomChair.rotation.y = -side * 0.22;
      church.add(brideGroomChair);
    }

    // 9. FILAS DE SILLAS ACOLCHADAS Y BANCAS MODERNAS DE LA CONGREGACIÓN A AMBOS LADOS DEL PASILLO
    const pewRowsZ = [1.45, 2.55, 3.65, 4.75, 5.85];
    for (const zPos of pewRowsZ) {
      for (const side of [-1, 1]) {
        const pew = this.createChurchPew(
          darkWalnutWoodMat,
          whiteLinenMat,
          brushedBrassMat,
          foliageMat,
          creamRoseMat,
          side,
        );
        pew.position.set(side * 2.15, -0.08, zPos);
        church.add(pew);

        const aisleChair = this.createWeddingChair(brushedBrassMat, whiteLinenMat, false);
        aisleChair.position.set(side * 1.15, -0.08, zPos);
        aisleChair.rotation.y = Math.PI;
        church.add(aisleChair);
      }
    }

    // 10. MESAS REDONDAS VESTIDAS DE GALA CON SILLAS PARA LA CENA Y RECEPCIÓN NUPCIAL
    const banquetTablePositions = [
      { x: -4.35, z: 0.9 },
      { x: 4.35, z: 0.9 },
      { x: -4.35, z: 2.95 },
      { x: 4.35, z: 2.95 },
      { x: -4.35, z: 5.0 },
      { x: 4.35, z: 5.0 },
    ];

    for (const pos of banquetTablePositions) {
      const roundTableWithChairs = this.createBanquetTableWithChairs(
        whiteLinenMat,
        emeraldFabricMat,
        brushedBrassMat,
        foliageMat,
        creamRoseMat,
        lavenderFlowerMat,
      );
      roundTableWithChairs.position.set(pos.x, -0.08, pos.z);
      church.add(roundTableWithChairs);
    }

    // 11. COLUMNAS MODERNAS DE MADERA Y PIEDRA, VENTANALES DE LUZ CLARA (NO VITRALES CATÓLICOS) Y VIGAS CÁLIDAS
    const archColumnsZ = [-1.8, 0.4, 2.6, 4.8, 7.0];
    const clearWindowTex = this.createClearSanctuaryWindowTexture();
    this.createdTextures.push(clearWindowTex);
    const windowMat = new THREE.MeshBasicMaterial({ map: clearWindowTex });

    for (const zCol of archColumnsZ) {
      for (const side of [-1, 1]) {
        const colX = side * 6.15;
        const colGroup = new THREE.Group();
        colGroup.position.set(colX, -0.08, zCol);
        church.add(colGroup);

        const colBase = new THREE.Mesh(
          new THREE.BoxGeometry(0.55, 0.35, 0.55),
          warmWallMat,
        );
        colBase.position.y = 0.175;
        colGroup.add(colBase);

        const colShaft = new THREE.Mesh(
          new THREE.BoxGeometry(0.38, 4.85, 0.38),
          warmWoodStageMat,
        );
        colShaft.position.y = 2.75;
        colShaft.castShadow = true;
        colShaft.receiveShadow = true;
        colGroup.add(colShaft);

        if (zCol < 6.5) {
          const daylightWindow = new THREE.Mesh(
            new THREE.PlaneGeometry(1.35, 2.9),
            windowMat,
          );
          daylightWindow.position.set(side * 6.45, 2.95, zCol + 1.1);
          daylightWindow.rotation.y = -side * (Math.PI / 2);
          church.add(daylightWindow);
        }
      }

      // Viga transversal contemporánea en madera cálida en el techo del auditorio
      const ceilingBeam = new THREE.Mesh(
        new THREE.BoxGeometry(12.4, 0.22, 0.28),
        warmWoodStageMat,
      );
      ceilingBeam.position.set(0, 5.2, zCol);
      church.add(ceilingBeam);
    }

    // Luminarias colgantes circulares modernas sobre el pasillo central
    for (const chandZ of [-0.4, 2.2, 4.8]) {
      const pendant = this.createModernPendantLight(brushedBrassMat);
      pendant.position.set(0, 4.65, chandZ);
      church.add(pendant);
    }
  }

  /**
   * Crea un Púlpito / Atril Cristiano Evangélico moderno con cuerpo de madera,
   * panel de acrílico esmerilado, Biblia abierta y micrófono de cuello de ganso
   */
  private createEvangelicalPulpit(
    woodMat: THREE.Material,
    brassMat: THREE.Material,
    paperMat: THREE.Material,
    blackMat: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();

    const base = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.46), woodMat);
    base.position.y = 0.04;
    base.receiveShadow = true;
    group.add(base);

    const centralPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.94, 0.22),
      woodMat,
    );
    centralPillar.position.y = 0.51;
    centralPillar.castShadow = true;
    group.add(centralPillar);

    const acrylicPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.52, 0.86, 0.02),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.45,
        roughness: 0.15,
      }),
    );
    acrylicPanel.position.set(0, 0.51, 0.12);
    group.add(acrylicPanel);

    // Mesa inclinada del púlpito con Biblia abierta
    const deskTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.68, 0.04, 0.48),
      woodMat,
    );
    deskTop.position.set(0, 0.98, 0.02);
    deskTop.rotation.x = 0.22;
    deskTop.castShadow = true;
    group.add(deskTop);

    // Biblia abierta sobre el púlpito
    const bibleLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.022, 0.24),
      paperMat,
    );
    bibleLeft.position.set(-0.095, 1.01, 0.02);
    bibleLeft.rotation.set(0.22, 0, -0.08);
    const bibleRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.022, 0.24),
      paperMat,
    );
    bibleRight.position.set(0.095, 1.01, 0.02);
    bibleRight.rotation.set(0.22, 0, 0.08);
    group.add(bibleLeft, bibleRight);

    // Micrófono del púlpito
    const micStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.26, 8),
      blackMat,
    );
    micStem.position.set(0.2, 1.1, -0.05);
    micStem.rotation.x = 0.35;
    group.add(micStem);

    const crossEmblem = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.24, 0.015),
      brassMat,
    );
    crossEmblem.position.set(0, 0.62, 0.135);
    const crossEmblemH = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.03, 0.015),
      brassMat,
    );
    crossEmblemH.position.set(0, 0.66, 0.135);
    group.add(crossEmblem, crossEmblemH);

    return group;
  }

  /**
   * Crea el piano / teclado de alabanza y adoración en el costado izquierdo de la plataforma
   */
  private createWorshipPiano(
    woodMat: THREE.Material,
    keysMat: THREE.Material,
    blackMat: THREE.Material,
    brassMat: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();

    // Cuerpo del piano de alabanza
    const keyboardBed = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 0.14, 0.48),
      woodMat,
    );
    keyboardBed.position.y = 0.76;
    keyboardBed.castShadow = true;
    group.add(keyboardBed);

    const whiteKeys = new THREE.Mesh(
      new THREE.BoxGeometry(1.16, 0.03, 0.16),
      keysMat,
    );
    whiteKeys.position.set(0, 0.835, 0.14);
    group.add(whiteKeys);

    const musicStand = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.24, 0.02),
      blackMat,
    );
    musicStand.position.set(0, 0.95, -0.06);
    musicStand.rotation.x = -0.25;
    group.add(musicStand);

    // Patas del piano y pedalera
    for (const lx of [-0.54, 0.54]) {
      for (const lz of [-0.18, 0.18]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.018, 0.74, 10),
          blackMat,
        );
        leg.position.set(lx, 0.37, lz);
        group.add(leg);
      }
    }

    const pedals = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.04, 0.14),
      brassMat,
    );
    pedals.position.set(0, 0.04, 0.05);
    group.add(pedals);

    // Banqueta del pianista
    const bench = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.46, 0.32),
      woodMat,
    );
    bench.position.set(0, 0.23, 0.52);
    bench.castShadow = true;
    group.add(bench);

    return group;
  }

  /**
   * Crea la guitarra acústica en su soporte y dos pedestales de micrófono para el grupo de alabanza
   */
  private createWorshipGuitarAndMics(
    spruceWoodMat: THREE.Material,
    walnutMat: THREE.Material,
    blackMat: THREE.Material,
    brassMat: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();

    // Guitarra acústica en soporte
    const guitarGroup = new THREE.Group();
    guitarGroup.position.set(0.35, 0.48, 0);
    guitarGroup.rotation.x = -0.22;
    group.add(guitarGroup);

    const lowerBout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 0.09, 24),
      spruceWoodMat,
    );
    lowerBout.rotation.x = Math.PI / 2;
    lowerBout.position.y = -0.12;
    guitarGroup.add(lowerBout);

    const upperBout = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.085, 24),
      spruceWoodMat,
    );
    upperBout.rotation.x = Math.PI / 2;
    upperBout.position.y = 0.08;
    guitarGroup.add(upperBout);

    const soundHole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.092, 20),
      walnutMat,
    );
    soundHole.rotation.x = Math.PI / 2;
    soundHole.position.y = 0.02;
    guitarGroup.add(soundHole);

    const neck = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.48, 0.025),
      walnutMat,
    );
    neck.position.set(0, 0.38, 0);
    guitarGroup.add(neck);

    // 2 Pedestales de micrófono de alabanza y adoración
    for (const mx of [-0.35, -0.82]) {
      const micStand = new THREE.Group();
      micStand.position.set(mx, 0, 0.18);
      group.add(micStand);

      const baseDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.15, 0.025, 16),
        blackMat,
      );
      baseDisc.position.y = 0.012;
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 1.32, 10),
        blackMat,
      );
      pole.position.y = 0.66;
      const boom = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.008, 0.46, 8),
        blackMat,
      );
      boom.position.set(0, 1.32, 0.12);
      boom.rotation.x = 0.65;
      const micCapsule = new THREE.Mesh(
        new THREE.SphereGeometry(0.026, 10, 10),
        brassMat,
      );
      micCapsule.position.set(0, 1.44, 0.28);
      micStand.add(baseDisc, pole, boom, micCapsule);
    }

    return group;
  }

  /**
   * Crea una banca contemporánea de iglesia en madera cálida con asiento acolchado crema y ramillete floral
   */
  private createChurchPew(
    woodMat: THREE.Material,
    cushionMat: THREE.Material,
    goldMat: THREE.Material,
    foliageMat: THREE.Material,
    flowerMat: THREE.Material,
    side: number,
  ): THREE.Group {
    const pewGroup = new THREE.Group();
    const pewWidth = 1.45;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(pewWidth, 0.06, 0.44), woodMat);
    seat.position.set(0, 0.44, 0);
    seat.castShadow = true;
    seat.receiveShadow = true;
    pewGroup.add(seat);

    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(pewWidth - 0.08, 0.045, 0.38),
      cushionMat,
    );
    cushion.position.set(0, 0.48, 0);
    pewGroup.add(cushion);

    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(pewWidth, 0.46, 0.05),
      woodMat,
    );
    backrest.position.set(0, 0.7, 0.19);
    backrest.rotation.x = 0.1;
    backrest.castShadow = true;
    pewGroup.add(backrest);

    for (const endX of [-pewWidth / 2, pewWidth / 2]) {
      const sidePanel = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.86, 0.48),
        woodMat,
      );
      sidePanel.position.set(endX, 0.43, 0);
      sidePanel.castShadow = true;
      pewGroup.add(sidePanel);
    }

    const aisleEndX = -side * (pewWidth / 2 + 0.04);
    const bouquetLeaves = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      foliageMat,
    );
    bouquetLeaves.position.set(aisleEndX, 0.72, 0);
    const bouquetFlower = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 8, 8),
      flowerMat,
    );
    bouquetFlower.position.set(aisleEndX, 0.76, -0.02);
    const ribbon = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.18, 0.02),
      goldMat,
    );
    ribbon.position.set(aisleEndX, 0.62, 0);
    pewGroup.add(bouquetLeaves, bouquetFlower, ribbon);

    return pewGroup;
  }

  /**
   * Crea una silla elegante de boda con asiento acolchado crema
   */
  private createWeddingChair(
    goldMat: THREE.Material,
    cushionMat: THREE.Material,
    isHonorChair = false,
  ): THREE.Group {
    const chair = new THREE.Group();
    const scale = isHonorChair ? 1.18 : 1.0;
    chair.scale.setScalar(scale);

    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(0.38, 0.045, 0.38),
      cushionMat,
    );
    seat.position.y = 0.44;
    seat.castShadow = true;
    chair.add(seat);

    const seatFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.03, 0.4),
      goldMat,
    );
    seatFrame.position.y = 0.415;
    chair.add(seatFrame);

    for (const lx of [-0.17, 0.17]) {
      for (const lz of [-0.17, 0.17]) {
        const leg = new THREE.Mesh(
          new THREE.CylinderGeometry(0.014, 0.012, 0.42, 8),
          goldMat,
        );
        leg.position.set(lx, 0.21, lz);
        chair.add(leg);
      }
    }

    for (const bx of [-0.17, -0.06, 0.06, 0.17]) {
      const spindle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.46, 8),
        goldMat,
      );
      spindle.position.set(bx, 0.66, -0.17);
      chair.add(spindle);
    }

    const topCrown = new THREE.Mesh(
      new THREE.TorusGeometry(0.17, 0.014, 8, 24, Math.PI),
      goldMat,
    );
    topCrown.position.set(0, 0.88, -0.17);
    chair.add(topCrown);

    return chair;
  }

  /**
   * Crea una mesa lateral decorativa en la plataforma con arreglo floral y velas cálidas
   */
  private createDecoratedCeremonialTable(
    marbleMat: THREE.Material,
    linenMat: THREE.Material,
    emeraldMat: THREE.Material,
    goldMat: THREE.Material,
    foliageMat: THREE.Material,
    creamRoseMat: THREE.Material,
    lavenderMat: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();

    const baseTable = new THREE.Mesh(
      new THREE.BoxGeometry(0.92, 0.68, 0.56),
      linenMat,
    );
    baseTable.position.y = 0.34;
    baseTable.castShadow = true;
    baseTable.receiveShadow = true;
    group.add(baseTable);

    const runner = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.69, 0.58),
      emeraldMat,
    );
    runner.position.y = 0.345;
    group.add(runner);

    const vase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.06, 0.22, 16),
      goldMat,
    );
    vase.position.set(0, 0.79, 0);
    group.add(vase);

    const foliageDome = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 12, 10),
      foliageMat,
    );
    foliageDome.scale.set(1.2, 0.75, 1.0);
    foliageDome.position.set(0, 0.94, 0);
    group.add(foliageDome);

    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * Math.PI * 2;
      const rose = new THREE.Mesh(
        new THREE.SphereGeometry(0.055, 8, 8),
        i % 2 === 0 ? creamRoseMat : lavenderMat,
      );
      rose.position.set(Math.cos(ang) * 0.11, 0.99, Math.sin(ang) * 0.09);
      group.add(rose);
    }

    for (const cx of [-0.28, 0.28]) {
      const holder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.045, 0.16, 12),
        goldMat,
      );
      holder.position.set(cx, 0.76, 0);
      const candle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.14, 10),
        marbleMat,
      );
      candle.position.set(cx, 0.9, 0);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.022, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffe494 }),
      );
      flame.scale.set(0.7, 1.4, 0.7);
      flame.position.set(cx, 0.99, 0);
      group.add(holder, candle, flame);
    }

    return group;
  }

  /**
   * Crea una mesa redonda vestida de gala con 4 sillas alrededor y centro de mesa floral para la cena
   */
  private createBanquetTableWithChairs(
    linenMat: THREE.Material,
    emeraldMat: THREE.Material,
    goldMat: THREE.Material,
    foliageMat: THREE.Material,
    creamRoseMat: THREE.Material,
    lavenderMat: THREE.Material,
  ): THREE.Group {
    const group = new THREE.Group();

    const tablecloth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.64, 0.72, 28),
      linenMat,
    );
    tablecloth.position.y = 0.36;
    tablecloth.castShadow = true;
    tablecloth.receiveShadow = true;
    group.add(tablecloth);

    const topOverlay = new THREE.Mesh(
      new THREE.CylinderGeometry(0.59, 0.59, 0.03, 28),
      emeraldMat,
    );
    topOverlay.position.y = 0.72;
    group.add(topOverlay);

    const centerpieceStand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.03, 0.08, 0.24, 12),
      goldMat,
    );
    centerpieceStand.position.y = 0.85;
    const floralBall = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 10, 10),
      foliageMat,
    );
    floralBall.position.y = 1.0;
    const topBlossom = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 8, 8),
      creamRoseMat,
    );
    topBlossom.position.y = 1.08;
    const sideBlossom = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 8, 8),
      lavenderMat,
    );
    sideBlossom.position.set(0.06, 1.03, 0.05);
    group.add(centerpieceStand, floralBall, topBlossom, sideBlossom);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const dist = 0.86;
      const chair = this.createWeddingChair(goldMat, linenMat, false);
      chair.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
      chair.rotation.y = -angle + Math.PI / 2;
      group.add(chair);
    }

    return group;
  }

  /**
   * Crea una luminaria colgante circular moderna de auditorio evangélico
   */
  private createModernPendantLight(brassMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();

    const rod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, 0.85, 8),
      brassMat,
    );
    rod.position.y = 0.42;
    group.add(rod);

    const outerHalo = new THREE.Mesh(
      new THREE.TorusGeometry(0.48, 0.022, 12, 36),
      brassMat,
    );
    outerHalo.rotation.x = Math.PI / 2;
    group.add(outerHalo);

    const innerDiffuser = new THREE.Mesh(
      new THREE.TorusGeometry(0.45, 0.016, 10, 36),
      new THREE.MeshBasicMaterial({ color: 0xffefc2 }),
    );
    innerDiffuser.rotation.x = Math.PI / 2;
    innerDiffuser.position.y = -0.015;
    group.add(innerDiffuser);

    return group;
  }

  /**
   * Ventanal arquitectónico limpio de luz clara (sin vitrales católicos)
   */
  private createClearSanctuaryWindowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#FFFDF7');
    grad.addColorStop(0.55, '#F5EFE0');
    grad.addColorStop(1, '#E1E7D9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Marco minimalista en madera cálida
    ctx.strokeStyle = '#6E492D';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 246, 502);

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(128, 0);
    ctx.lineTo(128, 512);
    ctx.moveTo(0, 256);
    ctx.lineTo(256, 256);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Construye los DOS ANILLOS DE BODA en 3D (oro 24k y diamante solitario)
   */
  private buildWeddingRingsShowcase(scene: THREE.Scene): void {
    const showcaseGroup = new THREE.Group();
    showcaseGroup.position.set(-0.46, 0.87, 0.14);
    showcaseGroup.userData = { interactionRole: 'rings' };
    scene.add(showcaseGroup);
    this.interactiveTargets.push(showcaseGroup);

    const pillowBaseMat = new THREE.MeshStandardMaterial({
      color: 0xf3efdf,
      roughness: 0.72,
      metalness: 0.02,
    });
    const goldMat24k = new THREE.MeshPhysicalMaterial({
      color: 0xf0c456,
      metalness: 0.96,
      roughness: 0.14,
      clearcoat: 0.5,
      clearcoatRoughness: 0.12,
      reflectivity: 0.95,
    });
    const roseGoldInnerMat = new THREE.MeshPhysicalMaterial({
      color: 0xe2b14e,
      metalness: 0.92,
      roughness: 0.24,
    });

    const trayPedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.27, 0.045, 40),
      goldMat24k,
    );
    trayPedestal.position.y = 0.022;
    trayPedestal.castShadow = true;
    trayPedestal.receiveShadow = true;
    showcaseGroup.add(trayPedestal);

    const velvetCushion = new THREE.Mesh(
      new THREE.SphereGeometry(0.21, 32, 24),
      pillowBaseMat,
    );
    velvetCushion.scale.set(1, 0.32, 1);
    velvetCushion.position.y = 0.055;
    velvetCushion.receiveShadow = true;
    showcaseGroup.add(velvetCushion);

    const ringsMaster = new THREE.Group();
    ringsMaster.position.set(0, 0.22, 0);
    showcaseGroup.add(ringsMaster);
    this.ringsMasterGroup = ringsMaster;

    // ANILLO 1
    const groomRing = new THREE.Group();
    const groomOuterBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.021, 32, 96),
      goldMat24k,
    );
    groomOuterBand.castShadow = true;
    const groomInnerLiner = new THREE.Mesh(
      new THREE.TorusGeometry(0.109, 0.015, 24, 72),
      roseGoldInnerMat,
    );
    groomRing.add(groomOuterBand, groomInnerLiner);
    groomRing.position.set(-0.055, 0, 0);
    groomRing.rotation.set(0.32, 0.42, -0.18);
    ringsMaster.add(groomRing);
    this.groomRingGroup = groomRing;

    // ANILLO 2 (con diamante solitario)
    const brideRing = new THREE.Group();
    const brideOuterBand = new THREE.Mesh(
      new THREE.TorusGeometry(0.108, 0.017, 32, 96),
      goldMat24k,
    );
    brideOuterBand.castShadow = true;
    brideRing.add(brideOuterBand);

    const settingGroup = new THREE.Group();
    settingGroup.position.set(0, 0.118, 0);
    brideRing.add(settingGroup);

    const crownBasket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.014, 0.026, 16),
      goldMat24k,
    );
    crownBasket.position.y = 0.008;
    settingGroup.add(crownBasket);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const prong = new THREE.Mesh(
        new THREE.CylinderGeometry(0.0038, 0.003, 0.036, 8),
        goldMat24k,
      );
      prong.position.set(Math.cos(angle) * 0.024, 0.018, Math.sin(angle) * 0.024);
      prong.rotation.z = -Math.cos(angle) * 0.22;
      prong.rotation.x = Math.sin(angle) * 0.22;
      settingGroup.add(prong);
    }

    const diamondGeo = new THREE.OctahedronGeometry(0.032, 2);
    diamondGeo.scale(1, 0.78, 1);
    const diamondMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.05,
      roughness: 0.02,
      transmission: 0.94,
      ior: 2.417,
      thickness: 0.8,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
      reflectivity: 1.0,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 0.026;
    diamond.castShadow = true;
    settingGroup.add(diamond);
    this.diamondMesh = diamond;

    brideRing.position.set(0.055, 0.01, 0.02);
    brideRing.rotation.set(-0.28, -0.45, 0.24);
    ringsMaster.add(brideRing);
    this.brideRingGroup = brideRing;
  }

  /**
   * Construye la CARTA 3D en papel mate verde #0F2A24 (sin brillo excesivo y sin líneas doradas
   * en el papel), con sello de cera dorado 3D en el centro y tarjeta interior que dice "¡Te esperamos!".
   */
  private buildDecorative3DLetter(scene: THREE.Scene): void {
    const assembly = new THREE.Group();
    assembly.position.set(0.24, 1.08, 0.02);
    assembly.rotation.x = -0.18;
    assembly.rotation.y = -0.12;
    assembly.userData = { interactionRole: 'letter' };
    scene.add(assembly);
    this.envelopeAssemblyGroup = assembly;
    this.interactiveTargets.push(assembly);

    const envWidth = 0.88;
    const envHeight = 0.58;

    // Papel mate de algodón #0F2A24 con roughness 0.92 y metalness 0.0 para CERO reflejos molestos
    const emeraldPaperMat = new THREE.MeshStandardMaterial({
      color: 0x0f2a24,
      roughness: 0.92,
      metalness: 0.0,
      envMapIntensity: 0.08,
      side: THREE.DoubleSide,
    });
    const creamEdgePaperMat = new THREE.MeshStandardMaterial({
      color: 0xf3efdf,
      roughness: 0.92,
      metalness: 0.0,
      envMapIntensity: 0.08,
    });
    const waxSealGoldMat = new THREE.MeshStandardMaterial({
      color: 0xd4ad42,
      metalness: 0.55,
      roughness: 0.36,
      envMapIntensity: 0.45,
      side: THREE.DoubleSide,
    });
    const woodStandMat = new THREE.MeshStandardMaterial({
      color: 0x5c3c24,
      roughness: 0.65,
      metalness: 0.05,
    });

    // Atril de madera discreto que sostiene la carta sobre el altar
    const standGroup = new THREE.Group();
    standGroup.position.set(0, -0.16, -0.08);
    assembly.add(standGroup);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.01, 0.012, 0.45, 12),
        woodStandMat,
      );
      leg.position.set(side * 0.28, 0, -0.06);
      leg.rotation.x = 0.35;
      standGroup.add(leg);
    }

    // 1. Cuerpo posterior del sobre #0F2A24
    const backEnvelopeTex = this.createEnvelopeFrontTexture();
    this.createdTextures.push(backEnvelopeTex);

    const backPlate = new THREE.Mesh(
      new THREE.BoxGeometry(envWidth, envHeight, 0.016),
      emeraldPaperMat,
    );
    backPlate.castShadow = true;
    backPlate.receiveShadow = true;
    assembly.add(backPlate);

    // 2. Bolsillo frontal en papel mate #0F2A24 (sin líneas doradas ni brillos)
    const frontPocketMat = new THREE.MeshStandardMaterial({
      map: backEnvelopeTex,
      roughness: 0.92,
      metalness: 0.0,
      envMapIntensity: 0.08,
    });
    this.frontPocketMat = frontPocketMat;

    const frontPocketPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(envWidth, envHeight),
      frontPocketMat,
    );
    frontPocketPlane.position.z = 0.022;
    frontPocketPlane.castShadow = true;
    assembly.add(frontPocketPlane);

    // 3. Solapa triangular superior articulada en 3D (limpia en #0F2A24 mate, sin tiras doradas)
    const flapHinge = new THREE.Group();
    flapHinge.position.set(0, envHeight / 2, 0.024);
    assembly.add(flapHinge);
    this.topFlapHingeGroup = flapHinge;

    const flapShape = new THREE.Shape();
    flapShape.moveTo(-envWidth / 2, 0);
    flapShape.lineTo(envWidth / 2, 0);
    flapShape.quadraticCurveTo(0.05, -envHeight * 0.56, 0, -envHeight * 0.58);
    flapShape.quadraticCurveTo(-0.05, -envHeight * 0.56, -envWidth / 2, 0);

    const flapGeo = new THREE.ExtrudeGeometry(flapShape, {
      depth: 0.006,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
    });
    const flapMesh = new THREE.Mesh(flapGeo, emeraldPaperMat);
    flapMesh.castShadow = true;
    flapHinge.add(flapMesh);

    // 4. Sello de cera DORADO 3D en el centro del sobre
    const sealGroup = new THREE.Group();
    sealGroup.position.set(0, -0.03, 0.036);
    assembly.add(sealGroup);
    this.waxSealGroup = sealGroup;

    const sealOuterDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.088, 0.094, 0.016, 36),
      waxSealGoldMat,
    );
    sealOuterDisc.rotation.x = Math.PI / 2;
    sealOuterDisc.castShadow = true;
    sealGroup.add(sealOuterDisc);

    const sealRimTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.009, 16, 36),
      waxSealGoldMat,
    );
    sealRimTorus.position.z = 0.008;
    sealGroup.add(sealRimTorus);

    // 5. LA CARTA DÍPTICA EN PAPEL MATE QUE SALE Y SE ABRE MOSTRANDO "¡TE ESPERAMOS!"
    const risingCard = new THREE.Group();
    risingCard.position.set(0, 0, 0.01);
    risingCard.scale.setScalar(0.88);
    assembly.add(risingCard);
    this.risingCardGroup = risingCard;

    const cardWidth = 0.82;
    const cardHeight = 0.54;

    const insideRightTex = this.createLetterInsideMainTexture();
    this.createdTextures.push(insideRightTex);

    const insideCardMat = new THREE.MeshStandardMaterial({
      map: insideRightTex,
      roughness: 0.94,
      metalness: 0.0,
      envMapIntensity: 0.06,
    });
    this.insideCardMat = insideCardMat;

    const mainCardPanel = new THREE.Mesh(
      new THREE.BoxGeometry(cardWidth, cardHeight, 0.008),
      [
        creamEdgePaperMat,
        creamEdgePaperMat,
        creamEdgePaperMat,
        creamEdgePaperMat,
        insideCardMat,
        emeraldPaperMat,
      ],
    );
    mainCardPanel.castShadow = true;
    risingCard.add(mainCardPanel);

    // Portada abatible izquierda de la tarjeta (papel mate sin reflejos)
    const leftCoverHinge = new THREE.Group();
    leftCoverHinge.position.set(-cardWidth / 2, 0, 0.005);
    risingCard.add(leftCoverHinge);
    this.cardLeftCoverHinge = leftCoverHinge;

    const coverFrontTex = this.createLetterCoverFrontTexture();
    const coverInsideLeftTex = this.createLetterInsideLeftTexture();
    this.createdTextures.push(coverFrontTex, coverInsideLeftTex);

    const coverFrontMat = new THREE.MeshStandardMaterial({
      map: coverFrontTex,
      roughness: 0.94,
      metalness: 0.0,
      envMapIntensity: 0.06,
    });
    this.coverFrontMat = coverFrontMat;

    const coverInsideMat = new THREE.MeshStandardMaterial({
      map: coverInsideLeftTex,
      roughness: 0.94,
      metalness: 0.0,
      envMapIntensity: 0.06,
    });
    this.coverInsideMat = coverInsideMat;

    const foldableCoverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(cardWidth, cardHeight, 0.006),
      [
        creamEdgePaperMat,
        creamEdgePaperMat,
        creamEdgePaperMat,
        creamEdgePaperMat,
        coverFrontMat,
        coverInsideMat,
      ],
    );
    foldableCoverMesh.position.set(cardWidth / 2, 0, 0);
    foldableCoverMesh.castShadow = true;
    leftCoverHinge.add(foldableCoverMesh);
  }

  private rebuildLetterTextures(): void {
    if (!this.risingCardGroup) return;
    if (this.frontPocketMat) {
      const tex = this.createEnvelopeFrontTexture();
      this.createdTextures.push(tex);
      this.frontPocketMat.map = tex;
      this.frontPocketMat.needsUpdate = true;
    }
    if (this.coverFrontMat) {
      const tex = this.createLetterCoverFrontTexture();
      this.createdTextures.push(tex);
      this.coverFrontMat.map = tex;
      this.coverFrontMat.needsUpdate = true;
    }
    if (this.coverInsideMat) {
      const tex = this.createLetterInsideLeftTexture();
      this.createdTextures.push(tex);
      this.coverInsideMat.map = tex;
      this.coverInsideMat.needsUpdate = true;
    }
    if (this.insideCardMat) {
      const tex = this.createLetterInsideMainTexture();
      this.createdTextures.push(tex);
      this.insideCardMat.map = tex;
      this.insideCardMat.needsUpdate = true;
    }
  }

  /**
   * Textura mate para el frente del sobre #0F2A24 con pliegues sutiles naturales (sin líneas doradas)
   */
  private createEnvelopeFrontTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(512, 340, 60, 512, 340, 600);
    grad.addColorStop(0, '#14382F');
    grad.addColorStop(0.7, '#0F2A24');
    grad.addColorStop(1, '#091B17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 680);

    // Pliegues naturales del papel del bolsillo (sin líneas doradas)
    ctx.beginPath();
    ctx.moveTo(0, 680);
    ctx.lineTo(512, 336);
    ctx.lineTo(1024, 680);
    ctx.strokeStyle = 'rgba(250, 247, 239, 0.12)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FAF7EF';
    ctx.font = 'italic 500 42px "Cormorant Garamond", Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('Una invitación muy especial', 512, 575);

    ctx.fillStyle = '#E1E7D9';
    ctx.font = '600 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('TOCA LA CARTA PARA ABRIRLA', 512, 622);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (this.renderer) {
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }
    return tex;
  }

  /**
   * Portada exterior limpia de la tarjeta (sin bordes ni líneas doradas)
   */
  private createLetterCoverFrontTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0F2A24';
    ctx.fillRect(0, 0, 1024, 680);

    ctx.fillStyle = '#E1E7D9';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NUESTRA BODA', 512, 195);

    ctx.fillStyle = '#FAF7EF';
    ctx.font = '400 108px "Great Vibes", Georgia, serif';
    ctx.fillText(this.config.couple.displayTitle, 512, 355);

    ctx.font = 'italic 42px "Cormorant Garamond", Georgia, serif';
    ctx.fillStyle = '#E1E7D9';
    ctx.fillText(this.config.date.displayDate, 512, 465);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (this.renderer) {
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }
    return tex;
  }

  /**
   * Hoja izquierda abierta de la tarjeta en verde profundo #0F2A24 mate (sin líneas doradas)
   */
  private createLetterInsideLeftTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    const ctx = canvas.getContext('2d')!;

    ctx.translate(1024, 0);
    ctx.scale(-1, 1);

    const grad = ctx.createRadialGradient(512, 340, 40, 512, 340, 580);
    grad.addColorStop(0, '#163B32');
    grad.addColorStop(0.75, '#0F2A24');
    grad.addColorStop(1, '#091A16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 680);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#E1E7D9';
    ctx.font = '600 23px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('CON EL CORAZÓN LLENO DE AMOR', 512, 138);

    ctx.fillStyle = '#FAF7EF';
    ctx.font = 'italic 44px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('¡Nos casamos!', 512, 208);

    ctx.fillStyle = '#FAF7EF';
    ctx.font = '400 96px "Great Vibes", Georgia, serif';
    ctx.fillText(this.config.couple.displayTitle, 512, 332);

    ctx.fillStyle = '#E1E7D9';
    ctx.font = '600 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(this.config.couple.fullNamesDisplay, 512, 405);

    const formattedTime = formatWeddingTime(this.config);
    const venue = formatVenueDisplay(this.config);

    ctx.fillStyle = '#FAF7EF';
    ctx.font = '600 32px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`${this.config.date.displayDate}  ·  ${formattedTime}`, 512, 495);

    ctx.fillStyle = '#E2D8E8';
    ctx.font = 'italic 30px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(`${venue.primaryTitle} — ${venue.secondaryDetail}`, 512, 552);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (this.renderer) {
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }
    return tex;
  }

  /**
   * Hoja principal derecha de la carta 3D en papel crema cálido mate (#F3EFDF)
   * sin líneas doradas y sin brillo excesivo, destacando "¡Te esperamos!"
   */
  private createLetterInsideMainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 680;
    const ctx = canvas.getContext('2d')!;

    // Papel crema cálido mate (#F3EFDF / #FAF7EF) suave a la vista para que nunca deslumbre
    const bgGrad = ctx.createRadialGradient(512, 340, 50, 512, 340, 600);
    bgGrad.addColorStop(0, '#FAF7EF');
    bgGrad.addColorStop(0.75, '#F3EFDF');
    bgGrad.addColorStop(1, '#E8E2CE');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 680);

    // Marco limpio en verde profundo #0F2A24 (sin líneas doradas)
    ctx.strokeStyle = '#0F2A24';
    ctx.lineWidth = 14;
    ctx.strokeRect(22, 22, 980, 636);

    ctx.textAlign = 'center';

    ctx.fillStyle = '#4B6049';
    ctx.font = '700 28px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('B & L', 512, 128);

    ctx.fillStyle = '#766580';
    ctx.font = '600 21px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('HAY MOMENTOS QUE MERECEN COMPARTIRSE CONTIGO', 512, 182);

    // Mensaje principal solicitado: "¡Te esperamos!"
    ctx.fillStyle = '#0F2A24';
    ctx.font = '400 124px "Great Vibes", Georgia, serif';
    ctx.fillText('¡Te esperamos!', 512, 334);

    ctx.fillStyle = '#394634';
    ctx.font = 'italic 36px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(
      'Tu presencia hará aún más especial nuestra ceremonia y adoración.',
      512,
      424,
    );

    ctx.fillStyle = '#0F2A24';
    ctx.font = '700 34px "Cormorant Garamond", Georgia, serif';
    ctx.fillText(this.config.couple.fullNamesDisplay, 512, 502);

    ctx.fillStyle = '#766580';
    ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `${this.config.date.displayDate.toUpperCase()}  ·  INICIO: 5:00 PM`,
      512,
      552,
    );

    ctx.fillStyle = '#4B6049';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'LLEGADA DE INVITADOS: 5:00 PM  ·  ENTRADA DE LOS NOVIOS: 6:00 PM',
      512,
      594,
    );

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    if (this.renderer) {
      tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }
    return tex;
  }

  private buildFloatingFireflies(scene: THREE.Scene): void {
    const count = 42;
    const geo = new THREE.SphereGeometry(0.016, 8, 8);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffe9a6,
      transparent: true,
      opacity: 0.72,
    });
    const inst = new THREE.InstancedMesh(geo, mat, count);
    inst.frustumCulled = false;

    this.firefliesData = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = 1.3 + (i % 7) * 0.45;
      const data: FireflyData = {
        baseX: Math.cos(angle) * dist,
        baseY: 0.35 + (i % 5) * 0.48,
        baseZ: Math.sin(angle) * dist,
        speed: 0.5 + (i % 4) * 0.25,
        phase: i * 0.7,
        radius: 0.08 + (i % 3) * 0.05,
      };
      this.firefliesData.push(data);

      _dummyPos.set(data.baseX, data.baseY, data.baseZ);
      _dummyQuat.identity();
      _dummyScale.setScalar(0.7 + (i % 3) * 0.3);
      _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
      inst.setMatrixAt(i, _dummyMatrix);
    }
    inst.computeBoundingSphere();
    scene.add(inst);
    this.firefliesInstanced = inst;
  }

  private applyEnvironmentPreset(preset: SanctuaryEnvironmentPreset): void {
    this.envPreset = preset;
    if (!this.scene || !this.skyDomeMat || !this.keyLight || !this.hemiLight) {
      return;
    }

    if (preset === 'sunset-sea') {
      // Luz Cálida de Ceremonia Evangélica (sin deslumbrar la carta)
      this.skyDomeMat.uniforms.uTopColor.value.setHex(0x162824);
      this.skyDomeMat.uniforms.uMidColor.value.setHex(0x4e665c);
      this.skyDomeMat.uniforms.uHorizonColor.value.setHex(0xebb982);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x23302b);
      this.keyLight.color.setHex(0xfff2d6);
      this.keyLight.intensity = 1.65;
      this.hemiLight.color.setHex(0xfaf5eb);
      this.hemiLight.groundColor.setHex(0x26332c);
      if (this.pointLightWarm) this.pointLightWarm.intensity = 1.05;
      if (this.naveLightWarm) this.naveLightWarm.intensity = 1.65;
    } else if (preset === 'starlight-garden') {
      // Noche de Adoración y Alabanza
      this.skyDomeMat.uniforms.uTopColor.value.setHex(0x061014);
      this.skyDomeMat.uniforms.uMidColor.value.setHex(0x0f2a24);
      this.skyDomeMat.uniforms.uHorizonColor.value.setHex(0x27493f);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x0f211d);
      this.keyLight.color.setHex(0xffdf9e);
      this.keyLight.intensity = 1.25;
      this.hemiLight.color.setHex(0xffe4b5);
      this.hemiLight.groundColor.setHex(0x14221d);
      if (this.pointLightWarm) this.pointLightWarm.intensity = 1.15;
      if (this.naveLightWarm) this.naveLightWarm.intensity = 2.0;
    } else {
      // Luz Suave Lavanda y Crema
      this.skyDomeMat.uniforms.uTopColor.value.setHex(0x241d2e);
      this.skyDomeMat.uniforms.uMidColor.value.setHex(0x6d5b7b);
      this.skyDomeMat.uniforms.uHorizonColor.value.setHex(0xe2d8e8);
      (this.scene.fog as THREE.FogExp2).color.setHex(0x332a3b);
      this.keyLight.color.setHex(0xfff3df);
      this.keyLight.intensity = 1.55;
      this.hemiLight.color.setHex(0xf3eaf7);
      this.hemiLight.groundColor.setHex(0x232d25);
      if (this.pointLightWarm) this.pointLightWarm.intensity = 1.0;
      if (this.naveLightWarm) this.naveLightWarm.intensity = 1.65;
    }
  }

  private updateFrame(): void {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsed = this.clock.getElapsedTime();

    // 1. Interpolación bien lenta y elegante de la apertura de la carta 3D
    const targetProgress = this.isLetterOpen ? 1 : 0;
    this.letterOpenProgress = THREE.MathUtils.damp(
      this.letterOpenProgress,
      targetProgress,
      1.15,
      dt,
    );

    const p = this.letterOpenProgress;

    // 1A. Sello de cera dorado
    if (this.waxSealGroup) {
      const sealP = Math.min(1, p * 2.5);
      this.waxSealGroup.position.z = 0.036 + sealP * 0.12;
      this.waxSealGroup.position.y = -0.03 - sealP * 0.18;
      this.waxSealGroup.rotation.z = -sealP * 0.4;
      const sealScale = Math.max(0.001, 1 - sealP);
      this.waxSealGroup.scale.setScalar(sealScale);
      this.waxSealGroup.visible = sealP < 0.98;
    }

    // 1B. Solapa triangular superior #0F2A24
    if (this.topFlapHingeGroup) {
      const flapP = Math.max(0, Math.min(1, (p - 0.08) / 0.42));
      this.topFlapHingeGroup.rotation.x = -flapP * Math.PI * 0.96;
    }

    // 1C. La tarjeta sale del sobre y abre su portada en díptico mostrando "¡Te esperamos!"
    if (this.risingCardGroup && this.cardLeftCoverHinge) {
      const slideP = Math.max(0, Math.min(1, (p - 0.25) / 0.5));
      const unfoldP = Math.max(0, Math.min(1, (p - 0.52) / 0.48));

      const archLift = Math.sin(slideP * Math.PI) * 0.34;
      this.risingCardGroup.position.y = archLift + unfoldP * 0.18;
      this.risingCardGroup.position.z = 0.01 + slideP * 0.16 + unfoldP * 0.08;
      this.risingCardGroup.position.x = unfoldP * 0.34;

      const cardScale = 0.88 + slideP * 0.14 + unfoldP * 0.12;
      this.risingCardGroup.scale.setScalar(cardScale);

      this.cardLeftCoverHinge.rotation.y = -unfoldP * Math.PI * 0.88;
    }

    // 2. Animación de los DOS ANILLOS DE BODA
    if (this.ringsMasterGroup && this.groomRingGroup && this.brideRingGroup) {
      const hoverLift = Math.sin(elapsed * 1.8) * 0.025 + p * 0.05;
      this.ringsMasterGroup.position.y = 0.22 + hoverLift;
      this.ringsMasterGroup.rotation.y = elapsed * 0.55;

      this.groomRingGroup.rotation.z = -0.18 + Math.sin(elapsed * 1.2) * 0.08;
      this.brideRingGroup.rotation.z = 0.24 - Math.sin(elapsed * 1.2) * 0.08;

      if (this.diamondMesh) {
        this.diamondMesh.rotation.y = elapsed * 1.4;
      }
    }

    // 3. Destellos flotando suavemente en el santuario
    if (this.firefliesInstanced) {
      for (let i = 0; i < this.firefliesData.length; i++) {
        const d = this.firefliesData[i];
        _dummyPos.set(
          d.baseX + Math.cos(elapsed * d.speed + d.phase) * d.radius,
          d.baseY + Math.sin(elapsed * d.speed * 1.3 + d.phase) * 0.12,
          d.baseZ + Math.sin(elapsed * d.speed + d.phase) * d.radius,
        );
        _dummyQuat.identity();
        const pulseScale = 0.65 + Math.sin(elapsed * 2.5 + d.phase) * 0.35;
        _dummyScale.setScalar(pulseScale);
        _dummyMatrix.compose(_dummyPos, _dummyQuat, _dummyScale);
        this.firefliesInstanced.setMatrixAt(i, _dummyMatrix);
      }
      this.firefliesInstanced.instanceMatrix.needsUpdate = true;
    }

    // 4. Transición suave de la cámara
    if (this.camera && this.controls) {
      if (this.cameraMode === 'letter') {
        _camTargetPos.set(0.22, 1.38, 1.85);
        _lookAtTarget.set(0.22, 1.15, 0.08);
      } else if (this.cameraMode === 'rings') {
        _camTargetPos.set(-0.46, 1.32, 1.42);
        _lookAtTarget.set(-0.46, 1.08, 0.14);
      } else if (this.cameraMode === 'church') {
        _camTargetPos.set(0, 2.35, 6.2);
        _lookAtTarget.set(0, 1.15, 1.2);
      } else {
        _camTargetPos.set(0, 1.88, 3.75);
        _lookAtTarget.set(0, 1.05, 0);
      }

      this.controls.target.lerp(_lookAtTarget, 1 - Math.exp(-3.5 * dt));
      this.controls.update();
    }
  }

  private disposeThreeScene(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('keydown', this.handleKeyDown);

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.controls?.dispose();
    this.controls = null;

    for (const tex of this.createdTextures) {
      tex.dispose();
    }
    this.createdTextures = [];
    this.interactiveTargets = [];
    this.frontPocketMat = null;
    this.insideCardMat = null;
    this.coverFrontMat = null;
    this.coverInsideMat = null;

    if (this.scene) {
      this.scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      this.scene = null;
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
      this.renderer = null;
    }
  }
}
