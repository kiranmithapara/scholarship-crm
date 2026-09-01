import { useEffect, useState } from "react";
import { toast } from "sonner";
import { isAxiosError } from "axios";
import { Globe, Mail, Shield, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput } from "@/components/forms/FormInput";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/common/ErrorState";
import { useSettings } from "@/hooks/useSettings";
import { settingsService } from "@/services/settings.service";

/** SettingsPage - Page 11. Super Admin only. Website config, SMTP, Firebase bucket, Allowed IPs, Theme. */
export default function SettingsPage() {
  const { data, isLoading, error, refetch } = useSettings();

  const [websiteName, setWebsiteName] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [firebaseBucket, setFirebaseBucket] = useState("");
  const [allowedIps, setAllowedIps] = useState("");
  const [darkModeDefault, setDarkModeDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setWebsiteName(data.websiteName);
    setSmtpHost(data.smtpHost ?? "");
    setSmtpPort(data.smtpPort ? String(data.smtpPort) : "");
    setSmtpUser(data.smtpUser ?? "");
    setFirebaseBucket(data.firebaseStorageBucket ?? "");
    setAllowedIps(data.allowedIps.join(", "));
    setDarkModeDefault(data.defaultTheme === "dark");
  }, [data]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.update({
        websiteName,
        smtpHost: smtpHost || undefined,
        smtpPort: smtpPort ? Number(smtpPort) : undefined,
        smtpUser: smtpUser || undefined,
        smtpPassword: smtpPassword || undefined,
        firebaseStorageBucket: firebaseBucket || undefined,
        allowedIps: allowedIps
          .split(",")
          .map((ip) => ip.trim())
          .filter(Boolean),
        defaultTheme: darkModeDefault ? "dark" : "light",
      });
      toast.success("Settings updated successfully");
      setSmtpPassword("");
      refetch();
    } catch (err) {
      const message = isAxiosError(err) ? err.response?.data?.message : null;
      toast.error(message ?? "Could not update settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-6">
        <ErrorState description="We couldn't load settings." onRetry={refetch} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Site-wide configuration for Scholarship CRM.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" /> Website
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <FormInput label="Website Name" value={websiteName} onChange={(e) => setWebsiteName(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" /> SMTP Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="SMTP Host" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
            <FormInput label="SMTP Port" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="587" />
          </div>
          <FormInput label="SMTP User" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="you@example.com" />
          <FormInput
            label="SMTP Password"
            type="password"
            value={smtpPassword}
            onChange={(e) => setSmtpPassword(e.target.value)}
            placeholder="Leave blank to keep unchanged"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" /> Firebase & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <FormInput label="Firebase Storage Bucket" value={firebaseBucket} onChange={(e) => setFirebaseBucket(e.target.value)} />
          <div className="space-y-1.5">
            <Label>Allowed IPs (comma separated, leave empty to allow all)</Label>
            <Textarea value={allowedIps} onChange={(e) => setAllowedIps(e.target.value)} rows={2} placeholder="103.21.244.10, 192.168.1.1" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <Moon className="h-3.5 w-3.5" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Default Dark Mode</p>
              <p className="text-xs text-muted-foreground">Sets the default theme for new users</p>
            </div>
            <Switch checked={darkModeDefault} onCheckedChange={setDarkModeDefault} />
          </div>
        </CardContent>
      </Card>

      <Button variant="gradient" size="lg" className="w-full" onClick={handleSave} isLoading={isSaving}>
        Save Settings
      </Button>
    </div>
  );
}
