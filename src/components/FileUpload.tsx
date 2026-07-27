import { useRef, useState } from "react";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { api } from "@/api/client";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  maxMB?: number;
  accept?: string;
  label?: string;
};

export default function FileUpload({
  value, onChange, folder = "files", maxMB = 50,
  accept = ".pdf,.doc,.docx,.epub,.txt,.zip", label = "Fayl yuklash",
}: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState<string>("");

  async function pick(file: File) {
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`Fayl ${maxMB}MB dan oshmasligi kerak`);
      return;
    }
    setBusy(true);
    try {
      const result = await api.uploadFile(file);
      onChange(result.url);
      setName(result.name || file.name);
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
        ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pick(f);
          if (ref.current) ref.current.value = "";
        }}
      />
      {value ? (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-secondary/40">
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm truncate flex-1 hover:underline">
            {name || value.split("/").pop()}
          </a>
          <button type="button" onClick={() => ref.current?.click()} className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs hover:bg-secondary inline-flex items-center gap-1">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Almashtirish
          </button>
          <button type="button" onClick={() => { onChange(""); setName(""); }} className="grid h-7 w-7 place-items-center rounded-lg hover:bg-background">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="w-full p-6 rounded-xl border-2 border-dashed border-border bg-secondary/40 hover:bg-secondary transition grid place-items-center text-sm text-muted-foreground"
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