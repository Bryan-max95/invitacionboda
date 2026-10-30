export type MeridiemOption = '' | 'AM' | 'PM';

export interface PhotoItem {
  id: 'bl-40' | 'bl-66' | 'bl-85' | 'bl-94';
  filename: string;
  role: 'hero' | 'promise' | 'gallery-toast' | 'gallery-night';
  title: string;
  caption: string;
  alt: string;
  aspectRatio: '3:4' | '4:3';
  focalPoint: string;
  publicPath: string;
}

export interface ItineraryItem {
  id: string;
  time: string;
  title: string;
  description: string;
  icon: 'reception' | 'ceremony' | 'worship' | 'dinner' | 'closing-worship';
}

export interface WeddingConfig {
  couple: {
    groomFullName: string;
    brideFullName: string;
    groomFirstName: string;
    brideFirstName: string;
    displayTitle: string;
    fullNamesDisplay: string;
    monogram: string;
  };
  date: {
    isoDate: string; // YYYY-MM-DD (2026-12-18)
    displayDate: string; // 18 de diciembre de 2026
    shortDate: string; // 18/12/2026
    dayNumber: string; // 19
    monthShort: string; // DIC
    year: string; // 2026
    timezone: string; // America/Tegucigalpa
  };
  time: {
    hour: string; // 6:00
    meridiem: MeridiemOption; // '' | 'AM' | 'PM'
    activityLabel: string; // Ceremonia y llegada de la novia (6:00 a 7:00 máx.)
  };
  venue: {
    placeLabel: string; // Iglesia
    ceremonyLabel: string; // Ceremonia de boda
    churchName: string; // Editable field for church name
    address: string; // Editable field for address
    mapUrl: string; // Editable field for Google Maps / Waze URL
  };
  whatsapp: {
    defaultRecipientPhone: string; // Optional country code + number, e.g., "50499999999"
    bryanPhone: string; // Optional country code + number for Bryan
    lyndelPhone: string; // Optional country code + number for Lyndel
  };
  itinerary: ItineraryItem[];
  colors: {
    bgPrimary: string; // #FAF7EF Crema suave
    paperWarm: string; // #F3EFDF Crema cálido
    sageSoft: string; // #E1E7D9 Verde salvia suave
    greenElegant: string; // #4B6049 Verde elegante
    textDarkGreen: string; // #394634 Verde oscuro
    lavenderSoft: string; // #E2D8E8 Lavanda suave
    purpleAccent: string; // #766580 Morado suave
    borderGrayGreen: string; // #C7C9B6 Verde grisáceo
    goldMuted: string; // #AC9975 Dorado apagado
  };
  animation: {
    envelopeOpenDurationMs: number; // 4200 ms
    invitationRevealDurationMs: number; // 1100 ms
    reducedMotionDurationMs: number; // 450 ms
  };
  photos: PhotoItem[];
}

export type CountdownStatus = 'upcoming' | 'today' | 'past';

export interface CountdownResult {
  status: CountdownStatus;
  daysRemaining: number;
  currentDateInTegucigalpa: string;
}

export type AttendanceChoice = 'yes' | 'no';

export interface RsvpFormData {
  fullName: string;
  attendance: AttendanceChoice;
  guestCount: number;
  message: string;
  recipientTarget: 'any' | 'bryan' | 'lyndel';
}
