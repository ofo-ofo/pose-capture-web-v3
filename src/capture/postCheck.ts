import { Thresholds } from '../metrics/thresholds';

/**
 * Perform a final validation on the metrics just before upload. Returns ok=false with a message
 * if any critical condition fails; otherwise ok=true.
 */
export function postCheck(
  m: {
    rollDeg: number;
    center: number;
    height: number;
    top: number;
    bottom: number;
    luma: number;
    presence: number;
  },
  t: Thresholds
): { ok: boolean; message?: string } {
  if (m.presence < t.presenceMin) return { ok: false, message: 'Kişi algılanamadı' };
  if (m.rollDeg > t.rollMaxDeg) return { ok: false, message: 'Telefonu düzleştir' };
  if (m.height < t.heightRatioMin) return { ok: false, message: 'Bir adım geri gel' };
  if (m.top < t.topMarginMin) return { ok: false, message: 'Baş kadrajda değil' };
  if (m.bottom < t.bottomMarginMin) return { ok: false, message: 'Ayaklar kadrajda değil' };
  if (m.luma < t.lumaMin) return { ok: false, message: 'Işığı artır' };
  return { ok: true };
}