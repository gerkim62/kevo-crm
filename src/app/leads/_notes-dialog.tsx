import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface NotesPopupProps {
  notes: string;
  children: React.ReactNode;
}

export function NotesPopup({ notes, children }: NotesPopupProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Notes</DialogTitle>
          <DialogDescription>
            The following notes were provided.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <p>{notes}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
