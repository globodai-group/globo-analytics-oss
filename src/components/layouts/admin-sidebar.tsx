"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Globe,
  CreditCard,
  Package,
  Ticket,
  Receipt,
  FileText,
  Settings,
  ArrowLeft,
  KeyRound,
} from "lucide-react";
import { useTranslations } from "next-intl";

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations("admin");

  const navigation = [
    { name: t("nav.dashboard"), href: "/admin", icon: LayoutDashboard },
    { name: t("nav.users"), href: "/admin/users", icon: Users },
    { name: t("nav.websites"), href: "/admin/websites", icon: Globe },
    { name: t("nav.licenses"), href: "/admin/licenses", icon: KeyRound },
    { name: t("nav.plans"), href: "/admin/plans", icon: Package },
    { name: t("nav.payments"), href: "/admin/payments", icon: CreditCard },
    { name: t("nav.coupons"), href: "/admin/coupons", icon: Ticket },
    { name: t("nav.taxRates"), href: "/admin/tax-rates", icon: Receipt },
    { name: t("nav.pages"), href: "/admin/pages", icon: FileText },
    { name: t("nav.settings"), href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname.endsWith("/admin");
    }
    return pathname.includes(href);
  };

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            A
          </div>
          <span className="text-lg font-semibold">{t("title")}</span>
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <Link
                href="/dashboard"
                className="group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-5 w-5 shrink-0" />
                {t("backToDashboard")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
