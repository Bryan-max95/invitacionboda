import { serverRequest } from '../utils/serverApi';
import { AttendanceChoice, RsvpFormData, WeddingConfig } from '../types';

export class RsvpModal {
  private container: HTMLElement;
  private config: WeddingConfig;
  private isOpen = false;
  private formData: RsvpFormData = {
    fullName: '',
    attendance: 'yes',
    guestCount: 1,
    message: '',
    recipientTarget: 'bryan',
  };
  private submissionId: string | null = null;
  private saving = false;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor(container: HTMLElement, config: WeddingConfig) {
    this.container = container;
    this.config = config;
    this.boundKeyDown = (e: KeyboardEvent) => {
      if (this.isOpen && e.key === 'Escape') {
        e.preventDefault();
        this.close();
      }
    };
    this.render();
  }

  public updateConfig(config: WeddingConfig): void {
    this.config = config;
    this.render();
  }

  public open(): void {
    this.isOpen = true;
    const backdrop = this.container.querySelector<HTMLElement>('#rsvp-modal-backdrop');
    if (backdrop) {
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    document.addEventListener('keydown', this.boundKeyDown);
    const nameInput = this.container.querySelector<HTMLInputElement>('#rsvp-fullname');
    window.setTimeout(() => nameInput?.focus(), 60);
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    const backdrop = this.container.querySelector<HTMLElement>('#rsvp-modal-backdrop');
    if (backdrop) {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', this.boundKeyDown);
  }

  /**
   * Construye el texto exacto del mensaje para WhatsApp según la respuesta del invitado.
   */
  public buildWhatsAppMessage(): string {
    const cleanName = this.formData.fullName.trim() || '[tu nombre]';
    const cleanOptionalMsg = this.formData.message.trim();
    const shortDate = this.config.date.shortDate || '22/12/2026';

    if (this.formData.attendance === 'yes') {
      const count = Math.max(1, Number(this.formData.guestCount) || 1);
      const countPhrase =
        count === 1
          ? `Seremos 1 persona en total.`
          : `Seremos ${count} personas en total.`;

      const parts = [
        `Hola Bryan y Lyndel. Soy ${cleanName}.`,
        `Confirmo mi asistencia a su boda del ${shortDate}.`,
        countPhrase,
      ];

      if (cleanOptionalMsg) {
        const normalizedMsg = /[.!?]$/.test(cleanOptionalMsg)
          ? cleanOptionalMsg
          : `${cleanOptionalMsg}.`;
        parts.push(normalizedMsg);
      }

      parts.push('¡Muchas felicidades!');
      return parts.join(' ');
    } else {
      const parts = [
        `Hola Bryan y Lyndel. Soy ${cleanName}.`,
        `Muchas gracias por la invitación a su boda del ${shortDate}; lamentablemente no podré asistir en esta ocasión.`,
      ];

      if (cleanOptionalMsg) {
        const normalizedMsg = /[.!?]$/.test(cleanOptionalMsg)
          ? cleanOptionalMsg
          : `${cleanOptionalMsg}.`;
        parts.push(normalizedMsg);
      }

      parts.push('¡Les deseo muchas felicidades!');
      return parts.join(' ');
    }
  }

  /**
   * Obtiene el enlace de WhatsApp:
   * - Si hay un número configurado con código de país, dirige a ese número.
   * - Mientras no se proporcione, abre WhatsApp con el mensaje listo para que el invitado
   *   seleccione el contacto de Bryan o Lyndel en su lista de WhatsApp.
   */
  public buildWhatsAppUrl(): string {
    const message = this.buildWhatsAppMessage();
    const encodedText = encodeURIComponent(message);

    let targetPhone = '';
    if (this.formData.recipientTarget === 'bryan' && this.config.whatsapp.bryanPhone.trim()) {
      targetPhone = this.config.whatsapp.bryanPhone.replace(/[^\d]/g, '');
    } else if (
      this.formData.recipientTarget === 'lyndel' &&
      this.config.whatsapp.lyndelPhone.trim()
    ) {
      targetPhone = this.config.whatsapp.lyndelPhone.replace(/[^\d]/g, '');
    } else if (this.config.whatsapp.defaultRecipientPhone.trim()) {
      targetPhone = this.config.whatsapp.defaultRecipientPhone.replace(/[^\d]/g, '');
    }

    if (targetPhone) {
      return `https://wa.me/${targetPhone}?text=${encodedText}`;
    }

    // Sin número fijo configurado: permite elegir el contacto de Bryan o Lyndel directamente en WhatsApp
    return `https://wa.me/?text=${encodedText}`;
  }

  private render(): void {
    const hasConfiguredPhones = Boolean(
      this.config.whatsapp.defaultRecipientPhone.trim() ||
        this.config.whatsapp.bryanPhone.trim() ||
        this.config.whatsapp.lyndelPhone.trim(),
    );

    this.container.innerHTML = `
      <div
        id="rsvp-modal-backdrop"
        class="rsvp-modal-backdrop ${this.isOpen ? 'is-open' : ''}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-modal-title"
        aria-hidden="${this.isOpen ? 'false' : 'true'}"
      >
        <div class="rsvp-modal-card">
          <div class="rsvp-modal-header">
            <div>
              <p class="rsvp-modal-kicker">${this.config.couple.displayTitle} · ${this.config.date.shortDate}</p>
              <h2 id="rsvp-modal-title" class="rsvp-modal-title">Confirmar invitación</h2>
            </div>
            <button
              type="button"
              id="rsvp-close-btn"
              class="rsvp-close-btn"
              aria-label="Cerrar ventana de confirmación"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <p class="rsvp-modal-intro">
            Tu presencia nos hace felices. Cuéntanos si nos acompañarás en este día especial.
          </p>

          <form id="rsvp-form" class="rsvp-form" novalidate>
            <!-- Nombre y apellido (obligatorio) -->
            <div class="rsvp-field">
              <label for="rsvp-fullname" class="rsvp-label">
                Nombre y apellido <span class="rsvp-required">*</span>
              </label>
              <input
                type="text"
                id="rsvp-fullname"
                name="fullName"
                class="rsvp-input"
                placeholder="Tu nombre completo"
                value="${this.escapeHtml(this.formData.fullName)}"
                required
                autocomplete="name"
              />
              <p id="rsvp-name-error" class="rsvp-error-msg" hidden>
                Por favor ingresa tu nombre y apellido para preparar tu mensaje.
              </p>
            </div>

            <!-- Asistencia -->
            <fieldset class="rsvp-fieldset">
              <legend class="rsvp-label">Asistencia <span class="rsvp-required">*</span></legend>
              <div class="rsvp-radio-grid">
                <label class="rsvp-radio-card ${this.formData.attendance === 'yes' ? 'is-selected' : ''}" data-attendance-card="yes">
                  <input
                    type="radio"
                    name="attendance"
                    value="yes"
                    ${this.formData.attendance === 'yes' ? 'checked' : ''}
                  />
                  <span class="rsvp-radio-indicator" aria-hidden="true"></span>
                  <span class="rsvp-radio-text">Sí, con mucho gusto</span>
                </label>

                <label class="rsvp-radio-card ${this.formData.attendance === 'no' ? 'is-selected' : ''}" data-attendance-card="no">
                  <input
                    type="radio"
                    name="attendance"
                    value="no"
                    ${this.formData.attendance === 'no' ? 'checked' : ''}
                  />
                  <span class="rsvp-radio-indicator" aria-hidden="true"></span>
                  <span class="rsvp-radio-text">No podré asistir</span>
                </label>
              </div>
            </fieldset>

            <!-- Personas en total (cuando confirme que asistirá) -->
            <div
              id="rsvp-guests-wrap"
              class="rsvp-field ${this.formData.attendance === 'yes' ? '' : 'is-hidden'}"
            >
              <label for="rsvp-guest-count" class="rsvp-label">
                Personas en total (incluyéndote)
              </label>
              <div class="rsvp-stepper-row">
                <button
                  type="button"
                  id="rsvp-guest-minus"
                  class="rsvp-stepper-btn"
                  aria-label="Disminuir cantidad de personas"
                >
                  −
                </button>
                <input
                  type="number"
                  id="rsvp-guest-count"
                  name="guestCount"
                  class="rsvp-input rsvp-input--number tabular-nums"
                  min="1"
                  max="12"
                  value="${this.formData.guestCount}"
                />
                <button
                  type="button"
                  id="rsvp-guest-plus"
                  class="rsvp-stepper-btn"
                  aria-label="Aumentar cantidad de personas"
                >
                  +
                </button>
                <span class="rsvp-stepper-hint">
                  Incluyéndote a ti en el total
                </span>
              </div>
            </div>

            <!-- Selección de contacto de Bryan o Lyndel -->
            <div class="rsvp-field">
              <label class="rsvp-label">
                Destinatario en WhatsApp
              </label>
              <div class="rsvp-contact-selector">
                <button
                  type="button"
                  class="rsvp-contact-tab ${this.formData.recipientTarget === 'bryan' ? 'is-active' : ''}"
                  data-recipient="bryan"
                >
                  Contacto de Bryan${this.config.whatsapp.bryanPhone ? ` (+${this.config.whatsapp.bryanPhone.replace(/[^\d]/g, '')})` : ''}
                </button>
                <button
                  type="button"
                  class="rsvp-contact-tab ${this.formData.recipientTarget === 'lyndel' ? 'is-active' : ''}"
                  data-recipient="lyndel"
                >
                  Contacto de Lyndel${this.config.whatsapp.lyndelPhone ? ` (+${this.config.whatsapp.lyndelPhone.replace(/[^\d]/g, '')})` : ''}
                </button>
              </div>
              <p class="rsvp-contact-note">
                ${
                  hasConfiguredPhones
                    ? 'Se abrirá el chat directo con el contacto seleccionado.'
                    : 'Al abrir WhatsApp podrás elegir a Bryan o a Lyndel en tu lista de contactos para enviarle este mensaje.'
                }
              </p>
            </div>

            <!-- Mensaje para la pareja (opcional) -->
            <div class="rsvp-field">
              <label for="rsvp-message" class="rsvp-label">
                Mensaje para la pareja <span class="rsvp-optional">(opcional)</span>
              </label>
              <textarea
                id="rsvp-message"
                name="message"
                rows="3"
                class="rsvp-textarea"
                placeholder="Escribe unas palabras o buenos deseos para Bryan y Lyndel..."
              >${this.escapeHtml(this.formData.message)}</textarea>
            </div>

            <!-- Vista previa del mensaje que se enviará -->
            <div class="rsvp-preview-box">
              <div class="rsvp-preview-header">
                <span class="rsvp-preview-label">Vista previa del mensaje para WhatsApp</span>
                <button
                  type="button"
                  id="rsvp-copy-msg-btn"
                  class="rsvp-copy-msg-btn"
                >
                  Copiar texto
                </button>
              </div>
              <p id="rsvp-message-preview" class="rsvp-preview-text">
                ${this.escapeHtml(this.buildWhatsAppMessage())}
              </p>
            </div>

            <!-- Aviso importante sobre completar el envío en WhatsApp -->
            <div class="rsvp-whatsapp-notice" role="note">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4m0 4h.01" stroke-linecap="round" />
              </svg>
              <span>
                Tu respuesta se guardará al confirmar. Después puedes enviarla también por WhatsApp.
              </span>
            </div>

            <div class="rsvp-actions">
              <a
                id="rsvp-whatsapp-link"
                href="${this.buildWhatsAppUrl()}"
                target="_blank"
                rel="noopener noreferrer"
                class="btn-primary rsvp-submit-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
                  <path
                    d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
                <span>Guardar confirmación</span>
              </a>
            </div>

            <p id="rsvp-step-reminder" class="rsvp-step-reminder" hidden>
              WhatsApp se ha abierto con tu mensaje preparado. Recuerda pulsar <strong>Enviar</strong> dentro de WhatsApp para que Bryan y Lyndel reciban tu confirmación.
            </p>
          </form>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  private bindEvents(): void {
    const backdrop = this.container.querySelector<HTMLElement>('#rsvp-modal-backdrop');
    const closeBtn = this.container.querySelector<HTMLButtonElement>('#rsvp-close-btn');
    const nameInput = this.container.querySelector<HTMLInputElement>('#rsvp-fullname');
    const nameError = this.container.querySelector<HTMLElement>('#rsvp-name-error');
    const guestInput = this.container.querySelector<HTMLInputElement>('#rsvp-guest-count');
    const minusBtn = this.container.querySelector<HTMLButtonElement>('#rsvp-guest-minus');
    const plusBtn = this.container.querySelector<HTMLButtonElement>('#rsvp-guest-plus');
    const guestsWrap = this.container.querySelector<HTMLElement>('#rsvp-guests-wrap');
    const msgTextarea = this.container.querySelector<HTMLTextAreaElement>('#rsvp-message');
    const whatsappLink = this.container.querySelector<HTMLAnchorElement>('#rsvp-whatsapp-link');
    const copyMsgBtn = this.container.querySelector<HTMLButtonElement>('#rsvp-copy-msg-btn');
    const stepReminder = this.container.querySelector<HTMLElement>('#rsvp-step-reminder');

    closeBtn?.addEventListener('click', () => this.close());
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) this.close();
    });

    const syncPreviewAndLink = () => {
      const previewEl = this.container.querySelector<HTMLElement>('#rsvp-message-preview');
      if (previewEl) {
        previewEl.textContent = this.buildWhatsAppMessage();
      }
      if (whatsappLink) {
        whatsappLink.href = this.buildWhatsAppUrl();
      }
    };

    nameInput?.addEventListener('input', () => {
      this.formData.fullName = nameInput.value;
      if (this.formData.fullName.trim() && nameError) {
        nameError.hidden = true;
        nameInput.classList.remove('has-error');
      }
      syncPreviewAndLink();
    });

    this.container
      .querySelectorAll<HTMLInputElement>('input[name="attendance"]')
      .forEach((radio) => {
        radio.addEventListener('change', () => {
          this.formData.attendance = radio.value as AttendanceChoice;
          this.container.querySelectorAll<HTMLElement>('[data-attendance-card]').forEach((card) => {
            card.classList.toggle(
              'is-selected',
              card.getAttribute('data-attendance-card') === this.formData.attendance,
            );
          });
          if (guestsWrap) {
            guestsWrap.classList.toggle('is-hidden', this.formData.attendance !== 'yes');
          }
          syncPreviewAndLink();
        });
      });

    const updateCount = (nextVal: number) => {
      const clamped = Math.max(1, Math.min(12, nextVal));
      this.formData.guestCount = clamped;
      if (guestInput) guestInput.value = String(clamped);
      syncPreviewAndLink();
    };

    minusBtn?.addEventListener('click', () => updateCount(this.formData.guestCount - 1));
    plusBtn?.addEventListener('click', () => updateCount(this.formData.guestCount + 1));
    guestInput?.addEventListener('input', () => {
      const parsed = parseInt(guestInput.value, 10);
      if (!Number.isNaN(parsed)) {
        updateCount(parsed);
      }
    });

    this.container
      .querySelectorAll<HTMLButtonElement>('[data-recipient]')
      .forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-recipient') as 'bryan' | 'lyndel';
          this.formData.recipientTarget = target;
          this.container.querySelectorAll<HTMLButtonElement>('[data-recipient]').forEach((b) => {
            b.classList.toggle('is-active', b === btn);
          });
          syncPreviewAndLink();
        });
      });

    msgTextarea?.addEventListener('input', () => {
      this.formData.message = msgTextarea.value;
      syncPreviewAndLink();
    });

    copyMsgBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(this.buildWhatsAppMessage());
        const original = copyMsgBtn.textContent;
        copyMsgBtn.textContent = '¡Mensaje copiado!';
        window.setTimeout(() => {
          copyMsgBtn.textContent = original || 'Copiar texto';
        }, 2200);
      } catch {
        // Ignore clipboard errors
      }
    });

    whatsappLink?.addEventListener('click', async (e) => {
      e.preventDefault();
      if (this.saving) return;
      if (!this.formData.fullName.trim()) {
        e.preventDefault();
        if (nameError) nameError.hidden = false;
        nameInput?.classList.add('has-error');
        nameInput?.focus();
        return;
      }

      this.saving = true;
      whatsappLink?.setAttribute('aria-disabled', 'true');
      if (stepReminder) { stepReminder.hidden = false; stepReminder.textContent = 'Guardando confirmacion...'; }
      try {
        if (!this.submissionId) {
          try { this.submissionId = localStorage.getItem('byl_rsvp_id'); } catch {}
          if (!this.submissionId) this.submissionId = crypto.randomUUID();
        }
        await serverRequest('/api/rsvp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...this.formData, id: this.submissionId }) });
        try { localStorage.setItem('byl_rsvp_id', this.submissionId); } catch {}
        if (stepReminder) {
          stepReminder.replaceChildren(document.createTextNode('Tu respuesta se ha guardado. '));
          const link = document.createElement('a');
          link.href = this.buildWhatsAppUrl(); link.target = '_blank'; link.rel = 'noopener noreferrer';
          link.textContent = 'Enviar tambien por WhatsApp';
          stepReminder.append(link);
        }
      } catch (error) {
        if (stepReminder) stepReminder.textContent = (error as Error).message;
      } finally {
        this.saving = false;
        whatsappLink?.removeAttribute('aria-disabled');
      }
    });
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
