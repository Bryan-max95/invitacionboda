import { GIFT_MESSAGE } from '../config/weddingMessages';

export function renderGiftMessage(placement: 'hero' | 'closing'): string {
  return `<aside class="gift-message gift-message--${placement}" aria-label="Un mensaje de los novios">
    <span class="gift-message__icon" aria-hidden="true">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="9" width="24" height="17" rx="2" />
        <path d="m5 10 11 9 11-9M5 25l8-8m14 8-8-8" />
        <path d="M16 9s-5-2.8-5-5.2c0-2 3-2.4 5 0 2-2.4 5-2 5 0C21 6.2 16 9 16 9Z" />
      </svg>
    </span>
    <div class="gift-message__body">
      <span class="gift-message__eyebrow">TU PRESENCIA ES NUESTRO MEJOR REGALO</span>
      <p>${GIFT_MESSAGE}</p>
    </div>
    <span class="gift-message__ornament" aria-hidden="true">✧</span>
  </aside>`;
}
