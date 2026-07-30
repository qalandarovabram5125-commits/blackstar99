import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { RequireAuth } from "@/components/RequireAuth";
import { RequireRole } from "@/components/RequireRole";
import Index from "./pages/Index";
import News from "./pages/News";
import Events from "./pages/Events";
import Certificates from "./pages/Certificates";
import Gallery from "./pages/Gallery";
import Library from "./pages/Library";
import Schedule from "./pages/Schedule";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/Auth";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminNews from "./pages/admin/AdminNews";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminProud from "./pages/admin/AdminProud";
import AdminSchedule from "./pages/admin/AdminSchedule";
import AdminLibrary from "./pages/admin/AdminLibrary";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminAudit from "./pages/admin/AdminAudit";
import { FaviconManager } from "@/components/FaviconManager";
import Chat from "./pages/Chat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <FaviconManager />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/news" element={<News />} />
              <Route path="/events" element={<Events />} />
              <Route path="/certificates" element={<Certificates />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/library" element={<Library />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/contact" element={<Contact />} />
              <Route element={<RequireAuth />}>
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
            <Route path="/auth" element={<AuthPage />} />
            <Route element={<RequireAuth />}>
              <Route path="/chat" element={<Chat />} />
            </Route>
            <Route element={<RequireRole roles={["admin", "superadmin", "vice_principal"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="news" element={<AdminNews />} />
                <Route path="events" element={<AdminEvents />} />
                <Route path="certificates" element={<AdminCertificates />} />
                <Route path="gallery" element={<AdminGallery />} />
                <Route path="proud" element={<AdminProud />} />
                <Route path="schedule" element={<AdminSchedule />} />
                <Route path="library" element={<AdminLibrary />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route element={<RequireRole roles={["superadmin"]} />}>
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                  <Route path="audit" element={<AdminAudit />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
