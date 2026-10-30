import { calculateWeddingCountdown } from './components/Countdown';
import { EnvelopeCover } from './components/EnvelopeCover';
import { LightboxModal } from './components/LightboxModal';
import { RsvpModal } from './components/RsvpModal';
import { WeddingInvitationView } from './components/WeddingInvitationView';
import type { WeddingConfig } from './types';
import { Wedding3DExperience } from './xr/WeddingXRScene';

export class WeddingInvitationApp {
  private countdown: ReturnType<typeof calculateWeddingCountdown>;
  constructor(private config: WeddingConfig) {
    this.countdown = calculateWeddingCountdown(config);
  }

  private envelopeMount!: HTMLElement;
  private invitationMount!: HTMLElement;
  private lightboxMount!: HTMLElement;
  private rsvpMount!: HTMLElement;
  private xr3dMount!: HTMLElement;

  private envelopeCover!: EnvelopeCover;
  private invitationView!: WeddingInvitationView;
  private lightboxModal!: LightboxModal;
  private rsvpModal!: RsvpModal;
  private wedding3DExperience!: Wedding3DExperience;

  private countdownTimerId: number | null = null;
  private onVisibilityChange: (() => void) | null = null;
  private onWindowFocus: (() => void) | null = null;

  public init(targetRoot?: HTMLElement): void {
    const root = targetRoot || document.getElementById('root') || document.body;
    root.innerHTML = `
      <div id="envelope-mount"></div>
      <div id="invitation-mount"></div>
      <div id="lightbox-mount"></div>
      <div id="rsvp-mount"></div>
      <div id="xr-3d-mount"></div>
    `;

    this.envelopeMount = root.querySelector<HTMLElement>('#envelope-mount')!;
    this.invitationMount = root.querySelector<HTMLElement>('#invitation-mount')!;
    this.lightboxMount = root.querySelector<HTMLElement>('#lightbox-mount')!;
    this.rsvpMount = root.querySelector<HTMLElement>('#rsvp-mount')!;
    this.xr3dMount = root.querySelector<HTMLElement>('#xr-3d-mount')!;

    this.refreshCountdownState();

    // 1. Portada del sobre cerrado (se muestra siempre al entrar o recargar)
    this.envelopeCover = new EnvelopeCover(
      this.envelopeMount,
      this.config,
      this.countdown,
      {
        onOpenComplete: () => {
          this.refreshCountdownState();
          this.invitationView.showWithReveal();
        },
      },
    );

    // 2. Vista 3D creada desde cero (Santuario 3D, Dos Anillos de Boda de oro 24k y Carta Decorativa "¡Te esperamos!")
    this.wedding3DExperience = new Wedding3DExperience(this.xr3dMount, this.config);

    // 3. Vista principal de la invitación
    this.invitationView = new WeddingInvitationView(
      this.invitationMount,
      this.config,
      this.countdown,
      {
        onReplayEnvelope: () => {
          this.refreshCountdownState();
          this.invitationView.hideForEnvelope();
          this.envelopeCover.resetAndShow();
        },
        onOpenRsvp: () => {
          this.rsvpModal.open();
        },
        onOpenLightbox: (photoId) => {
          this.lightboxModal.openByPhotoId(photoId);
        },
        onLaunchXR: () => {
          this.wedding3DExperience.open();
        },
      },
    );

    // 4. Visor de fotografías completo sin recorte (Lightbox)
    this.lightboxModal = new LightboxModal(this.lightboxMount, this.config.photos);

    // 5. Ventana modal de confirmación por WhatsApp (RSVP)
    this.rsvpModal = new RsvpModal(this.rsvpMount, this.config);

    this.envelopeCover.render();
    this.invitationView.render();

    this.setupAutomaticCountdownUpdates();
  }

  private refreshCountdownState(): void {
    this.countdown = calculateWeddingCountdown(this.config);
    this.envelopeCover?.updateCountdown(this.countdown);
    this.invitationView?.updateCountdown(this.countdown);
  }

  /**
   * Actualiza la cuenta regresiva automáticamente al regresar a la pestaña
   * y periódicamente mientras permanezca abierta (zona horaria America/Tegucigalpa).
   */
  private setupAutomaticCountdownUpdates(): void {
    this.onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        this.refreshCountdownState();
      }
    };
    this.onWindowFocus = () => {
      this.refreshCountdownState();
    };

    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('focus', this.onWindowFocus);

    this.countdownTimerId = window.setInterval(() => {
      this.refreshCountdownState();
    }, 30_000);
  }

  public dispose(): void {
    this.invitationView?.dispose();
    if (this.countdownTimerId !== null) {
      window.clearInterval(this.countdownTimerId);
    }
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
    if (this.onWindowFocus) {
      window.removeEventListener('focus', this.onWindowFocus);
    }
    this.wedding3DExperience?.close();
  }
}
