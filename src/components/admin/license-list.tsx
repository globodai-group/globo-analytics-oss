"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Copy,
  Ban,
  Pause,
  Play,
  Trash2,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  revokeLicenseAction,
  suspendLicenseAction,
  reactivateLicenseAction,
  deleteLicenseAction,
} from "@/lib/actions/licenses";
import { useRouter } from "next/navigation";
import { LicenseType, LicenseStatus } from "@prisma/client";

interface License {
  id: number;
  licenseKey: string;
  type: LicenseType;
  status: LicenseStatus;
  customerEmail: string;
  customerName: string | null;
  companyName: string | null;
  activations: number;
  maxActivations: number;
  expiresAt: Date | null;
  createdAt: Date;
  _count?: { activationLogs: number };
}

interface LicenseListProps {
  licenses: License[];
}

export function LicenseList({ licenses }: LicenseListProps) {
  const t = useTranslations("admin.licenses");
  const router = useRouter();
  const [selectedLicense, setSelectedLicense] = useState<License | null>(null);
  const [actionType, setActionType] = useState<"revoke" | "delete" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const copyLicenseKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success(t("keyCopied"));
  };

  const handleAction = async () => {
    if (!selectedLicense || !actionType) return;
    setIsLoading(true);

    try {
      if (actionType === "revoke") {
        await revokeLicenseAction(selectedLicense.id);
        toast.success("License revoked");
      } else if (actionType === "delete") {
        await deleteLicenseAction(selectedLicense.id);
        toast.success("License deleted");
      }
      router.refresh();
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
      setSelectedLicense(null);
      setActionType(null);
    }
  };

  const handleSuspend = async (license: License) => {
    try {
      await suspendLicenseAction(license.id);
      toast.success("License suspended");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleReactivate = async (license: License) => {
    try {
      await reactivateLicenseAction(license.id);
      toast.success("License reactivated");
      router.refresh();
    } catch {
      toast.error("An error occurred");
    }
  };

  const getStatusBadge = (status: LicenseStatus) => {
    const variants: Record<
      LicenseStatus,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      ACTIVE: "default",
      EXPIRED: "secondary",
      REVOKED: "destructive",
      SUSPENDED: "outline",
    };
    return <Badge variant={variants[status]}>{t(`statuses.${status}`)}</Badge>;
  };

  const getTypeBadge = (type: LicenseType) => {
    const colors: Record<LicenseType, string> = {
      COMMUNITY: "bg-gray-100 text-gray-800",
      PRO: "bg-purple-100 text-purple-800",
      ENTERPRISE: "bg-orange-100 text-orange-800",
    };
    return (
      <Badge className={colors[type]} variant="outline">
        {t(`types.${type}`)}
      </Badge>
    );
  };

  if (licenses.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {t("noLicenses")}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("licenseKey")}</TableHead>
              <TableHead>{t("type")}</TableHead>
              <TableHead>{t("customerEmail")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("activations")}</TableHead>
              <TableHead>{t("expiresAt")}</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {license.licenseKey.slice(0, 20)}...
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => copyLicenseKey(license.licenseKey)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(license.type)}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{license.customerEmail}</div>
                    {license.companyName && (
                      <div className="text-xs text-muted-foreground">
                        {license.companyName}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(license.status)}</TableCell>
                <TableCell>
                  {license.activations} / {license.maxActivations}
                </TableCell>
                <TableCell>
                  {license.expiresAt
                    ? format(new Date(license.expiresAt), "PP")
                    : t("lifetime")}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/admin/licenses/${license.id}`)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => copyLicenseKey(license.licenseKey)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {t("copyKey")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {license.status === "ACTIVE" && (
                        <DropdownMenuItem
                          onClick={() => handleSuspend(license)}
                        >
                          <Pause className="mr-2 h-4 w-4" />
                          {t("suspend")}
                        </DropdownMenuItem>
                      )}
                      {license.status === "SUSPENDED" && (
                        <DropdownMenuItem
                          onClick={() => handleReactivate(license)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {t("reactivate")}
                        </DropdownMenuItem>
                      )}
                      {license.status !== "REVOKED" && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setSelectedLicense(license);
                            setActionType("revoke");
                          }}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          {t("revoke")}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedLicense(license);
                          setActionType("delete");
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!selectedLicense && !!actionType}
        onOpenChange={() => {
          setSelectedLicense(null);
          setActionType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "revoke" ? t("confirmRevoke") : "Delete License?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "revoke"
                ? t("revokeWarning")
                : "This action cannot be undone. The license will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading
                ? "..."
                : actionType === "revoke"
                  ? t("revoke")
                  : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
