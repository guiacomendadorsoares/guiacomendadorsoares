import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

type Slide = {
  /** Imagem (jpg/png/webp), GIF animado ou vídeo (mp4/webm). */
  src: string;
  /** Tipo da mídia. Detectado automaticamente pela extensão se omitido. */
  mediaType?: "image" | "gif" | "video";
  /** Poster para vídeos (mostrado enquanto carrega). */
  poster?: string;
  eyebrow: string;
  title: string;
  cta: string;
  /** Link ao clicar no banner. Use rota interna ("/guia") ou URL externa ("https://..."). */
  href?: string;
};

const slides: Slide[] = [
  {
    src: banner1,
    eyebrow: "Comendador Soares",
    title: "O bairro que conecta gente, comércio e oportunidade.",
    cta: "Explorar guia",
    href: "/guia",
  },
  {
    src: banner2,
    eyebrow: "Apoie o local",
    title: "Conheça os negócios que fazem o bairro acontecer.",
    cta: "Ver empresas",
    href: "/guia",
  },
  {
    src: banner3,
    eyebrow: "Onde comer",
    title: "Os melhores sabores estão pertinho de você.",
    cta: "Ver restaurantes",
    href: "/onde-comer",
  },
];

function detectMediaType(src: string, explicit?: Slide["mediaType"]): "image" | "gif" | "video" {
  if (explicit) return explicit;
  const lower = src.split("?")[0].toLowerCase();
  if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov")) return "video";
  if (lower.endsWith(".gif")) return "gif";
  return "image";
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

function InlineBannerVideo({ slide, active }: { slide: Slide; active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    if (active) {
      const tryPlay = () => video.play().catch(() => undefined);
      tryPlay();
      video.addEventListener("loadedmetadata", tryPlay, { once: true });
      video.addEventListener("canplay", tryPlay, { once: true });
      const onVis = () => {
        if (document.visibilityState === "visible") tryPlay();
      };
      document.addEventListener("visibilitychange", onVis);
      return () => document.removeEventListener("visibilitychange", onVis);
    } else {
      try {
        video.pause();
      } catch {}
    }
  }, [slide.src, active]);

  return (
    <video
      ref={videoRef}
      src={slide.src}
      poster={slide.poster}
      autoPlay
      muted
      loop
      playsInline
      {...({ "webkit-playsinline": "true" } as any)}
      controls={false}
      disableRemotePlayback
      preload="auto"
      className="pointer-events-none h-full w-full object-cover bg-background"
    />
  );
}

function SlideMedia({ slide, eager, active }: { slide: Slide; eager: boolean; active: boolean }) {
  const type = detectMediaType(slide.src, slide.mediaType);
  if (type === "video") {
    return <InlineBannerVideo slide={slide} active={active} />;
  }
  return (
    <img
      src={slide.src}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      {...(eager ? { fetchPriority: "high" as any } : {})}
      className="h-full w-full object-cover [image-rendering:auto]"
    />
  );
}

function SlideLink({
  href,
  className,
  children,
  ariaLabel,
}: {
  href?: string;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  if (!href) return <div className={className}>{children}</div>;
  if (isExternal(href)) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

export function HeroCarousel() {
  const [i, setI] = useState(0);

  const { data: dbSlides } = useQuery({
    queryKey: ["home-banners"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("eyebrow,title,cta,href,media_url,media_type,poster_url")
        .eq("active", true)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map(
        (b: any): Slide => ({
          eyebrow: b.eyebrow,
          title: b.title,
          cta: b.cta,
          href: b.href ?? undefined,
          src: b.media_url,
          mediaType: b.media_type,
          poster: b.poster_url ?? undefined,
        }),
      );
    },
  });

  const activeSlides: Slide[] = dbSlides && dbSlides.length > 0 ? dbSlides : slides;

  useEffect(() => {
    setI(0);
  }, [activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length <= 1) return;
    // Avança para o próximo banner a cada 15 segundos.
    const id = setInterval(() => setI((v) => (v + 1) % activeSlides.length), 15000);
    return () => clearInterval(id);
  }, [activeSlides.length, i]);

  return (
    <section className="relative -mx-5 -mt-4 mb-6 overflow-hidden">
      {/*
        Tamanho ideal da mídia enviada (para não perder qualidade em nenhuma tela):
          • Recomendado: 2400 x 1350 px (proporção 16:9), até 2 MB para imagem/GIF.
          • Mínimo aceitável: 1600 x 900 px.
          • Vídeo: 1920 x 1080 px (Full HD), MP4/WebM, até 50 MB.
        A área visível usa proporções diferentes por dispositivo (a mídia é recortada
        com object-cover): 4:5 no mobile, 16:9 no tablet e 21:9 no desktop.
      */}
      <div className="relative w-full aspect-[16/9] sm:max-h-[560px]">
        {activeSlides.map((s, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${
              idx === i ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={idx !== i}
          >
            <SlideLink href={s.href} className="block h-full w-full" ariaLabel={s.title}>
              <SlideMedia slide={s} eager={idx === 0} active={idx === i} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-5 pb-8 text-white">
                <span className="inline-block rounded-full bg-gold/95 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-foreground">
                  {s.eyebrow}
                </span>
                <h2 className="mt-2 font-display text-xl font-bold leading-tight drop-shadow">
                  {s.title}
                </h2>
                <span className="mt-3 inline-block rounded-full bg-white/95 px-4 py-1.5 text-xs font-bold text-primary shadow-card backdrop-blur">
                  {s.cta} →
                </span>
              </div>
            </SlideLink>
          </div>
        ))}
      </div>
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
        {activeSlides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-6 bg-gold" : "w-1.5 bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
