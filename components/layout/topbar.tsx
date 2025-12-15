"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Languages, SunMoon, UserCircle2 } from "lucide-react";

type LanguageKey = "en" | "de" | "it";
type RoleKey = "reader" | "editor" | "admin";

export function TopBar() {
  const { theme, setTheme } = useTheme();

  const [language, setLanguage] = useState<LanguageKey>("en");
  const [role, setRole] = useState<RoleKey>("reader");
  const themeValue = (theme === "light" ? "light" : "dark") as "dark" | "light";

  useEffect(() => {
    const storedLang = (localStorage.getItem("qos-et-language") as LanguageKey | null) || "en";
    const storedRole = (localStorage.getItem("qos-et-role") as RoleKey | null) || "reader";

    setLanguage(storedLang);
    setRole(storedRole);

    // keep the document lang aligned (simple placeholder for later i18n)
    document.documentElement.lang = storedLang;
  }, []);

  useEffect(() => {
    localStorage.setItem("qos-et-language", language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem("qos-et-role", role);
  }, [role]);

  const languageLabel = useMemo(() => {
    if (language === "de") return "German";
    if (language === "it") return "Italian";
    return "English";
  }, [language]);

  const roleLabel = useMemo(() => {
    if (role === "admin") return "Admin";
    if (role === "editor") return "Editor";
    return "Reader";
  }, [role]);

  const themeLabel = themeValue === "light" ? "Light" : "Dark";

  return (
    <header
      className={cn(
        "flex h-16 items-center border-b border-border/60 px-6",
        "bg-background/55 backdrop-blur-md supports-[backdrop-filter]:bg-background/35"
      )}
    >
      <div className="flex w-full items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">QOS ET Quality Report</h1>

        <div className="flex items-center gap-4">
          {/* Language */}
          <Select value={language} onValueChange={(v: LanguageKey) => setLanguage(v)}>
            <SelectTrigger className="h-10 w-[190px] border-border/60 bg-background/40 backdrop-blur">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="English" />
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="en">English (Default)</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
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
              <SelectItem value="dark">Dark (Default)</SelectItem>
              <SelectItem value="light">Light</SelectItem>
            </SelectContent>
          </Select>

          {/* Profile */}
          <Select value={role} onValueChange={(v: RoleKey) => setRole(v)}>
            <SelectTrigger className="h-10 w-[170px] border-border/60 bg-background/40 backdrop-blur">
              <div className="flex items-center gap-2">
                <UserCircle2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{roleLabel}</span>
              </div>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="reader">Reader (Default)</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}

