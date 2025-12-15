"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  TrendingUp,
  Database,
  ChevronDown,
  ChevronRight,
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  children?: { name: string; href: string; icon?: any }[];
}

const navigation: NavigationItem[] = [
  { name: "QOS ET Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "AI Management Summary", href: "/ai-summary", icon: Sparkles },
  { 
    name: "Customer & Supplier Performance", 
    icon: TrendingUp,
    children: [
      { name: "Customer Performance", href: "/customer-ppm-global", icon: Users },
      { name: "Supplier Performance", href: "/supplier-ppm-global", icon: Package },
    ]
  },
  { 
    name: "Cost Performance", 
    icon: Coins,
    children: [
      { name: "Poor Quality Costs", href: "/cost-poor-quality", icon: ReceiptEuro },
      { name: "Warranties Costs", href: "/warranties-costs", icon: ShieldCheck },
    ]
  },
  { 
    name: "Internal Performance", 
    icon: BarChart3,
    children: [
      { name: "PPAPs Overview", href: "/ppaps", icon: ClipboardList },
      { name: "Deviations Overview", href: "/deviations", icon: AlertTriangle },
      { name: "Audit Management", href: "/audit-management", icon: FileCheck },
    ]
  },
  { name: "Upload Data", href: "/upload", icon: Upload },
  { name: "Data Lineage", href: "/data-lineage", icon: Database },
  { name: "FAQ & Glossary", href: "/glossary", icon: HelpCircle },
];

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
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (itemName: string) => {
    setOpenItem((prev) => {
      // If clicking the same item, close it; otherwise open the new one
      return prev === itemName ? null : itemName;
    });
  };

  // Auto-open parent items if a child is active (only one at a time)
  useEffect(() => {
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(
          (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
        );
        if (hasActiveChild) {
          setOpenItem(item.name);
        }
      }
    });
  }, [pathname]);

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      <div className="relative flex items-center justify-center border-b border-border px-3 py-2 min-h-[68px] overflow-hidden">
        <Link
          href="/"
          className="group relative flex items-center justify-center w-full z-10 overflow-hidden rounded-lg border border-transparent hover:border-[#00FF00]/30 hover:shadow-[0_8px_24px_0_rgba(0,255,0,0.18)] transition-all duration-300"
        >
          <ShineOverlay />
          <div className="relative z-10 w-full flex items-center justify-center">
            <Image
              src="/Media/QOS Logo green.jpg"
              alt="QM ET Logo"
              width={232}
              height={120}
              className="w-full object-contain"
              style={{ height: 'auto' }}
              priority
            />
          </div>
        </Link>
        {/* Gradient overlay at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-sidebar pointer-events-none" />
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto sidebar-scrollbar">
        {navigation.map((item) => {
          // Check if item or any child is active
          const isActive = item.href 
            ? (pathname === item.href || pathname?.startsWith(item.href + "/"))
            : item.children?.some(
                (child) => pathname === child.href || pathname?.startsWith(child.href + "/")
              ) || false;
          
          const isOpen = openItem === item.name;

          if (item.children && item.children.length > 0) {
            // Item with submenu
            return (
              <Collapsible
                key={item.name}
                open={isOpen}
                onOpenChange={() => toggleItem(item.name)}
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
                    <span className="text-left">{item.name}</span>
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
                      const isChildActive = pathname === child.href || pathname?.startsWith(child.href + "/");
                      const ChildIcon = child.icon || FileText;
                      return (
                        <Link
                          key={child.name}
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
                            <span className="text-left">{child.name}</span>
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
                key={item.name}
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
                  <span className="text-left">{item.name}</span>
                </div>
              </Link>
            );
          }
        })}
      </nav>
    </div>
  );
}

