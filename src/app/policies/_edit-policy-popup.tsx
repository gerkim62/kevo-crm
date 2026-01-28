"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Policy } from "@prisma/client";
import { updatePolicy } from "./_actions";

const schema = z.object({
  policyNumber: z.string().min(1),
  clientName: z.string().min(1),
  clientPhone: z.string(),
  insurer: z.string().min(1),
  vehicleRegistrationNumber: z.string().optional(),
  type: z.enum([
    "life_insurance",
    "health_insurance",
    "motor_insurance",
    "property_insurance",
    "travel_insurance",
    "personal_accident_insurance",
    "group_personal_accident_insurance",
    "WIBA_insurance",
    "all_risks_insurance",
    "public_liability_insurance",
  ]),
  status: z.enum(["active", "cancelled", "pending"]),
  premium: z.number().min(0),
  sumInsured: z.number().min(0),
  startDate: z.string().min(1),
  expiryDate: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export const EditPolicyPopup = ({
  children,
  policy,
}: {
  children: React.ReactNode;
  policy: Policy;
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      policyNumber: policy.policyNumber,
      clientName: policy.clientName,
      clientPhone: policy.clientPhone || "",
      insurer: policy.insurer,
      vehicleRegistrationNumber: policy.vehicleRegistrationNumber || "",
      type: policy.type,
      status: policy.status,
      premium: policy.premium,
      sumInsured: policy.sumInsured,
      startDate: policy.startDate.toISOString().split("T")[0], // yyyy-mm-dd
      expiryDate: policy.expiryDate.toISOString().split("T")[0], // yyyy-mm-dd
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await updatePolicy({
        ...data,
        id: policy.id,
        startDate: new Date(data.startDate).toISOString(),
        expiryDate: new Date(data.expiryDate).toISOString(),
      });
      setOpen(false);

      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to update policy.");
    } finally {
      setLoading(false);
    }
  };

  const policyTypeOptions = [
    { value: "life_insurance", label: "Life Insurance" },
    { value: "health_insurance", label: "Health Insurance" },
    { value: "motor_insurance", label: "Motor Insurance" },
    { value: "property_insurance", label: "Property Insurance" },
    { value: "travel_insurance", label: "Travel Insurance" },
    {
      value: "personal_accident_insurance",
      label: "Personal Accident Insurance",
    },
    {
      value: "group_personal_accident_insurance",
      label: "Group Personal Accident Insurance",
    },
    { value: "WIBA_insurance", label: "WIBA Insurance" },
    { value: "all_risks_insurance", label: "All Risks Insurance" },
    {
      value: "public_liability_insurance",
      label: "Public Liability Insurance",
    },
  ];

  const policyStatusOptions = [
    { value: "active", label: "Active" },
    { value: "cancelled", label: "Cancelled" },
    { value: "pending", label: "Pending" },
  ];

  return (
    <Dialog open={open} onOpenChange={(val) => !loading && setOpen(val)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sumInsured"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sum Insured</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Phone</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="insurer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Insurer</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vehicleRegistrationNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle Registration Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter vehicle registration number (optional)"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {policyTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={loading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {policyStatusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="premium"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Premium</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      value={field.value === 0 ? '' : field.value}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => !loading && setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
