import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import DashboardHome from "./pages/DashboardHome";
import InterviewPostsList from "./pages/Index";
import NewPost from "./pages/NewPost";
import EditPost from "./pages/EditPost";
import PreviewPost from "./pages/PreviewPost";
import TechStack from "./pages/TechStack";
import Module1Erfassung from "./pages/modules/Module1Erfassung";
import Module2VorabScan from "./pages/modules/Module2VorabScan";
import Module3Profil from "./pages/modules/Module3Profil";
import Module4Leitfaden from "./pages/modules/Module4Leitfaden";
import Module5Vorgespraech from "./pages/modules/Module5Vorgespraech";
import Module6Aufzeichnung from "./pages/modules/Module6Aufzeichnung";
import Module8NewsPlattform from "./pages/modules/Module8NewsPlattform";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/module/erfassung" element={<Module1Erfassung />} />
            <Route path="/module/vorab-scan" element={<Module2VorabScan />} />
            <Route path="/module/profil" element={<Module3Profil />} />
            <Route path="/module/leitfaden" element={<Module4Leitfaden />} />
            <Route path="/module/vorgespraech" element={<Module5Vorgespraech />} />
            <Route path="/module/aufzeichnung" element={<Module6Aufzeichnung />} />
            <Route path="/module/interview-beitraege" element={<InterviewPostsList />} />
            <Route path="/module/interview-beitraege/new" element={<NewPost />} />
            <Route path="/module/interview-beitraege/edit/:id" element={<EditPost />} />
            <Route path="/module/interview-beitraege/preview/:id" element={<PreviewPost />} />
            <Route path="/module/news" element={<Module8NewsPlattform />} />
            <Route path="/tech-stack" element={<TechStack />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
