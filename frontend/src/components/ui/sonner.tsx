import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group bottom-36! md:bottom-4!"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "bg-green-600! text-white! border-green-500! dark:bg-green-900! dark:text-green-100! dark:border-green-800!",
          error: "bg-red-600! text-white! border-red-500! dark:bg-red-900! dark:text-red-100! dark:border-red-800!",
          info: "bg-blue-600! text-white! border-blue-500! dark:bg-blue-900! dark:text-blue-100! dark:border-blue-800!",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4 text-white!" />,
        info: <InfoIcon className="size-4 text-white!" />,
        warning: <TriangleAlertIcon className="size-4 text-white!" />,
        error: <OctagonXIcon className="size-4 text-white!" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
