import { CountdownResult, WeddingConfig } from '../types';
import { renderCornerBotanicalSvg } from './BotanicalDecor';
import { renderCoverCountdownMarkup } from './Countdown';

export interface EnvelopeCoverCallbacks {
  onOpenComplete: () => void;
}

export class EnvelopeCover {
  private container: HTMLElement;
  private config: WeddingConfig;
  private countdown: CountdownResult;
  private callbacks: EnvelopeCoverCallbacks;
  private isOpening = false;
  private isOpened = false;
  private rafId: number | null = null;
  private revealTriggered = false;

  constructor(
    container: HTMLElement,
    config: WeddingConfig,
    countdown: CountdownResult,
    callbacks: EnvelopeCoverCallbacks,
  ) {
    this.container = container;
    this.config = config;
    this.countdown = countdown;
    this.callbacks = callbacks;
  }

  /**
   * Renderiza el sello de lacre dorado realista en 3D en el centro del sobre.
   */
  private renderRealisticGoldWaxSeal(): string {
    return `<div class="wax-seal" id="wax-seal" aria-hidden="true">
      <div class="wax-seal__pedestal-shadow" id="wax-seal-shadow"></div>
      <div class="wax-seal__glow-ring" id="wax-seal-glow"></div>
      <img class="wax-seal__image" src="/images/sello-dorado-lb.png" alt="" width="1280" height="1280" decoding="async" fetchpriority="high" draggable="false">
    </div>`;
  }

  public render(): void {
    this.stopAnimation();
    this.isOpening = false;
    this.isOpened = false;
    this.revealTriggered = false;

    this.container.innerHTML = `
      <section
        id="envelope-cover"
        class="envelope-cover"
        aria-label="Portada de la invitación de boda de ${this.config.couple.displayTitle}"
      >
        <div class="envelope-cover__botanicals" aria-hidden="true">
          ${renderCornerBotanicalSvg('top-left')}
          ${renderCornerBotanicalSvg('top-right')}
          ${renderCornerBotanicalSvg('bottom-left')}
          ${renderCornerBotanicalSvg('bottom-right')}
        </div>

        <div class="envelope-cover__inner">
          <header class="envelope-cover__header" id="envelope-cover-header">
            <p class="envelope-cover__kicker">CON AMOR, PARA TI</p>
            <h1 class="envelope-cover__couple-names">${this.config.couple.displayTitle}</h1>
            <p class="envelope-cover__subtitle">Hay momentos que merecen compartirse contigo.</p>
          </header>

          <div class="envelope-stage-wrapper">
            <button
              type="button"
              id="envelope-trigger-btn"
              class="envelope-interactive-btn"
              aria-label="Una invitación muy especial de ${this.config.couple.displayTitle}. Toca el sello dorado o el sobre para abrir la carta"
            >
              <div class="envelope-3d" id="envelope-3d">
                <!-- Sombra suave bajo el sobre #0F2A24 -->
                <div class="envelope-shadow" id="envelope-shadow" aria-hidden="true"></div>

                <!-- 1. Interior abierto del sobre en tono crema suave sin líneas doradas -->
                <div class="envelope-back" id="envelope-back" aria-hidden="true">
                  <div class="envelope-back__soft-liner"></div>
                </div>

                <!-- 2. Solapa superior cuando ya pasó de 90° a 180° (abierta hacia arriba, limpia sin líneas doradas) -->
                <svg
                  id="envelope-flap-open-svg"
                  class="envelope-flap-svg envelope-flap-svg--open"
                  viewBox="0 0 560 360"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="openFlapEmeraldGrad" x1="50%" y1="100%" x2="50%" y2="0%">
                      <stop offset="0%" stop-color="#0F2A24" />
                      <stop offset="60%" stop-color="#153830" />
                      <stop offset="100%" stop-color="#0A1D18" />
                    </linearGradient>
                    <linearGradient id="openFlapSoftLiner" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stop-color="#FAF7EF" />
                      <stop offset="65%" stop-color="#F3EFDF" />
                      <stop offset="100%" stop-color="#E5E1D0" />
                    </linearGradient>
                  </defs>
                  <path
                    id="open-flap-outer-path"
                    d="M 0,4 L 560,4 L 298,0 Q 280,-2 262,0 Z"
                    fill="url(#openFlapEmeraldGrad)"
                  />
                  <path
                    id="open-flap-liner-path"
                    d="M 20,4 L 540,4 L 294,0 Q 280,-2 266,0 Z"
                    fill="url(#openFlapSoftLiner)"
                  />
                </svg>

                <!-- 3. Página interior que sale del sobre (limpia, sin líneas ni bordes dorados) -->
                <div class="envelope-letter" id="envelope-letter" aria-hidden="true">
                  <div class="envelope-letter__card-surface" id="envelope-letter-surface">
                    <div class="envelope-letter__content">
                      <span class="envelope-letter__kicker">CON EL CORAZÓN LLENO DE AMOR</span>
                      <span class="envelope-letter__married">¡Nos casamos!</span>
                      <span class="envelope-letter__names">${this.config.couple.displayTitle}</span>
                      <span class="envelope-letter__fullnames">${this.config.couple.fullNamesDisplay}</span>
                      <span class="envelope-letter__date">${this.config.date.displayDate} · ${this.config.time.hour} ${this.config.time.meridiem}</span>
                    </div>
                  </div>
                </div>

                <!-- 4. Bolsillo frontal del sobre en color verde #0F2A24 limpio (sin líneas doradas) -->
                <div class="envelope-pocket" id="envelope-pocket" aria-hidden="true">
                  <svg
                    class="envelope-pocket__svg"
                    viewBox="0 0 560 360"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="flapLeftGreen" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#173D34" />
                        <stop offset="55%" stop-color="#0F2A24" />
                        <stop offset="100%" stop-color="#091B17" />
                      </linearGradient>
                      <linearGradient id="flapRightGreen" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#153931" />
                        <stop offset="55%" stop-color="#0F2A24" />
                        <stop offset="100%" stop-color="#081915" />
                      </linearGradient>
                      <linearGradient id="flapBottomGreen" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stop-color="#194238" />
                        <stop offset="42%" stop-color="#0F2A24" />
                        <stop offset="100%" stop-color="#091C17" />
                      </linearGradient>
                    </defs>

                    <!-- Sombras naturales de volumen entre pliegues -->
                    <polygon points="0,0 286,196 0,360" fill="rgba(0,0,0,0.38)" />
                    <polygon points="560,0 274,196 560,360" fill="rgba(0,0,0,0.38)" />

                    <!-- Solapa izquierda #0F2A24 -->
                    <polygon
                      points="0,0 280,196 0,360"
                      fill="url(#flapLeftGreen)"
                    />

                    <!-- Solapa derecha #0F2A24 -->
                    <polygon
                      points="560,0 280,196 560,360"
                      fill="url(#flapRightGreen)"
                    />

                    <!-- Sombra proyectada por la solapa inferior -->
                    <polygon points="0,360 280,156 560,360" fill="rgba(0,0,0,0.44)" />

                    <!-- Solapa inferior #0F2A24 -->
                    <polygon
                      points="0,360 280,166 560,360"
                      fill="url(#flapBottomGreen)"
                    />
                  </svg>

                  <!-- Texto sobre el frente del sobre #0F2A24 -->
                  <div class="envelope-front-inscription">
                    <span class="envelope-front-text">Una invitación muy especial</span>
                  </div>
                </div>

                <!-- 5. Solapa superior cerrada #0F2A24 (limpia, sin líneas doradas) -->
                <svg
                  id="envelope-flap-closed-svg"
                  class="envelope-flap-svg envelope-flap-svg--closed"
                  viewBox="0 0 560 360"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="closedFlapEmeraldGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                      <stop offset="0%" stop-color="#1A453B" />
                      <stop offset="55%" stop-color="#0F2A24" />
                      <stop offset="100%" stop-color="#091B17" />
                    </linearGradient>
                    <pattern id="closedFlapPaperPattern" patternUnits="userSpaceOnUse" width="560" height="360">
                      <rect width="560" height="360" fill="url(#closedFlapEmeraldGrad)" />
                      <image href="/images/sobre-grabado.svg" width="280" height="240" opacity=".13" />
                      <image href="/images/sobre-grabado.svg" x="280" width="280" height="240" opacity=".13" />
                      <image href="/images/sobre-grabado.svg" y="240" width="280" height="240" opacity=".13" />
                      <image href="/images/sobre-grabado.svg" x="280" y="240" width="280" height="240" opacity=".13" />
                    </pattern>
                  </defs>
                  <path
                    id="closed-flap-shadow-path"
                    d="M 0,2 L 560,2 L 302,212 Q 280,228 258,212 Z"
                    fill="rgba(0, 0, 0, 0.45)"
                  />
                  <path
                    id="closed-flap-outer-path"
                    d="M 0,0 L 560,0 L 300,198 Q 280,214 260,198 Z"
                    fill="url(#closedFlapPaperPattern)"
                  />
                </svg>

                <!-- 6. Sello de cera DORADO realista en 3D con iniciales L & B -->
                ${this.renderRealisticGoldWaxSeal()}
              </div>

              <span class="envelope-prompt" id="envelope-prompt">
                Toca el sello para abrir
              </span>
            </button>
          </div>

          <footer class="envelope-cover__footer" id="envelope-cover-countdown">
            ${renderCoverCountdownMarkup(this.config, this.countdown)}
          </footer>
        </div>
      </section>
    `;

    const triggerBtn = this.container.querySelector<HTMLButtonElement>('#envelope-trigger-btn');
    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => this.triggerOpenSequence());
    }
  }

  public updateCountdown(countdown: CountdownResult): void {
    this.countdown = countdown;
    const footerEl = this.container.querySelector<HTMLElement>('#envelope-cover-countdown');
    if (footerEl) {
      footerEl.innerHTML = renderCoverCountdownMarkup(this.config, this.countdown);
    }
  }

  public updateConfig(config: WeddingConfig, countdown: CountdownResult): void {
    this.config = config;
    this.countdown = countdown;
    if (!this.isOpening && !this.isOpened) {
      this.render();
    }
  }

  public triggerOpenSequence(): void {
    if (this.isOpening || this.isOpened) {
      return;
    }
    this.isOpening = true;

    const coverEl = this.container.querySelector<HTMLElement>('#envelope-cover');
    const headerEl = this.container.querySelector<HTMLElement>('#envelope-cover-header');
    const footerEl = this.container.querySelector<HTMLElement>('#envelope-cover-countdown');
    const triggerBtn = this.container.querySelector<HTMLButtonElement>('#envelope-trigger-btn');
    const envelope3d = this.container.querySelector<HTMLElement>('#envelope-3d');
    const waxSeal = this.container.querySelector<HTMLElement>('#wax-seal');
    const waxSealGlow = this.container.querySelector<HTMLElement>('#wax-seal-glow');
    const promptEl = this.container.querySelector<HTMLElement>('#envelope-prompt');

    const closedFlapSvg = this.container.querySelector<SVGElement>('#envelope-flap-closed-svg');
    const closedShadowPath = this.container.querySelector<SVGPathElement>('#closed-flap-shadow-path');
    const closedOuterPath = this.container.querySelector<SVGPathElement>('#closed-flap-outer-path');

    const openFlapSvg = this.container.querySelector<SVGElement>('#envelope-flap-open-svg');
    const openOuterPath = this.container.querySelector<SVGPathElement>('#open-flap-outer-path');
    const openLinerPath = this.container.querySelector<SVGPathElement>('#open-flap-liner-path');

    const letterEl = this.container.querySelector<HTMLElement>('#envelope-letter');
    const pocketEl = this.container.querySelector<HTMLElement>('#envelope-pocket');
    const backEl = this.container.querySelector<HTMLElement>('#envelope-back');

    if (!coverEl || !envelope3d || !waxSeal || !letterEl) return;

    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.setAttribute('aria-busy', 'true');
    }

    if (promptEl) {
      promptEl.textContent = 'Abriendo tu invitación lentamente…';
    }

    const startTime = performance.now();
    // Fases lentas y elegantes:
    // 0 -> 5200 ms: Apertura lenta del sello, solapa y salida de la página
    // 5200 -> 8800 ms (3.6 segundos): Al abrirse toda, la carta se queda bien lenta en primer plano para apreciarla
    // 8800 -> 10400 ms (1.6 segundos): Transición suave hacia la invitación completa
    const fullOpenReachedMs = 5200;
    const holdSlowEndMs = 8800;
    const revealDuration = 1600;
    const totalDuration = holdSlowEndMs + revealDuration;

    const easeInOutCubic = (x: number): number =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

    const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3);

    const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

    const stepFrame = (now: number) => {
      const elapsed = now - startTime;

      // 1. Sello dorado se desprende suavemente (0 -> 1150 ms)
      const sealProgress = clamp01(elapsed / 1150);
      const sealEase = easeInOutCubic(sealProgress);
      const sealScale = 1 + Math.sin(sealProgress * Math.PI) * 0.16;
      const sealLiftY = -50 - sealEase * 22;
      waxSeal.style.opacity = String(1 - sealEase);
      waxSeal.style.transform = `translate(-50%, ${sealLiftY.toFixed(1)}%) scale(${sealScale.toFixed(3)}) rotate(${(sealEase * -12).toFixed(1)}deg)`;

      if (waxSealGlow) {
        const glowOpacity = Math.sin(sealProgress * Math.PI) * 0.95;
        waxSealGlow.style.opacity = String(glowOpacity);
        waxSealGlow.style.transform = `scale(${(1 + sealProgress * 0.45).toFixed(2)})`;
      }

      if (promptEl && elapsed > 450 && elapsed < fullOpenReachedMs) {
        const promptFade = clamp01((elapsed - 450) / 800);
        promptEl.style.opacity = String(1 - promptFade * 0.35);
      }

      // 2. Solapa superior #0F2A24 se levanta lentamente (550 -> 2650 ms)
      const flapProgress = clamp01((elapsed - 550) / 2100);
      const flapEase = easeInOutCubic(flapProgress);
      const angleRad = flapEase * Math.PI;
      const cosA = Math.cos(angleRad);

      if (cosA >= 0) {
        if (closedFlapSvg) closedFlapSvg.style.display = 'block';
        if (openFlapSvg) openFlapSvg.style.display = 'none';

        const tipY = 214 * cosA;
        const sideY = 198 * cosA;
        const shadowTipY = 228 * cosA + (1 - cosA) * 18;
        const shadowSideY = 212 * cosA + (1 - cosA) * 14;

        if (closedOuterPath) {
          closedOuterPath.setAttribute(
            'd',
            `M 0,0 L 560,0 L 300,${sideY.toFixed(1)} Q 280,${tipY.toFixed(1)} 260,${sideY.toFixed(1)} Z`,
          );
        }
        if (closedShadowPath) {
          closedShadowPath.setAttribute(
            'd',
            `M 0,2 L 560,2 L 302,${shadowSideY.toFixed(1)} Q 280,${shadowTipY.toFixed(1)} 258,${shadowSideY.toFixed(1)} Z`,
          );
          closedShadowPath.setAttribute('fill', `rgba(0, 0, 0, ${(0.45 * cosA).toFixed(2)})`);
        }
      } else {
        if (closedFlapSvg) closedFlapSvg.style.display = 'none';
        if (openFlapSvg) openFlapSvg.style.display = 'block';

        const openFactor = -cosA;
        const tipY = -196 * openFactor;
        const sideY = -180 * openFactor;
        const linerTipY = -176 * openFactor;
        const linerSideY = -162 * openFactor;

        if (openOuterPath) {
          openOuterPath.setAttribute(
            'd',
            `M 0,4 L 560,4 L 300,${sideY.toFixed(1)} Q 280,${tipY.toFixed(1)} 260,${sideY.toFixed(1)} Z`,
          );
        }
        if (openLinerPath) {
          openLinerPath.setAttribute(
            'd',
            `M 20,4 L 540,4 L 294,${linerSideY.toFixed(1)} Q 280,${linerTipY.toFixed(1)} 266,${linerSideY.toFixed(1)} Z`,
          );
        }
      }

      const envDropProgress = clamp01((elapsed - 650) / 2400);
      const envDropEase = easeInOutCubic(envDropProgress);

      if (headerEl && elapsed > 1300) {
        const headerFade = clamp01((elapsed - 1300) / 1800);
        headerEl.style.opacity = String(1 - headerFade * 0.92);
      }

      // 3. La página interior sale lentamente del sobre (2100 -> 5200 ms)
      if (elapsed < 3800) {
        const emergeProgress = clamp01((elapsed - 2100) / 1700);
        const emergeEase = easeInOutCubic(emergeProgress);

        const letterYPercent = 8 - emergeEase * 80;
        const letterScale = 0.94 + emergeEase * 0.08;

        letterEl.style.zIndex = '2';
        letterEl.style.transform = `translateY(${letterYPercent.toFixed(2)}%) scale(${letterScale.toFixed(3)})`;
        envelope3d.style.transform = `translateY(${(envDropEase * 24).toFixed(1)}%)`;
      } else if (elapsed < fullOpenReachedMs) {
        const presentProgress = clamp01((elapsed - 3800) / 1400);
        const presentEase = easeOutCubic(presentProgress);

        letterEl.style.zIndex = '12';
        const letterYPercent = -72 + presentEase * 60;
        const letterScale = 1.02 + presentEase * 0.2;
        letterEl.style.transform = `translateY(${letterYPercent.toFixed(2)}%) scale(${letterScale.toFixed(3)})`;
        letterEl.style.boxShadow = '0 34px 76px rgba(3, 12, 10, 0.55)';

        const envBehindY = 24 - presentEase * 8;
        const envBehindScale = 1 - presentEase * 0.06;
        envelope3d.style.transform = `translateY(${envBehindY.toFixed(1)}%) scale(${envBehindScale.toFixed(3)})`;

        const envFade = String(1 - presentEase * 0.45);
        if (pocketEl) pocketEl.style.opacity = envFade;
        if (backEl) backEl.style.opacity = envFade;
        if (openFlapSvg) openFlapSvg.style.opacity = envFade;
      } else if (elapsed <= holdSlowEndMs) {
        // 4. AL ABRIRSE TODA LA CARTA: Se queda bien lenta y majestuosa en primer plano (5200 -> 8800 ms)
        const slowHoldProgress = clamp01((elapsed - fullOpenReachedMs) / (holdSlowEndMs - fullOpenReachedMs));
        const slowBreath = easeInOutCubic(slowHoldProgress);

        if (promptEl) {
          promptEl.textContent = 'Te esperamos con mucho amor…';
          promptEl.style.opacity = String(0.9 - slowHoldProgress * 0.7);
        }

        letterEl.style.zIndex = '12';
        const letterYPercent = -12 - Math.sin(slowHoldProgress * Math.PI) * 2.5;
        const letterScale = 1.22 + slowBreath * 0.06;
        letterEl.style.transform = `translateY(${letterYPercent.toFixed(2)}%) scale(${letterScale.toFixed(3)})`;

        const envFade = String(0.55 - slowBreath * 0.25);
        if (pocketEl) pocketEl.style.opacity = envFade;
        if (backEl) backEl.style.opacity = envFade;
        if (openFlapSvg) openFlapSvg.style.opacity = envFade;
      }

      // 5. Transición lenta y suave de entrada a la invitación (8800 -> 10400 ms)
      if (elapsed >= holdSlowEndMs) {
        if (!this.revealTriggered) {
          this.revealTriggered = true;
          this.callbacks.onOpenComplete();
        }

        const enterProgress = clamp01((elapsed - holdSlowEndMs) / revealDuration);
        const enterEase = easeInOutCubic(enterProgress);

        const zoomScale = 1.28 + enterEase * 1.15;
        const zoomY = -12 + enterEase * 10;
        letterEl.style.zIndex = '12';
        letterEl.style.transform = `translateY(${zoomY.toFixed(2)}%) scale(${zoomScale.toFixed(3)})`;
        coverEl.style.opacity = String(1 - enterEase);
        if (footerEl) {
          footerEl.style.opacity = String(1 - enterEase);
        }
      }

      if (elapsed < totalDuration) {
        this.rafId = requestAnimationFrame(stepFrame);
      } else {
        this.isOpened = true;
        this.isOpening = false;
        this.rafId = null;
        coverEl.classList.add('envelope-cover--hidden');
      }
    };

    this.rafId = requestAnimationFrame(stepFrame);
  }

  public resetAndShow(): void {
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private stopAnimation(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
