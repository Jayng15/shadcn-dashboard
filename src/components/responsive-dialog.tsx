import { useState, useEffect } from "react";
import useMediaQuery from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "./ui/drawer";

type ResponsiveDialogProps = {
  children: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  title: string;
  description?: string;
};

export function ResponsiveDialog({
  children,
  isOpen,
  setIsOpen,
  title,
  description,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [internalOpen, setInternalOpen] = useState(false);

  // Defer the internal open state to prevent focus-fighting with 
  // triggering elements (like DropdownMenus) which might still be 
  // in their cleanup phase.
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setInternalOpen(true), 10);
      return () => clearTimeout(timer);
    } else {
      setInternalOpen(false);
    }
  }, [isOpen]);

  if (isDesktop) {
    return (
      <Dialog open={internalOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={internalOpen} onOpenChange={setIsOpen}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4 pb-4">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}
