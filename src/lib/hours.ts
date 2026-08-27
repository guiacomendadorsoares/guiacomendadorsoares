// Utilities to interpret business.hours (jsonb) and decide "aberto agora".
// Accepts multiple shapes so the UI is resilient while owners fill in data.

export type HourEntry =
  | { day?: string | number; open?: string; close?: string; closed?: boolean }
  | { day?: string | number; hours?: string; closed?: boolean }
  | string;

const DAY_ALIASES: Record<string, number> = {
  dom: 0,
  domingo: 0,
  sun: 0,
  sunday: 0,
  seg: 1,
  segunda: 1,
  mon: 1,
  monday: 1,
  ter: 2,
  terca: 2,
  terça: 2,
  tue: 2,
  tuesday: 2,
  qua: 3,
  quarta: 3,
  wed: 3,
  wednesday: 3,
  qui: 4,
  quinta: 4,
  thu: 4,
  thursday: 4,
  sex: 5,
  sexta: 5,
  fri: 5,
  friday: 5,
  sab: 6,
  sáb: 6,
  sabado: 6,
  sábado: 6,
  sat: 6,
  saturday: 6,
};

function toDayIndex(v: unknown): number | null {
  if (typeof v === "number") return v >= 0 && v <= 6 ? v : null;
  if (typeof v === "string") {
    const k = v.trim().toLowerCase();
    if (k in DAY_ALIASES) return DAY_ALIASES[k];
    for (const alias of Object.keys(DAY_ALIASES)) {
      if (k.startsWith(alias)) return DAY_ALIASES[alias];
    }
  }
  return null;
}

function toMinutes(hhmm: string): number | null {
  const m = hhmm.trim().match(/^(\d{1,2})[:h](\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (isNaN(h) || isNaN(mi)) return null;
  return h * 60 + mi;
}

function nowInSaoPaulo(): { day: number; minutes: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = weekdayMap[parts.weekday as string] ?? new Date().getDay();
  const h = Number(parts.hour) || 0;
  const m = Number(parts.minute) || 0;
  return { day, minutes: h * 60 + m };
}

export function isOpenNow(hours: unknown): boolean {
  if (!Array.isArray(hours) || hours.length === 0) return false;
  const { day, minutes } = nowInSaoPaulo();
  for (const raw of hours as HourEntry[]) {
    if (!raw || typeof raw === "string") continue;
    if ((raw as any).closed) continue;
    const idx = toDayIndex((raw as any).day);
    if (idx === null || idx !== day) continue;
    let open: number | null = null;
    let close: number | null = null;
    if ("open" in raw && "close" in raw) {
      open = raw.open ? toMinutes(raw.open) : null;
      close = raw.close ? toMinutes(raw.close) : null;
    } else if ("hours" in raw && typeof raw.hours === "string") {
      const [a, b] = raw.hours.split(/[-–—]/);
      open = a ? toMinutes(a) : null;
      close = b ? toMinutes(b) : null;
    }
    if (open === null || close === null) continue;
    if (close > open ? minutes >= open && minutes < close : minutes >= open || minutes < close) {
      return true;
    }
  }
  return false;
}
