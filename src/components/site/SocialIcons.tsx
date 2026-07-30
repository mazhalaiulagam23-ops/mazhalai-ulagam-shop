import {
  Facebook,
  Instagram,
  Linkedin,
  QrCode,
  Send,
  Star,
  Wallet,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { useSocialLinks, useQrCodes } from "@/lib/cms";
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.8 14.1c-.24.68-1.42 1.32-1.95 1.36-.5.05-.98.24-3.3-.69-2.78-1.1-4.53-3.95-4.67-4.13-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.28.24-.27.53-.34.71-.34h.5c.16 0 .38-.06.59.45.24.55.8 1.9.87 2.04.07.14.12.3.02.48-.09.18-.14.29-.28.45l-.42.49c-.14.14-.29.3-.12.58.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.25 2.25 1.39.28.14.44.12.6-.07.17-.18.7-.81.88-1.09.18-.28.36-.23.6-.14.25.09 1.58.75 1.85.88.27.14.45.21.52.32.06.11.06.63-.18 1.3Z" />
    </svg>
  );
}

const ICONS: Record<string, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  twitter: Send,
  linkedin: Linkedin,
  telegram: Send,
  pinterest: QrCode,
  google_review: Star,
  upi: Wallet,
};

function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  if (platform === "whatsapp") return <WhatsAppIcon className={className} />;
  const Icon = ICONS[platform] ?? QrCode;
  return <Icon className={className} aria-hidden="true" />;
}

/** Social icons for a given placement, managed from Admin → Social & QR. */
export function SocialIcons({ placement, className = "", iconClassName = "h-4 w-4" }: {
  placement: string;
  className?: string;
  iconClassName?: string;
}) {
  const { links } = useSocialLinks(placement);
  if (links.length === 0) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {links.map((l) => (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          className="rounded-full p-2 transition-colors hover:text-primary"
        >
          <PlatformIcon platform={l.platform} className={iconClassName} />
        </a>
      ))}
    </div>
  );
}

/** QR codes for a given placement. */
export function QrCodes({ placement, className = "" }: { placement: string; className?: string }) {
  const codes = useQrCodes(placement);
  if (codes.length === 0) return null;
  return (
    <div className={`flex flex-wrap gap-4 ${className}`}>
      {codes.map((c) => (
        <figure key={c.id} className="text-center">
          <img
            src={c.qr_image_url ?? ""}
            alt={`${c.label} QR code`}
            className="h-24 w-24 rounded-xl border border-border bg-card object-contain p-1"
          />
          <figcaption className="mt-1 text-xs text-muted-foreground">{c.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** Floating action buttons (bottom-right) for social links marked "Floating Buttons". */
export function FloatingSocial() {
  const { links } = useSocialLinks("floating");
  if (links.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-4 z-40 flex flex-col gap-2">
      {links.map((l) => (
        <a
          key={l.id}
          href={l.url}
          target="_blank"
          rel="noreferrer"
          aria-label={l.label}
          className="rounded-full bg-teal p-3 text-teal-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-105"
        >
          <PlatformIcon platform={l.platform} className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
}
