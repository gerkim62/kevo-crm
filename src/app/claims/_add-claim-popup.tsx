import React, { useState, ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, Upload, X, FileText, Loader2 } from "lucide-react";
import {
  ClaimSubmissionResult,
  fetchByPolicyNumber,
  submitClaim,
} from "./_actions";
import { Policy } from "@prisma/client";

interface FormData {
  incidentDate: string;
  type: string;
  estimatedLosKes: string;
  description: string;
  status: string; // NEW
}

interface ClaimPopupProps {
  children: ReactNode;
}

const AddClaimPopup: React.FC<ClaimPopupProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [policyNumber, setPolicyNumber] = useState("");
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loadingPolicy, setLoadingPolicy] = useState(false);
  const [policyError, setPolicyError] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<FormData>({
    incidentDate: "",
    type: "",
    estimatedLosKes: "",
    description: "",
    status: "Pending", // NEW
  });
  const [submitting, setSubmitting] = useState(false);

  const claimTypes = [
    "Accident",
    "Fire",
    "Theft",
    "Flood",
    "Vandalism",
    "Other",
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: Policy["status"]): string => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const lookupPolicy = async () => {
    if (!policyNumber.trim()) {
      setPolicyError("Please enter a policy number");
      return;
    }

    setLoadingPolicy(true);
    setPolicyError("");

    try {
      // Mock function - replace with actual API call

      const fetchedPolicy = await fetchByPolicyNumber(policyNumber);
      if (fetchedPolicy.success) setPolicy(fetchedPolicy.policy);
      else setPolicyError(fetchedPolicy.message);
    } catch (error: any) {
      setPolicyError(error.message || "Failed to fetch policy");
      setPolicy(null);
    } finally {
      setLoadingPolicy(false);
    }
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

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!policy) {
      alert("Please lookup a valid policy first");
      return;
    }
    if (
      !formData.incidentDate ||
      !formData.type ||
      !formData.estimatedLosKes ||
      !formData.description ||
      !formData.status
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const submitFormData = new FormData();

      // Add claim data
      submitFormData.append("policyId", policy.id);
      submitFormData.append("incidentDate", formData.incidentDate);
      submitFormData.append("type", formData.type);
      submitFormData.append("estimatedLosKes", formData.estimatedLosKes);
      submitFormData.append("description", formData.description);
      submitFormData.append("status", formData.status);

      // Add files
      files.forEach((file: File) => {
        submitFormData.append(`evidenceDocuments`, file);
      });

      // Call server action
      const result: ClaimSubmissionResult = await submitClaim(submitFormData);

      if (result.success) {
        console.log("Claim ID:", result.claimId);
        window.location.reload(); // Reload to reflect changes

        // Reset form
        setPolicy(null);
        setPolicyNumber("");
        setFormData({
          incidentDate: "",
          type: "",
          estimatedLosKes: "",
          description: "",
          status: "Pending", // Reset status
        });
        setFiles([]);
        setOpen(false);
      } else {
        alert(result.message);
      }
    } catch (error: any) {
      console.error("Client error:", error);
      alert("Failed to submit claim: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPolicy(null);
    setPolicyNumber("");
    setPolicyError("");
    setFormData({
      incidentDate: "",
      type: "",
      estimatedLosKes: "",
      description: "",
      status: "Pending", // Reset status
    });
    setFiles([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetForm();
        }
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Claim</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Policy Lookup Section */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="Enter policy number"
                  disabled={loadingPolicy}
                />
              </div>
              <Button
                type="button"
                onClick={lookupPolicy}
                disabled={loadingPolicy}
                className="mt-6"
              >
                {loadingPolicy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {policyError && (
              <p className="text-sm text-red-600">{policyError}</p>
            )}
          </div>

          {/* Policy Details Display */}
          {policy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Policy Details
                  <Badge className={getStatusColor(policy.status)}>
                    {policy.status}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Policy found and details auto-populated
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Client Name
                    </Label>
                    <p className="text-sm">{policy.clientName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Policy Type
                    </Label>
                    <p className="text-sm capitalize">
                      {policy.type.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Premium
                    </Label>
                    <p className="text-sm">{formatCurrency(policy.premium)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Start Date
                    </Label>
                    <p className="text-sm">{formatDate(policy.startDate)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Insurer
                    </Label>
                    <p className="text-sm">{policy.insurer}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Expiry Date
                    </Label>
                    <p className="text-sm">{formatDate(policy.expiryDate)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Claim Details Form */}
          {policy && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Claim Details</h3>

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
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="type">Claim Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        handleInputChange("type", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select claim type" />
                      </SelectTrigger>
                      <SelectContent>
                        {claimTypes.map((type) => (
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
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {["Pending", "Approved", "Paid", "Reject"].map(
                          (status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="estimatedLoss">Estimated Loss (KES) *</Label>
                  <Input
                    id="estimatedLoss"
                    type="number"
                    step="0.01"
                    value={formData.estimatedLosKes}
                    onChange={(e) =>
                      handleInputChange("estimatedLosKes", e.target.value)
                    }
                    placeholder="Enter estimated loss amount"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    placeholder="Describe the incident and damage in detail..."
                    rows={4}
                    required
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="evidence">Evidence Documents</Label>
                  <div className="mt-2">
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
                      onClick={() =>
                        document.getElementById("evidence")?.click()
                      }
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Documents
                    </Button>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({files.length})</Label>
                    <div className="space-y-2">
                      {files.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
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
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Claim"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClaimPopup;
