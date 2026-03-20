import * as React from "react";
import { NavLink, useLocation, useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { Home, Trophy, Users, Calendar, Settings } from "lucide-react";
import { motion, useMotionValue, animate } from "framer-motion";
import { useTheme } from "@/context/theme-context";

interface MobileNavProps extends React.HTMLAttributes<HTMLDivElement> {}

const navItems = [
  { to: "/", label: "Home", icon: Home, end: true, id: undefined },
  { to: "/leagues", label: "Leagues", icon: Trophy, end: false, id: "mobile-nav-leagues" },
  { to: "/picks", label: "Picks", icon: Users, end: false, id: "mobile-nav-picks" },
  { to: "/schedule", label: "Schedule", icon: Calendar, end: false, id: "mobile-nav-schedule" },
  { to: "/settings", label: "Settings", icon: Settings, end: false, id: undefined },
];

/** Converts hex to rgba for dynamic inline styles */
function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function MobileNav({ className, ...props }: MobileNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentTeam } = useTheme();
  const primaryColor = currentTeam.primaryColor;

  const activeIndex = navItems.findIndex((item) =>
    item.end
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to)
  );

  // Refs for measuring nav item positions
  const navRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  // Drag state
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragActiveIndex, setDragActiveIndex] = React.useState<number | null>(null);

  // Track actual index to animate from
  const currentDisplayIndex = isDragging && dragActiveIndex !== null ? dragActiveIndex : activeIndex;

  const handleDrag = (_: PointerEvent, info: { point: { x: number } }) => {
    if (!navRef.current) return;
    const navBox = navRef.current.getBoundingClientRect();
    const relX = info.point.x - navBox.left;
    const navW = navBox.width;
    const segmentW = navW / navItems.length;
    const hoveredIndex = Math.max(0, Math.min(navItems.length - 1, Math.floor(relX / segmentW)));

    if (hoveredIndex !== dragActiveIndex) {
      setDragActiveIndex(hoveredIndex);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (dragActiveIndex !== null && dragActiveIndex !== activeIndex) {
      navigate(navItems[dragActiveIndex]!.to);
    }
    setDragActiveIndex(null);
  };

  return (
    <div
      className={cn("fixed bottom-6 left-0 right-0 z-50 flex justify-center md:hidden pointer-events-none", className)}
      {...props}
    >
      <nav
        ref={navRef}
        className="pointer-events-auto relative px-2 py-2"
        style={{
          background: "rgba(16, 16, 20, 0.52)",
          backdropFilter: "blur(32px) saturate(240%)",
          WebkitBackdropFilter: "blur(32px) saturate(240%)",
          border: "1px solid rgba(255, 255, 255, 0.09)",
          borderRadius: 999,
          boxShadow: `0 12px 40px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.11), 0 0 0 0.5px rgba(0,0,0,0.3)`,
        }}
      >
        {/* Thin top glint */}
        <div
          className="absolute inset-x-4 top-0 h-px pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)", borderRadius: 999 }}
        />

        {/* Nav items wrapper that captures drag events and allows clicks to pass through */}
        <motion.div
          className="relative z-20 flex items-center cursor-grab active:cursor-grabbing"
          drag="x"
          dragElastic={0.05}
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={() => setIsDragging(true)}
          onDrag={(e, info) => handleDrag(e as unknown as PointerEvent, info)}
          onDragEnd={handleDragEnd}
        >
          {navItems.map((item, index) => {
            const isActive = currentDisplayIndex === index;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                id={item.id}
                draggable={false}
                className="focus-visible:outline-none relative"
                onClick={(e) => {
                  if (isDragging) {
                    e.preventDefault();
                    return;
                  }
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileNavPill"
                    className="absolute inset-0 z-0 pointer-events-none"
                    style={{
                      borderRadius: 999,
                      background: `linear-gradient(135deg, ${hexToRgba(primaryColor, 0.32)} 0%, ${hexToRgba(primaryColor, 0.16)} 100%)`,
                      border: `1px solid ${hexToRgba(primaryColor, 0.38)}`,
                      boxShadow: `0 0 18px ${hexToRgba(primaryColor, 0.28)}, 0 0 6px ${hexToRgba(primaryColor, 0.2)}, inset 0 1px 0 rgba(255,255,255,0.1)`,
                    }}
                    transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  />
                )}
                <div
                  className={cn(
                    "relative z-10 flex flex-col items-center justify-center gap-0.5 select-none transition-all duration-300 ease-out",
                    isActive ? "px-3.5 py-2.5 min-w-[72px]" : "px-3.5 py-2.5 min-w-[52px]"
                  )}
                >
                  <item.icon
                    className="transition-all duration-300 ease-out"
                    style={{
                      width: 20,
                      height: 20,
                      color: isActive ? primaryColor : "rgba(255,255,255,0.38)",
                      filter: isActive ? `drop-shadow(0 0 6px ${hexToRgba(primaryColor, 0.7)})` : "none",
                      strokeWidth: isActive ? 2.8 : 2.2,
                    }}
                  />
                  <motion.span
                    className="text-[10px] font-semibold tracking-wide whitespace-nowrap overflow-hidden"
                    style={{ color: primaryColor }}
                    initial={false}
                    animate={{
                      opacity: isActive ? 1 : 0,
                      maxHeight: isActive ? 18 : 0,
                      y: isActive ? 0 : -4,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  >
                    {item.label}
                  </motion.span>
                </div>
              </NavLink>
            );
          })}
        </motion.div>
      </nav>
    </div>
  );
}
