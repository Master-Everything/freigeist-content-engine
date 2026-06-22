import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  ScanSearch,
  UserCheck,
  BookOpen,
  MessagesSquare,
  Video,
  FileText,
  Newspaper,
  LayoutDashboard,
  Wrench,
  LogOut,
  Plus,
  User as UserIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

function UserMenu({ collapsed }: { collapsed: boolean }) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  return (
    <>
      <SidebarMenuItem>
        <div className={cn("flex items-center gap-2 px-2 py-1.5 text-xs", collapsed && "justify-center")}>
          <UserIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{user.email}</div>
              {role && <div className="text-[10px] text-muted-foreground capitalize">{role}</div>}
            </div>
          )}
        </div>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={async () => {
            await signOut();
            navigate("/auth");
          }}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Abmelden</span>}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

type Module = {
  num: number;
  title: string;
  url: string;
  icon: any;
  status: "active" | "planned";
};

const adminModules: Module[] = [
  { num: 1, title: "Erfassung", url: "/module/erfassung", icon: ClipboardList, status: "planned" },
  { num: 2, title: "Vorab-Scan", url: "/module/vorab-scan", icon: ScanSearch, status: "planned" },
  { num: 3, title: "Profil & Sprechermappe", url: "/module/profil", icon: UserCheck, status: "planned" },
  { num: 4, title: "Interview-Leitfaden", url: "/module/leitfaden", icon: BookOpen, status: "planned" },
  { num: 5, title: "Vorgespräch", url: "/module/vorgespraech", icon: MessagesSquare, status: "planned" },
  { num: 6, title: "Aufzeichnung / Live", url: "/module/aufzeichnung", icon: Video, status: "planned" },
  { num: 7, title: "Interview-Beiträge", url: "/module/interview-beitraege", icon: FileText, status: "active" },
  { num: 8, title: "News-Plattform", url: "/module/news", icon: Newspaper, status: "planned" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useAuth();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) =>
    url === "/" || url === "/speaker" ? pathname === url : pathname.startsWith(url);

  const isAdmin = role === "admin";
  const homeUrl = isAdmin ? "/" : "/speaker";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Übersicht</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === homeUrl}>
                  <NavLink to={homeUrl} end className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Workflow-Module</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminModules.map((m) => (
                  <SidebarMenuItem key={m.url}>
                    <SidebarMenuButton asChild isActive={isActive(m.url)}>
                      <NavLink to={m.url} className="flex items-center gap-2">
                        <m.icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <>
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {m.num}.
                            </span>
                            <span className="flex-1 truncate">{m.title}</span>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5 py-0 h-5",
                                m.status === "active"
                                  ? "border-primary/40 text-primary"
                                  : "text-muted-foreground"
                              )}
                            >
                              {m.status === "active" ? "Aktiv" : "Geplant"}
                            </Badge>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>Mein Bereich</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/module/erfassung")}>
                    <NavLink to="/module/erfassung" className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Mein Profil</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/module/interview/neu")}>
                    <NavLink to="/module/interview/neu" className="flex items-center gap-2">
                      <Plus className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Neues Interview</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/module/interview-beitraege/mine")}>
                    <NavLink to="/module/interview-beitraege/mine" className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>Meine Beiträge</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/tech-stack"}>
                <NavLink to="/tech-stack" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  {!collapsed && <span>Tech Stack</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <UserMenu collapsed={collapsed} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
