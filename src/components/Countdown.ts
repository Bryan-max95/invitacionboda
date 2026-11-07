import type { CountdownResult, WeddingConfig } from '../types';
import { escapeHtml } from '../utils/escapeHtml';

/** Resolve the configured wedding date and local time in its own timezone. */
export function calculateWeddingCountdown(config: WeddingConfig, now: Date = new Date()): CountdownResult {
  const timeZone = config.date.timezone || 'America/Tegucigalpa';
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const partsOf = (date: Date) => Object.fromEntries(formatter.formatToParts(date).map(part => [part.type, part.value]));
  const current = partsOf(now);
  const currentDateInTegucigalpa = `${current.year}-${current.month}-${current.day}`;
  const [year, month, day] = config.date.isoDate.split('-').map(Number);
  const [hour, minute] = config.time.hour.split(':').map(Number);
  const localHour = config.time.meridiem ? hour % 12 + (config.time.meridiem === 'PM' ? 12 : 0) : hour;
  const targetWallTime = Date.UTC(year, month - 1, day, localHour, minute);
  let target = targetWallTime;
  for (let i = 0; i < 3; i++) {
    const local = partsOf(new Date(target));
    const wallTime = Date.UTC(Number(local.year), Number(local.month) - 1, Number(local.day), Number(local.hour), Number(local.minute), Number(local.second));
    target += targetWallTime - wallTime;
  }
  const remaining = Math.max(0, Math.floor((target - now.getTime()) / 1000));
  return {
    status: remaining > 0 ? 'upcoming' : currentDateInTegucigalpa === config.date.isoDate ? 'today' : 'past',
    daysRemaining: Math.floor(remaining / 86400),
    hoursRemaining: Math.floor(remaining / 3600) % 24,
    minutesRemaining: Math.floor(remaining / 60) % 60,
    secondsRemaining: remaining % 60,
    currentDateInTegucigalpa,
  };
}

function clockMarkup(result: CountdownResult): string {
  return `<div class="countdown-units">${[
    [result.daysRemaining, 'Días'], [result.hoursRemaining, 'Horas'],
    [result.minutesRemaining, 'Minutos'], [result.secondsRemaining, 'Segundos'],
  ].map(([value, label]) => `<div class="countdown-unit"><strong class="tabular-nums">${String(value).padStart(2, '0')}</strong><span>${label}</span></div>`).join('')}</div>`;
}

export function renderMainCountdownMarkup(result: CountdownResult): string {
  if (result.status !== 'upcoming') {
    return `<div class="countdown-box countdown-box--special" role="timer" aria-live="off"><p class="countdown-special-title">${result.status === 'today' ? '¡Hoy es el gran día!' : 'El comienzo de nuestro para siempre.'}</p></div>`;
  }
  return `<div class="countdown-box countdown-box--live" role="timer" aria-live="off"><span class="countdown-kicker">FALTAN</span>${clockMarkup(result)}<span class="countdown-label">PARA NUESTRA BODA</span></div>`;
}

export function renderCoverCountdownMarkup(config: WeddingConfig, result: CountdownResult): string {
  return `<div class="cover-countdown" role="timer" aria-live="off"><div class="cover-date-line">${escapeHtml(config.date.displayDate)}</div>${result.status === 'upcoming' ? `<span class="cover-days-kicker">FALTAN</span>${clockMarkup(result)}<span class="cover-days-label">PARA NUESTRA BODA</span>` : `<span class="cover-status-special">${result.status === 'today' ? '¡Hoy es el gran día!' : 'El comienzo de nuestro para siempre.'}</span>`}</div>`;
}
