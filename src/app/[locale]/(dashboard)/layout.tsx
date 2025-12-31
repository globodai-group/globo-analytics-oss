import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardSidebar } from "@/components/layouts/dashboard-sidebar";
import { DashboardHeader } from "@/components/layouts/dashboard-header";
import { DashboardProviders } from "@/components/layouts/dashboard-providers";
import { BottomNav } from "@/components/layouts/bottom-nav";
import { GlobalSearchWrapper } from "@/components/search";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardProviders>
      <div className="min-h-screen bg-muted/30">
        <DashboardSidebar />
        <div className="lg:pl-64">
          <DashboardHeader user={session.user} />
          {/* Responsive padding + bottom padding for mobile nav */}
          <main className="px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">
            {children}
          </main>
        </div>
        {/* Mobile bottom navigation */}
        <BottomNav />
      </div>
      {/* Global search command palette */}
      <GlobalSearchWrapper userId={session.user.id} />
    </DashboardProviders>
  );
}
