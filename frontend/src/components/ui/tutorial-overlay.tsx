import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTutorial } from "@/context/tutorial-context";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate, useLocation } from "react-router";

export function TutorialOverlay() {
  const { activeTour, currentStepIndex, steps, nextStep, prevStep, skipTour } = useTutorial();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const step = steps[currentStepIndex];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!activeTour || !step) return;

    // Reset target rect when step changes to avoid "sticking"
    setTargetRect(null);

    const findTarget = () => {
      const el = document.getElementById(step.targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Only set if rect has area (element is visible)
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
          return true;
        }
      }
      return false;
    };

    const checkNavigation = (targetId: string) => {
      if (targetId.startsWith("nav-")) return;

      if (targetId === "league-actions-container" && location.pathname !== "/leagues") {
        navigate("/leagues");
      } else if (
        (targetId === "copy-picks-btn" || targetId === "league-select-container") &&
        location.pathname !== "/picks"
      ) {
        navigate("/picks");
      } else if (targetId === "nav-schedule" && location.pathname !== "/schedule") {
        navigate("/schedule");
      } else if (targetId === "nav-changelog" && location.pathname !== "/changelog") {
        navigate("/changelog");
      }
    };

    // Initial attempt
    if (!findTarget()) {
      checkNavigation(step.targetId);
    }

    // Polling for the element (useful during navigation/loading)
    const interval = setInterval(() => {
      if (findTarget()) {
        clearInterval(interval);
      }
    }, 100);

    window.addEventListener("resize", findTarget);
    window.addEventListener("scroll", findTarget, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", findTarget);
      window.removeEventListener("scroll", findTarget, true);
    };
  }, [activeTour, step, currentStepIndex, location.pathname, navigate]);

  if (!mounted || !activeTour || !step || !targetRect) return null;

  const { top, left, bottom, arrowOffset } = calculateCardPosition(targetRect, step.placement || "bottom");

  return (
    <div className="fixed inset-0 z-100 pointer-events-none">
      {/* ... (existing SVG and spotlight pulser) ... */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="hole">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={targetRect.left - 8}
              y={targetRect.top - 8}
              width={targetRect.width + 16}
              height={targetRect.height + 16}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.7)"
          mask="url(#hole)"
          onClick={(e) => e.stopPropagation()}
        />
      </svg>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        key={`pulse-${currentStepIndex}`}
        style={{
          position: "absolute",
          top: targetRect.top - 8,
          left: targetRect.left - 8,
          width: targetRect.width + 16,
          height: targetRect.height + 16,
          borderRadius: "8px",
          border: "2px solid hsl(var(--primary))",
          boxShadow: "0 0 15px hsl(var(--primary) / 0.5)",
        }}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute bg-card border border-border shadow-2xl p-5 rounded-xl w-[280px] sm:w-[320px] pointer-events-auto"
          style={{ top, left, bottom }}>
          <div className="flex justify-between items-start mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <button
              onClick={skipTour}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 -mt-1 -mr-1">
              <X className="h-4 w-4" />
            </button>
          </div>

          <h3 className="font-bold text-lg mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{step.content}</p>

          <div className="flex items-center justify-between">
            <button
              onClick={skipTour}
              className="text-xs text-muted-foreground hover:text-foreground font-medium transition-colors">
              Skip Tutorial
            </button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
                className="h-8 w-8 p-0 rounded-full">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" onClick={nextStep} className="h-8 px-4 rounded-full font-bold">
                {currentStepIndex === steps.length - 1 ? "Finish" : "Next"}
                {currentStepIndex < steps.length - 1 && <ChevronRight className="ml-1 h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Arrow */}
          <div
            className={`absolute w-3 h-3 bg-card border-l border-t border-border transform rotate-45 ${getArrowPlacementClasses(
              step.placement || "bottom",
            )}`}
            style={arrowOffset}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function calculateCardPosition(rect: DOMRect, placement: string) {
  const gap = 20;
  const isMobile = window.innerWidth < 640;
  const cardWidth = isMobile ? 280 : 320;

  let left: any = rect.left + rect.width / 2 - cardWidth / 2;
  let top: any = undefined;
  let bottom: any = undefined;

  if (placement === "top") {
    bottom = window.innerHeight - rect.top + gap;
  } else if (placement === "bottom") {
    top = rect.bottom + gap;
  } else if (placement === "right" && !isMobile) {
    top = rect.top + rect.height / 2 - 80;
    left = rect.right + gap;
  } else if (placement === "left" && !isMobile) {
    top = rect.top + rect.height / 2 - 80;
    left = rect.left - gap - cardWidth;
  } else {
    top = rect.bottom + gap;
  }

  // Viewport constraints for horizontal
  const finalLeft = Math.max(10, Math.min(left, window.innerWidth - cardWidth - 10));

  // Viewport constraints for vertical
  if (top !== undefined) {
    if (top < 10) top = 10;
    if (top + 210 > window.innerHeight - 10) top = window.innerHeight - 220;
  }
  if (bottom !== undefined) {
    if (bottom < 10) bottom = 10;
    if (window.innerHeight - bottom < 10) bottom = window.innerHeight - 10;
  }

  // Calculate arrow offset relative to the card's final position
  let arrowOffset: React.CSSProperties = {};
  if (placement === "top" || placement === "bottom") {
    const targetCenter = rect.left + rect.width / 2;
    const offset = targetCenter - finalLeft;
    arrowOffset = { left: Math.max(20, Math.min(cardWidth - 20, offset)) };
  } else if (placement === "left" || placement === "right") {
    const targetCenter = rect.top + rect.height / 2;
    const finalTop = top || window.innerHeight - (bottom || 0) - 200; // rough estimate if bottom is used
    const offset = targetCenter - (finalTop as number);
    arrowOffset = { top: Math.max(20, Math.min(180, offset)) };
  }

  return { top, left: finalLeft, bottom, arrowOffset };
}

function getArrowPlacementClasses(placement: string) {
  if (placement === "top") return "-bottom-1.5 rotate-[225deg]";
  if (placement === "bottom") return "-top-1.5";
  if (placement === "right") return "-left-1.5 -rotate-45";
  if (placement === "left") return "-right-1.5 rotate-[135deg]";
  return "-top-1.5";
}
