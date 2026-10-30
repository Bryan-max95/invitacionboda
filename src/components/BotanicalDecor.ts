/** Lirios de seis pétalos, blancos y morados, acompañados de ramas de olivo. */
function lily(x: number, y: number, scale: number, purple: boolean, angle = 0): string {
  const petal = purple ? '#a58abe' : '#fffdf8';
  const edge = purple ? '#75518f' : '#b9b49c';
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">
    ${[0, 60, 120, 180, 240, 300].map(rotation => `<g transform="rotate(${rotation})"><path d="M0 4 C-7-5-20-22-6-45 Q0-53 6-45 C20-22 7-5 0 4Z" fill="${petal}" stroke="${edge}" stroke-width=".8"/><path d="M0-2 Q-3-19 0-38" stroke="${edge}" stroke-width=".65" opacity=".45"/></g>`).join('')}
    ${[-32, 0, 32].map(rotation => `<g transform="rotate(${rotation})"><path d="M0 1 Q5-8 3-18" stroke="#847644" stroke-width="1.2"/><ellipse cx="3" cy="-18" rx="1.8" ry="3" fill="#b4994c"/></g>`).join('')}
    <circle r="3" fill="#a4a76a"/>
  </g>`;
}

function oliveBranch(): string {
  return `<g stroke="#69733f" stroke-linecap="round">
    <path d="M20 211 Q51 110 207 28 M45 164 Q44 113 26 78 M88 111 Q151 111 198 78" stroke-width="2" fill="none"/>
    ${[[34,179,-32],[48,153,65],[66,128,-36],[90,105,60],[116,83,-30],[145,62,62],[177,43,-28],[43,128,-60],[33,99,-36],[132,105,50],[164,94,55]].map(([x,y,r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0 Q-14-16 0-38 Q14-16 0 0" fill="#899260" fill-opacity=".82" stroke-width=".6"/><path d="M0-3V-31" stroke-width=".7" opacity=".65"/></g>`).join('')}
  </g>`;
}

export function renderCornerBotanicalSvg(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'): string {
  const transforms = { 'top-left': 'rotate(0)', 'top-right': 'scale(-1, 1)', 'bottom-left': 'scale(1, -1)', 'bottom-right': 'scale(-1, -1)' };
  return `<svg class="botanical-corner botanical-corner--${position}" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" style="transform:${transforms[position]}">
    ${oliveBranch()}
    ${lily(75, 156, .83, false, -15)}
    ${lily(120, 91, .86, true, 15)}
    ${lily(184, 55, .62, false, 30)}
    ${lily(39, 213, .48, true, -25)}
  </svg>`;
}

export function renderFloralDividerSvg(): string {
  return `<div class="floral-divider" aria-hidden="true"><svg viewBox="0 0 420 100" fill="none" xmlns="http://www.w3.org/2000/svg" focusable="false">
    <path d="M18 55 Q110 78 210 50 Q310 78 402 55" stroke="#78834e" stroke-width="1.2"/>
    ${[65,100,135,285,320,355].map((x, i) => `<path d="M${x} 64 q${i < 3 ? '-20' : '20'}-4 ${i < 3 ? '-24' : '24'}-23 q${i < 3 ? '23' : '-23'} 2 ${i < 3 ? '24' : '-24'} 23Z" fill="#899260" fill-opacity=".7"/>`).join('')}
    ${lily(167, 53, .56, false, -20)}${lily(210, 45, .79, true)}${lily(254, 53, .56, false, 20)}
  </svg></div>`;
}

export function renderArchBotanicalSprigSvg(): string {
  return `<svg class="arch-botanical-sprig" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${oliveBranch()}${lily(92, 133, .95, false, -20)}${lily(154, 73, .9, true, 20)}${lily(48, 202, .58, true)}
  </svg>`;
}
