/**
 * Ilustraciones botánicas delicadas en SVG para las esquinas de la portada,
 * el marco en arco de la fotografía principal, los divisores y el cierre.
 */
export function renderCornerBotanicalSvg(
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
): string {
  const transforms: Record<typeof position, string> = {
    'top-left': 'rotate(0)',
    'top-right': 'scale(-1, 1)',
    'bottom-left': 'scale(1, -1)',
    'bottom-right': 'scale(-1, -1)',
  };

  return `
    <svg
      class="botanical-corner botanical-corner--${position}"
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style="transform: ${transforms[position]};"
    >
      <!-- Rama principal en dorado apagado y verde elegante -->
      <path
        d="M12 185 C 38 118, 92 56, 190 16"
        stroke="#4B6049"
        stroke-width="1.35"
        stroke-linecap="round"
        opacity="0.48"
      />
      <path
        d="M8 140 C 48 92, 95 54, 152 34"
        stroke="#AC9975"
        stroke-width="1"
        stroke-linecap="round"
        opacity="0.52"
      />
      <!-- Hojas de olivo y eucalipto suaves -->
      <path
        d="M36 142 C 22 126, 26 105, 44 100 C 52 116, 48 134, 36 142 Z"
        fill="#4B6049"
        fill-opacity="0.18"
        stroke="#4B6049"
        stroke-width="1"
        stroke-opacity="0.38"
      />
      <path
        d="M58 114 C 76 122, 94 114, 100 98 C 82 94, 66 100, 58 114 Z"
        fill="#4B6049"
        fill-opacity="0.15"
        stroke="#4B6049"
        stroke-width="1"
        stroke-opacity="0.35"
      />
      <path
        d="M74 88 C 60 72, 64 52, 82 46 C 90 62, 86 78, 74 88 Z"
        fill="#766580"
        fill-opacity="0.14"
        stroke="#766580"
        stroke-width="1"
        stroke-opacity="0.35"
      />
      <path
        d="M104 66 C 122 72, 140 66, 148 50 C 130 46, 114 54, 104 66 Z"
        fill="#4B6049"
        fill-opacity="0.16"
        stroke="#4B6049"
        stroke-width="1"
        stroke-opacity="0.36"
      />
      <path
        d="M128 44 C 118 30, 124 16, 140 12 C 146 24, 140 36, 128 44 Z"
        fill="#766580"
        fill-opacity="0.14"
        stroke="#766580"
        stroke-width="1"
        stroke-opacity="0.32"
      />
      <!-- Pequeños botones florales lavanda y dorado -->
      <circle cx="84" cy="44" r="3" fill="#766580" fill-opacity="0.42" />
      <circle cx="142" cy="12" r="2.5" fill="#AC9975" fill-opacity="0.55" />
      <circle cx="102" cy="96" r="2.5" fill="#AC9975" fill-opacity="0.48" />
    </svg>
  `;
}

export function renderFloralDividerSvg(): string {
  return `
    <div class="floral-divider" aria-hidden="true">
      <svg viewBox="0 0 320 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="16" y1="18" x2="124" y2="18" stroke="#AC9975" stroke-width="0.9" stroke-opacity="0.6" />
        <line x1="196" y1="18" x2="304" y2="18" stroke="#AC9975" stroke-width="0.9" stroke-opacity="0.6" />
        <path
          d="M138 18 C 146 10, 154 10, 160 18 C 154 26, 146 26, 138 18 Z"
          fill="#4B6049"
          fill-opacity="0.22"
          stroke="#4B6049"
          stroke-width="1"
        />
        <path
          d="M182 18 C 174 10, 166 10, 160 18 C 166 26, 174 26, 182 18 Z"
          fill="#4B6049"
          fill-opacity="0.22"
          stroke="#4B6049"
          stroke-width="1"
        />
        <circle cx="160" cy="18" r="3.2" fill="#AC9975" />
        <circle cx="130" cy="18" r="1.8" fill="#766580" fill-opacity="0.65" />
        <circle cx="190" cy="18" r="1.8" fill="#766580" fill-opacity="0.65" />
      </svg>
    </div>
  `;
}

export function renderArchBotanicalSprigSvg(): string {
  return `
    <svg
      class="arch-botanical-sprig"
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22 158 C 46 108, 86 64, 154 24"
        stroke="#AC9975"
        stroke-width="1.3"
        stroke-linecap="round"
      />
      <path
        d="M48 122 C 34 106, 38 86, 56 80 C 64 96, 60 112, 48 122 Z"
        fill="#E1E7D9"
        stroke="#4B6049"
        stroke-width="1.1"
      />
      <path
        d="M72 98 C 90 104, 108 98, 114 82 C 98 78, 82 86, 72 98 Z"
        fill="#E2D8E8"
        stroke="#766580"
        stroke-width="1.1"
      />
      <path
        d="M96 68 C 84 54, 88 36, 104 30 C 112 44, 108 58, 96 68 Z"
        fill="#E1E7D9"
        stroke="#4B6049"
        stroke-width="1.1"
      />
      <circle cx="122" cy="44" r="3.5" fill="#AC9975" />
    </svg>
  `;
}
