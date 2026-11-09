import { CountdownResult, PhotoItem, WeddingConfig } from '../types';
import { formatVenueDisplay, formatWeddingTime } from '../config/weddingConfig';
import { getPhotoSrc } from '../utils/photoArtwork';
import { escapeHtml } from '../utils/escapeHtml';
import { renderGiftMessage } from './GiftMessage';
import {
  renderCornerBotanicalSvg,
  renderFloralDividerSvg,
} from './BotanicalDecor';
import { renderMainCountdownMarkup } from './Countdown';

export interface InvitationViewCallbacks {
  onReplayEnvelope: () => void;
  onOpenRsvp: () => void;
  onOpenLightbox: (photoId: PhotoItem['id']) => void;
}

export class WeddingInvitationView {
  private container: HTMLElement;
  private config: WeddingConfig;
  private countdown: CountdownResult;
  private callbacks: InvitationViewCallbacks;
  private isVisible = false;
  private readonly onResize = () => {
    if (window.innerWidth > 900 && this.isMobileMenuOpen) this.setMobileMenuOpen(false);
  };

  constructor(
    container: HTMLElement,
    config: WeddingConfig,
    countdown: CountdownResult,
    callbacks: InvitationViewCallbacks,
  ) {
    this.container = container;
    this.config = config;
    this.countdown = countdown;
    this.callbacks = callbacks;
    window.addEventListener('resize', this.onResize);
  }

  public dispose(): void {
    document.documentElement.classList.remove('invitation-menu-open');
    window.removeEventListener('resize', this.onResize);
  }

  public showWithReveal(): void {
    this.isVisible = true;
    const wrapper = this.container.querySelector<HTMLElement>('#invitation-main-wrapper');
    if (wrapper) {
      wrapper.classList.remove('invitation-wrapper--hidden');
      requestAnimationFrame(() => {
        wrapper.classList.add('invitation-wrapper--visible');
      });
    }
  }

  public hideForEnvelope(): void {
    this.setMobileMenuOpen(false);
    this.isVisible = false;
    const wrapper = this.container.querySelector<HTMLElement>('#invitation-main-wrapper');
    if (wrapper) {
      wrapper.classList.remove('invitation-wrapper--visible');
      wrapper.classList.add('invitation-wrapper--hidden');
    }
  }

  public updateCountdown(countdown: CountdownResult): void {
    this.countdown = countdown;
    const heroCountdownEl = this.container.querySelector<HTMLElement>('#hero-countdown-slot');
    if (heroCountdownEl) {
      heroCountdownEl.innerHTML = renderMainCountdownMarkup(this.countdown);
    }
  }

  public updateConfigAndRender(config: WeddingConfig, countdown: CountdownResult): void {
    this.config = config;
    this.countdown = countdown;
    const wasVisible = this.isVisible;
    this.render();
    if (wasVisible) {
      const wrapper = this.container.querySelector<HTMLElement>('#invitation-main-wrapper');
      if (wrapper) {
        wrapper.classList.remove('invitation-wrapper--hidden');
        wrapper.classList.add('invitation-wrapper--visible');
      }
    }
  }

  private isMobileMenuOpen = false;

  private setMobileMenuOpen(open: boolean): void {
    this.isMobileMenuOpen = open;
    const toggleBtn = this.container.querySelector<HTMLButtonElement>('#mobile-menu-toggle-btn');
    const drawer = this.container.querySelector<HTMLElement>('#mobile-nav-drawer');
    const backdrop = this.container.querySelector<HTMLElement>('#mobile-nav-backdrop');

    if (toggleBtn) {
      toggleBtn.classList.toggle('is-open', open);
      toggleBtn.setAttribute('aria-expanded', String(open));
    }
    if (drawer) {
      drawer.classList.toggle('is-open', open);
      drawer.setAttribute('aria-hidden', String(!open));
      drawer.inert = !open;
      drawer.scrollTop = 0;
    }
    if (backdrop) {
      backdrop.classList.toggle('is-open', open);
    }
    document.documentElement.classList.toggle('invitation-menu-open', open);
    this.container.querySelectorAll<HTMLElement>('.invitation-topbar, .invitation-main, .invitation-utility-footer').forEach(element => {
      element.inert = open;
    });
    if (open) {
      requestAnimationFrame(() => {
        if (this.isMobileMenuOpen) drawer?.querySelector<HTMLButtonElement>('#mobile-menu-close-btn')?.focus({ preventScroll: true });
      });
    } else {
      toggleBtn?.focus({ preventScroll: true });
    }
  }

  public render(): void {
    const promisePhoto = this.config.photos.find((p) => p.id === 'bl-66') || this.config.photos[1];

    const formattedTime = escapeHtml(formatWeddingTime(this.config));
    const brideArrivalTime = escapeHtml(this.config.itinerary.find(item => item.id === 'ceremonia')?.time.split(' – ')[0] || '7:00 p. m.');
    const venueInfo = formatVenueDisplay(this.config);

    this.container.innerHTML = `
      <div
        id="invitation-main-wrapper"
        class="invitation-wrapper ${this.isVisible ? 'invitation-wrapper--visible' : 'invitation-wrapper--hidden'}"
      >
        <!-- Barra superior de navegación con Menú de Hamburguesa para Celular -->
        <header class="invitation-topbar">
          <a href="#inicio" class="topbar-brand whitespace-nowrap shrink-0">
            ${this.config.couple.displayTitle}
          </a>

          <nav class="topbar-nav" aria-label="Secciones de la invitación">
            <a href="#ceremonia" class="topbar-link whitespace-nowrap shrink-0">Ceremonia</a>
            <a href="#itinerario" class="topbar-link whitespace-nowrap shrink-0">Itinerario</a>
            <a href="#historia" class="topbar-link whitespace-nowrap shrink-0">Nuestra historia</a>
            <a href="#galeria" class="topbar-link whitespace-nowrap shrink-0">Galería</a>
            <a href="#cierre" class="topbar-link whitespace-nowrap shrink-0">Asistir</a>
          </nav>

          <div class="topbar-action shrink-0">
            <button
              type="button"
              id="topbar-replay-envelope-btn"
              class="btn-outline-sm topbar-desktop-only whitespace-nowrap shrink-0"
              aria-label="Volver a ver el sobre cerrado y repetir la apertura de la carta"
            >
              Ver la carta
            </button>

            <!-- Botón de Menú de Hamburguesa para Celular y Tableta -->
            <button
              type="button"
              id="mobile-menu-toggle-btn"
              class="mobile-hamburger-btn"
              aria-label="Abrir menú de navegación"
              aria-expanded="false"
              aria-controls="mobile-nav-drawer"
            >
              <span class="mobile-hamburger-btn__label">Menú</span>
              <span class="mobile-hamburger-btn__bars" aria-hidden="true">
                <span class="hamburger-bar hamburger-bar--1"></span>
                <span class="hamburger-bar hamburger-bar--2"></span>
                <span class="hamburger-bar hamburger-bar--3"></span>
              </span>
            </button>
          </div>
        </header>

        <!-- Fondo oscuro suave y Menú Desplegable Móvil (Menú de Hamburguesa) -->
        <div id="mobile-nav-backdrop" class="mobile-nav-backdrop" aria-hidden="true"></div>
        <aside
          id="mobile-nav-drawer"
          class="mobile-nav-drawer"
          aria-label="Menú móvil de la invitación"
          role="dialog"
          aria-modal="true"
          aria-hidden="true"
          inert
        >
          <div class="mobile-nav-drawer__header">
            <div class="mobile-nav-drawer__brand">
              <span class="mobile-nav-drawer__monogram">${this.config.couple.monogram}</span>
              <div>
                <strong class="mobile-nav-drawer__names">${this.config.couple.displayTitle}</strong>
                <span class="mobile-nav-drawer__date">${this.config.date.displayDate} · ${formattedTime}</span>
              </div>
            </div>
            <button
              type="button"
              id="mobile-menu-close-btn"
              class="mobile-nav-drawer__close"
              aria-label="Cerrar menú"
            >
              ✕
            </button>
          </div>

          <div class="mobile-nav-drawer__schedule-pill">
            <span><strong>${formattedTime}</strong> Llegada de invitados</span>
            <span aria-hidden="true">·</span>
            <span><strong>${brideArrivalTime}</strong> Entrada de la novia</span>
          </div>

          <nav class="mobile-nav-drawer__links" aria-label="Navegación móvil">
            <a href="#inicio" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">Inicio</span>
              <span class="mobile-nav-link__sub">Portada principal</span>
            </a>
            <a href="#ceremonia" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">La Ceremonia</span>
              <span class="mobile-nav-link__sub">Invitados ${formattedTime} · Novia ${brideArrivalTime}</span>
            </a>
            <a href="#itinerario" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">Itinerario de la Boda</span>
              <span class="mobile-nav-link__sub">Recepción, Ceremonia, Adoración y Cena</span>
            </a>
            <a href="#historia" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">Nuestra Historia</span>
              <span class="mobile-nav-link__sub">Nuestra promesa de amor</span>
            </a>
            <a href="#galeria" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">Galería de Fotografías</span>
              <span class="mobile-nav-link__sub">Nuestros momentos especiales</span>
            </a>
            <a href="#cierre" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">Asistir</span>
              <span class="mobile-nav-link__sub">Registra hasta 3 personas</span>
            </a>
          </nav>

          <div class="mobile-nav-drawer__actions">
            <button
              type="button"
              id="mobile-drawer-rsvp-btn"
              class="btn-primary mobile-nav-drawer__btn-full"
            >
              Asistir
            </button>
            <div class="mobile-nav-drawer__grid-btns">
              <button
                type="button"
                id="mobile-drawer-envelope-btn"
                class="btn-secondary"
              >
                Ver la carta
              </button>
            </div>
          </div>
        </aside>

        <main id="inicio" class="invitation-main">
          <!-- 5. Invitación principal después de abrir la carta (Dos columnas en computadora, una en celular) -->
          <section class="hero-section" aria-labelledby="hero-heading">
            <div class="hero-container hero-container--intro">
              <div class="hero-content-col">
                <p class="section-kicker">CON EL CORAZÓN LLENO DE AMOR</p>
                <p class="hero-married-announcement">¡Nos casamos!</p>
                <h1 id="hero-heading" class="hero-calligraphy-names">
                  ${this.config.couple.displayTitle}
                </h1>
                <p class="hero-full-names">
                  ${this.config.couple.fullNamesDisplay}
                </p>
                <p class="hero-lead-message">
                  Y queremos que seas parte de este día tan especial.
                </p>

                <!-- 6. Cuenta regresiva principal -->
                <div id="hero-countdown-slot" class="hero-countdown-slot">
                  ${renderMainCountdownMarkup(this.countdown)}
                </div>


              </div>

            </div>
          </section>

          ${renderFloralDividerSvg()}

          <!-- 7. Sección de la ceremonia -->
          <section id="ceremonia" class="ceremony-section" aria-labelledby="ceremony-heading">
            <div class="section-narrow-container">
              <p class="section-kicker">ESTÁS INVITADO A NUESTRA BODA</p>
              <h2 id="ceremony-heading" class="section-serif-title">Una promesa de amor</h2>
              <p class="ceremony-intro-text">
                Con mucha alegría, te invitamos a acompañarnos en el momento en que uniremos nuestras vidas ante Dios. Tu presencia hará aún más especial nuestra celebración.
              </p>

              <div class="ceremony-details-grid">
                <!-- Columna 1: El día -->
                <div class="ceremony-detail-item">
                  <span class="ceremony-detail-label">El día</span>
                  <strong class="ceremony-detail-value">${this.config.date.displayDate}</strong>
                  <span class="ceremony-detail-sub">Viernes · Celebración nupcial</span>
                </div>

                <!-- Columna 2: La hora (5:00 PM Invitados / 6:00 PM Novios) -->
                <div class="ceremony-detail-item">
                  <span class="ceremony-detail-label">La hora</span>
                  <strong class="ceremony-detail-value tabular-nums">${formattedTime}</strong>
                  <div class="ceremony-schedule-badges">
                    <span class="ceremony-schedule-badge"><strong>${formattedTime}</strong> · Recepción de invitados</span>
                    <span class="ceremony-schedule-badge"><strong>${brideArrivalTime}</strong> · Entrada de la novia</span>
                  </div>
                </div>

                <!-- Columna 3: El lugar -->
                <div class="ceremony-detail-item">
                  <span class="ceremony-detail-label">El lugar</span>
                  <strong class="ceremony-detail-value">${escapeHtml(venueInfo.primaryTitle)}</strong>
                  <span class="ceremony-detail-sub">${escapeHtml(venueInfo.secondaryDetail)}</span>
                  ${
                    venueInfo.addressText
                      ? `<span class="ceremony-detail-address">${escapeHtml(venueInfo.addressText)}</span>`
                      : ''
                  }
                  ${
                    venueInfo.hasMapLink
                      ? `<div class="ceremony-map-action">
                          <a
                            href="${escapeHtml(venueInfo.mapHref)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn-outline-sm whitespace-nowrap"
                          >
                            Ver ubicación
                          </a>
                        </div>`
                      : ''
                  }
                </div>
              </div>

              <p class="ceremony-closing-quote">
                “Un día para celebrar el amor, juntos.”
              </p>
            </div>
          </section>

          ${renderFloralDividerSvg()}

          <!-- SECCIÓN: Itinerario de Nuestra Celebración -->
          <section id="itinerario" class="itinerary-section" aria-labelledby="itinerary-heading">
            <div class="section-narrow-container">
              <p class="section-kicker">PROGRAMA DE NUESTRA CELEBRACIÓN</p>
              <h2 id="itinerary-heading" class="section-serif-title">Itinerario de nuestra boda</h2>
              <div class="wedding-schedule-wrap">
                <table class="wedding-schedule">
                  <caption class="sr-only">Horario y actividades de nuestra boda</caption>
                  <thead><tr><th scope="col">Horario</th><th scope="col">Actividad</th></tr></thead>
                  <tbody>${this.config.itinerary.map(item => `<tr><td class="tabular-nums">${escapeHtml(item.time)}</td><td>${escapeHtml(item.title)}</td></tr>`).join('')}</tbody>
                </table>
              </div>
            </div>
          </section>

          <!-- 9 (Parte 1). Sección de la pareja con fondo lavanda suave y fotografía del anillo (B&L-66.jpg) -->
          <section id="historia" class="promise-lavender-section" aria-labelledby="promise-heading">
            <div class="promise-container">
              <div class="promise-photo-col">
                <button
                  type="button"
                  class="promise-photo-frame-btn"
                  data-lightbox-open="${promisePhoto.id}"
                  aria-label="Ampliar fotografía de la promesa: Bryan colocando el anillo a Lyndel"
                >
                  <div class="promise-photo-frame">
                    <img
                      src="${getPhotoSrc(promisePhoto)}"
                      alt="${promisePhoto.alt}"
                      class="promise-photo-img"
                      loading="lazy"
                      style="object-position: ${promisePhoto.focalPoint};"
                      referrerpolicy="no-referrer"
                    />
                    <span class="photo-zoom-hint" aria-hidden="true">
                      Ampliar fotografía
                    </span>
                  </div>
                </button>
              </div>

              <div class="promise-text-col">
                <p class="section-kicker section-kicker--purple">NUESTRA HISTORIA CONTINÚA</p>
                <h2 id="promise-heading" class="section-serif-title">
                  El mejor lugar es a tu lado.
                </h2>
                <p class="promise-body-copy">
                  Hoy elegimos caminar juntos, compartir nuestros sueños y construir una vida llena de amor bajo la bendición de Dios.
                </p>
                <div class="promise-signature-wrap">
                  <span class="promise-signature">${this.config.couple.displayTitle}</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 8 y 9 (Parte 2). Galería: Nuestros momentos -->
          <section id="galeria" class="gallery-section" aria-labelledby="gallery-heading">
            <div class="gallery-container">
              <div class="gallery-header">
                <h2 id="gallery-heading" class="section-serif-title">Nuestros momentos</h2>
                <p class="gallery-subtitle">Un amor que se ve y se siente.</p>
              </div>

              <div class="gallery-staggered-grid">
                ${this.config.photos
                  .map(
                    (photo, index) => `
                  <article class="gallery-card gallery-card--slot-${index + 1}">
                    <button
                      type="button"
                      class="gallery-card__btn"
                      data-lightbox-open="${photo.id}"
                      aria-label="Ampliar fotografía ${index + 1} de 4: ${photo.caption}"
                    >
                      <div class="gallery-card__frame">
                        <div class="gallery-card__img-aspect gallery-card__img-aspect--${photo.aspectRatio === '3:4' ? 'portrait' : 'landscape'}">
                          <img
                            src="${getPhotoSrc(photo)}"
                            alt="${photo.alt}"
                            class="gallery-card__img"
                            loading="lazy"
                            style="object-position: ${photo.focalPoint};"
                            referrerpolicy="no-referrer"
                          />
                        </div>
                        <div class="gallery-card__caption-bar">
                          <span class="gallery-card__title">${photo.title}</span>
                          <span class="gallery-card__expand-text">Ver completa</span>
                        </div>
                      </div>
                    </button>
                  </article>
                `,
                  )
                  .join('')}
              </div>
            </div>
          </section>

          <!-- 11. Cierre de la invitación con fondo verde salvia suave y detalles botánicos -->
          <section id="cierre" class="closing-sage-section" aria-labelledby="closing-heading">
            <div class="closing-botanicals" aria-hidden="true">
              ${renderCornerBotanicalSvg('top-left')}
              ${renderCornerBotanicalSvg('top-right')}
              ${renderCornerBotanicalSvg('bottom-left')}
              ${renderCornerBotanicalSvg('bottom-right')}
            </div>

            <div class="closing-container">
              <p class="section-kicker">CON MUCHO AMOR</p>
              <h2 id="closing-heading" class="section-serif-title">Te esperamos</h2>
              <p class="closing-message">
                Porque los momentos más bonitos de la vida son los que compartimos con quienes queremos.
              </p>

              <div class="closing-summary-row">
                <span>${this.config.date.displayDate}</span>
                <span class="closing-summary-sep" aria-hidden="true">·</span>
                <span class="tabular-nums">Recepción: ${formattedTime} · Novia: ${brideArrivalTime}</span>
                <span class="closing-summary-sep" aria-hidden="true">·</span>
                <span>${escapeHtml(venueInfo.primaryTitle)}</span>
              </div>

              ${renderGiftMessage('closing')}
              <div class="closing-actions-group">
                <button
                  type="button"
                  id="closing-open-rsvp-btn"
                  class="btn-primary whitespace-nowrap shrink-0"
                >
                  Asistir
                </button>

                <button
                  type="button"
                  id="closing-replay-envelope-btn"
                  class="btn-outline-sm whitespace-nowrap shrink-0"
                >
                  Ver la carta
                </button>
              </div>


              <div class="closing-signature-block">
                <p class="closing-calligraphy-names">${this.config.couple.displayTitle}</p>
                <p class="closing-forever-motto">EL COMIENZO DE NUESTRO PARA SIEMPRE</p>
              </div>
            </div>
          </section>
        </main>

        <!-- Barra inferior con acceso directo al Panel de Administrador para subir imágenes y editar datos -->
        <footer class="invitation-utility-footer">
          <div class="utility-footer-inner">
            <span>${this.config.couple.fullNamesDisplay} · ${this.config.date.displayDate} · ${formattedTime}</span>

          </div>
        </footer>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const replayTopBtn = this.container.querySelector<HTMLButtonElement>(
      '#topbar-replay-envelope-btn',
    );
    const replayBottomBtn = this.container.querySelector<HTMLButtonElement>(
      '#closing-replay-envelope-btn',
    );
    const closingRsvpBtn = this.container.querySelector<HTMLButtonElement>(
      '#closing-open-rsvp-btn',
    );

    // Eventos del Menú de Hamburguesa Móvil
    const mobileMenuToggleBtn = this.container.querySelector<HTMLButtonElement>(
      '#mobile-menu-toggle-btn',
    );
    const mobileMenuCloseBtn = this.container.querySelector<HTMLButtonElement>(
      '#mobile-menu-close-btn',
    );
    const mobileNavBackdrop = this.container.querySelector<HTMLElement>('#mobile-nav-backdrop');
    const mobileDrawer = this.container.querySelector<HTMLElement>('#mobile-nav-drawer');
    mobileDrawer?.addEventListener('transitionend', event => {
      if (event.propertyName === 'transform' && this.isMobileMenuOpen && !mobileDrawer.contains(document.activeElement)) {
        mobileMenuCloseBtn?.focus({ preventScroll: true });
      }
    });

    mobileMenuToggleBtn?.addEventListener('click', () => {
      this.setMobileMenuOpen(!this.isMobileMenuOpen);
    });
    mobileMenuCloseBtn?.addEventListener('click', () => {
      this.setMobileMenuOpen(false);
    });
    mobileNavBackdrop?.addEventListener('click', () => {
      this.setMobileMenuOpen(false);
    });
    this.container.querySelector<HTMLElement>('#mobile-nav-drawer')?.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.setMobileMenuOpen(false);
      }
      if (event.key === 'Tab') {
        const controls = Array.from(this.container.querySelectorAll<HTMLElement>('#mobile-nav-drawer a[href], #mobile-nav-drawer button'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault(); last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault(); first?.focus();
        }
      }
    });

    this.container.querySelectorAll<HTMLAnchorElement>('[data-mobile-nav-link]').forEach((link) => {
      link.addEventListener('click', () => {
        this.setMobileMenuOpen(false);
      });
    });

    this.container
      .querySelector<HTMLButtonElement>('#mobile-drawer-rsvp-btn')
      ?.addEventListener('click', () => {
        this.setMobileMenuOpen(false);
        this.callbacks.onOpenRsvp();
      });
    this.container
      .querySelector<HTMLButtonElement>('#mobile-drawer-envelope-btn')
      ?.addEventListener('click', () => {
        this.setMobileMenuOpen(false);
        this.callbacks.onReplayEnvelope();
      });

    replayTopBtn?.addEventListener('click', () => this.callbacks.onReplayEnvelope());
    replayBottomBtn?.addEventListener('click', () => this.callbacks.onReplayEnvelope());


    closingRsvpBtn?.addEventListener('click', () => this.callbacks.onOpenRsvp());

    this.container
      .querySelectorAll<HTMLButtonElement>('[data-lightbox-open]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const photoId = btn.getAttribute('data-lightbox-open') as PhotoItem['id'];
          if (photoId) {
            this.callbacks.onOpenLightbox(photoId);
          }
        });
      });

  }
}
