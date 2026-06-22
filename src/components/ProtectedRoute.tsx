import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

type Role = "admin" | "speaker";

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Speaker hat keinen Zugriff auf Admin-Routen → zurück auf Speaker-Dashboard
    // Admin landet auf Workflow-Übersicht
    const fallback = role === "admin" ? "/" : "/speaker";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
