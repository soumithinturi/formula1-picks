import { useState } from "react";
import { useNavigate } from "react-router";
import { Step1 } from "./step-1";
import { Step2 } from "./step-2";
import { Step3 } from "./step-3";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { api, type League } from "@/lib/api";
import { toast } from "sonner";

export function CreateLeagueWizard() {
  const navigate = useNavigate();
  const handleDone = () => navigate("/leagues");
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [createdLeague, setCreatedLeague] = useState<League | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    privacy: "public" as "public" | "private",
    rules: {
      p1: { enabled: true, points: 5 },
      p2: { enabled: true, points: 3 },
      p3: { enabled: true, points: 1 },
      quali: { enabled: true, points: 1 },
      podium: { enabled: true, points: 10 },
      perfectOrder: { enabled: true, points: 15 },
      fastestLap: { enabled: true, points: 5 },
      firstDNF: { enabled: false, points: 5 },
    },
  });

  const handleNextStep = async (data: Partial<typeof formData>) => {
    const newData = { ...formData, ...data };
    setFormData(newData);

    if (step === 2) {
      // Create League
      setIsCreating(true);
      try {
        const league = await api.leagues.create({
          name: newData.name,
          scoringConfig: newData.rules,
        });
        setCreatedLeague(league);
        setStep(3);
        toast.success("League created successfully!");
      } catch (error) {
        console.error("Failed to create league:", error);
        toast.error("Failed to create league. Please try again.");
      } finally {
        setIsCreating(false);
      }
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBackStep = () => {
    setStep((prev) => prev - 1);
  };

  const steps = [
    { id: 1, title: "League Details" },
    { id: 2, title: "Scoring Rules" },
    { id: 3, title: "Review & Invite" },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Wizard Header — sticks to top of scroll container */}
      <div className="sticky top-0 z-10 bg-background border-b pt-6 pb-6">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold tracking-tight">Create League</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDone}
              className="-mr-2 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex gap-4">
            {steps.map((s) => {
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              const canNavigate = isCompleted && !isCreating;

              return (
                <div
                  key={s.id}
                  className={`flex-1 flex flex-col gap-3 group ${canNavigate ? "cursor-pointer" : ""}`}
                  onClick={() => canNavigate && setStep(s.id)}>
                  <span
                    className={`text-xs font-bold uppercase tracking-widest transition-colors ${
                      isActive || isCompleted ? "text-primary" : "text-muted-foreground/50"
                    }`}>
                    {s.title}
                  </span>
                  <div
                    className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                      isActive || isCompleted ? "bg-primary" : "bg-muted"
                    } ${isActive ? "shadow-[0_0_10px_rgba(224,42,42,0.5)]" : ""}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wizard Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-4 md:p-8 pb-24 relative">
        {isCreating && (
          <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <p className="font-bold text-lg animate-pulse">Creating your league...</p>
          </div>
        )}

        {step === 1 && (
          <Step1
            initialData={{ name: formData.name, privacy: formData.privacy }}
            onNext={handleNextStep}
            onCancel={handleDone}
          />
        )}
        {step === 2 && (
          <Step2 initialData={{ rules: formData.rules }} onNext={handleNextStep} onBack={handleBackStep} />
        )}
        {step === 3 && createdLeague && (
          <Step3 league={createdLeague} rules={formData.rules} onFinish={handleDone} onBack={handleBackStep} />
        )}
      </div>
    </div>
  );
}
