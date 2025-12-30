"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import {
  Menu,
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
  User,
  LogOut,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";

interface AdminHeaderProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations("admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: t("nav.dashboard"), href: "/admin", icon: LayoutDashboard },
    { name: t("nav.users"), href: "/admin/users", icon: Users },
    { name: t("nav.websites"), href: "/admin/websites", icon: Globe },
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
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden touch-target"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 shrink-0 items-center gap-2 px-6 border-b">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              A
            </div>
            <span className="text-lg font-semibold">{t("title")}</span>
          </div>
          <nav className="flex flex-col gap-y-5 overflow-y-auto px-6 py-4">
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "group flex gap-x-3 rounded-md p-2.5 min-h-[44px] text-sm font-medium leading-6 transition-colors items-center",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t pt-4">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="group flex gap-x-3 rounded-md p-2.5 min-h-[44px] text-sm font-medium leading-6 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors items-center"
              >
                <ArrowLeft className="h-5 w-5 shrink-0" />
                {t("backToDashboard")}
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

      {/* Breadcrumb placeholder */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground">{t("title")}</span>
        </div>
      </div>

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2 h-11">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted overflow-hidden">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User avatar"}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium">{user.name || user.email}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href="/account/profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
