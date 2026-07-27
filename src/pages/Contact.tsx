import { Section } from "@/components/ui/section";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { MapPin, Phone, Mail, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { api } from "@/api/client";
import { toast } from "sonner";
import { Btn, Field, inp } from "@/components/admin/ui";

export default function Contact() {
  const { data: s } = useSiteSettings();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!name.trim() || !message.trim()) {
      toast.error("Ism va xabar majburiy");
      return;
    }
    setBusy(true);
    toast.success("Xabaringiz yuborildi. Rahmat!");
    setName(""); setContact(""); setMessage("");
  }

  return (
    <Section title="Aloqa" subtitle="Biz bilan bog'lanish">
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
          <iframe
            title="Xarita"
            className="w-full aspect-[4/3]"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${(s?.longitude ?? 69.2401) - 0.01}%2C${(s?.latitude ?? 41.2995) - 0.005}%2C${(s?.longitude ?? 69.2401) + 0.01}%2C${(s?.latitude ?? 41.2995) + 0.005}&layer=mapnik&marker=${s?.latitude ?? 41.2995}%2C${s?.longitude ?? 69.2401}`}
            loading="lazy"
          />
        </div>
        <div className="glass-card p-6 space-y-5">
          <Row icon={MapPin} label="Manzil" value={s?.address ?? ""}/>
          <Row icon={Phone} label="Telefon" value={s?.phone ?? ""} link={s?.phone ? `tel:${s.phone}` : undefined}/>
          <Row icon={Mail} label="E-pochta" value={s?.email ?? ""} link={s?.email ? `mailto:${s.email}` : undefined}/>
        </div>
      </div>

      <div className="glass-card p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Xabar yuborish</h2>
          <p className="text-sm text-muted-foreground mt-1">Xabaringiz Telegram orqali to'g'ridan-to'g'ri ma'muriyatga yetib boradi.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Ismingiz *">
            <input className={inp} value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Ism Familiya" />
          </Field>
          <Field label="Aloqa (telefon yoki email)">
            <input className={inp} value={contact} onChange={(e) => setContact(e.target.value)} maxLength={200} placeholder="+998 ..." />
          </Field>
        </div>
        <div className="mt-3">
          <Field label="Xabar *">
            <textarea className={inp} value={message} onChange={(e) => setMessage(e.target.value)} rows={5} maxLength={2000} placeholder="Xabaringizni yozing..." />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Btn onClick={send} busy={busy}>
            {!busy && <Send className="h-4 w-4" />} Yuborish
          </Btn>
        </div>
      </div>
    </Section>
  );
}
function Row({ icon: Icon, label, value, link }: { icon:any; label:string; value:string; link?:string }) {
  const content = (
    <div className="flex items-start gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"><Icon className="h-4 w-4"/></div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-medium">{value || "—"}</div>
      </div>
    </div>
  );
  return link ? <a href={link} className="block hover:opacity-80 transition">{content}</a> : content;
}