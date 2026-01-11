"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  TrendingUp,
  Database,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Coins,
  BarChart3,
  ClipboardList,
  AlertTriangle,
  Shield,
  Sparkles,
  Users,
  Package,
  ReceiptEuro,
  ShieldCheck,
  FileCheck,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ROLE_CHANGED_EVENT, ROLE_STORAGE_KEY, type RoleKey } from "@/lib/auth/roles";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTranslation } from "@/lib/i18n/useTranslation";

interface NavigationItem {
  nameKey: string;
  href?: string;
  icon: any;
  children?: { nameKey: string; href: string; icon?: any }[];
}

function ShineOverlay() {
  return (
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-transparent via-[#00FF00]/30 to-transparent -translate-x-full -translate-y-full group-hover:translate-x-full group-hover:translate-y-full transition-transform ease-in-out"
        style={{ width: "200%", height: "200%", transitionDuration: "1333ms" }}
      />
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [openItem, setOpenItem] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [role, setRole] = useState<RoleKey>("reader");

  useEffect(() => {
    const stored = localStorage.getItem("qos-et-sidebar-collapsed");
    setIsCollapsed(stored === "1");
  }, []);

  useEffect(() => {
    const loadRole = () => {
      const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as RoleKey | null) || "reader";
      setRole(storedRole);
    };

    loadRole();
    const onRoleChanged = () => loadRole();
    window.addEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
    return () => window.removeEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("qos-et-sidebar-collapsed", next ? "1" : "0");
      // Force chart/layout re-measure (e.g. Recharts) when sidebar width changes
      setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
      return next;
    });
  };

  const toggleItem = (itemNameKey: string) => {
    setOpenItem((prev) => {
      // If clicking the same item, close it; otherwise open the new one
      return prev === itemNameKey ? null : itemNameKey;
    });
  };

  const navigation: NavigationItem[] = useMemo(() => [
    { nameKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { nameKey: "aiSummary", href: "/ai-summary", icon: Sparkles },
    { 
      nameKey: "customerSupplierPerformance", 
      icon: TrendingUp,
      children: [
        { nameKey: "customerPerformance", href: "/customer-ppm-global", icon: Users },
        { nameKey: "supplierPerformance", href: "/supplier-ppm-global", icon: Package },
      ]
    },
    { 
      nameKey: "costPerformance", 
      icon: Coins,
      children: [
        { nameKey: "poorQualityCosts", href: "/cost-poor-quality", icon: ReceiptEuro },
        { nameKey: "warrantiesCosts", href: "/warranties-costs", icon: ShieldCheck },
      ]
    },
    { 
      nameKey: "internalPerformance", 
      icon: BarChart3,
      children: [
        { nameKey: "ppapsOverview", href: "/ppaps", icon: ClipboardList },
        { nameKey: "deviationsOverview", href: "/deviations", icon: AlertTriangle },
        { nameKey: "auditManagement", href: "/audit-management", icon: FileCheck },
      ]
    },
    { nameKey: "uploadData", href: "/upload", icon: Upload },
    { nameKey: "dataLineage", href: "/data-lineage", icon: Database },
    { nameKey: "glossary", href: "/glossary", icon: HelpCircle },
  ], []);

  // Auto-open parent items if a child is active (only one at a time)
  useEffect(() => {
    if (isCollapsed) return;
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
        );
        if (hasActiveChild) {
          setOpenItem(item.nameKey);
        }
      }
    });
  }, [pathname, isCollapsed, navigation]);

  const visibleNavigation = useMemo(() => {
    // Always show all navigation items - access control is handled on the upload page itself
    return navigation;
  }, [navigation]);

  const flattenedNavigation = useMemo(() => {
    return navigation.flatMap((item) => {
      if (item.children && item.children.length > 0) {
        return item.children.map((child) => ({
          nameKey: child.nameKey,
          name: t.sidebar[child.nameKey as keyof typeof t.sidebar] as string,
          href: child.href,
          icon: child.icon || FileText,
        }));
      }

      if (!item.href) return [];

      return [{ 
        nameKey: item.nameKey,
        name: t.sidebar[item.nameKey as keyof typeof t.sidebar] as string,
        href: item.href, 
        icon: item.icon 
      }];
    });
  }, [navigation, t]);

  const visibleFlattenedNavigation = useMemo(() => {
    // Always show all navigation items - access control is handled on the upload page itself
    return flattenedNavigation;
  }, [flattenedNavigation]);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar overflow-hidden transition-[width] duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-64"
      )}
    >
      <div className="relative flex flex-col items-center justify-center gap-2 border-b border-border px-3 py-2 min-h-[68px] overflow-hidden">
        <Link
          href="/"
          className={cn(
            "group relative flex items-center justify-center z-10 overflow-hidden rounded-lg border border-transparent hover:border-[#00FF00]/30 hover:shadow-[0_8px_24px_0_rgba(0,255,0,0.18)] transition-all duration-300",
            isCollapsed ? "p-1" : "w-full"
          )}
          aria-label="Go to home"
          title="Home"
        >
          <ShineOverlay />
          <div className={cn("relative z-10 flex items-center justify-center", isCollapsed ? "w-10" : "w-full")}>
            <Image
              src="/Media/QOS Logo green.jpg"
              alt="QM ET Logo"
              width={isCollapsed ? 40 : 232}
              height={isCollapsed ? 40 : 120}
              className={cn("object-contain", isCollapsed ? "h-10 w-10" : "w-full")}
              style={{ height: "auto" }}
              priority
            />
          </div>
        </Link>

        {/* Collapse / Expand button (below logo) */}
        <Button
          type="button"
          variant="outline"
          size={isCollapsed ? "icon" : "sm"}
          className={cn(
            "z-20 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50",
            isCollapsed ? "h-9 w-9" : "h-9 w-full justify-center"
          )}
          onClick={toggleCollapsed}
          aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
          title={isCollapsed ? "Expand menu" : "Collapse menu"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!isCollapsed && <span className="text-xs">{t.common.close}</span>}
        </Button>

        {/* Gradient overlay at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-sidebar pointer-events-none" />
      </div>

      <nav
        className={cn(
          "relative flex-1 space-y-1 py-4 overflow-y-auto sidebar-scrollbar",
          isCollapsed ? "px-2" : "px-3"
        )}
      >
        {/* Collapsed (icon rail) */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none absolute inset-0"
          )}
          aria-hidden={!isCollapsed}
          inert={!isCollapsed ? true : undefined}
        >
          {visibleFlattenedNavigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative overflow-hidden flex items-center justify-center rounded-lg px-2 py-2 text-sm font-medium transition-colors text-left border border-transparent hover:border-[#00FF00]/20 hover:shadow-[0_6px_18px_0_rgba(0,255,0,0.14)]",
                  isActive
                    ? "bg-[#00FF88] text-[#000000] font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                aria-label={item.name}
                title={item.name}
              >
                <ShineOverlay />
                <div className="relative z-10 flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                  <span className="sr-only">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Expanded (full nav) */}
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isCollapsed ? "opacity-0 translate-x-2 pointer-events-none absolute inset-0" : "opacity-100 translate-x-0"
          )}
          aria-hidden={isCollapsed}
          inert={isCollapsed ? true : undefined}
        >
          {visibleNavigation.map((item) => {
          const itemName = t.sidebar[item.nameKey as keyof typeof t.sidebar] as string;
          // Check if item or any child is active
          const isActive = item.href 
            ? (pathname === item.href || pathname?.startsWith(item.href + "/"))
            : item.children?.some(
                (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
              ) || false;
          
          const isOpen = openItem === item.nameKey;

          if (item.children && item.children.length > 0) {
            // Item with submenu
            return (
              <Collapsible
                key={item.nameKey}
                open={isOpen}
                onOpenChange={() => toggleItem(item.nameKey)}
              >
                <CollapsibleTrigger
                  className={cn(
                    "group relative overflow-hidden w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left border border-transparent hover:border-[#00FF00]/20 hover:shadow-[0_6px_18px_0_rgba(0,255,0,0.14)]",
                    isActive
                      ? "bg-[#00FF88] text-[#000000] font-semibold"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <ShineOverlay />
                  <div className="relative z-10 flex items-center gap-3 text-left flex-1">
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-left">{itemName}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 transition-transform" />
                  ) : (
                    <ChevronRight className="h-4 w-4 transition-transform" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                  <div className="ml-8 mt-1 space-y-1">
                    {item.children.map((child) => {
                      const childName = t.sidebar[child.nameKey as keyof typeof t.sidebar] as string;
                      const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                      const ChildIcon = child.icon || FileText;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "group relative overflow-hidden flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left border border-transparent hover:border-[#00FF00]/20 hover:shadow-[0_6px_18px_0_rgba(0,255,0,0.14)]",
                            isChildActive
                              ? "bg-[#00FF88] text-[#000000] font-semibold"
                              : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <ShineOverlay />
                          <div className="relative z-10 flex items-center gap-3">
                            <ChildIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-left">{childName}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          } else {
            // Regular menu item
            return (
              <Link
                key={item.nameKey}
                href={item.href || "#"}
                className={cn(
                  "group relative overflow-hidden flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left border border-transparent hover:border-[#00FF00]/20 hover:shadow-[0_6px_18px_0_rgba(0,255,0,0.14)]",
                  isActive
                    ? "bg-[#00FF88] text-[#000000] font-semibold"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <ShineOverlay />
                <div className="relative z-10 flex items-center gap-3">
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-left">{itemName}</span>
                </div>
              </Link>
            );
          }
        })}
        </div>
      </nav>
    </div>
  );
}
