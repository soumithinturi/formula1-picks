import * as React from "react";
import { cn } from "@/lib/utils";

interface CountdownProps extends React.HTMLAttributes<HTMLDivElement> {
  targetDate: Date;
}

export function Countdown({ targetDate, className, ...props }: CountdownProps) {
  const [timeLeft, setTimeLeft] = React.useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +targetDate - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }

    return timeLeft;
  }

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  const TimerBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <span className="text-xl sm:text-2xl font-bold font-mono bg-card border border-border px-2 sm:px-3 py-1.5 sm:py-2 rounded-md min-w-10 sm:min-w-12 text-center text-primary shadow-inner">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] sm:text-[10px] uppercase text-muted-foreground mt-1 font-semibold tracking-wider text-center">
        {label}
      </span>
    </div>
  );

  return (
    <div className={cn("flex items-center justify-center gap-1 sm:gap-3", className)} {...props}>
      <TimerBox value={timeLeft.days} label="Days" />
      <span className="text-xl sm:text-2xl font-bold text-muted-foreground mb-4 sm:mb-4 px-1">:</span>
      <TimerBox value={timeLeft.hours} label="Hours" />
      <span className="text-xl sm:text-2xl font-bold text-muted-foreground mb-4 sm:mb-4 px-1">:</span>
      <TimerBox value={timeLeft.minutes} label="Mins" />
      <span className="text-xl sm:text-2xl font-bold text-muted-foreground/50 mb-4 sm:mb-4 px-1">:</span>
      <TimerBox value={timeLeft.seconds} label="Secs" />
    </div>
  );
}
