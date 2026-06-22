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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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

type SubItem = { title: string; url: string };
type Module = {
  num: number;
  title: string;
  url: string;
  icon: any;
  status: "active" | "in-progress" | "planned";
  items?: SubItem[];
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

const speakerModules: Module[] = [
  {
    num: 1,
    title: "Erfassung",
    url: "/module/erfassung",
    icon: ClipboardList,
    status: "active",
    items: [
      { title: "Profil", url: "/module/erfassung" },
      { title: "Neues Interview", url: "/module/interview/neu" },
      { title: "Meine Interviews", url: "/module/interview-beitraege/mine" },
    ],
  },
  {
    num: 2,
    title: "Vorab-Scan",
    url: "/module/vorab-scan/eingereicht",
    icon: ScanSearch,
    status: "in-progress",
    items: [
      { title: "Eingereichte Interviews", url: "/module/vorab-scan/eingereicht" },
    ],
  },
  { num: 3, title: "Profil & Sprechermappe", url: "/speaker/modul/3", icon: UserCheck, status: "planned" },
  { num: 4, title: "Interview-Leitfaden", url: "/speaker/modul/4", icon: BookOpen, status: "planned" },
  { num: 5, title: "Vorgespräch", url: "/speaker/modul/5", icon: MessagesSquare, status: "planned" },
  { num: 6, title: "Aufzeichnung / Live", url: "/speaker/modul/6", icon: Video, status: "planned" },
  { num: 7, title: "Interview-Beiträge", url: "/speaker/modul/7", icon: FileText, status: "planned" },
  { num: 8, title: "News-Plattform", url: "/speaker/modul/8", icon: Newspaper, status: "planned" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useAuth();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isAdmin = role === "admin";
  const homeUrl = isAdmin ? "/" : "/speaker";
  const modules = isAdmin ? adminModules : speakerModules;

  const isSubActive = (url: string) => pathname === url;
  const isModuleActive = (m: Module) => {
    if (m.items?.some((it) => pathname === it.url)) return true;
    return pathname === m.url;
  };

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

        <SidebarGroup>
          <SidebarGroupLabel>Workflow-Module</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {modules.map((m) => {
                const active = isModuleActive(m);
                return (
                  <SidebarMenuItem key={`${m.num}-${m.url}`}>
                    <SidebarMenuButton asChild isActive={active}>
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
                                  : m.status === "in-progress"
                                  ? "border-amber-500/40 text-amber-500"
                                  : "text-muted-foreground"
                              )}
                            >
                              {m.status === "active"
                                ? "Aktiv"
                                : m.status === "in-progress"
                                ? "Umsetzung"
                                : "Geplant"}
                            </Badge>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                    {!collapsed && m.items && active && (
                      <SidebarMenuSub>
                        {m.items.map((it) => (
                          <SidebarMenuSubItem key={it.url}>
                            <SidebarMenuSubButton asChild isActive={isSubActive(it.url)}>
                              <NavLink to={it.url}>{it.title}</NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
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
