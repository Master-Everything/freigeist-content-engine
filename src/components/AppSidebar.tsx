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
  Database,
  Sparkles,
} from "lucide-react";
import { useKnowledgeCounts } from "@/hooks/useKnowledgeCounts";
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
  { num: 1, title: "Erfassung", url: "/module/erfassung", icon: ClipboardList, status: "active" },
  { num: 2, title: "Vorab-Scan", url: "/module/vorab-scan", icon: ScanSearch, status: "active" },
  { num: 3, title: "Profil & Sprechermappe", url: "/module/profil", icon: UserCheck, status: "in-progress" },
  { num: 4, title: "Interview-Leitfaden", url: "/module/leitfaden", icon: BookOpen, status: "in-progress" },
  { num: 5, title: "Vorgespräch", url: "/module/vorgespraech", icon: MessagesSquare, status: "active" },
  { num: 6, title: "Aufzeichnung / Live", url: "/module/aufzeichnung", icon: Video, status: "in-progress" },
  { num: 7, title: "Interview-Beiträge", url: "/module/interview-beitraege", icon: FileText, status: "active" },
  { num: 8, title: "News-Plattform", url: "/module/news", icon: Newspaper, status: "active" },
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
    status: "active",
    items: [
      { title: "Eingereichte Interviews", url: "/module/vorab-scan/eingereicht" },
    ],
  },
  { num: 3, title: "Profil & Sprechermappe", url: "/module/profil", icon: UserCheck, status: "in-progress" },
  { num: 4, title: "Interview-Leitfaden", url: "/module/leitfaden", icon: BookOpen, status: "in-progress" },
  { num: 5, title: "Vorgespräch", url: "/module/vorgespraech", icon: MessagesSquare, status: "active" },
  { num: 6, title: "Aufzeichnung / Live", url: "/module/aufzeichnung", icon: Video, status: "in-progress" },
  { num: 7, title: "Interview-Beiträge", url: "/speaker/modul/7", icon: FileText, status: "planned" },
  { num: 8, title: "News-Plattform", url: "/speaker/modul/8", icon: Newspaper, status: "active" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { role } = useAuth();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isAdmin = role === "admin";
  const homeUrl = isAdmin ? "/" : "/speaker";
  const modules = isAdmin ? adminModules : speakerModules;
  const knowledgeCounts = isAdmin ? useKnowledgeCounts() : null;

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
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/wissensbasis"}>
                  <NavLink to="/admin/wissensbasis" className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {!collapsed && <span>Wissensbasis</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {!collapsed && knowledgeCounts && (
                <SidebarMenuItem>
                  <div className="px-3 py-1 text-[10px] leading-tight text-muted-foreground">
                    {knowledgeCounts.rules} Regeln · {knowledgeCounts.banned} Wörter ·{" "}
                    {knowledgeCounts.prompts} Prompts
                  </div>
                </SidebarMenuItem>
              )}
              {!collapsed && (
                <SidebarMenuItem>
                  <div
                    className="mx-2 mt-1 mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-transparent px-2 py-0.5 text-[10px] text-muted-foreground shadow-[0_0_0_0_transparent] transition-shadow hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.5)]"
                    title="Powered by Martina Hautau"
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>
                      Powered by <span className="font-medium text-foreground">Martina Hautau</span>
                    </span>
                  </div>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/tech-stack"}>
                  <NavLink to="/tech-stack" className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    {!collapsed && <span>Tech Stack</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          <UserMenu collapsed={collapsed} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
