"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LoginForm, type LoginFormMode } from "@/components/login-form";

export interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: LoginFormMode;
  onSuccess?: () => void;
  redirectTo?: string;
}

export function LoginDialog({
  open,
  onOpenChange,
  initialMode = "signin",
  onSuccess,
  redirectTo,
}: LoginDialogProps) {
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    // Automatically close modal after success
    setTimeout(() => {
      onOpenChange(false);
    }, 600);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[480px]">
        <DialogTitle className="sr-only">Sign In or Join Bantaba</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in to your Bantaba creator profile or apply to join our creator network.
        </DialogDescription>
        <LoginForm
          initialMode={initialMode}
          isModal={true}
          redirectTo={redirectTo}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  );
}
