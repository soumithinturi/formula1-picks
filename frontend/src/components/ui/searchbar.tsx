import * as React from "react";
import { Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export interface SearchbarProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Searchbar = React.forwardRef<HTMLInputElement, SearchbarProps>(({ className, ...props }, ref) => {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        className={cn(
          "pl-9 bg-muted/50 border-transparent focus-visible:bg-background focus-visible:border-input rounded-full",
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Searchbar.displayName = "Searchbar";

export { Searchbar };
