import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { auth } from "@/lib/auth";

export function LoginScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"request" | "verify" | "profile">("request");
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, phone: false });
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    const lastRequest = localStorage.getItem("lastOtpRequest");
    if (lastRequest) {
      const elapsed = Math.floor((Date.now() - parseInt(lastRequest, 10)) / 1000);
      if (elapsed < 60) {
        setCooldown(60 - elapsed);
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "");
    return digits.length === 11 && digits.startsWith("1");
  };

  const isContactValid = authType === "email" ? isValidEmail(contact) : isValidPhone(contact);
  const showContactError =
    touched[authType] &&
    (authType === "email" ? contact.length > 0 : contact !== "+1 " && contact.length > 0) &&
    !isContactValid;

  // Check for Magic Link URL hash on load
  useEffect(() => {
    let hash = window.location.hash;
    const storedHash = sessionStorage.getItem("magic_link_hash");

    // If the hash in the URL doesn't have an access_token but we stored one, use the stored one
    if ((!hash || !hash.includes("access_token")) && storedHash && storedHash.includes("access_token")) {
      hash = storedHash;
      sessionStorage.removeItem("magic_link_hash");
    }

    if (hash && hash.includes("access_token")) {
      const params = new URLSearchParams(hash.replace("#", "?"));
      const accessToken = params.get("access_token");

      if (accessToken) {
        setLoading(true);
        // Sync token to our backend to ensure user profile exists in `users` table
        api.auth
          .sync({ access_token: accessToken })
          .then(({ user }) => {
            auth.setToken(accessToken);
            auth.setUser(user);
            window.location.hash = ""; // clean URL

            if (!user.display_name) {
              setStep("profile");
              setLoading(false);
            } else {
              toast.success("Welcome back!", {
                description: `Signed in as ${user.display_name || user.contact}`,
              });

              const redirect = sessionStorage.getItem("post_login_redirect");
              if (redirect) {
                sessionStorage.removeItem("post_login_redirect");
                navigate(redirect);
              } else {
                navigate("/");
              }
            }
          })
          .catch((err) => {
            toast.error("Invalid or expired magic link", { description: String(err) });
            setLoading(false);
          });
      }
    }
  }, [navigate]);

  const formatPhoneNumber = (value: string) => {
    const cleaned = ("" + value).replace(/\D/g, "");
    const match = cleaned.match(/^1?(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return [
        "+1",
        match[1] ? " (" + match[1] : "",
        match[2] ? ") " + match[2] : "",
        match[3] ? "-" + match[3] : "",
      ].join("");
    }
    return value;
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (authType === "phone") {
      setContact(formatPhoneNumber(value));
    } else {
      setContact(value);
    }
  };

  const getCleanContact = () => {
    if (authType === "email") return contact;
    const digits = contact.replace(/\D/g, "");
    return "+" + digits;
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || cooldown > 0) return;

    setLoading(true);
    try {
      await api.auth.requestOtp({ type: authType, contact: getCleanContact() });
      setStep("verify");
      setCooldown(60);
      localStorage.setItem("lastOtpRequest", Date.now().toString());
      toast.success("Code sent!", { description: `Check your ${authType} for the code.` });
    } catch (error) {
      toast.error("Failed to send code", { description: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    try {
      const { token, user } = await api.auth.verifyOtp({
        type: authType,
        contact: getCleanContact(),
        code,
      });
      auth.setToken(token);
      auth.setUser(user);

      if (!user.display_name) {
        setStep("profile");
      } else {
        toast.success("Welcome back!", {
          description: `Signed in as ${user.display_name || user.contact}`,
        });
        const redirect = sessionStorage.getItem("post_login_redirect");
        if (redirect) {
          sessionStorage.removeItem("post_login_redirect");
          navigate(redirect);
        } else {
          navigate("/");
        }
      }
    } catch (error) {
      toast.error("Invalid code", { description: "Please try again." });
    } finally {
      if (step !== "profile") {
        setLoading(false);
      }
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    try {
      const { user } = await api.users.updateProfile({ display_name: displayName.trim() });
      auth.setUser(user);
      toast.success("Profile saved!", {
        description: `Welcome, ${user.display_name}!`,
      });
      const redirect = sessionStorage.getItem("post_login_redirect");
      if (redirect) {
        sessionStorage.removeItem("post_login_redirect");
        navigate(redirect);
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.error("Failed to save profile", { description: String(error) });
    } finally {
      if (step !== "profile") {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "request" && "Sign in"}
            {step === "verify" && "Enter code"}
            {step === "profile" && "Complete your profile"}
          </CardTitle>
          <CardDescription>
            {step === "request" && "Choose your preferred sign in method below."}
            {step === "verify" && `We sent a code to ${contact}. Enter it below.`}
            {step === "profile" && "Please enter a display name to continue."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <Tabs
              value={authType}
              onValueChange={(v) => {
                setAuthType(v as "email" | "phone");
                setContact(v === "phone" ? "+1 " : "");
                setTouched({ email: false, phone: false });
              }}
              className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Phone
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleRequestOtp}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact" className={showContactError ? "text-red-500" : ""}>
                      {authType === "email" ? "Email address" : "Phone number"}
                    </Label>
                    <Input
                      key={authType}
                      id={`contact-${authType}`}
                      type={authType === "email" ? "email" : "tel"}
                      placeholder={authType === "email" ? "me@example.com" : "+1 (555) 000-0000"}
                      value={contact}
                      onChange={handleContactChange}
                      onBlur={() => setTouched((prev) => ({ ...prev, [authType]: true }))}
                      required
                      autoFocus
                      className={showContactError ? "border-red-500 focus-visible:ring-red-500" : ""}
                    />
                    {showContactError && (
                      <p className="text-sm text-red-500 mt-1">
                        {authType === "email"
                          ? "Please enter a valid email address"
                          : "Please enter a valid phone number"}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loading || (contact.length > 0 && !isContactValid) || cooldown > 0}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {cooldown > 0 ? `Try again in ${cooldown}s` : "Send Code"}
                    {cooldown === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </Tabs>
          ) : step === "verify" ? (
            <form onSubmit={handleVerifyOtp}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">One-Time Password</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                    autoFocus
                    maxLength={6}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading || code.trim().length < 6}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Verify & Sign In
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setStep("request")}
                  disabled={loading}>
                  Back
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSetupProfile}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="e.g. VerstappenFan33"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    autoFocus
                    minLength={2}
                    maxLength={32}
                    pattern="^[-a-zA-Z0-9_]+$"
                    title="Only letters, numbers, underscores, and hyphens are allowed"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is how you'll appear on leaderboards and to other players.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading || !displayName.trim()}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Save & Continue
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
