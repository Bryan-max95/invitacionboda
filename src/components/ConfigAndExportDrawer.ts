import { DEFAULT_WEDDING_CONFIG } from '../config/weddingConfig';
import { MeridiemOption, PhotoItem, WeddingConfig } from '../types';
import { getPhotoSrc, hasCustomPhoto } from '../utils/photoArtwork';
import { serverRequest } from '../utils/serverApi';

export interface ConfigDrawerCallbacks {
  onConfigUpdated: (newConfig: WeddingConfig) => void;
  onPhotosUpdated: () => void;
}

export class ConfigAndExportDrawer {
  private container: HTMLElement;
  private config: WeddingConfig;
  private callbacks: ConfigDrawerCallbacks;
  private isOpen = false;
  private activeTab: 'photos' | 'settings' = 'photos';
  private statusBanner = '';

  constructor(
    container: HTMLElement,
    config: WeddingConfig,
    callbacks: ConfigDrawerCallbacks,
  ) {
    this.container = container;
    this.config = config;
    this.callbacks = callbacks;
    this.isOpen = true;
    this.render();
  }

  public open(tab: 'photos' | 'settings' = 'photos'): void {
    this.activeTab = tab;
    this.isOpen = true;
    this.statusBanner = '';
    this.render();
  }

  public close(): void {
    window.location.assign('/');
  }

  public render(): void {
    this.container.innerHTML = `
      <div
        id="config-drawer-backdrop"
        class="admin-panel-page"
        aria-labelledby="config-drawer-title"
        aria-hidden="${this.isOpen ? 'false' : 'true'}"
      >
        <div class="rsvp-modal-card config-drawer-card admin-panel-card">
          <div class="rsvp-modal-header">
            <div>
              <p class="rsvp-modal-kicker">Panel de Administración · Bryan &amp; Lyndel</p>
              <h2 id="config-drawer-title" class="rsvp-modal-title">Administrar Invitación y Fotos</h2>
            </div>
            <button
              type="button"
              id="config-drawer-close"
              class="rsvp-close-btn"
              aria-label="Cerrar panel de administración"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <p class="rsvp-contact-note"><a href="/">&larr; Ver invitaci&oacute;n</a></p>
          <div class="config-tabs" aria-label="Opciones del panel">
            <button
              type="button"
              class="config-tab-btn ${this.activeTab === 'photos' ? 'is-active' : ''}"
              data-tab="photos"
            >
              Subir Fotografías (4)
            </button>
            <button
              type="button"
              class="config-tab-btn ${this.activeTab === 'settings' ? 'is-active' : ''}"
              data-tab="settings"
            >
              Datos e Itinerario
            </button>
          </div>

          ${
            this.statusBanner
              ? `<div class="admin-status-banner" role="status">${this.escapeAttr(this.statusBanner)}</div>`
              : ''
          }

          ${this.activeTab === 'photos' ? this.renderPhotosTab() : ''}
          ${this.activeTab === 'settings' ? this.renderSettingsTab() : ''}
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private renderPhotosTab(): string {
    const roleLabels: Record<PhotoItem['id'], string> = {
      'bl-40': '1. Foto Principal (Portada Hero en arco)',
      'bl-66': '2. Foto Nuestra Promesa (Sección lavanda + Galería)',
      'bl-85': '3. Foto Galería (Momento especial 3)',
      'bl-94': '4. Foto Galería (Momento especial 4)',
    };

    return `
      <div class="rsvp-form">
        <p class="rsvp-contact-note">
          Los cambios se guardan en la base de datos y se muestran en todos los dispositivos. Desde este <strong>Panel de Administrador</strong> puedes subir las fotografías reales de <strong>Bryan &amp; Lyndel</strong> desde tu celular o computadora. Se optimizan y guardan automáticamente para verse al instante en toda la invitación y en el visor de pantalla completa.
        </p>

        <div class="admin-photo-grid">
          ${this.config.photos
            .map(
              (photo) => `
              <div class="admin-photo-card">
                <div class="admin-photo-card__preview">
                  <img
                    src="${getPhotoSrc(photo)}"
                    alt="${photo.alt}"
                    class="admin-photo-card__img"
                    referrerpolicy="no-referrer"
                  />
                  <span class="admin-photo-card__badge ${hasCustomPhoto(photo) ? 'is-custom' : ''}">
                    ${hasCustomPhoto(photo) ? 'Foto personalizada activa' : 'Sin fotografía'}
                  </span>
                </div>

                <div class="admin-photo-card__body">
                  <strong class="admin-photo-card__role">${roleLabels[photo.id]}</strong>
                  <span class="admin-photo-card__filename">${photo.filename} · ${photo.caption}</span>

                  <label class="btn-primary admin-upload-btn">
                    <span>Subir / Cambiar imagen</span>
                    <input
                      type="file"
                      accept="image/*"
                      data-photo-upload="${photo.id}"
                      hidden
                    />
                  </label>
                </div>
              </div>
            `,
            )
            .join('')}
        </div>

        <div class="config-actions-row">
          <button type="button" id="cfg-clear-photos-btn" class="btn-secondary">
            Quitar fotos cargadas
          </button>
          <button type="button" id="cfg-done-photos-btn" class="btn-primary">
            Guardar y ver invitación
          </button>
        </div>
      </div>
    `;
  }

  private renderSettingsTab(): string {
    return `
      <form id="config-settings-form" class="rsvp-form" novalidate>
        <p class="rsvp-contact-note">
          Personaliza la hora de inicio, los datos de la iglesia, los números de WhatsApp y los horarios del itinerario del <strong>18 de diciembre de 2026</strong>.
        </p>

        <div class="config-two-col">
          <div class="rsvp-field">
            <label class="rsvp-label" for="cfg-hour">Hora de inicio</label>
            <input
              id="cfg-hour"
              type="text"
              class="rsvp-input"
              value="${this.escapeAttr(this.config.time.hour)}"
              placeholder="6:00"
            />
          </div>
          <div class="rsvp-field">
            <label class="rsvp-label" for="cfg-meridiem">Formato AM / PM</label>
            <select id="cfg-meridiem" class="rsvp-input">
              <option value="PM" ${this.config.time.meridiem === 'PM' ? 'selected' : ''}>PM (Ej. 6:00 PM)</option>
              <option value="AM" ${this.config.time.meridiem === 'AM' ? 'selected' : ''}>AM (Ej. 6:00 AM)</option>
              <option value="" ${this.config.time.meridiem === '' ? 'selected' : ''}>Sin AM/PM</option>
            </select>
          </div>
        </div>

        <div class="rsvp-field">
          <label class="rsvp-label" for="cfg-church">Nombre de la iglesia <span class="rsvp-optional">(opcional)</span></label>
          <input
            id="cfg-church"
            type="text"
            class="rsvp-input"
            value="${this.escapeAttr(this.config.venue.churchName)}"
            placeholder="Ej. Iglesia Cristiana Evangélica..."
          />
        </div>

        <div class="rsvp-field">
          <label class="rsvp-label" for="cfg-address">Dirección de la iglesia <span class="rsvp-optional">(habilita botón “Ver ubicación”)</span></label>
          <input
            id="cfg-address"
            type="text"
            class="rsvp-input"
            value="${this.escapeAttr(this.config.venue.address)}"
            placeholder="Ej. Tegucigalpa, Honduras"
          />
        </div>

        <div class="rsvp-field">
          <label class="rsvp-label" for="cfg-mapurl">Enlace de ubicación (Google Maps / Waze)</label>
          <input
            id="cfg-mapurl"
            type="url"
            class="rsvp-input"
            value="${this.escapeAttr(this.config.venue.mapUrl)}"
            placeholder="https://maps.google.com/..."
          />
        </div>

        <div class="config-two-col">
          <div class="rsvp-field">
            <label class="rsvp-label" for="cfg-bryan-phone">WhatsApp de Bryan (con código de país)</label>
            <input
              id="cfg-bryan-phone"
              type="tel"
              class="rsvp-input"
              value="${this.escapeAttr(this.config.whatsapp.bryanPhone)}"
              placeholder="Ej. 50499998888"
            />
          </div>
          <div class="rsvp-field">
            <label class="rsvp-label" for="cfg-lyndel-phone">WhatsApp de Lyndel (con código de país)</label>
            <input
              id="cfg-lyndel-phone"
              type="tel"
              class="rsvp-input"
              value="${this.escapeAttr(this.config.whatsapp.lyndelPhone)}"
              placeholder="Ej. 50488887777"
            />
          </div>
        </div>

        <div class="admin-itinerary-editor">
          <span class="rsvp-label">Itinerario de la Boda (5 momentos · Inicio 5:00 PM)</span>
          ${this.config.itinerary
            .map(
              (item, index) => `
              <div class="admin-itinerary-row">
                <input
                  type="text"
                  class="rsvp-input"
                  data-itin-time="${index}"
                  value="${this.escapeAttr(item.time)}"
                  placeholder="Hora (ej. 5:00 PM)"
                />
                <input
                  type="text"
                  class="rsvp-input"
                  data-itin-title="${index}"
                  value="${this.escapeAttr(item.title)}"
                  placeholder="Actividad"
                />
              </div>
            `,
            )
            .join('')}
        </div>

        <div class="config-actions-row">
          <button type="button" id="cfg-reset-btn" class="btn-secondary">
            Restaurar valores iniciales
          </button>
          <button type="submit" class="btn-primary">
            Guardar y actualizar invitación
          </button>
        </div>
      </form>
    `;
  }

  /**
   * Comprime y redimensiona la imagen subida (máx. 1600px) para que pueda almacenarse
   * antes de enviarla al servidor.
   */
  private compressImageFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Error al leer archivo'));
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen no válida'));
        img.onload = () => {
          const maxDim = 1600;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.86));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  private bindEvents(): void {
    const backdrop = this.container.querySelector<HTMLElement>('#config-drawer-backdrop');
    const closeBtn = this.container.querySelector<HTMLButtonElement>('#config-drawer-close');

    closeBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    this.container.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab') as 'photos' | 'settings';
        if (tab) {
          this.activeTab = tab;
          this.statusBanner = '';
          this.render();
        }
      });
    });

    // Formulario de datos e itinerario
    const settingsForm = this.container.querySelector<HTMLFormElement>('#config-settings-form');
    settingsForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const hour =
        this.container.querySelector<HTMLInputElement>('#cfg-hour')?.value.trim() || '6:00';
      const meridiem = (this.container.querySelector<HTMLSelectElement>('#cfg-meridiem')?.value ||
        '') as MeridiemOption;
      const churchName =
        this.container.querySelector<HTMLInputElement>('#cfg-church')?.value.trim() || '';
      const address =
        this.container.querySelector<HTMLInputElement>('#cfg-address')?.value.trim() || '';
      const mapUrl =
        this.container.querySelector<HTMLInputElement>('#cfg-mapurl')?.value.trim() || '';
      const bryanPhone =
        this.container.querySelector<HTMLInputElement>('#cfg-bryan-phone')?.value.trim() || '';
      const lyndelPhone =
        this.container.querySelector<HTMLInputElement>('#cfg-lyndel-phone')?.value.trim() || '';

      const updatedItinerary = this.config.itinerary.map((item, idx) => {
        const timeInput = this.container.querySelector<HTMLInputElement>(
          `[data-itin-time="${idx}"]`,
        );
        const titleInput = this.container.querySelector<HTMLInputElement>(
          `[data-itin-title="${idx}"]`,
        );
        return {
          ...item,
          time: timeInput ? timeInput.value.trim() || item.time : item.time,
          title: titleInput ? titleInput.value.trim() || item.title : item.title,
        };
      });

      const nextConfig: WeddingConfig = {
        ...this.config,
        time: {
          ...this.config.time,
          hour,
          meridiem,
        },
        venue: {
          ...this.config.venue,
          churchName,
          address,
          mapUrl,
        },
        whatsapp: {
          ...this.config.whatsapp,
          bryanPhone,
          lyndelPhone,
          defaultRecipientPhone: bryanPhone || lyndelPhone,
        },
        itinerary: updatedItinerary,
      };

      const button = settingsForm.querySelector<HTMLButtonElement>('button[type="submit"]');
      if (button) button.disabled = true;
      try {
        await serverRequest('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nextConfig) });
        this.config = nextConfig;
        this.callbacks.onConfigUpdated(this.config);
        this.statusBanner = 'Datos guardados en la base de datos.';
        this.render();
      } catch (error) {
        const status = this.container.querySelector<HTMLElement>('#config-save-error') || document.createElement('p');
        status.id = 'config-save-error';
        status.setAttribute('role', 'alert');
        status.textContent = (error as Error).message;
        settingsForm.append(status);
        if (button) button.disabled = false;
      }
    });

    const resetBtn = this.container.querySelector<HTMLButtonElement>('#cfg-reset-btn');
    resetBtn?.addEventListener('click', async () => {
      if (!window.confirm('Restaurar los datos iniciales para todos los visitantes?')) return;
      resetBtn.disabled = true;
      try {
        await serverRequest('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(DEFAULT_WEDDING_CONFIG) });
        this.config = { ...structuredClone(DEFAULT_WEDDING_CONFIG), photos: this.config.photos };
        this.callbacks.onConfigUpdated(this.config);
        this.statusBanner = 'Se restauraron los datos iniciales.';
      } catch (error) { this.statusBanner = (error as Error).message; }
      this.render();
    });

    // Subida de fotografías en el Panel Admin
    this.container
      .querySelectorAll<HTMLInputElement>('[data-photo-upload]')
      .forEach((fileInput) => {
        fileInput.addEventListener('change', async () => {
          const file = fileInput.files?.[0];
          const photoId = fileInput.getAttribute('data-photo-upload') as PhotoItem['id'];
          if (!file || !photoId) return;
          if (!file.type.startsWith('image/')) {
            this.statusBanner = 'Selecciona un archivo de imagen válido.';
            this.render();
            return;
          }

          fileInput.disabled = true;
          try {
            const compressedDataUrl = await this.compressImageFile(file);
            const image = await (await fetch(compressedDataUrl)).blob();
            await serverRequest(`/api/photos/${photoId}`, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: image });
            this.config.photos = this.config.photos.map(photo => photo.id === photoId ? { ...photo, publicPath: `/api/photos/${photoId}?v=${Date.now()}` } : photo);
            this.callbacks.onPhotosUpdated();
            this.statusBanner = '¡Fotografía cargada y actualizada con éxito!';
            this.render();
          } catch (error) {
            this.statusBanner = (error as Error).message;
            this.render();
          }
        });
      });

    const clearPhotosBtn =
      this.container.querySelector<HTMLButtonElement>('#cfg-clear-photos-btn');
    clearPhotosBtn?.addEventListener('click', async () => {
      if (!window.confirm('Quitar las fotos cargadas para todos los visitantes?')) return;
      clearPhotosBtn.disabled = true;
      try {
        await serverRequest('/api/admin/photos', { method: 'DELETE' });
        this.config.photos = structuredClone(DEFAULT_WEDDING_CONFIG.photos);
      this.callbacks.onPhotosUpdated();
      this.statusBanner = 'Se quitaron las fotografías cargadas.';
      } catch (error) { this.statusBanner = (error as Error).message; }
      this.render();
    });

    const donePhotosBtn = this.container.querySelector<HTMLButtonElement>('#cfg-done-photos-btn');
    donePhotosBtn?.addEventListener('click', () => this.close());


  }

  private escapeAttr(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
