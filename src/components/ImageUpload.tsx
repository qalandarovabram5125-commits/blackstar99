import { useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  maxMB?: number;
  accept?: string;
  label?: string;
  aspect?: string; // tailwind aspect class e.g. "aspect-video"
};

export default function ImageUpload({
  value,
  onChange,
  folder = "uploads",
  maxMB = 5,
  accept = "image/*",
  label = "Rasm yuklash",
  aspect = "aspect-video",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function pick(file: File) {
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Fayl ${maxMB}MB dan oshmasligi kerak`);
      return;
    }
    setBusy(true);
    try {
      const result = await api.uploadFile(file);
      onChange(result.url);
      toast.success("Yuklandi");
    } catch (e: any) {
      toast.error(e.message ?? "Yuklashda xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          if (ref.current) ref.current.value = "";
        }}
      />
      {value ? (
        <div className={`relative ${aspect} w-full rounded-xl overflow-hidden border border-border bg-secondary`}>
          <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-lg bg-background/90 backdrop-blur border border-border hover:bg-background"
            aria-label="O'chirish"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => ref.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur border border-border text-xs font-medium hover:bg-background inline-flex items-center gap-1.5"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            Almashtirish
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className={`${aspect} w-full rounded-xl border-2 border-dashed border-border bg-secondary/40 hover:bg-secondary transition grid place-items-center text-sm text-muted-foreground`}
        >
          {busy ? (
            <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Yuklanmoqda…</span>
          ) : (
            <span className="inline-flex items-center gap-2"><Upload className="h-4 w-4" />{label} (max {maxMB}MB)</span>
          )}
        </button>
      )}
    </div>
  );
}