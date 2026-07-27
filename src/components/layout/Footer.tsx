import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-20 glass-sheet border-t border-white/30">
      <div className="container-page py-10 grid gap-6 sm:grid-cols-3 text-sm">
        <div>
          <div className="flex items-center gap-2 font-semibold">
            <Logo size={28} className="rounded-lg" />
            51-maktab
          </div>
          <p className="mt-2 text-muted-foreground">Rasmiy portal va o'quvchilar maydoni.</p>
        </div>
        <div>
          <h4 className="font-medium mb-2">Bo'limlar</h4>
          <ul className="grid gap-1.5 text-muted-foreground">
            <li><Link to="/news" className="hover:text-foreground">Yangiliklar</Link></li>
            <li><Link to="/events" className="hover:text-foreground">Tadbirlar</Link></li>
            <li><Link to="/gallery" className="hover:text-foreground">Galereya</Link></li>
            <li><Link to="/library" className="hover:text-foreground">Kutubxona</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium mb-2">Aloqa</h4>
          <ul className="grid gap-1.5 text-muted-foreground">
            <li><Link to="/contact" className="hover:text-foreground">Bog'lanish</Link></li>
            <li><Link to="/schedule" className="hover:text-foreground">Dars jadvali</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="container-page py-4 text-xs text-muted-foreground text-center">
          Developer: Abram Qalandarov · © {new Date().getFullYear()} 51-maktab
        </div>
      </div>
    </footer>
  );
}