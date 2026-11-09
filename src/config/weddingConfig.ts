import { WeddingConfig } from '../types';

/**
 * Archivo central de configuración de la invitación de boda.
 * Todos los datos de nombres, fecha (18 de diciembre de 2026), hora,
 * itinerario, nombre de la iglesia, dirección, enlace de ubicación y teléfonos de WhatsApp
 * se pueden modificar directamente desde aquí o desde el Panel de Administrador.
 */
export const DEFAULT_WEDDING_CONFIG: WeddingConfig = {
  couple: {
    groomFullName: 'Bryan Cárcamo',
    brideFullName: 'Lyndel Pérez',
    groomFirstName: 'Bryan',
    brideFirstName: 'Lyndel',
    displayTitle: 'Lyndel & Bryan',
    fullNamesDisplay: 'Lyndel Pérez & Bryan Cárcamo',
    monogram: 'L & B',
  },
  date: {
    isoDate: '2026-12-18',
    displayDate: '18 de diciembre de 2026',
    shortDate: '18/12/2026',
    dayNumber: '18',
    monthShort: 'DIC',
    year: '2026',
    timezone: 'America/Tegucigalpa',
  },
  time: {
    hour: '6:00',
    meridiem: 'PM',
    activityLabel: 'Llegada de invitados: 6:00 PM · Entrada de la novia: 7:00 PM',
  },
  venue: {
    placeLabel: 'Iglesia',
    ceremonyLabel: 'Ceremonia y celebración nupcial',
    // Campos preparados para agregar o editar desde el Panel Admin:
    churchName: '',
    address: '',
    mapUrl: '',
  },
  whatsapp: {
    defaultRecipientPhone: '',
    bryanPhone: '',
    lyndelPhone: '',
  },
  itinerary: [
    {
      id: 'recepcion-invitados',
      time: '6:00 p. m. – 6:30 p. m.',
      title: 'Recepción de invitados',
      description: '',
      icon: 'reception',
    },
    {
      id: 'cortejo',
      time: '6:30 p. m. – 7:00 p. m.',
      title: 'Maestro de ceremonias (cortejo)',
      description: '',
      icon: 'ceremony',
    },
    {
      id: 'ceremonia',
      time: '7:00 p. m. – 7:30 p. m.',
      title: 'Entrada de la novia',
      description: '',
      icon: 'ceremony',
    },
    {
      id: 'adoracion-1',
      time: '7:30 p. m. – 7:50 p. m.',
      title: 'Adoración (20 minutos)',
      description: '',
      icon: 'worship',
    },
    {
      id: 'fotografias',
      time: '7:50 p. m. – 8:20 p. m.',
      title: 'Fotografías en las mesas con los invitados',
      description: '',
      icon: 'reception',
    },
    {
      id: 'comida',
      time: '8:20 p. m. – 9:00 p. m.',
      title: 'Cena',
      description: '',
      icon: 'dinner',
    },
    {
      id: 'adoracion-final',
      time: '9:00 p. m. – 9:30 p. m.',
      title: 'Cierre del evento',
      description: '',
      icon: 'closing-worship',
    },
  ],
  colors: {
    bgPrimary: '#FAF7EF', // Crema suave
    paperWarm: '#F3EFDF', // Crema cálido
    sageSoft: '#E1E7D9', // Verde salvia suave
    greenElegant: '#4B6049', // Verde elegante
    textDarkGreen: '#394634', // Verde oscuro
    lavenderSoft: '#E2D8E8', // Lavanda suave
    purpleAccent: '#766580', // Morado suave
    borderGrayGreen: '#C7C9B6', // Verde grisáceo
    goldMuted: '#AC9975', // Dorado apagado
  },
  animation: {
    envelopeOpenDurationMs: 8800,
    invitationRevealDurationMs: 1600,
    reducedMotionDurationMs: 450,
  },
  photos: [
    {
      id: 'bl-40',
      filename: 'B&L-40.jpg',
      role: 'gallery-night',
      title: 'Frente al mar al atardecer',
      caption: 'Lyndel y Bryan juntos frente al mar al atardecer.',
      alt: 'Fotografía principal: Lyndel y Bryan juntos frente al mar al atardecer (B&L-40.jpg)',
      aspectRatio: '3:4',
      focalPoint: '50% 32%',
      publicPath: '/images/B&L-40.jpg',
    },
    {
      id: 'bl-66',
      filename: 'B&L-66.jpg',
      role: 'promise',
      title: 'Nuestra promesa',
      caption: 'Momento en el que Bryan coloca el anillo de compromiso a Lyndel.',
      alt: 'Sección de la promesa: momento en el que Bryan coloca el anillo a Lyndel (B&L-66.jpg)',
      aspectRatio: '4:3',
      focalPoint: '50% 45%',
      publicPath: '/images/B&L-66.jpg',
    },
    {
      id: 'bl-85',
      filename: 'B&L-85.jpg',
      role: 'gallery-toast',
      title: 'Celebrando nuestro amor',
      caption: 'Ambos sonriendo y mirándose con complicidad al atardecer.',
      alt: 'Galería: Lyndel y Bryan mirándose con alegría al atardecer (B&L-85.jpg)',
      aspectRatio: '4:3',
      focalPoint: '50% 35%',
      publicPath: '/images/B&L-85.jpg',
    },
    {
      id: 'bl-94',
      filename: 'B&L-94.jpg',
      role: 'hero',
      title: 'Bajo el cielo nocturno',
      caption: 'Lyndel y Bryan juntos bajo el cielo estrellado nocturno.',
      alt: 'Galería: Lyndel y Bryan juntos bajo el cielo nocturno (B&L-94.jpg)',
      aspectRatio: '3:4',
      focalPoint: '50% 55%',
      publicPath: '/images/B&L-94.jpg',
    },
  ],
};

/**
 * Formatea la hora configurada incluyendo AM/PM únicamente si ya fue definido.
 */
export function formatWeddingTime(config: WeddingConfig): string {
  const baseHour = config.time.hour.trim() || '6:00';
  const meridiem = config.time.meridiem.trim();
  return meridiem ? `${baseHour} ${meridiem}` : baseHour;
}

/**
 * Formatea el nombre del lugar de la ceremonia.
 */
export function formatVenueDisplay(config: WeddingConfig): {
  primaryTitle: string;
  secondaryDetail: string;
  addressText: string;
  hasMapLink: boolean;
  mapHref: string;
} {
  const churchName = config.venue.churchName.trim();
  const address = config.venue.address.trim();
  const mapUrl = config.venue.mapUrl.trim();

  const primaryTitle = churchName
    ? `${config.venue.placeLabel}: ${churchName}`
    : config.venue.placeLabel;

  const secondaryDetail = config.venue.ceremonyLabel;

  const hasMapLink = Boolean(mapUrl || address);
  const mapHref = mapUrl
    ? mapUrl
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${churchName ? churchName + ', ' : ''}${address}`,
        )}`
      : '';

  return {
    primaryTitle,
    secondaryDetail,
    addressText: address,
    hasMapLink,
    mapHref,
  };
}
