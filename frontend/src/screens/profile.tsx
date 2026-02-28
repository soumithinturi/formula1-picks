import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { F1HelmetAvatar } from "@/components/user/f1-helmet-avatar";
import type { UserProfile } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TEAMS } from "@/context/theme-context";

const PRESET_COLORS = [
  "#dc2626", // Red
  "#ea580c", // Orange
  "#eab308", // Yellow
  "#16a34a", // Green
  "#2563eb", // Blue
  "#4f46e5", // Indigo
  "#9333ea", // Purple
  "#ec4899", // Pink
  "#1e293b", // Slate
  "#94a3b8", // Silver
  "#ffffff", // White
  "#000000", // Black
];

export function ProfileScreen() {
  const navigate = useNavigate();
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [helmetColor, setHelmetColor] = React.useState("#dc2626");
  const [bgColor, setBgColor] = React.useState("#1e293b");
  const [teamId, setTeamId] = React.useState("default");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setUser(currentUser);
    setFullName(currentUser.full_name || "");
    setDisplayName(currentUser.display_name || "");

    if (currentUser.avatar_url) {
      try {
        const parsed = JSON.parse(currentUser.avatar_url);
        if (parsed.helmetColor) setHelmetColor(parsed.helmetColor);
        if (parsed.bgColor) setBgColor(parsed.bgColor);
        if (parsed.teamId) setTeamId(parsed.teamId);
      } catch (e) {
        // ignore JSON parse errors
      }
    }
  }, [navigate]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const avatar_url = JSON.stringify({ helmetColor, bgColor, teamId });

      const payload = {
        full_name: fullName || null,
        display_name: displayName,
        avatar_url,
      };

      const data = await api.users.updateProfile(payload);

      auth.setUser(data.user);
      setUser(data.user);
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl tracking-tight font-bold">Edit Profile</h1>
        <p className="text-muted-foreground mt-2">Update your personal details and customize your driver helmet.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="contact">Contact</Label>
            <Input id="contact" value={user.contact} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground">Your login credential cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              placeholder="e.g. Max Verstappen"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              maxLength={32}
              pattern="^[a-zA-Z\\s'-]+$"
              title="Only letters, spaces, hyphens, and apostrophes are allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              placeholder="e.g. SuperMax"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={2}
              maxLength={32}
              pattern="^[a-zA-Z0-9_-]+$"
              title="Only letters, numbers, underscores, and hyphens are allowed"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="favorite_team">Favorite Team</Label>
            <Select value={teamId} onValueChange={setTeamId}>
              <SelectTrigger id="favorite_team">
                <SelectValue placeholder="Select a team" />
              </SelectTrigger>
              <SelectContent>
                {TEAMS.filter((t) => t.id !== "default").map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full border border-border"
                        style={{ background: team.primaryColor }}
                      />
                      {team.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-6 border rounded-xl p-6 bg-card">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 ring-4 ring-background shadow-xl rounded-full">
              <F1HelmetAvatar helmetColor={helmetColor} bgColor={bgColor} />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <Label>Helmet Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={`helmet-${c}`}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${helmetColor === c ? "border-primary scale-110 shadow-sm" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setHelmetColor(c)}
                  aria-label={`Select helmet color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Label>Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={`bg-${c}`}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${bgColor === c ? "border-primary scale-110 shadow-sm" : "border-transparent hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setBgColor(c)}
                  aria-label={`Select background color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={loading} size="lg">
          {loading ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </div>
  );
}
