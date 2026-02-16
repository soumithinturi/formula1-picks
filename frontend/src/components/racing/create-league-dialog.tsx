import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export interface CreateLeagueDialogProps {
  onLeagueCreated?: (league: { name: string; description: string; inviteCode: string }) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateLeagueDialog({
  onLeagueCreated,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: CreateLeagueDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const [leagueName, setLeagueName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!leagueName.trim()) {
      toast.error("Please enter a league name");
      return;
    }

    // Generate a mock invite code (6-character alphanumeric)
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);

    // Notify parent component
    onLeagueCreated?.({ name: leagueName, description, inviteCode: code });

    toast.success("League created successfully!");
  };

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    if (setOpen) setOpen(false);
    // Reset form after a short delay to avoid visual glitch
    setTimeout(() => {
      setLeagueName("");
      setDescription("");
      setInviteCode(null);
      setCopied(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create League
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Private League</DialogTitle>
        </DialogHeader>

        {!inviteCode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="league-name">League Name *</Label>
              <Input
                id="league-name"
                placeholder="My F1 League"
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="league-description">Description (Optional)</Label>
              <Textarea
                id="league-description"
                placeholder="A friendly competition among friends..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                Create League
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Your league has been created! Share this invite code with others:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-background px-3 py-2 text-lg font-mono font-bold tracking-wider">
                  {inviteCode}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopyInviteCode} className="shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
