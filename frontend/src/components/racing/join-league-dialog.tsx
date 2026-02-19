import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export interface JoinLeagueDialogProps {
  onLeagueJoined?: (inviteCode: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function JoinLeagueDialog({
  onLeagueJoined,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: JoinLeagueDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen : setInternalOpen;

  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = inviteCode.trim().toUpperCase();

    if (!code) {
      toast.error("Please enter an invite code");
      return;
    }

    if (code.length < 6) {
      toast.error("Invite code must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    try {
      await api.leagues.join(code);
      toast.success("Successfully joined league!");
      onLeagueJoined?.(code);
      handleClose();
    } catch (error) {
      console.error("Failed to join league:", error);
      toast.error("Failed to join league. Check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (setOpen) setOpen(false);
    setTimeout(() => {
      setInviteCode("");
      setIsLoading(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <UserPlus className="h-4 w-4" />
            Join League
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Private League</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">Invite Code</Label>
            <Input
              id="invite-code"
              placeholder="ABC123"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={12}
              className="font-mono tracking-wider"
            />
            <p className="text-xs text-muted-foreground">Enter the 6-character code shared by the league creator</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1" disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join League"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
