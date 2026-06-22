import { NavLink, useLocation } from "react-router-dom";
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

type Item = {
  num?: number;
  title: string;
  url: string;
  icon: any;
  status: "active" | "planned";
};

const modules: Item[] = [
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
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname.startsWith(url);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Übersicht</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/"}>
                  <NavLink to="/" end className="flex items-center gap-2">
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
              {modules.map((m) => (
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === "/tech-stack"}>
              <NavLink to="/tech-stack" className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {!collapsed && <span>Tech Stack</span>}
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <UserMenu collapsed={collapsed} />
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
