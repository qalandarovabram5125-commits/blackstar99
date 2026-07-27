import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Calendar, Award, Heart, MapPin, Phone, Mail, ArrowRight, GraduationCap, Users, Briefcase, Sparkles } from "lucide-react";
import { api } from "@/api/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Section } from "@/components/ui/section";
import { HorizontalCarousel } from "@/components/HorizontalCarousel";
import { uzDate, uzDateTime, uzNumber } from "@/lib/format";
import heroImg from "@/assets/hero-school.jpg";

const Index = () => {
  const { data: settings } = useSiteSettings();

  const { data: events = [] } = useQuery({
    queryKey: ["home_events"],
    queryFn: async () => {
      const all = await api.list("events", "order=starts_at&dir=asc&limit=20");
      return all.filter((e:any) => new Date(e.starts_at) >= new Date()).slice(0, 8);
    },
  });

  const { data: news = [] } = useQuery({
    queryKey: ["home_news"],
    queryFn: async () => api.list("news", "order=published_at&dir=desc&limit=8"),
  });

  const { data: certs = [] } = useQuery({
    queryKey: ["home_certs"],
    queryFn: async () => api.list("certificates", "order=created_at&dir=desc&limit=10"),
  });

  const { data: proud = [] } = useQuery({
    queryKey: ["home_proud"],
    queryFn: async () => api.list("proud", "order=sort_order&dir=asc"),
  });

  const heroBg = settings?.hero_image_url || heroImg;
  const proudLoop = [...proud, ...proud];

  return (
    <>
      {/* HERO */}
      <section className="relative -mt-14 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${heroBg})`, filter: "blur(14px) brightness(0.95)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-hero" aria-hidden />
        <div className="relative container-page pt-32 pb-20 sm:pt-40 sm:pb-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs font-medium mb-5 animate-fade-in">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Rasmiy portal
          </div>
          <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight text-balance animate-fade-in">
            {settings?.school_name ?? "51-maktab"}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto text-balance animate-fade-in">
            {settings?.motto ?? "Bilim — kelajak kaliti"}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in">
            <Link to="/news" className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition">
              Yangiliklar
            </Link>
            <Link to="/schedule" className="px-5 py-2.5 rounded-full glass text-sm font-medium hover:bg-secondary transition">
              Dars jadvali
            </Link>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <Section
        title="Tadbirlar"
        subtitle="Yaqinlashayotgan tadbirlarimiz"
        action={<Link to="/events" className="text-sm text-primary hover:underline inline-flex items-center gap-1">Barchasi <ArrowRight className="h-4 w-4" /></Link>}
      >
        {events.length === 0 ? (
          <EmptyHint text="Hozircha tadbirlar yo'q" />
        ) : (
          <HorizontalCarousel>
            {events.map((e: any) => (
              <article key={e.id} className="snap-start shrink-0 w-72 sm:w-80 glass-card overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
                <div className="aspect-[16/9] bg-gradient-primary relative">
                  {e.cover_url && <img src={e.cover_url} alt={e.title} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                  <div className="absolute top-3 left-3 glass rounded-lg px-2 py-1 text-xs font-medium">
                    <Calendar className="inline h-3 w-3 mr-1" />{uzDate(e.starts_at)}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold tracking-tight">{e.title}</h3>
                  {e.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{e.description}</p>}
                  {e.location && <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.location}</p>}
                </div>
              </article>
            ))}
          </HorizontalCarousel>
        )}
      </Section>

      {/* NEWS */}
      <Section
        title="Yangiliklar"
        subtitle="Eng so'nggi yangiliklar"
        action={<Link to="/news" className="text-sm text-primary hover:underline inline-flex items-center gap-1">Barchasi <ArrowRight className="h-4 w-4" /></Link>}
      >
        {news.length === 0 ? (
          <EmptyHint text="Hozircha yangiliklar yo'q" />
        ) : (
          <HorizontalCarousel>
            {news.map((n: any) => (
              <article key={n.id} className="snap-start shrink-0 w-72 sm:w-80 glass-card overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-lg">
                <div className="aspect-[16/9] bg-secondary">
                  {n.cover_url && <img src={n.cover_url} alt={n.title} className="h-full w-full object-cover" loading="lazy" />}
                </div>
                <div className="p-4">
                  <div className="text-xs text-muted-foreground">{uzDate(n.published_at)}</div>
                  <h3 className="font-semibold tracking-tight mt-1">{n.title}</h3>
                  {n.excerpt && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.excerpt}</p>}
                </div>
              </article>
            ))}
          </HorizontalCarousel>
        )}
      </Section>

      {/* CERTIFICATES */}
      <Section
        title="Sertifikatlar"
        subtitle="O'quvchilarimiz yutuqlari"
        action={<Link to="/certificates" className="text-sm text-primary hover:underline inline-flex items-center gap-1">Barchasi <ArrowRight className="h-4 w-4" /></Link>}
      >
        {certs.length === 0 ? (
          <EmptyHint text="Hozircha sertifikatlar yo'q" />
        ) : (
          <HorizontalCarousel>
            {certs.map((c: any) => (
              <article key={c.id} className="snap-start shrink-0 w-60 sm:w-72 glass-card overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:shadow-lg">
                <div className="aspect-[4/5] bg-gradient-to-br from-secondary to-muted relative grid place-items-center">
                  {c.image_url ? (
                    <img src={c.image_url} alt={c.recipient_name} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Award className="h-14 w-14 text-muted-foreground/50" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold tracking-tight">{c.recipient_name}</h3>
                  <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-1">
                    {c.class_name && <span>{c.class_name}</span>}
                    {c.subject && <span>· {c.subject}</span>}
                    {c.level && <span>· {c.level}</span>}
                  </div>
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" /> {c.likes_count ?? 0}
                  </div>
                </div>
              </article>
            ))}
          </HorizontalCarousel>
        )}
      </Section>

      {/* PROUD STUDENTS — infinite marquee */}
      <Section title="Faxrimiz" subtitle="Bitiruvchi va g'oliblarimiz">
        {proud.length === 0 ? (
          <EmptyHint text="Hozircha ma'lumotlar yo'q" />
        ) : (
          <div className="relative overflow-hidden -mx-4 sm:-mx-6">
            <div className="flex gap-4 w-max animate-marquee">
              {proudLoop.map((p: any, idx) => (
                <div key={`${p.id}-${idx}`} className="shrink-0 w-56 glass-card p-4 text-center shadow-sm">
                  <div className="mx-auto h-20 w-20 rounded-full bg-gradient-primary grid place-items-center text-primary-foreground text-2xl font-semibold overflow-hidden">
                    {p.photo_url ? <img src={p.photo_url} alt={p.full_name} className="h-full w-full object-cover" /> : p.full_name?.[0]}
                  </div>
                  <h3 className="mt-3 font-semibold tracking-tight text-sm">{p.full_name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.achievement}</p>
                  {p.year && <div className="text-[11px] text-muted-foreground mt-1">{p.year}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* STATISTICS */}
      <Section title="Raqamlarda" subtitle="Maktabimiz bugun">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard icon={GraduationCap} label="O'quvchilar" value={settings?.stat_students ?? 0} />
          <StatCard icon={Users} label="O'qituvchilar" value={settings?.stat_teachers ?? 0} />
          <StatCard icon={Briefcase} label="Ishchilar" value={settings?.stat_workers ?? 0} />
          <StatCard icon={Award} label="OTM ga kirgan" value={`${settings?.stat_university_pct ?? 0}%`} hint="bu yil" />
        </div>
      </Section>

      {/* MAP + CONTACT */}
      <Section title="Aloqa va manzil" subtitle="Bizni topishingiz mumkin">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
            <iframe
              title="Xarita"
              className="w-full aspect-[4/3]"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${(settings?.longitude ?? 69.2401) - 0.01}%2C${(settings?.latitude ?? 41.2995) - 0.005}%2C${(settings?.longitude ?? 69.2401) + 0.01}%2C${(settings?.latitude ?? 41.2995) + 0.005}&layer=mapnik&marker=${settings?.latitude ?? 41.2995}%2C${settings?.longitude ?? 69.2401}`}
              loading="lazy"
            />
          </div>
          <div className="glass-card p-6 space-y-4">
            <ContactRow icon={MapPin} label="Manzil" value={settings?.address ?? ""} />
            <ContactRow icon={Phone} label="Telefon" value={settings?.phone ?? ""} />
            <ContactRow icon={Mail} label="E-pochta" value={settings?.email ?? ""} />
            <Link to="/contact" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              To'liq aloqa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
};

function EmptyHint({ text }: { text: string }) {
  return <div className="glass-card border-dashed p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function StatCard({ icon: Icon, label, value, hint }: { icon: any; label: string; value: number | string; hint?: string }) {
  return (
    <div className="glass-card p-5">
      <Icon className="h-5 w-5 text-primary" />
      <div className="mt-3 text-3xl font-semibold tracking-tight">
        {typeof value === "number" ? uzNumber(value) : value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">
        {label}{hint && <span className="opacity-70"> · {hint}</span>}
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary"><Icon className="h-4 w-4" /></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
}

export default Index;
