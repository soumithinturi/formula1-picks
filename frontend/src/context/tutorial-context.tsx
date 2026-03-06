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
    targetId: "nav-picks", // Step 3
    title: "Make Your Picks",
    content: "This is where the magic happens. Submit your predictions for the next race.",
    placement: "right",
  },
  {
    targetId: "copy-picks-btn", // Step 4
    title: "Copy Picks",
    content: "Already filled out picks for another league? Save time by copying them over with one click.",
    placement: "top",
  },
  {
    targetId: "nav-schedule", // Step 5
    title: "Race Schedule",
    content: "Plan your weekend. Check all race session times in your local timezone.",
    placement: "right",
  },
  {
    targetId: "personalization-tour", // Step 6
    title: "Personalization",
    content: "Customize your F1 helmet and pick your favorite team to theme the app in real-time.",
    placement: "bottom",
  },
  {
    targetId: "nav-changelog", // Step 7
    title: "What's New",
    content: "Keep track of the latest app updates and feature releases here.",
    placement: "right",
  },
];

// Special handling for mobile because IDs differ
const getResponsiveSteps = (steps: TutorialStep[]): TutorialStep[] => {
  const isMobile = window.innerWidth < 768;
  return steps.map((step) => {
    if (isMobile) {
      if (step.targetId === "nav-leagues") return { ...step, targetId: "mobile-nav-leagues", placement: "top" };
      if (step.targetId === "nav-picks") return { ...step, targetId: "mobile-nav-picks", placement: "top" };
      if (step.targetId === "nav-schedule") return { ...step, targetId: "mobile-nav-schedule", placement: "top" };
      if (step.targetId === "nav-changelog") return { ...step, targetId: "header-changelog", placement: "bottom" };
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
      if (leaguesCount <= 1) {
        // Skip step 4 (Copy Picks) if only one (or zero) league
        filteredSteps = filteredSteps.filter((step) => step.targetId !== "copy-picks-btn");
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
