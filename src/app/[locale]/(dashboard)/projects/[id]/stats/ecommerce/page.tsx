import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  ShoppingCart,
  DollarSign,
  Package,
  TrendingUp,
  CreditCard,
  BarChart3,
} from "lucide-react";
import { subDays, format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { ProjectDateRangePicker } from "@/components/analytics/project-date-range-picker";

interface EcommerceStatsPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function EcommerceStatsPage({
  params,
  searchParams,
}: EcommerceStatsPageProps) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const session = await auth();
  const t = await getTranslations();
  const locale = await getLocale();
  const dateLocale = locale === "fr" ? fr : enUS;

  if (!session?.user?.id) {
    return null;
  }

  const projectId = parseInt(id);
  if (isNaN(projectId)) {
    notFound();
  }

  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: session.user.id,
    },
    select: {
      id: true,
      name: true,
      trackingId: true,
    },
  });

  if (!project) {
    notFound();
  }

  // Date range
  const fromDate = from ? new Date(from) : subDays(new Date(), 29);
  const toDate = to ? new Date(to) : new Date();
  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(23, 59, 59, 999);

  // Fetch e-commerce stats
  const [transactions, revenueStats, topProducts, topCategories, funnelStats] = await Promise.all([
    // Total transactions in period
    prisma.ecommerceTransaction.findMany({
      where: {
        projectId: project.id,
        createdAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        items: true,
      },
    }),
    // Revenue aggregation
    prisma.ecommerceTransaction.aggregate({
      where: {
        projectId: project.id,
        createdAt: { gte: fromDate, lte: toDate },
      },
      _sum: { value: true, tax: true, shipping: true },
      _count: true,
      _avg: { value: true },
    }),
    // Top products
    prisma.ecommerceItem.groupBy({
      by: ["itemId", "itemName"],
      where: {
        transaction: {
          projectId: project.id,
          createdAt: { gte: fromDate, lte: toDate },
        },
      },
      _sum: { quantity: true, price: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    // Top categories
    prisma.ecommerceItem.groupBy({
      by: ["itemCategory"],
      where: {
        transaction: {
          projectId: project.id,
          createdAt: { gte: fromDate, lte: toDate },
        },
        itemCategory: { not: null },
      },
      _sum: { quantity: true, price: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    // Funnel stats (events count)
    prisma.ecommerceEvent.groupBy({
      by: ["eventType"],
      where: {
        projectId: project.id,
        createdAt: { gte: fromDate, lte: toDate },
      },
      _count: true,
    }),
  ]);

  const totalRevenue = revenueStats._sum.value || 0;
  const totalTransactions = revenueStats._count || 0;
  const avgOrderValue = revenueStats._avg.value || 0;
  const totalTax = revenueStats._sum.tax || 0;
  const totalShipping = revenueStats._sum.shipping || 0;

  // Build funnel data
  const funnelData = {
    view_item: funnelStats.find((f) => f.eventType === "view_item")?._count || 0,
    add_to_cart: funnelStats.find((f) => f.eventType === "add_to_cart")?._count || 0,
    begin_checkout: funnelStats.find((f) => f.eventType === "begin_checkout")?._count || 0,
    purchase: totalTransactions,
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(amount);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href={`/projects/${project.id}/stats`} className="shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 shrink-0" />
              <span className="truncate">{locale === "fr" ? "E-commerce" : "E-commerce"}</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{project.name}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <ProjectDateRangePicker projectId={project.id} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "fr" ? "Chiffre d'affaires" : "Revenue"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Taxes: " : "Tax: "}
              {formatCurrency(totalTax)} | {locale === "fr" ? "Livraison: " : "Shipping: "}
              {formatCurrency(totalShipping)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "fr" ? "Transactions" : "Transactions"}
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Commandes complétées" : "Completed orders"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "fr" ? "Panier moyen" : "Avg. Order Value"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Par transaction" : "Per transaction"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {locale === "fr" ? "Taux de conversion" : "Conversion Rate"}
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funnelData.view_item > 0
                ? ((funnelData.purchase / funnelData.view_item) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              {locale === "fr" ? "Vue produit → Achat" : "View → Purchase"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "fr" ? "Entonnoir de conversion" : "Conversion Funnel"}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Progression des visiteurs dans le parcours d'achat"
              : "Visitor progression through the purchase journey"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                label: locale === "fr" ? "Vues produit" : "Product Views",
                value: funnelData.view_item,
                percentage: 100,
              },
              {
                label: locale === "fr" ? "Ajouts au panier" : "Add to Cart",
                value: funnelData.add_to_cart,
                percentage:
                  funnelData.view_item > 0
                    ? (funnelData.add_to_cart / funnelData.view_item) * 100
                    : 0,
              },
              {
                label: locale === "fr" ? "Début checkout" : "Begin Checkout",
                value: funnelData.begin_checkout,
                percentage:
                  funnelData.view_item > 0
                    ? (funnelData.begin_checkout / funnelData.view_item) * 100
                    : 0,
              },
              {
                label: locale === "fr" ? "Achats" : "Purchases",
                value: funnelData.purchase,
                percentage:
                  funnelData.view_item > 0 ? (funnelData.purchase / funnelData.view_item) * 100 : 0,
              },
            ].map((step, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{step.label}</span>
                  <span className="font-medium">
                    {step.value.toLocaleString()} ({step.percentage.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${step.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {locale === "fr" ? "Produits les plus vendus" : "Top Products"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {locale === "fr" ? "Aucune donnée" : "No data"}
              </p>
            ) : (
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{product.itemName || product.itemId}</p>
                      <p className="text-sm text-muted-foreground">{product.itemId}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product._sum.quantity || 0} vendus</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency((product._sum.price || 0) * (product._sum.quantity || 0))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Categories */}
        <Card>
          <CardHeader>
            <CardTitle>{locale === "fr" ? "Catégories" : "Categories"}</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                {locale === "fr" ? "Aucune donnée" : "No data"}
              </p>
            ) : (
              <div className="space-y-4">
                {topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{category.itemCategory}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{category._sum.quantity || 0} vendus</p>
                      <p className="text-sm text-muted-foreground">
                        {category._count} transactions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>{locale === "fr" ? "Transactions récentes" : "Recent Transactions"}</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {locale === "fr" ? "Aucune transaction" : "No transactions"}
            </p>
          ) : (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{tx.transactionId}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(tx.createdAt, "PPp", { locale: dateLocale })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {tx.items.length} {locale === "fr" ? "article(s)" : "item(s)"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-lg">{formatCurrency(tx.value)}</p>
                    {tx.coupon && (
                      <p className="text-sm text-green-600">
                        {locale === "fr" ? "Coupon: " : "Coupon: "}
                        {tx.coupon}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
