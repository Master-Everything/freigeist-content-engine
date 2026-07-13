import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";
import DashboardHome from "./pages/DashboardHome";
import SpeakerDashboard from "./pages/SpeakerDashboard";
import MyPosts from "./pages/MyPosts";
import ViewPost from "./pages/ViewPost";
import InterviewPostsList from "./pages/Index";
import NewPost from "./pages/NewPost";
import EditPost from "./pages/EditPost";
import PreviewPost from "./pages/PreviewPost";
import TechStack from "./pages/TechStack";
import Auth from "./pages/Auth";
import Module1Erfassung from "./pages/modules/Module1Erfassung";
import Module2VorabScan from "./pages/modules/Module2VorabScan";
import Module3Profil from "./pages/modules/Module3Profil";
import Module4Leitfaden from "./pages/modules/Module4Leitfaden";
import Module5Vorgespraech from "./pages/modules/Module5Vorgespraech";
import Module6Aufzeichnung from "./pages/modules/Module6Aufzeichnung";
import Module8NewsPlattform from "./pages/modules/Module8NewsPlattform";
import ErfassungDanke from "./pages/modules/erfassung/Danke";
import InterviewForm from "./pages/modules/interview/InterviewForm";
import InterviewEdit from "./pages/modules/interview/InterviewEdit";
import VorabScanEingereicht from "./pages/modules/vorab-scan/Eingereicht";
import SpeakerModulePlaceholder from "./pages/SpeakerModulePlaceholder";
import Wissensbasis from "./pages/admin/Wissensbasis";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              {/* Admin-Startseite */}
              <Route
                path="/"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <DashboardHome />
                  </ProtectedRoute>
                }
              />
              {/* Speaker-Startseite */}
              <Route path="/speaker" element={<SpeakerDashboard />} />
              <Route path="/module/interview-beitraege/mine" element={<MyPosts />} />
              <Route path="/module/interview-beitraege/view/:id" element={<ViewPost />} />

              {/* Gemeinsam: Speaker + Admin */}
              <Route path="/module/erfassung" element={<Module1Erfassung />} />
              <Route path="/module/erfassung/danke" element={<ErfassungDanke />} />
              <Route path="/module/interview/neu" element={<InterviewForm />} />
              <Route path="/module/interview/edit/:id" element={<InterviewEdit />} />
              <Route path="/module/vorab-scan/eingereicht" element={<VorabScanEingereicht />} />
              <Route path="/speaker/modul/:num" element={<SpeakerModulePlaceholder />} />

              {/* Admin-only Module */}
              <Route
                path="/module/vorab-scan"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Module2VorabScan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/profil"
                element={
                  <ProtectedRoute>
                    <Module3Profil />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/leitfaden"
                element={
                  <ProtectedRoute>
                    <Module4Leitfaden />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/vorgespraech"
                element={
                  <ProtectedRoute>
                    <Module5Vorgespraech />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/aufzeichnung"
                element={
                  <ProtectedRoute>
                    <Module6Aufzeichnung />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/interview-beitraege"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <InterviewPostsList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/interview-beitraege/new"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <NewPost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/interview-beitraege/edit/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <EditPost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/interview-beitraege/preview/:id"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <PreviewPost />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/module/news"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Module8NewsPlattform />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/wissensbasis"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <Wissensbasis />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tech-stack"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <TechStack />
                  </ProtectedRoute>
                }
              />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
