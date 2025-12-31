"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy } from "lucide-react";
import { toast } from "sonner";
import { createLicenseAction } from "@/lib/actions/licenses";

export function CreateLicenseButton() {
  const t = useTranslations("admin.licenses");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdLicense, setCreatedLicense] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState<"PRO" | "ENTERPRISE">("PRO");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [maxDomains, setMaxDomains] = useState(1);
  const [maxActivations, setMaxActivations] = useState(1);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerEmail || !customerEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const result = await createLicenseAction({
        type,
        customerEmail,
        customerName: customerName || undefined,
        companyName: companyName || undefined,
        maxDomains,
        maxActivations,
        expiresAt: hasExpiry && expiresAt ? new Date(expiresAt) : null,
        notes: notes || undefined,
      });

      if (result.success && result.data) {
        setCreatedLicense(result.data.licenseKey);
        toast.success("License created successfully");
        router.refresh();
      } else {
        toast.error("Failed to create license");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const copyLicenseKey = () => {
    if (createdLicense) {
      navigator.clipboard.writeText(createdLicense);
      toast.success(t("keyCopied"));
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedLicense(null);
    // Reset form
    setType("PRO");
    setCustomerEmail("");
    setCustomerName("");
    setCompanyName("");
    setMaxDomains(1);
    setMaxActivations(1);
    setHasExpiry(false);
    setExpiresAt("");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t("create")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
          <DialogDescription>
            Generate a new license key for a customer.
          </DialogDescription>
        </DialogHeader>

        {createdLicense ? (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-2">
                License created successfully!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white dark:bg-gray-900 px-3 py-2 rounded border font-mono break-all">
                  {createdLicense}
                </code>
                <Button size="icon" variant="outline" onClick={copyLicenseKey}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("type")}</Label>
              <Select
                value={type}
                onValueChange={(v) => setType(v as "PRO" | "ENTERPRISE")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRO">{t("types.PRO")} - 29/mo</SelectItem>
                  <SelectItem value="ENTERPRISE">
                    {t("types.ENTERPRISE")} - 199/mo
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("customerEmail")} *</Label>
              <Input
                type="email"
                placeholder="customer@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("customerName")}</Label>
                <Input
                  placeholder="John Doe"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("companyName")}</Label>
                <Input
                  placeholder="Acme Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("maxDomains")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxDomains}
                  onChange={(e) => setMaxDomains(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("maxActivations")}</Label>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={maxActivations}
                  onChange={(e) =>
                    setMaxActivations(parseInt(e.target.value) || 1)
                  }
                />
              </div>
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label>Set Expiration Date</Label>
                <p className="text-xs text-muted-foreground">
                  Leave off for lifetime license
                </p>
              </div>
              <Switch checked={hasExpiry} onCheckedChange={setHasExpiry} />
            </div>

            {hasExpiry && (
              <div className="space-y-2">
                <Label>{t("expiresAt")}</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("notes")}</Label>
              <Textarea
                placeholder="Internal notes about this license..."
                className="resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : t("generateKey")}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
