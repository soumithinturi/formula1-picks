import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Loader2, Info, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { PageContainer } from "@/components/layout/page-container";

const NOTIFICATION_TYPES = [
  { value: "RESULTS_IN", label: "Results In" },
  { value: "PICKS_DUE", label: "Picks Due" },
  { value: "LEAGUE_ACTIVITY", label: "League Activity" },
  { value: "UPCOMING_SESSION", label: "Upcoming Session" },
  { value: "GENERAL", label: "General Admin Alert" },
];

export function AdminNotificationsScreen() {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState("GENERAL");
  const [title, setTitle] = useState("Admin Test Notification");
  const [body, setBody] = useState("This is a test push notification from the admin dashboard.");
  const [broadcast, setBroadcast] = useState(false);
  const [url, setUrl] = useState("/");

  const handleSendTest = async () => {
    setLoading(true);
    try {
      const resp: any = await api.admin.testPush({
        type,
        title,
        body,
        metadata: { url },
        broadcast
      });
      toast.success(resp.message || "Test notification sent!");
    } catch (e: any) {
      toast.error(e.message || "Failed to send test notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer 
      title="Notification Testing" 
      subtitle="Trigger manual push notifications to verify delivery and payload layout."
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="bg-card/50 border-white/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Push Configuration
            </CardTitle>
            <CardDescription>
              Select a template type and customize the message.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Notification Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification Title"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="body">Body Message</Label>
              <Input
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Alert message content..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="url">Action URL</Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="/leagues or /picks etc."
              />
              <p className="text-[10px] text-muted-foreground">
                Where the user is taken when they click the notification.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
              <div className="space-y-0.5">
                <Label htmlFor="broadcast" className="text-sm">Broadcast to All Users</Label>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  Warning: This sends to EVERY active subscription in the DB.
                </div>
              </div>
              <Switch
                id="broadcast"
                checked={broadcast}
                onCheckedChange={setBroadcast}
              />
            </div>
          </CardContent>
        </Card>

        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Testing Tip</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              If broadcasting is <strong>OFF</strong>, the notification will only be sent to 
              device tokens associated with your current admin account. Ensure you have 
              enabled notifications in your own settings first.
            </p>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full h-14 text-lg font-black uppercase italic shadow-lg shadow-primary/20"
          onClick={handleSendTest}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Send className="w-5 h-5 mr-2" />
          )}
          Send Test Notification
        </Button>
      </div>
    </PageContainer>
  );
}
