export function renderCornerBotanicalSvg(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): string {
  return `<span class="botanical-corner botanical-corner--${position}" aria-hidden="true"></span>`;
}
export function renderFloralDividerSvg(): string {
  return '<div class="floral-divider"><div class="wedding-monogram wedding-monogram--type" aria-label="Lyndel y Bryan, 18 de diciembre de 2026"><span>L &amp; B</span><small>18.12.2026</small></div></div>';
}
export function renderArchBotanicalSprigSvg(): string { return ''; }
