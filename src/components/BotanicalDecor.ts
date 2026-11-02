export function renderCornerBotanicalSvg(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): string {
  return `<span class="botanical-corner botanical-corner--${position}" aria-hidden="true"></span>`;
}
export function renderFloralDividerSvg(): string {
  return '<div class="floral-divider"><img class="wedding-monogram" src="/images/monograma.jpeg" alt="B y L ? 18 de diciembre de 2026" loading="lazy"></div>';
}
export function renderArchBotanicalSprigSvg(): string { return ''; }
