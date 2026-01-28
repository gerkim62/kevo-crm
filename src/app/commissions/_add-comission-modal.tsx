"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Commission, Policy } from "@prisma/client";
import { Loader2, PlusCircle } from "lucide-react";
import React, { useState } from "react";
import { fetchByPolicyNumber } from "../claims/_actions";
import { addCommission } from "../commissions/_actions"; // ✅ Make sure this path is correct

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddCommissionDialogProps {
  children?: React.ReactNode;
}

export function AddCommissionDialog({ children }: AddCommissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [policyNumber, setPolicyNumber] = useState("");
  const [foundPolicy, setFoundPolicy] = useState<Policy | null>(null);
  const [commissionAmount, setCommissionAmount] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [status, setStatus] = useState<Commission["status"]>("Pending");
  const [commissionDate, setCommissionDate] = useState(new Date());

  const resetState = () => {
    setPolicyNumber("");
    setFoundPolicy(null);
    setCommissionAmount("");
    setIsLookingUp(false);
    setSubmitting(false);
    setError(null);
    setSubmitMessage(null);
    setStatus("Pending");
    setCommissionDate(new Date());
  };

  const handleLookup = async () => {
    if (!policyNumber) return;
    setIsLookingUp(true);
    setError(null);
    setFoundPolicy(null);
    try {
      const policy = await fetchByPolicyNumber(policyNumber);
      if (policy.success) setFoundPolicy(policy.policy);
      else setError(policy.message);
    } catch (err: any) {
      setError(err.message || "Policy not found.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!foundPolicy || !commissionAmount) {
      setError("Please lookup a policy and enter a commission amount.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSubmitMessage(null);

    const result = await addCommission({
      policyId: foundPolicy.id,
      commissionAmount,
      status,
      commissionDate,
    });

    setSubmitting(false);

    if (result.success) {
      setIsOpen(false); // ✅ Close dialog on success
      resetState(); // ✅ Clear form
      window.location.reload();
    } else {
      setSubmitMessage(result.message); // ✅ Show error
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        // ignore if loading
        if (submitting) return;
        setIsOpen(open);
        if (!open) resetState();
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="icon">
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Commission</DialogTitle>
          <DialogDescription>
            Enter a policy number to look up details and add the commission
            amount.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="policy-number" className="text-right">
                Policy #
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="policy-number"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  className="flex-grow"
                  disabled={isLookingUp || submitting}
                />
                <Button
                  type="button"
                  onClick={handleLookup}
                  disabled={isLookingUp || !policyNumber}
                >
                  {isLookingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Lookup"
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm col-span-4 text-center">
                {error}
              </p>
            )}

            {foundPolicy && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Client</Label>
                  <Input
                    value={foundPolicy.clientName}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Insurer</Label>
                  <Input
                    value={foundPolicy.insurer}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right">Type</Label>
                  <Input
                    value={foundPolicy.type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                    disabled
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="commission-amount" className="text-right">
                    Amount (KES)
                  </Label>
                  <Input
                    id="commission-amount"
                    type="number"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 1500"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="commission-status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={status}
                    onValueChange={(val) =>
                      setStatus(val as Commission["status"])
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="commission-date" className="text-right">
                    Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="col-span-3 justify-start text-left font-normal"
                      >
                        {commissionDate
                          ? commissionDate.toLocaleDateString()
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={commissionDate}
                        onSelect={(date) => {
                          if (date) setCommissionDate(date);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {submitMessage && (
              <p className="text-red-500 text-sm text-center">
                {submitMessage}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={
                !foundPolicy || !commissionAmount || isLookingUp || submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Add Commission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
