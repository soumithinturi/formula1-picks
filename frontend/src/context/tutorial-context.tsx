import React, { createContext, useContext, useEffect, useState } from "react";
import { safeStorage } from "@/lib/utils";

export interface TutorialStep {
  targetId: string;
  title: string;
  content: string;
  placement?: "top" | "bottom" | "left" | "right";
  action?: () => void;
}

export type TourId = "onboarding";

interface TutorialContextType {
  activeTour: TourId | null;
  currentStepIndex: number;
  steps: TutorialStep[];
  startTour: (tourId: TourId, leaguesCount?: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  isTourCompleted: (tourId: TourId) => boolean;
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined);

const ONBOARDING_STEPS: TutorialStep[] = [
  {
    targetId: "nav-leagues",
    title: "Leagues",
    content: "View all your active leagues and global standings here.",
    placement: "right",
  },
  {
    targetId: "league-actions-container",
    title: "Compete",
    content: "Join existing leagues with a code or create your own to challenge friends.",
    placement: "bottom",
  },
  {
    targetId: "league-tabs-scroll", // Step 3
    title: "Switch Leagues",
    content: "Easily jump between different leagues you're participating in.",
    placement: "bottom",
  },
  {
    targetId: "nav-picks", // Step 4
    title: "Make Your Picks",
    content: "This is where the magic happens. Submit your predictions for the next race.",
    placement: "right",
  },
  {
    targetId: "league-select-container", // Step 5
    title: "League Specific Picks",
    content: "Some leagues have different scoring rules. Make sure you select the right league before saving.",
    placement: "bottom",
  },
  {
    targetId: "save-picks-btn", // Step 6
    title: "Lock It In",
    content: "Don't forget to save! You can update your picks until the session starts.",
    placement: "top",
  },
  {
    targetId: "profile-header-tour",
    title: "Your Profile",
    content: "Customize your F1 helmet and track your global rank across all leagues.",
    placement: "bottom",
  },
];

// Special handling for mobile because IDs differ
const getResponsiveSteps = (steps: TutorialStep[]): TutorialStep[] => {
  const isMobile = window.innerWidth < 768;
  return steps.map((step) => {
    if (isMobile) {
      if (step.targetId === "nav-leagues") return { ...step, targetId: "mobile-nav-leagues", placement: "top" };
      if (step.targetId === "nav-picks") return { ...step, targetId: "mobile-nav-picks", placement: "top" };
    }
    return step;
  });
};

const COMPLETED_TOURS_KEY = "f1picks_completed_tours";

export function TutorialProvider({ children }: { children: React.ReactNode }) {
  const [activeTour, setActiveTour] = useState<TourId | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TutorialStep[]>([]);

  const startTour = (tourId: TourId, leaguesCount: number = 0) => {
    if (tourId === "onboarding") {
      let filteredSteps = [...ONBOARDING_STEPS];
      if (leaguesCount === 0) {
        // Skip steps 3, 5, and 6
        filteredSteps = filteredSteps.filter(
          (step) =>
            step.targetId !== "league-tabs-scroll" &&
            step.targetId !== "league-select-container" &&
            step.targetId !== "save-picks-btn",
        );
      }
      setSteps(getResponsiveSteps(filteredSteps));
    }
    setActiveTour(tourId);
    setCurrentStepIndex(0);
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = () => {
    if (activeTour) {
      const completed = JSON.parse(safeStorage.getItem(COMPLETED_TOURS_KEY) || "[]");
      if (!completed.includes(activeTour)) {
        safeStorage.setItem(COMPLETED_TOURS_KEY, JSON.stringify([...completed, activeTour]));
      }
    }
    setActiveTour(null);
    setCurrentStepIndex(0);
  };

  const isTourCompleted = (tourId: TourId) => {
    const completed = JSON.parse(safeStorage.getItem(COMPLETED_TOURS_KEY) || "[]");
    return completed.includes(tourId);
  };

  return (
    <TutorialContext.Provider
      value={{
        activeTour,
        currentStepIndex,
        steps,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        isTourCompleted,
      }}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
