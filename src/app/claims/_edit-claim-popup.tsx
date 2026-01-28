"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Claim } from "@prisma/client";
import { FileText, Loader2, Upload, X } from "lucide-react";
import React, { ReactNode, useEffect, useState } from "react";
import { editClaim } from "./_actions";

interface EditClaimPopupProps {
  children: ReactNode;
  claim: Claim;
}

const EditClaimPopup: React.FC<EditClaimPopupProps> = ({ children, claim }) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    incidentDate: "",
    type: "",
    estimatedLosKes: "",
    description: "",
    status: "Pending",
  });

  useEffect(() => {
    if (claim) {
      setFormData({
        incidentDate: claim.incidentDate.toISOString().slice(0, 10), // YYYY-MM-DD
        type: claim.type,
        estimatedLosKes: claim.estimatedLosKes.toString(),
        description: claim.description,
        status: claim.status,
      });
    }
  }, [claim]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    // max 4mb
    if (!e.target.files) return;

    const hasLargeFile = Array.from(e.target.files).some(
      (file) => file.size > 4 * 1024 * 1024
    );

    if (hasLargeFile) {
      alert("One or more files exceed the 4MB limit.");
      return;
    }

    const uploadedFiles = Array.from(e.target.files || []);

    setFiles((prev) => [...prev, ...uploadedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submitFormData = new FormData();
      submitFormData.append("policyId", claim.policyId);
      submitFormData.append("incidentDate", formData.incidentDate);
      submitFormData.append("type", formData.type);
      submitFormData.append("estimatedLosKes", formData.estimatedLosKes);
      submitFormData.append("description", formData.description);
      submitFormData.append("status", formData.status);
      files.forEach((file) => {
        submitFormData.append("evidenceDocuments", file);
      });

      const result = await editClaim(claim.id, submitFormData);

      if (result.success) {
        window.location.reload();
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      console.error("Edit error:", error);
      alert("Failed to edit claim: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Claim Form */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="incidentDate">Incident Date *</Label>
              <Input
                id="incidentDate"
                type="date"
                value={formData.incidentDate}
                onChange={(e) =>
                  handleInputChange("incidentDate", e.target.value)
                }
              />
            </div>

            <div>
              <Label htmlFor="type">Claim Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select claim type" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Accident",
                    "Fire",
                    "Theft",
                    "Flood",
                    "Vandalism",
                    "Other",
                  ].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Claim Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {["Pending", "Approved", "Paid", "Reject"].map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedLoss">Estimated Loss (KES) *</Label>
            <Input
              id="estimatedLoss"
              type="number"
              value={formData.estimatedLosKes}
              onChange={(e) =>
                handleInputChange("estimatedLosKes", e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          {/* File Upload */}
          <div>
            <Label>New Evidence Documents</Label>
            <input
              id="evidence"
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("evidence")?.click()}
              className="w-full mt-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Documents
            </Button>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Files ({files.length})</Label>
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting} type="submit">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditClaimPopup;
