import { serverRequest } from '../utils/serverApi';
import { escapeHtml } from '../utils/escapeHtml';
import type { WeddingConfig } from '../types';

export class RsvpModal {
  private isOpen = false;
  private saving = false;
  private submissionId = crypto.randomUUID();
  private keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') this.close(); };
  constructor(private container: HTMLElement, private config: WeddingConfig) { this.render(); }
  public updateConfig(config: WeddingConfig): void { this.config = config; this.render(); }
  public open(): void {
    this.isOpen = true;
    const backdrop = this.container.querySelector<HTMLElement>('#rsvp-modal-backdrop')!;
    backdrop.classList.add('is-open'); backdrop.setAttribute('aria-hidden', 'false');
    document.addEventListener('keydown', this.keydown);
    this.container.querySelector<HTMLInputElement>('input[name="person"]')?.focus();
  }
  public close(): void {
    this.isOpen = false;
    const backdrop = this.container.querySelector<HTMLElement>('#rsvp-modal-backdrop');
    backdrop?.classList.remove('is-open'); backdrop?.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', this.keydown);
  }
  private render(): void {
    this.container.innerHTML = `<div id="rsvp-modal-backdrop" class="rsvp-modal-backdrop ${this.isOpen ? 'is-open' : ''}" role="dialog" aria-modal="true" aria-labelledby="rsvp-modal-title" aria-hidden="${!this.isOpen}">
      <div class="rsvp-modal-card"><div class="rsvp-modal-header"><div><p class="rsvp-modal-kicker">${escapeHtml(this.config.couple.displayTitle)}</p><h2 id="rsvp-modal-title" class="rsvp-modal-title">Asistir</h2></div><button type="button" id="rsvp-close-btn" class="rsvp-close-btn" aria-label="Cerrar">&times;</button></div>
      <p class="rsvp-modal-intro">Será una alegría compartir contigo. Registra hasta 3 personas en total, incluyéndote.</p>
      <form id="rsvp-form" class="rsvp-form">
      <fieldset class="rsvp-fieldset"><legend class="rsvp-label">¿Podrás asistir?</legend><div class="rsvp-radio-grid"><label class="rsvp-radio-card"><input type="radio" name="attendance" value="yes" checked> Sí, voy a asistir</label><label class="rsvp-radio-card"><input type="radio" name="attendance" value="no"> No podré asistir</label></div></fieldset>
      <div id="rsvp-people">${[0,1,2].map(i => `<div class="rsvp-field" data-person="${i}" ${i ? 'hidden' : ''}><label class="rsvp-label" for="person-${i}">${i ? 'Invitado ' + (i+1) : 'Tu nombre y apellido'}</label><input id="person-${i}" class="rsvp-input" name="person" minlength="2" maxlength="160" ${i ? 'disabled' : 'required autocomplete="name"'} placeholder="Nombre completo"></div>`).join('')}</div>
      <button type="button" id="add-person" class="btn-secondary">+ Agregar persona</button><button type="button" id="remove-person" class="btn-secondary" hidden>Quitar última persona</button>
      <div class="rsvp-field"><label class="rsvp-label" for="rsvp-message">Mensaje para los novios (opcional)</label><textarea id="rsvp-message" class="rsvp-textarea" maxlength="2000" rows="3"></textarea></div>
      <button class="btn-primary" type="submit">Guardar respuesta</button><p id="rsvp-status" role="status" aria-live="polite"></p></form></div></div>`;
    this.container.querySelector('#rsvp-close-btn')?.addEventListener('click', () => this.close());
    this.container.querySelector('#rsvp-modal-backdrop')?.addEventListener('click', e => { if (e.target === e.currentTarget) this.close(); });
    let count = 1;
    const add = this.container.querySelector<HTMLButtonElement>('#add-person')!;
    const remove = this.container.querySelector<HTMLButtonElement>('#remove-person')!;
    const sync = () => {
      const attending = this.container.querySelector<HTMLInputElement>('input[name="attendance"]:checked')?.value === 'yes';
      this.container.querySelectorAll<HTMLElement>('[data-person]').forEach((row, i) => {
        row.hidden = i >= count || (!attending && i > 0);
        const input = row.querySelector('input')!; input.disabled = row.hidden; input.required = !row.hidden;
      });
      add.hidden = !attending || count >= 3; remove.hidden = !attending || count <= 1;
    };
    add.addEventListener('click', () => { count = Math.min(3, count + 1); sync(); this.container.querySelector<HTMLInputElement>(`#person-${count-1}`)?.focus(); });
    remove.addEventListener('click', () => { count = Math.max(1, count - 1); sync(); });
    this.container.querySelectorAll('[name="attendance"]').forEach(radio => radio.addEventListener('change', sync));
    this.container.querySelector('form')?.addEventListener('submit', async event => {
      event.preventDefault(); if (this.saving) return;
      const form = event.currentTarget as HTMLFormElement;
      this.container.querySelectorAll<HTMLInputElement>('input[name="person"]').forEach(input => { input.value = input.value.trim(); });
      if (!form.reportValidity()) return;
      const names = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="person"]:enabled')).map(input => input.value);
      const status = this.container.querySelector<HTMLElement>('#rsvp-status')!;
      const button = form.querySelector<HTMLButtonElement>('[type="submit"]')!;
      this.saving = true; button.disabled = true; status.textContent = 'Guardando...';
      try {
        await serverRequest('/api/rsvp', { method: 'POST', body: JSON.stringify({ id: this.submissionId, fullName: names[0], guestNames: names, attendance: new FormData(form).get('attendance'), guestCount: names.length, message: this.container.querySelector<HTMLTextAreaElement>('#rsvp-message')!.value, recipientTarget: 'any' }) });
        status.textContent = 'Tu respuesta quedó guardada. ¡Gracias por acompañarnos en este momento especial!';
      } catch (error) { status.textContent = (error as Error).message; }
      finally { this.saving = false; button.disabled = false; }
    });
  }
}
