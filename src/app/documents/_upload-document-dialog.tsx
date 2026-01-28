"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitDocumentUpload } from "./_actions";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const DocumentTypeMap = {
  policy: "Policy Document",
  kycId: "KYC ID",
  kycPin: "KYC PIN",
};

type DocumentType = keyof typeof DocumentTypeMap;

interface UploadDocumentDialogProps {
  children: React.ReactNode;
}

export function UploadDocumentDialog({ children }: UploadDocumentDialogProps) {
  const [clientName, setClientName] = React.useState("");
  const [documentType, setDocumentType] = React.useState<DocumentType | "">("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    // max 4mb
    if (file && file.size > 4 * 1024 * 1024) {
      setError("File size exceeds 4MB limit.");
      setSelectedFile(null);
      return;
    }

    if (file) {
      setSelectedFile(file);
    }
  };

  const resetForm = () => {
    setClientName("");
    setDocumentType("");
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!clientName || !documentType || !selectedFile) {
      setError("All fields are required.");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("clientName", clientName);
    formData.append("documentType", documentType);
    formData.append("file", selectedFile);

    try {
      await submitDocumentUpload(formData);
      setIsOpen(false);
      toast.success("Document uploaded successfully!");
      window.location.reload();
    } catch (err) {
      alert("Upload failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetForm();
      }, 300);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        className="sm:max-w-[425px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
            <DialogDescription>
              Please fill in the details below to upload a new document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="clientName" className="text-right">
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="documentType" className="text-right">
                Document Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={documentType}
                onValueChange={(value) =>
                  setDocumentType(value as DocumentType)
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DocumentTypeMap).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="file" className="text-right">
                Select Files <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3">
                <Input
                  id="file"
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported formats: PDF, JPG, PNG, DOC, DOCX
                </p>
              </div>
            </div>
            {error && (
              <p className="text-sm font-medium text-destructive text-center col-span-4">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    ></path>
                  </svg>
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
