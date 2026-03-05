import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ArrowUp, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/realtime";
import { auth } from "@/lib/auth";
import { api, type ChatMessage } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { safeStorage } from "@/lib/utils";

const TIMESTAMP_COL_W = 80; // px — width of the hidden timestamp column

interface LeagueChatProps {
  leagueId: string;
  onUnreadChange?: (count: number) => void;
  isOpen: boolean;
}

function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function LeagueChat({ leagueId, onUnreadChange, isOpen }: LeagueChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  // swipeOffset: 0 (hidden) → -TIMESTAMP_COL_W (fully revealed)
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSnapping, setIsSnapping] = useState(false); // drives transition on release

  const unreadRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const unreadDividerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const gestureAxis = useRef<"h" | "v" | null>(null); // lock gesture axis

  const currentUser = auth.getUser();
  const watermarkRef = useRef<string | null>(safeStorage.getItem(`f1_chat_seen_${leagueId}`));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  const scrollToUnread = useCallback(() => {
    setTimeout(() => {
      (unreadDividerRef.current ?? bottomRef.current)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      scrollToUnread();
      unreadRef.current = 0;
      onUnreadChange?.(0);
    }
  }, [isOpen, onUnreadChange, scrollToUnread]);

  useEffect(() => {
    if (!leagueId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await api.chat.list(leagueId);
        if (mounted) {
          setMessages(data);
          scrollToUnread();
        }
      } catch {
        /* Silent */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [leagueId, scrollToUnread]);

  useEffect(() => {
    if (!isOpen || !leagueId) return;
    const iv = setInterval(async () => {
      try {
        setMessages(await api.chat.list(leagueId));
      } catch {
        /* Silent */
      }
    }, 15_000);
    return () => clearInterval(iv);
  }, [isOpen, leagueId]);

  useEffect(() => {
    if (!leagueId) return;
    let mounted = true;
    const supabase = getSupabase();
    if (!supabase) return;
    const ch = supabase
      .channel(`league_chat_${leagueId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `league_id=eq.${leagueId}` },
        async () => {
          if (!mounted) return;
          try {
            const data = await api.chat.list(leagueId);
            if (!mounted) return;
            setMessages(data);
            if (!isOpen) {
              unreadRef.current += 1;
              onUnreadChange?.(unreadRef.current);
            }
            scrollToBottom();
          } catch {
            /* Silent */
          }
        },
      )
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [leagueId, isOpen, onUnreadChange, scrollToBottom]);

  // ── Swipe gesture handlers ──────────────────────────────────────────────────
  // touch-action: pan-y on the container tells the browser to handle vertical
  // scroll natively while we intercept horizontal movement ourselves.
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]!.clientX;
    touchStartY.current = e.touches[0]!.clientY;
    gestureAxis.current = null;
    setIsSnapping(false);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0]!.clientX - touchStartX.current;
    const dy = e.touches[0]!.clientY - touchStartY.current;
    // Determine axis lock on first significant movement
    if (!gestureAxis.current) {
      if (Math.abs(dx) > Math.abs(dy) + 3) gestureAxis.current = "h";
      else if (Math.abs(dy) > Math.abs(dx) + 3) gestureAxis.current = "v";
      else return;
    }
    if (gestureAxis.current !== "h") return;
    setSwipeOffset(Math.max(Math.min(dx, 0), -TIMESTAMP_COL_W));
  };
  const onTouchEnd = () => {
    gestureAxis.current = null;
    setIsSnapping(true);
    setSwipeOffset(0);
  };

  // Desktop: trackpad horizontal scroll
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY) * 0.5) return;
    e.preventDefault();
    setIsSnapping(false);
    setSwipeOffset((prev) => Math.max(Math.min(prev - e.deltaX * 0.8, 0), -TIMESTAMP_COL_W));
    if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    wheelTimerRef.current = setTimeout(() => {
      setIsSnapping(true);
      setSwipeOffset(0);
    }, 600);
  };

  // Send
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !currentUser) return;
    setSending(true);
    const msg = newMessage.trim();
    const optimistic: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      league_id: leagueId,
      user_id: currentUser.id,
      message: msg,
      created_at: new Date().toISOString(),
      display_name: currentUser.display_name || currentUser.contact,
      avatar_url: currentUser.avatar_url ?? null,
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    scrollToBottom();
    try {
      await api.chat.send({ leagueId, message: msg });
    } catch (err: any) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setNewMessage(msg);
      toast.error("Failed to send message", { description: err?.message });
    } finally {
      setSending(false);
    }
  };

  const { firstUnreadIdx, dayLabelIndices } = useMemo(() => {
    const wm = watermarkRef.current;
    let firstUnread = -1;
    const dayLabels = new Set<number>();
    let lastDay = "";
    messages.forEach((msg, idx) => {
      const label = formatDayLabel(msg.created_at);
      if (label !== lastDay) {
        dayLabels.add(idx);
        lastDay = label;
      }
      if (firstUnread === -1 && wm && msg.created_at > wm) firstUnread = idx;
    });
    return { firstUnreadIdx: firstUnread, dayLabelIndices: dayLabels };
  }, [messages]);

  const unreadCount = firstUnreadIdx >= 0 ? messages.length - firstUnreadIdx : 0;

  const innerStyle: React.CSSProperties = {
    position: "relative",
    width: "100%",
    transform: `translateX(${swipeOffset}px)`,
    transition: isSnapping ? "transform 0.32s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
    willChange: "transform",
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
        <p>Loading chat history...</p>
      </div>
    );

  return (
    <div className="flex flex-col h-full bg-background rounded-md overflow-hidden">
      {/* ── Message list ──────────────────────────────────────────────────────
          overflow-x: hidden + overflow-y: auto on the SAME element.
          Per CSS spec this is valid (coercion only applies when one is "visible").
          touch-action: pan-y lets the browser handle vertical scroll natively
          while our handlers intercept horizontal swipes.                      */}
      <div
        className="flex-1 p-4 space-y-1"
        style={
          {
            overflowX: "hidden",
            overflowY: "auto",
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
          } as React.CSSProperties
        }
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}>
        {/* Inner wrapper is wider than the container.
            translateX shifts it left to reveal the timestamp column. */}
        <div style={innerStyle} className="space-y-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground opacity-70 p-8">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p>No messages yet. Be the first to start the banter!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const nodes: React.ReactNode[] = [];

              if (dayLabelIndices.has(idx)) {
                nodes.push(
                  <div key={`day-${idx}`} className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium text-muted-foreground bg-muted/70 border border-white/5">
                      {formatDayLabel(msg.created_at)}
                    </span>
                  </div>,
                );
              }

              if (idx === firstUnreadIdx) {
                nodes.push(
                  <div key="unread-divider" ref={unreadDividerRef} className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-emerald-500/40" />
                    <span className="text-xs font-semibold text-emerald-400 whitespace-nowrap">
                      {unreadCount === 1 ? "1 unread message" : `${unreadCount} unread messages`}
                    </span>
                    <div className="flex-1 h-px bg-emerald-500/40" />
                  </div>,
                );
              }

              if ((msg as any).type === "system") {
                nodes.push(
                  <div key={msg.id} className="flex justify-center my-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-muted-foreground bg-muted/60 border border-white/5 italic">
                      {msg.message}
                    </span>
                  </div>,
                );
                return <React.Fragment key={`g-${idx}`}>{nodes}</React.Fragment>;
              }

              const isMe = msg.user_id === currentUser?.id;
              const prevMsg = messages[idx - 1];
              const isSequential =
                idx > 0 &&
                prevMsg?.user_id === msg.user_id &&
                (prevMsg as any).type !== "system" &&
                !dayLabelIndices.has(idx) &&
                idx !== firstUnreadIdx;
              const author = msg.display_name || "Unknown";
              let avatarBg: string | undefined;
              try {
                if (msg.avatar_url) avatarBg = JSON.parse(msg.avatar_url)?.bgColor;
              } catch {
                /* Not JSON */
              }

              nodes.push(
                <div key={msg.id} className={`relative flex items-end gap-0 ${isSequential ? "mt-1" : "mt-4"}`}>
                  {/* Bubble area — 100% width of container */}
                  <div className={`flex flex-col min-w-0 flex-1 ${isMe ? "items-end" : "items-start"}`}>
                    {!isMe && !isSequential && (
                      <span className="text-xs text-muted-foreground ml-8 mb-1 font-medium">{author}</span>
                    )}
                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      {!isMe && !isSequential && (
                        <Avatar className="h-6 w-6 shrink-0 mb-1 border">
                          <AvatarFallback
                            className="text-[10px]"
                            style={avatarBg ? { backgroundColor: avatarBg, color: "#fff" } : undefined}>
                            {author.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {!isMe && isSequential && <div className="w-6 shrink-0" />}
                      <div
                        className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm border border-white/5"}`}>
                        {msg.message}
                      </div>
                    </div>
                  </div>
                  {/* Timestamp column — pinned absolutely off-screen to the right */}
                  <div
                    className="absolute top-0 bottom-0 flex flex-col justify-end pb-[2px] pointer-events-none"
                    style={{ right: -TIMESTAMP_COL_W - 5, width: TIMESTAMP_COL_W }}>
                    <span className="text-xs text-muted-foreground whitespace-nowrap pl-3">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </div>,
              );

              return <React.Fragment key={`g-${idx}`}>{nodes}</React.Fragment>;
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t bg-card shrink-0">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Talk trash..."
            className="flex-1 rounded-full bg-muted/50 focus-visible:ring-1"
            disabled={sending}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-full shrink-0 h-9 w-9 shadow-md bg-primary hover:bg-primary/90 flex items-center justify-center"
            disabled={!newMessage.trim() || sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
