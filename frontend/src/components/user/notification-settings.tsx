import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Bell, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function NotificationSettingsCard() {
  const { isSupported, permission, isSubscribed, loading: pushLoading, subscribe, unsubscribe } = usePushNotifications();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await api.get("/notifications/settings");
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch notification settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (newSettings: any) => {
    setSaving(true);
    try {
      await api.put("/notifications/settings", newSettings);
      setSettings(newSettings);
      toast.success("Notification settings saved");
    } catch (err) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    handleSave(updated);
  };

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">Push notifications are not supported in this browser.</p>
        </CardContent>
      </Card>
    );
  }

  const CADENCE_OPTIONS = [
    { value: 0, label: "Start" },
    { value: 15, label: "15m" },
    { value: 30, label: "30m" },
    { value: 60, label: "1h" },
    { value: 1440, label: "1d" }
  ];

  const CadenceSetting = ({ label, valueKey }: { label: string, valueKey: string }) => {
    const dbValue = settings?.[valueKey];
    const isEnabled = dbValue !== null && dbValue !== undefined;
    const dbIndex = isEnabled ? Math.max(0, CADENCE_OPTIONS.findIndex(opt => opt.value === dbValue)) : 1;
    const [localIndex, setLocalIndex] = useState(dbIndex);

    useEffect(() => {
      setLocalIndex(dbIndex);
    }, [dbIndex]);

    return (
      <div className="space-y-3 py-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{label}</Label>
          <Switch 
            checked={isEnabled}
            disabled={!isSubscribed || saving}
            onCheckedChange={(checked) => {
              if (checked) {
                updateSetting(valueKey, CADENCE_OPTIONS[localIndex ?? 0]?.value ?? 15);
              } else {
                updateSetting(valueKey, null);
              }
            }}
          />
        </div>
        
        {isEnabled && (
          <div className="pt-2 pb-1 px-1 animate-in fade-in slide-in-from-top-2 duration-300">
            <Slider
              disabled={!isSubscribed || saving}
              value={[localIndex]}
              min={0}
              max={CADENCE_OPTIONS.length - 1}
              step={1}
              onValueChange={(val) => setLocalIndex(val[0] ?? 0)}
              onValueCommit={(val) => {
                const newMin = CADENCE_OPTIONS[val[0] ?? 0]?.value ?? 15;
                if (newMin !== dbValue) {
                  updateSetting(valueKey, newMin);
                }
              }}
              className="py-1"
            />
            <div className="relative mt-4 h-4 w-full text-[11px] text-muted-foreground font-medium">
              {CADENCE_OPTIONS.map((opt, i) => {
                const percent = (i / (CADENCE_OPTIONS.length - 1)) * 100;
                return (
                  <span 
                    key={i} 
                    className={`absolute top-0 -translate-x-1/2 ${i === localIndex ? "text-primary font-bold transition-colors" : "transition-colors"}`}
                    style={{ left: `${percent}%` }}
                  >
                    {opt.label}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable Push Notifications</Label>
            <p className="text-xs text-muted-foreground">Receive native alerts on this device.</p>
          </div>
          <Switch 
            checked={isSubscribed} 
            disabled={pushLoading || permission === "denied"}
            onCheckedChange={async (checked: boolean) => {
              if (checked) {
                await subscribe();
              } else {
                await unsubscribe();
              }
            }} 
          />
        </div>

        {permission === "denied" && (
          <p className="text-xs text-destructive">Notifications are blocked in your browser settings.</p>
        )}

        {isSubscribed && settings && !loading && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold">Events & Cadence</h3>
            
            <div className="flex items-center justify-between">
              <Label>League Joins</Label>
              <Switch 
                checked={!!settings?.notify_league_joins}
                disabled={saving}
                onCheckedChange={(val: boolean) => updateSetting("notify_league_joins", val)}
              />
            </div>

            <CadenceSetting label="Sprint Quali" valueKey="notify_sprint_quali_cadence" />
            <CadenceSetting label="Sprint" valueKey="notify_sprint_cadence" />
            <CadenceSetting label="Race Quali" valueKey="notify_race_quali_cadence" />
            <CadenceSetting label="Grand Prix" valueKey="notify_race_cadence" />
          </div>
        )}

        {loading && isSubscribed && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
