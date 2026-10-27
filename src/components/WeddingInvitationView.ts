import { CountdownResult, ItineraryItem, PhotoItem, WeddingConfig } from '../types';
import { formatVenueDisplay, formatWeddingTime } from '../config/weddingConfig';
import { getPhotoSrc } from '../utils/photoArtwork';
import { escapeHtml } from '../utils/escapeHtml';
import {
  renderArchBotanicalSprigSvg,
  renderCornerBotanicalSvg,
  renderFloralDividerSvg,
} from './BotanicalDecor';
import { renderMainCountdownMarkup } from './Countdown';

export interface InvitationViewCallbacks {
  onReplayEnvelope: () => void;
  onOpenRsvp: () => void;
  onOpenLightbox: (photoId: PhotoItem['id']) => void;
  onLaunchXR?: () => void;
}

export class WeddingInvitationView {
  private container: HTMLElement;
  private config: WeddingConfig;
  private countdown: CountdownResult;
  private callbacks: InvitationViewCallbacks;
  private isVisible = false;

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

  private renderItineraryIcon(iconType: ItineraryItem['icon']): string {
    switch (iconType) {
      case 'reception':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `;
      case 'ceremony':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <circle cx="9" cy="12" r="5" />
            <circle cx="15" cy="12" r="5" />
            <path d="M12 4l1.5 2L12 8l-1.5-2L12 4z" />
          </svg>
        `;
      case 'worship':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M9 18V5l12-2v13" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        `;
      case 'dinner':
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" stroke-linecap="round" />
            <path d="M7 2v20" stroke-linecap="round" />
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        `;
      case 'closing-worship':
      default:
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke-linejoin="round" />
          </svg>
        `;
    }
  }

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
    }
    if (backdrop) {
      backdrop.classList.toggle('is-open', open);
    }
  }

  public render(): void {
    const heroPhoto = this.config.photos.find((p) => p.id === 'bl-40') || this.config.photos[0];
    const promisePhoto = this.config.photos.find((p) => p.id === 'bl-66') || this.config.photos[1];

    const formattedTime = escapeHtml(formatWeddingTime(this.config));
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
            <a href="#cierre" class="topbar-link whitespace-nowrap shrink-0">Confirmar</a>
          </nav>

          <div class="topbar-action shrink-0">
            <button
              type="button"
              id="topbar-launch-xr-btn"
              class="btn-outline-sm topbar-desktop-only whitespace-nowrap shrink-0"
              aria-label="Abrir vista 3D XR en la iglesia con anillos de boda y carta"
            >
              Vista 3D XR
            </button>
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
          aria-hidden="true"
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
            <span><strong>5:00 PM</strong> Llegada de invitados</span>
            <span aria-hidden="true">·</span>
            <span><strong>6:00 PM</strong> Entrada de novios</span>
          </div>

          <nav class="mobile-nav-drawer__links" aria-label="Navegación móvil">
            <a href="#inicio" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">Inicio</span>
              <span class="mobile-nav-link__sub">Portada principal</span>
            </a>
            <a href="#ceremonia" class="mobile-nav-link" data-mobile-nav-link>
              <span class="mobile-nav-link__title">La Ceremonia</span>
              <span class="mobile-nav-link__sub">Invitados 5:00 PM · Novios 6:00 PM</span>
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
              <span class="mobile-nav-link__title">Confirmar Asistencia</span>
              <span class="mobile-nav-link__sub">Confirmación por WhatsApp</span>
            </a>
          </nav>

          <div class="mobile-nav-drawer__actions">
            <button
              type="button"
              id="mobile-drawer-rsvp-btn"
              class="btn-primary mobile-nav-drawer__btn-full"
            >
              Confirmar invitación
            </button>
            <div class="mobile-nav-drawer__grid-btns">
              <button
                type="button"
                id="mobile-drawer-xr-btn"
                class="btn-secondary"
              >
                Vista 3D XR
              </button>
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
            <div class="hero-container">
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

                <!-- Dos acciones principales -->
                <div class="hero-cta-group">
                  <button
                    type="button"
                    id="hero-scroll-ceremony-btn"
                    class="btn-secondary whitespace-nowrap shrink-0"
                  >
                    Descubre nuestra invitación
                  </button>
                  <button
                    type="button"
                    id="hero-open-rsvp-btn"
                    class="btn-primary whitespace-nowrap shrink-0"
                  >
                    Confirmar invitación
                  </button>
                </div>
              </div>

              <!-- Columna derecha: Fotografía principal en marco de arco -->
              <div class="hero-photo-col">
                <div class="hero-arch-wrapper">
                  ${renderArchBotanicalSprigSvg()}

                  <button
                    type="button"
                    class="hero-arch-frame-btn"
                    data-lightbox-open="${heroPhoto.id}"
                    aria-label="Ampliar fotografía principal de ${this.config.couple.displayTitle}"
                  >
                    <div class="hero-arch-frame">
                      <img
                        src="${getPhotoSrc(heroPhoto)}"
                        alt="${heroPhoto.alt}"
                        class="hero-arch-img"
                        style="object-position: ${heroPhoto.focalPoint};"
                        referrerpolicy="no-referrer"
                      />
                      <span class="photo-zoom-hint" aria-hidden="true">
                        Toca para ver completa
                      </span>
                    </div>
                  </button>

                  <!-- Detalle circular lavanda con el día y el mes de la boda (19 DIC) -->
                  <div class="hero-lavender-date-badge" aria-label="Fecha de la boda: ${this.config.date.dayNumber} de diciembre">
                    <span class="hero-lavender-date-badge__day tabular-nums">${this.config.date.dayNumber}</span>
                    <span class="hero-lavender-date-badge__rule" aria-hidden="true"></span>
                    <span class="hero-lavender-date-badge__month">${this.config.date.monthShort}</span>
                  </div>
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
                  <span class="ceremony-detail-sub">Sábado · Celebración nupcial</span>
                </div>

                <!-- Columna 2: La hora (5:00 PM Invitados / 6:00 PM Novios) -->
                <div class="ceremony-detail-item">
                  <span class="ceremony-detail-label">La hora</span>
                  <strong class="ceremony-detail-value tabular-nums">${formattedTime}</strong>
                  <div class="ceremony-schedule-badges">
                    <span class="ceremony-schedule-badge"><strong>5:00 PM</strong> · Recepción de invitados</span>
                    <span class="ceremony-schedule-badge"><strong>6:00 PM</strong> · Entrada del novio y la novia</span>
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
              <p class="ceremony-intro-text">
                Todo comienza a las <strong>5:00 PM</strong> con la recepción de nuestros invitados, y a las <strong>6:00 PM</strong> daremos inicio con la entrada del novio y la novia este ${this.config.date.displayDate}.
              </p>

              <div class="itinerary-timeline">
                ${this.config.itinerary
                  .map(
                    (item, idx) => `
                  <article class="itinerary-step-card">
                    <div class="itinerary-step-card__badge" aria-hidden="true">
                      <span class="itinerary-step-card__icon">
                        ${this.renderItineraryIcon(item.icon)}
                      </span>
                      <span class="itinerary-step-card__num">0${idx + 1}</span>
                    </div>

                    <div class="itinerary-step-card__body">
                      <span class="itinerary-step-card__time tabular-nums">${escapeHtml(item.time)}</span>
                      <h3 class="itinerary-step-card__title">${escapeHtml(item.title)}</h3>
                      <p class="itinerary-step-card__desc">${escapeHtml(item.description)}</p>
                    </div>
                  </article>
                `,
                  )
                  .join('')}
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
                <span class="tabular-nums">Recepción: 5:00 PM · Novios: 6:00 PM</span>
                <span class="closing-summary-sep" aria-hidden="true">·</span>
                <span>${escapeHtml(venueInfo.primaryTitle)}</span>
              </div>

              <div class="closing-actions-group">
                <button
                  type="button"
                  id="closing-open-rsvp-btn"
                  class="btn-primary whitespace-nowrap shrink-0"
                >
                  Confirmar invitación
                </button>
                <button
                  type="button"
                  id="closing-share-btn"
                  class="btn-secondary whitespace-nowrap shrink-0"
                >
                  Compartir invitación
                </button>
                <button
                  type="button"
                  id="closing-replay-envelope-btn"
                  class="btn-outline-sm whitespace-nowrap shrink-0"
                >
                  Ver la carta
                </button>
                <button
                  type="button"
                  id="closing-launch-xr-btn"
                  class="btn-outline-sm whitespace-nowrap shrink-0"
                >
                  Vista 3D XR
                </button>
              </div>

              <p id="closing-share-feedback" class="closing-share-feedback" role="status" aria-live="polite" hidden></p>

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
            <span>${this.config.couple.fullNamesDisplay} · ${this.config.date.displayDate} · 5:00 PM</span>
            <div class="utility-footer-links">
              ${
                this.callbacks.onLaunchXR
                  ? `<span aria-hidden="true">·</span>
                     <button type="button" id="footer-launch-xr-btn" class="utility-footer-btn">
                       Vista 3D XR
                     </button>`
                  : ''
              }
            </div>
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
    const scrollCeremonyBtn = this.container.querySelector<HTMLButtonElement>(
      '#hero-scroll-ceremony-btn',
    );
    const heroRsvpBtn = this.container.querySelector<HTMLButtonElement>('#hero-open-rsvp-btn');
    const closingRsvpBtn = this.container.querySelector<HTMLButtonElement>(
      '#closing-open-rsvp-btn',
    );
    const shareBtn = this.container.querySelector<HTMLButtonElement>('#closing-share-btn');
    const shareFeedback = this.container.querySelector<HTMLElement>('#closing-share-feedback');

    // Eventos del Menú de Hamburguesa Móvil
    const mobileMenuToggleBtn = this.container.querySelector<HTMLButtonElement>(
      '#mobile-menu-toggle-btn',
    );
    const mobileMenuCloseBtn = this.container.querySelector<HTMLButtonElement>(
      '#mobile-menu-close-btn',
    );
    const mobileNavBackdrop = this.container.querySelector<HTMLElement>('#mobile-nav-backdrop');

    mobileMenuToggleBtn?.addEventListener('click', () => {
      this.setMobileMenuOpen(!this.isMobileMenuOpen);
    });
    mobileMenuCloseBtn?.addEventListener('click', () => {
      this.setMobileMenuOpen(false);
    });
    mobileNavBackdrop?.addEventListener('click', () => {
      this.setMobileMenuOpen(false);
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
      .querySelector<HTMLButtonElement>('#mobile-drawer-xr-btn')
      ?.addEventListener('click', () => {
        this.setMobileMenuOpen(false);
        this.callbacks.onLaunchXR?.();
      });
    this.container
      .querySelector<HTMLButtonElement>('#mobile-drawer-envelope-btn')
      ?.addEventListener('click', () => {
        this.setMobileMenuOpen(false);
        this.callbacks.onReplayEnvelope();
      });

    replayTopBtn?.addEventListener('click', () => this.callbacks.onReplayEnvelope());
    replayBottomBtn?.addEventListener('click', () => this.callbacks.onReplayEnvelope());

    scrollCeremonyBtn?.addEventListener('click', () => {
      const ceremonySection = this.container.querySelector<HTMLElement>('#ceremonia');
      ceremonySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    heroRsvpBtn?.addEventListener('click', () => this.callbacks.onOpenRsvp());
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

    shareBtn?.addEventListener('click', async () => {
      const shareData = {
        title: `${this.config.couple.displayTitle} — Invitación de Boda`,
        text: `Acompáñanos a celebrar la boda de ${this.config.couple.fullNamesDisplay} el ${this.config.date.displayDate} (Recepción: 5:00 PM · Entrada de los novios: 6:00 PM).`,
        url: window.location.href,
      };

      const showShareFeedback = (msg: string) => {
        if (!shareFeedback) return;
        shareFeedback.textContent = msg;
        shareFeedback.hidden = false;
        window.setTimeout(() => {
          shareFeedback.hidden = true;
        }, 3500);
      };

      if (typeof navigator.share === 'function') {
        try {
          await navigator.share(shareData);
          showShareFeedback('¡Gracias por compartir nuestra invitación!');
          return;
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
        }
      }

      try {
        await navigator.clipboard.writeText(window.location.href);
        showShareFeedback('Enlace copiado al portapapeles para compartir.');
      } catch {
        showShareFeedback(`Enlace de la invitación: ${window.location.href}`);
      }
    });

    this.container
      .querySelector<HTMLButtonElement>('#topbar-launch-xr-btn')
      ?.addEventListener('click', () => this.callbacks.onLaunchXR?.());
    this.container
      .querySelector<HTMLButtonElement>('#closing-launch-xr-btn')
      ?.addEventListener('click', () => this.callbacks.onLaunchXR?.());
    this.container
      .querySelector<HTMLButtonElement>('#footer-launch-xr-btn')
      ?.addEventListener('click', () => this.callbacks.onLaunchXR?.());
  }
}
