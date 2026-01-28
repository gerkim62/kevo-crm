"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { createPolicy } from "./_actions";

const policySchema = z.object({
  policyNumber: z.string().min(1, "Policy number is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientPhone: z.string(),
  insurer: z.string().min(1, "Insurer is required"),
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
  premium: z.number().min(0, "Premium must be a positive number"),
  sumInsured: z.number().min(0, "Sum insured must be a positive number"),
  startDate: z.string().min(1, "Start date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
});

type PolicyFormData = z.infer<typeof policySchema>;

export const NewPolicyPopup = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      policyNumber: "",
      clientName: "",
      clientPhone: "",
      insurer: "",
      vehicleRegistrationNumber: "",
      type: undefined,
      status: "pending",
      premium: 0,
      sumInsured: 0,
      expiryDate: "",
      startDate: "",
    },
  });

  const onSubmit = async (data: PolicyFormData) => {
    setIsSubmitting(true);
    try {
      await createPolicy({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        expiryDate: new Date(data.expiryDate).toISOString(),
      });

      form.reset();
      setOpen(false);

      window.location.reload();
    } catch (err) {
      alert("Failed to submit policy.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
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
    <Dialog open={open} onOpenChange={(val) => !isSubmitting && setOpen(val)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit New Policy</DialogTitle>
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
                    <Input
                      placeholder="Enter policy number"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                      placeholder="Enter sum insured"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      disabled={isSubmitting}
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
                    <Input
                      placeholder="Enter client name"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                    <Input
                      placeholder="Enter client phone"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                    <Input
                      placeholder="Enter insurer name"
                      {...field}
                      disabled={isSubmitting}
                    />
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
                      disabled={isSubmitting}
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
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select policy type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {policyTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {policyStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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
                      placeholder="Enter premium amount"
                      value={field.value === 0 ? "" : field.value}
                      onChange={(e) => {
                        const value =
                          e.target.value === ""
                            ? 0
                            : parseFloat(e.target.value);
                        field.onChange(isNaN(value) ? 0 : value);
                      }}
                      disabled={isSubmitting}
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
                    <Input type="date" {...field} disabled={isSubmitting} />
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
                    <Input type="date" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => !isSubmitting && setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Policy"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
