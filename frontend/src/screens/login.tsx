import React, { useState } from "react";
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
  const [step, setStep] = useState<"request" | "verify">("request");
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!contact) return;

    setLoading(true);
    try {
      await api.auth.requestOtp({ type: authType, contact: getCleanContact() });
      setStep("verify");
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
      toast.success("Welcome back!", {
        description: `Signed in as ${user.display_name || user.contact}`,
      });
      navigate("/"); // Redirect to home
    } catch (error) {
      toast.error("Invalid code", { description: "Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            {step === "request" ? "Sign in" : "Enter code"}
          </CardTitle>
          <CardDescription>
            {step === "request"
              ? "Choose your preferred sign in method below."
              : `We sent a code to ${contact}. Enter it below.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "request" ? (
            <Tabs
              defaultValue="email"
              onValueChange={(v) => {
                setAuthType(v as "email" | "phone");
                setContact("");
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
                    <Label htmlFor="contact">{authType === "email" ? "Email address" : "Phone number"}</Label>
                    <Input
                      id="contact"
                      type={authType === "email" ? "email" : "tel"}
                      placeholder={authType === "email" ? "m@example.com" : "+1 (555) 000-0000"}
                      value={contact}
                      onChange={handleContactChange}
                      required
                      autoFocus
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Send Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Tabs>
          ) : (
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
                    className="text-center text-lg tracking-widest"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
