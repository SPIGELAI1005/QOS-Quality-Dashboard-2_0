"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Languages, SunMoon, UserCircle2, MessageCircle } from "lucide-react";
import { RoleAccessDialog } from "@/components/auth/role-access-dialog";
import { ROLE_CHANGED_EVENT, ROLE_STORAGE_KEY, type RoleKey } from "@/lib/auth/roles";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { type LanguageKey, LANGUAGE_CHANGED_EVENT } from "@/lib/i18n/translations";
import { IAmQChatPanel } from "@/components/iamq/iamq-chat-panel";

export function TopBar() {
  const { theme, setTheme } = useTheme();
  const { t, language, setLanguage } = useTranslation();

  const [role, setRole] = useState<RoleKey>("reader");
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<RoleKey | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const themeValue = (theme === "light" ? "light" : "dark") as "dark" | "light";

  useEffect(() => {
    const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as RoleKey | null) || "reader";
    setRole(storedRole);
  }, []);

  useEffect(() => {
    const loadRole = () => {
      const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as RoleKey | null) || "reader";
      setRole(storedRole);
    };

    const onRoleChanged = () => loadRole();
    window.addEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
    return () => window.removeEventListener(ROLE_CHANGED_EVENT, onRoleChanged);
  }, []);

  const languageLabel = useMemo(() => {
    if (language === "de") return "Deutsch";
    if (language === "it") return "Italiano";
    return "English";
  }, [language]);

  const roleLabel = useMemo(() => {
    return t.common[role === "admin" ? "admin" : role === "editor" ? "editor" : "reader"];
  }, [role, t]);

  const themeLabel = themeValue === "light" ? t.common.light : t.common.dark;

  return (
    <header
      className={cn(
        "flex h-16 items-center border-b border-border/60 px-6",
        "bg-background/55 backdrop-blur-md supports-[backdrop-filter]:bg-background/35"
      )}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">{t.header.title}</h1>

        <div className="flex items-center gap-4">
          {/* I AM Q Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsChatOpen(true)}
            className={cn(
              "h-11 px-4 bg-[#00FF88] text-black hover:bg-[#00FF88] hover:border-black border-[#00FF88] border-2 font-semibold shadow-sm hover:shadow-md transition-all",
              themeValue === "light" && "hover:text-black"
            )}
          >
            <MessageCircle className={cn("h-5 w-5 scale-x-[-1] text-black", themeValue === "light" && "hover:text-black")} />
            <span className={cn("ml-2.5 font-semibold", themeValue === "light" && "hover:text-black")}>I A:M Q</span>
          </Button>

          {/* Language */}
          <Select value={language} onValueChange={(v: LanguageKey) => setLanguage(v)}>
            <SelectTrigger className="h-10 w-[190px] border-border/60 bg-background/40 backdrop-blur">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder={languageLabel} />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="en">English {language === "en" ? "(Default)" : ""}</SelectItem>
              <SelectItem value="de">Deutsch {language === "de" ? "(Standard)" : ""}</SelectItem>
              <SelectItem value="it">Italiano {language === "it" ? "(Predefinito)" : ""}</SelectItem>
            </SelectContent>
          </Select>

          {/* Theme */}
          <Select value={themeValue} onValueChange={(v: "dark" | "light") => setTheme(v)}>
            <SelectTrigger className="h-10 w-[170px] border-border/60 bg-background/40 backdrop-blur">
              <div className="flex items-center gap-2">
                <SunMoon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{themeLabel}</span>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="dark">{t.common.dark} {themeValue === "dark" ? `(${language === "de" ? "Standard" : "Default"})` : ""}</SelectItem>
              <SelectItem value="light">{t.common.light}</SelectItem>
            </SelectContent>
          </Select>

          {/* Profile / Role switch (dropdown under user icon) */}
          <Select
            value={role}
            onValueChange={(next: RoleKey) => {
              if (next === "reader") {
                localStorage.setItem(ROLE_STORAGE_KEY, "reader");
                window.dispatchEvent(new Event(ROLE_CHANGED_EVENT));
              } else {
                // open password dialog and preset role; do not change select yet
                setPendingRole(next);
                setIsRoleDialogOpen(true);
              }
            }}
          >
            <SelectTrigger className="h-10 w-[190px] border-border/60 bg-background/40 backdrop-blur justify-start">
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder={roleLabel} />
              </div>
            </SelectTrigger>
            <SelectContent align="end" className="z-[2001]">
              <SelectItem value="reader">{t.common.reader} {role === "reader" ? `(${language === "de" ? "Standard" : "Default"})` : ""}</SelectItem>
              <SelectItem value="editor">{t.common.editor}</SelectItem>
              <SelectItem value="admin">{t.common.admin}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <RoleAccessDialog
        open={isRoleDialogOpen}
        title={t.roleAccess.switchRole}
        description={t.roleAccess.selectRoleDescription}
        forceChoice
        initialRole={pendingRole ?? undefined}
        onClose={() => setIsRoleDialogOpen(false)}
        onAuthenticated={() => {
          setIsRoleDialogOpen(false);
          setPendingRole(null);
          // After successful auth, ensure the Select shows the new role (reload from storage)
          const storedRole = (localStorage.getItem(ROLE_STORAGE_KEY) as RoleKey | null) || "reader";
          setRole(storedRole);
        }}
      />

      <IAmQChatPanel open={isChatOpen} onOpenChange={setIsChatOpen} />
    </header>
  );
}

