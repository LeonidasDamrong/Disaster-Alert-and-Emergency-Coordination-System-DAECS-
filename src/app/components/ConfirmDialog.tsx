import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Button } from './ui/button';
import { cn } from './ui/utils';

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Main explanation shown under the title. */
  description?: ReactNode;
  /** Extra body content (e.g. type-to-confirm fields). Rendered between description and actions. */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /**
   * primary: app red action button.
   * destructive: destructive variant for irreversible actions.
   */
  variant?: 'primary' | 'destructive';
  /** Disables the confirm button (e.g. until a typed confirmation matches). */
  confirmDisabled?: boolean;
  /** If set, overrides default confirm button colours (e.g. green for save). */
  confirmButtonClassName?: string;
  onConfirm: () => void | Promise<void>;
};

/**
 * Controlled confirmation modal for destructive or sensitive actions.
 * Safe for async `onConfirm`; keeps the dialog open until the promise resolves successfully.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary',
  confirmDisabled = false,
  confirmButtonClassName,
  onConfirm,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handleOpenChange = (next: boolean) => {
    if (pending && !next) return;
    onOpenChange(next);
  };

  const handleConfirm = async () => {
    if (confirmDisabled || pending) return;
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Caller shows toast / error UI
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => {
          if (pending) e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description != null && description !== '' ? (
            typeof description === 'string' ? (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            ) : (
              <div className="text-sm text-muted-foreground space-y-2">{description}</div>
            )
          ) : null}
        </AlertDialogHeader>
        {children ? <div className="py-1">{children}</div> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'default'}
            disabled={pending || confirmDisabled}
            className={cn(
              variant === 'primary' &&
                !confirmButtonClassName &&
                'bg-red-600 hover:bg-red-700 focus-visible:ring-red-600',
              confirmButtonClassName,
            )}
            onClick={handleConfirm}
          >
            {pending ? 'Please wait…' : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
