"use client";

import { useState, useEffect } from "react";
import { clientLogger } from "@/lib/client-logger";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Globe, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { addProjectDomainAction, removeProjectDomainAction } from "@/lib/actions/projects";

interface Domain {
  id: number;
  domain: string;
  type: string;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
  trackingId: string;
  domains: Domain[];
}

export default function ProjectDomainsPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domainType, setDomainType] = useState<"primary" | "secondary">("primary");
  const [copied, setCopied] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    async function loadProject() {
      try {
        const res = await fetch(`/api/v1/projects/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);
        }
      } catch (error) {
        clientLogger.error("Failed to load project:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProject();
  }, [params.id]);

  async function handleAddDomain() {
    if (!newDomain.trim() || !project) return;

    setIsAdding(true);
    const result = await addProjectDomainAction(project.id, newDomain.trim(), domainType);

    if (result.success && result.data) {
      toast.success(result.message);
      setProject({
        ...project,
        domains: [...project.domains, result.data as Domain],
      });
      setNewDomain("");
    } else {
      toast.error(result.error);
    }
    setIsAdding(false);
  }

  async function handleRemoveDomain(domainId: number) {
    if (!project) return;

    setRemovingId(domainId);
    const result = await removeProjectDomainAction(domainId);

    if (result.success) {
      toast.success(result.message);
      setProject({
        ...project,
        domains: project.domains.filter((d) => d.id !== domainId),
      });
    } else {
      toast.error(result.error);
    }
    setRemovingId(null);
  }

  async function handleCopyTrackingId() {
    if (!project) return;
    await navigator.clipboard.writeText(project.trackingId);
    setCopied(true);
    toast.success(locale === "fr" ? "ID copié !" : "ID copied!");
    setTimeout(() => setCopied(false), 2000);
  }

  function getTrackingScript() {
    if (!project) return "";
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `<!-- GloboAnalytics Analytics -->
<script async src="${baseUrl}/js/tracker.js" data-tid="${project.trackingId}"></script>
<!-- End GloboAnalytics Analytics -->`;
  }

  async function handleCopyScript() {
    if (!project) return;
    await navigator.clipboard.writeText(getTrackingScript());
    setCopiedScript(true);
    toast.success(locale === "fr" ? "Code copié !" : "Code copied!");
    setTimeout(() => setCopiedScript(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">{t("common.noData")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t("projects.domains")}</h1>
            <p className="text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Link href={`/projects/${project.id}/stats`}>
          <Button>
            {t("dashboard.viewStats")}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      {/* Tracking ID */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.trackingId")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Utilisez cet ID pour intégrer le tracking"
              : "Use this ID to integrate tracking"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm">
              {project.trackingId}
            </code>
            <Button variant="outline" size="icon" onClick={handleCopyTrackingId}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Code */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.trackingCode")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Copiez ce code et collez-le avant la balise </head> de votre site"
              : "Copy this code and paste it before the </head> tag of your site"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-xs font-mono max-h-64 overflow-y-auto">
              {getTrackingScript()}
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleCopyScript}
            >
              {copiedScript ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {locale === "fr" ? "Copié" : "Copied"}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {locale === "fr" ? "Copier" : "Copy"}
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {locale === "fr"
              ? "Ce script track automatiquement les pages vues et le temps d'engagement. Utilisez window.grTrack('event_name', {data}) pour tracker des événements personnalisés."
              : "This script automatically tracks pageviews and engagement time. Use window.grTrack('event_name', {data}) to track custom events."}
          </p>
        </CardContent>
      </Card>

      {/* Add Domain */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.addDomain")}</CardTitle>
          <CardDescription>
            {locale === "fr"
              ? "Ajoutez les domaines autorisés pour ce projet"
              : "Add authorized domains for this project"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label>{t("projects.domain")}</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">https://</span>
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  disabled={isAdding}
                />
              </div>
            </div>
            <div className="w-40 space-y-2">
              <Label>{t("projects.domainType")}</Label>
              <Select
                value={domainType}
                onValueChange={(v) => setDomainType(v as "primary" | "secondary")}
                disabled={isAdding}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">{t("projects.domainTypes.primary")}</SelectItem>
                  <SelectItem value="secondary">{t("projects.domainTypes.secondary")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleAddDomain} disabled={isAdding || !newDomain.trim()}>
            {isAdding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" />
            {t("projects.addDomain")}
          </Button>
        </CardContent>
      </Card>

      {/* Domain List */}
      <Card>
        <CardHeader>
          <CardTitle>{t("projects.configuredDomains")}</CardTitle>
          <CardDescription>
            {project.domains.length === 0
              ? locale === "fr"
                ? "Aucun domaine configuré"
                : "No domains configured"
              : `${project.domains.length} ${locale === "fr" ? "domaine(s)" : "domain(s)"}`}
          </CardDescription>
        </CardHeader>
        {project.domains.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {project.domains.map((domain) => (
                <div
                  key={domain.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{domain.domain}</span>
                    <Badge variant={domain.type === "primary" ? "default" : "secondary"}>
                      {domain.type === "primary"
                        ? t("projects.domainTypes.primary")
                        : t("projects.domainTypes.secondary")}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleRemoveDomain(domain.id)}
                    disabled={removingId === domain.id}
                  >
                    {removingId === domain.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
