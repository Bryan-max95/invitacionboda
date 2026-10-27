import { PhotoItem } from '../types';
import { getPhotoSrc } from '../utils/photoArtwork';

export class LightboxModal {
  private container: HTMLElement;
  private photos: PhotoItem[];
  private currentIndex = 0;
  private isOpen = false;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement, photos: PhotoItem[]) {
    this.container = container;
    this.photos = photos;
    this.boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
    this.renderShell();
  }

  private renderShell(): void {
    this.container.innerHTML = `
      <div
        id="lightbox-backdrop"
        class="lightbox-backdrop"
        role="dialog"
        aria-modal="true"
        aria-label="Visor de fotografías de la pareja"
        aria-hidden="true"
      >
        <div class="lightbox-topbar">
          <div class="lightbox-counter tabular-nums" id="lightbox-counter">1 / 4</div>
          <button
            type="button"
            id="lightbox-close-btn"
            class="lightbox-icon-btn lightbox-close-btn"
            aria-label="Cerrar visor de fotografías (Escape)"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span>Cerrar</span>
          </button>
        </div>

        <div class="lightbox-stage">
          <button
            type="button"
            id="lightbox-prev-btn"
            class="lightbox-nav-btn lightbox-nav-btn--prev"
            aria-label="Fotografía anterior"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>

          <figure class="lightbox-figure" id="lightbox-figure">
            <div class="lightbox-img-wrap">
              <img
                id="lightbox-img"
                class="lightbox-img"
                src=""
                alt=""
                referrerpolicy="no-referrer"
              />
            </div>
            <figcaption class="lightbox-caption">
              <strong id="lightbox-title" class="lightbox-caption__title"></strong>
              <span class="lightbox-caption__sep" aria-hidden="true">·</span>
              <span id="lightbox-desc" class="lightbox-caption__desc"></span>
              <span class="lightbox-caption__sep" aria-hidden="true">·</span>
              <span id="lightbox-filename" class="lightbox-caption__file"></span>
            </figcaption>
          </figure>

          <button
            type="button"
            id="lightbox-next-btn"
            class="lightbox-nav-btn lightbox-nav-btn--next"
            aria-label="Fotografía siguiente"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div class="lightbox-dots" id="lightbox-dots" role="tablist" aria-label="Seleccionar fotografía"></div>
      </div>
    `;

    const backdrop = this.container.querySelector<HTMLElement>('#lightbox-backdrop');
    const closeBtn = this.container.querySelector<HTMLButtonElement>('#lightbox-close-btn');
    const prevBtn = this.container.querySelector<HTMLButtonElement>('#lightbox-prev-btn');
    const nextBtn = this.container.querySelector<HTMLButtonElement>('#lightbox-next-btn');

    closeBtn?.addEventListener('click', () => this.close());
    prevBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.prev();
    });
    nextBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.next();
    });

    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop || (e.target as HTMLElement).classList.contains('lightbox-stage')) {
        this.close();
      }
    });
  }

  public openByPhotoId(photoId: PhotoItem['id']): void {
    const idx = this.photos.findIndex((p) => p.id === photoId);
    this.openAtIndex(idx >= 0 ? idx : 0);
  }

  public openAtIndex(index: number): void {
    this.currentIndex = (index + this.photos.length) % this.photos.length;
    this.isOpen = true;
    this.updateView();

    const backdrop = this.container.querySelector<HTMLElement>('#lightbox-backdrop');
    if (backdrop) {
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
    }

    document.addEventListener('keydown', this.boundKeyDown);
    const closeBtn = this.container.querySelector<HTMLButtonElement>('#lightbox-close-btn');
    closeBtn?.focus();
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const backdrop = this.container.querySelector<HTMLElement>('#lightbox-backdrop');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', this.boundKeyDown);
  }

  public prev(): void {
    this.currentIndex = (this.currentIndex - 1 + this.photos.length) % this.photos.length;
    this.updateView();
  }

  public next(): void {
    this.currentIndex = (this.currentIndex + 1) % this.photos.length;
    this.updateView();
  }

  private updateView(): void {
    const item = this.photos[this.currentIndex];
    if (!item) return;

    const imgEl = this.container.querySelector<HTMLImageElement>('#lightbox-img');
    const counterEl = this.container.querySelector<HTMLElement>('#lightbox-counter');
    const titleEl = this.container.querySelector<HTMLElement>('#lightbox-title');
    const descEl = this.container.querySelector<HTMLElement>('#lightbox-desc');
    const fileEl = this.container.querySelector<HTMLElement>('#lightbox-filename');
    const dotsEl = this.container.querySelector<HTMLElement>('#lightbox-dots');

    if (imgEl) {
      const fallbackSrc = getPhotoSrc(item);
      imgEl.onerror = () => {
        if (imgEl.src !== fallbackSrc) {
          imgEl.src = fallbackSrc;
        }
      };
      // Las fotos cargadas se sirven desde la base de datos.
      imgEl.src = fallbackSrc;
      imgEl.alt = item.alt;
    }

    if (counterEl) {
      counterEl.textContent = `${this.currentIndex + 1} / ${this.photos.length}`;
    }
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.caption;
    if (fileEl) fileEl.textContent = item.filename;

    if (dotsEl) {
      dotsEl.innerHTML = this.photos
        .map(
          (p, i) => `
          <button
            type="button"
            class="lightbox-dot ${i === this.currentIndex ? 'is-active' : ''}"
            aria-label="Ver fotografía ${i + 1}: ${p.title}"
            aria-selected="${i === this.currentIndex ? 'true' : 'false'}"
            data-idx="${i}"
          ></button>
        `,
        )
        .join('');

      dotsEl.querySelectorAll<HTMLButtonElement>('.lightbox-dot').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.idx || '0', 10);
          this.currentIndex = idx;
          this.updateView();
        });
      });
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.prev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    }
  }
}
