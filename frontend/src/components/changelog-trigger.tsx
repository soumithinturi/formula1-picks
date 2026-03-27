import React, { useEffect, useState } from "react";
import { changelog } from "@/data/changelog";
import { ChangelogModal } from "@/components/ui/changelog-modal";
import { safeStorage } from "@/lib/utils";
import { auth } from "@/lib/auth";

export function ChangelogTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const user = auth.getUser();

  useEffect(() => {
    // Only trigger if:
    // 1. User is authenticated and fully set up
    // 2. We have changelog entries
    if (user?.display_name && changelog.length > 0) {
      const latestVersion = changelog[0]?.version;
      const lastSeenVersion = safeStorage.getItem("lastSeenChangelogVersion");

      // If version is different (new or never seen), show the modal
      if (latestVersion && latestVersion !== lastSeenVersion) {
        // Small delay to let the app settle after login/hydrating
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.display_name]);

  const handleClose = () => {
    setIsOpen(false);
    // Mark this version as seen
    if (changelog.length > 0 && changelog[0]) {
      safeStorage.setItem("lastSeenChangelogVersion", changelog[0].version);
    }
  };

  if (!changelog.length) return null;

  return (
    <ChangelogModal
      isOpen={isOpen}
      onClose={handleClose}
      entry={changelog[0]!}
    />
  );
}
