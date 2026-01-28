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
import { Loader2, Pencil } from "lucide-react";
import React, { useState } from "react";
import { updateCommission } from "../commissions/_actions";
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

interface EditCommissionDialogProps {
  commission: Commission & { policy: Policy };
  children?: React.ReactNode;
}

export function EditCommissionDialog({
  commission,
  children,
}: EditCommissionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commissionAmount, setCommissionAmount] = useState(
    commission.amount.toString()
  );
  const [status, setStatus] = useState<Commission["status"]>(commission.status);
  const [commissionDate, setCommissionDate] = useState(
    new Date(commission.commissionDate)
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const resetState = () => {
    setCommissionAmount(commission.amount.toString());
    setStatus(commission.status);
    setCommissionDate(new Date(commission.commissionDate));
    setSubmitting(false);
    setSubmitMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    setSubmitMessage(null);

    const result = await updateCommission({
      commissionId: commission.id,
      commissionAmount,
      status,
      commissionDate,
    });

    setSubmitting(false);

    if (result.success) {
      setIsOpen(false);
      resetState();


    window.location.reload();
    } else {
      setSubmitMessage(result.message);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) resetState();
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Commission</DialogTitle>
          <DialogDescription>
            Modify the amount, status or date for this commission record.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Client</Label>
              <Input
                value={commission.policy.clientName}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Insurer</Label>
              <Input
                value={commission.policy.insurer}
                disabled
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Amount (KES)</Label>
              <Input
                type="number"
                value={commissionAmount}
                onChange={(e) => setCommissionAmount(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as Commission["status"])}
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
              <Label className="text-right">Date</Label>
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

            {submitMessage && (
              <p className="text-red-500 text-sm text-center">
                {submitMessage}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={submitting || !commissionAmount}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Update Commission"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
