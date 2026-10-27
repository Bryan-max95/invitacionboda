import { WeddingConfig } from '../types';

/**
 * Archivo central de configuración de la invitación de boda.
 * Todos los datos de nombres, fecha (19 de diciembre de 2026), hora,
 * itinerario, nombre de la iglesia, dirección, enlace de ubicación y teléfonos de WhatsApp
 * se pueden modificar directamente desde aquí o desde el Panel de Administrador.
 */
export const DEFAULT_WEDDING_CONFIG: WeddingConfig = {
  couple: {
    groomFullName: 'Bryan Cárcamo',
    brideFullName: 'Lyndel Pérez',
    groomFirstName: 'Bryan',
    brideFirstName: 'Lyndel',
    displayTitle: 'Bryan & Lyndel',
    fullNamesDisplay: 'Bryan Cárcamo & Lyndel Pérez',
    monogram: 'B & L',
  },
  date: {
    isoDate: '2026-12-19',
    displayDate: '19 de diciembre de 2026',
    shortDate: '19/12/2026',
    dayNumber: '19',
    monthShort: 'DIC',
    year: '2026',
    timezone: 'America/Tegucigalpa',
  },
  time: {
    hour: '5:00',
    meridiem: 'PM',
    activityLabel: 'Llegada de invitados: 5:00 PM · Entrada de los novios: 6:00 PM',
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
      time: '5:00 PM',
      title: 'Recepción y Llegada de Invitados',
      description:
        'Apertura de puertas y bienvenida en la iglesia. Te invitamos a llegar puntualmente a las 5:00 PM para ubicarte con comodidad.',
      icon: 'reception',
    },
    {
      id: 'ceremonia',
      time: '6:00 PM – 7:00 PM',
      title: 'Entrada del Novio y la Novia · Ceremonia Nupcial',
      description:
        'A las 6:00 PM inicia la entrada solemne del novio y la novia para celebrar nuestro pacto matrimonial ante Dios (finalizando a las 7:00 PM como máximo).',
      icon: 'ceremony',
    },
    {
      id: 'adoracion-1',
      time: '7:00 PM',
      title: 'Tiempo de Adoración y Alabanza',
      description:
        'Unidos en un mismo sentir, elevamos una canción de adoración y gratitud a Dios por Su fidelidad y bendición sobre nuestro hogar.',
      icon: 'worship',
    },
    {
      id: 'comida',
      time: '7:45 PM',
      title: 'Cena y Banquete Nupcial',
      description:
        'Compartimos juntos la mesa con una cena especial preparada con mucho cariño para disfrutar en familia y comunión.',
      icon: 'dinner',
    },
    {
      id: 'adoracion-final',
      time: '9:00 PM',
      title: 'Adoración Final y Bendición',
      description:
        'Cerramos esta noche tan especial con una última alabanza a Dios y una oración de agradecimiento y despedida.',
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
      role: 'hero',
      title: 'Frente al mar al atardecer',
      caption: 'Bryan y Lyndel juntos frente al mar al atardecer.',
      alt: 'Fotografía principal: Bryan y Lyndel juntos frente al mar al atardecer (B&L-40.jpg)',
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
      alt: 'Galería: Bryan y Lyndel mirándose con alegría al atardecer (B&L-85.jpg)',
      aspectRatio: '4:3',
      focalPoint: '50% 35%',
      publicPath: '/images/B&L-85.jpg',
    },
    {
      id: 'bl-94',
      filename: 'B&L-94.jpg',
      role: 'gallery-night',
      title: 'Bajo el cielo nocturno',
      caption: 'Bryan y Lyndel juntos bajo el cielo estrellado nocturno.',
      alt: 'Galería: Bryan y Lyndel juntos bajo el cielo nocturno (B&L-94.jpg)',
      aspectRatio: '3:4',
      focalPoint: '50% 38%',
      publicPath: '/images/B&L-94.jpg',
    },
  ],
};

/**
 * Formatea la hora configurada incluyendo AM/PM únicamente si ya fue definido.
 */
export function formatWeddingTime(config: WeddingConfig): string {
  const baseHour = config.time.hour.trim() || '5:00';
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
