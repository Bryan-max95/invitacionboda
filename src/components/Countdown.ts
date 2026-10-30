import { CountdownResult, WeddingConfig } from '../types';

/**
 * Calcula los días calendario restantes hasta la fecha de la boda (18 de diciembre de 2026)
 * utilizando estrictamente la zona horaria de Honduras (America/Tegucigalpa).
 *
 * - Si faltan días (> 0): status = 'upcoming', daysRemaining = N
 * - El día de la boda (== 0): status = 'today', daysRemaining = 0 -> "¡Hoy es el gran día!"
 * - Después de esa fecha (< 0): status = 'past', daysRemaining = 0 -> "El comienzo de nuestro para siempre."
 * Nunca devuelve cantidades negativas.
 */
export function calculateWeddingCountdown(
  config: WeddingConfig,
  now: Date = new Date(),
): CountdownResult {
  const timeZone = config.date.timezone || 'America/Tegucigalpa';

  // Extract current calendar date (YYYY, MM, DD) in America/Tegucigalpa
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(now);
  let curYear = 2026;
  let curMonth = 1;
  let curDay = 1;

  for (const part of parts) {
    if (part.type === 'year') curYear = parseInt(part.value, 10);
    if (part.type === 'month') curMonth = parseInt(part.value, 10);
    if (part.type === 'day') curDay = parseInt(part.value, 10);
  }

  const [targetYearStr, targetMonthStr, targetDayStr] = config.date.isoDate.split('-');
  const targetYear = parseInt(targetYearStr || '2026', 10);
  const targetMonth = parseInt(targetMonthStr || '12', 10);
  const targetDay = parseInt(targetDayStr || '18', 10);

  // Convert both calendar dates to UTC midnight timestamps to count exact calendar days
  const currentUtcMidnight = Date.UTC(curYear, curMonth - 1, curDay);
  const targetUtcMidnight = Date.UTC(targetYear, targetMonth - 1, targetDay);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const diffDays = Math.round((targetUtcMidnight - currentUtcMidnight) / MS_PER_DAY);

  const currentDateInTegucigalpa = `${String(curYear).padStart(4, '0')}-${String(
    curMonth,
  ).padStart(2, '0')}-${String(curDay).padStart(2, '0')}`;

  if (diffDays > 0) {
    return {
      status: 'upcoming',
      daysRemaining: diffDays,
      currentDateInTegucigalpa,
    };
  }

  if (diffDays === 0) {
    return {
      status: 'today',
      daysRemaining: 0,
      currentDateInTegucigalpa,
    };
  }

  return {
    status: 'past',
    daysRemaining: 0,
    currentDateInTegucigalpa,
  };
}

/**
 * Renderiza el bloque de cuenta regresiva principal (Sección 5 y 6):
 * "FALTAN" / "[cantidad de días]" / "DÍAS PARA NUESTRA BODA"
 * o los textos especiales para el día de la boda y fechas posteriores.
 */
export function renderMainCountdownMarkup(result: CountdownResult): string {
  if (result.status === 'today') {
    return `
      <div class="countdown-box countdown-box--special" role="timer" aria-live="polite">
        <p class="countdown-special-title">¡Hoy es el gran día!</p>
      </div>
    `;
  }

  if (result.status === 'past') {
    return `
      <div class="countdown-box countdown-box--special" role="timer" aria-live="polite">
        <p class="countdown-special-title">El comienzo de nuestro para siempre.</p>
      </div>
    `;
  }

  const dayWord = result.daysRemaining === 1 ? 'DÍA PARA NUESTRA BODA' : 'DÍAS PARA NUESTRA BODA';

  return `
    <div class="countdown-box" role="timer" aria-live="polite">
      <span class="countdown-kicker">FALTAN</span>
      <span class="countdown-number tabular-nums">${result.daysRemaining}</span>
      <span class="countdown-label">${dayWord}</span>
    </div>
  `;
}

/**
 * Renderiza la cuenta regresiva discreta para la portada del sobre cerrado (Sección 3 y 6).
 */
export function renderCoverCountdownMarkup(
  config: WeddingConfig,
  result: CountdownResult,
): string {
  if (result.status === 'today') {
    return `
      <div class="cover-countdown" aria-live="polite">
        <span class="cover-date">${config.date.displayDate}</span>
        <span class="cover-sep" aria-hidden="true">·</span>
        <span class="cover-status-special">¡Hoy es el gran día!</span>
      </div>
    `;
  }

  if (result.status === 'past') {
    return `
      <div class="cover-countdown" aria-live="polite">
        <span class="cover-date">${config.date.displayDate}</span>
        <span class="cover-sep" aria-hidden="true">·</span>
        <span class="cover-status-special">El comienzo de nuestro para siempre.</span>
      </div>
    `;
  }

  const dayWord = result.daysRemaining === 1 ? 'DÍA PARA NUESTRA BODA' : 'DÍAS PARA NUESTRA BODA';

  return `
    <div class="cover-countdown" aria-live="polite">
      <div class="cover-date-line">${config.date.displayDate}</div>
      <div class="cover-days-row">
        <span class="cover-days-kicker">FALTAN</span>
        <strong class="cover-days-number tabular-nums">${result.daysRemaining}</strong>
        <span class="cover-days-label">${dayWord}</span>
      </div>
    </div>
  `;
}
