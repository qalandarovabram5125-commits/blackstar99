import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MeshBg } from "@/components/MeshBg";

export default function PublicLayout() {
  return (
    <div className="min-h-full flex flex-col bg-background relative">
      <MeshBg />
      <Header />
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}