import { Check, Languages } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeLanguage, type SupportedLang } from "@/i18n";
import { cn } from "@/lib/utils";

const LANG_OPTIONS: { value: SupportedLang; label: string; short: string }[] = [
  { value: "en", label: "English", short: "EN" },
  { value: "zh-CN", label: "简体中文", short: "中" },
];

export const LanguageToggle: React.FC = () => {
  const { t, i18n } = useTranslation();
  const current = i18n.language?.startsWith("zh") ? "zh-CN" : "en";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("nav.switchLanguage")}
            title={t("nav.switchLanguage")}
          />
        }
      >
        <Languages className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANG_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => changeLanguage(opt.value)}
            className="cursor-pointer"
          >
            <Check className={cn("h-4 w-4", current === opt.value ? "opacity-100" : "opacity-0")} />
            <span className="text-muted-foreground w-6 font-mono text-xs">{opt.short}</span>
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
