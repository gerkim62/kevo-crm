"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  DollarSign,
  Download,
  PencilIcon,
  PlusCircle,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AddCommissionDialog } from "./_add-comission-modal";
import {
  Commission as TCommission,
  CommissionStatus,
  Policy,
  PolicyType,
} from "@prisma/client";

import { ExportCsv } from "@/components/export-csv";
import { EditCommissionDialog } from "./_edit-commission";
import { deleteCommission } from "./_actions";
import { authClient } from "@/lib/auth";

export type Commission = {
  policy: Policy;
} & TCommission;

// A utility to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 2,
  }).format(amount);
};

export function CommissionTrackingPage({
  commissionsData,
}: {
  commissionsData: Commission[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localCommissions, setLocalCommissions] = useState(commissionsData);
  const userRole = authClient.useSession().data?.user.role;

  const totalCommissions = useMemo(
    () => localCommissions.reduce((acc, c) => acc + c.amount, 0),
    [localCommissions]
  );
  const paidCommissions = useMemo(
    () =>
      localCommissions
        .filter((c) => c.status === CommissionStatus.Paid)
        .reduce((acc, c) => acc + c.amount, 0),
    [localCommissions]
  );
  const pendingCommissions = totalCommissions - paidCommissions;

  const filteredCommissions = useMemo(() => {
    let filtered = localCommissions;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((c) => {
        const commissionDate = new Date(c.commissionDate);
        commissionDate.setHours(0, 0, 0, 0);
        return commissionDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((c) => {
        const commissionDate = new Date(c.commissionDate);
        return commissionDate <= end;
      });
    }

    // Search term filter
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.policy.clientName.toLowerCase().includes(lowercasedSearchTerm) ||
          c.policy.policyNumber.toLowerCase().includes(lowercasedSearchTerm) ||
          c.policy.insurer.toLowerCase().includes(lowercasedSearchTerm)
      );
    }
    return filtered;
  }, [localCommissions, statusFilter, searchTerm, startDate, endDate]);

  const exportableCommissions = localCommissions.map((c) => ({
    "Policy Number": c.policy.policyNumber,
    "Client Name": c.policy.clientName,
    Insurer: c.policy.insurer,
    Type: c.policy.type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase()),
    Amount: formatCurrency(c.amount),
    Status: c.status,
    "Commission Date": c.commissionDate.toLocaleDateString("en-KE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }),
  }));

  async function handleDelete(id: string) {
    if (userRole !== "admin") {
      alert("You do not have permission to delete commissions.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this commission? This action cannot be undone."
      )
    ) {
      return;
    }
    setDeletingId(id);
    const res = await deleteCommission(id);
    if (res.success) {
      setLocalCommissions((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert(res.error || "Failed to delete commission");
    }
    setDeletingId(null);
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 bg-background w-full max-w-none">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Commission Tracking
          </h2>
          <p className="text-muted-foreground">
            Track and manage commission payments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <ExportCsv filename="Commissions.csv" data={exportableCommissions}>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </ExportCsv>

          <AddCommissionDialog>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Commission
            </Button>
          </AddCommissionDialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Commissions
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommissions)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid Commissions
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(paidCommissions)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Commissions
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(pendingCommissions)}
            </div>
          </CardContent>
        </Card>
        {/* Add a fourth card for additional metrics */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Filtered Results
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredCommissions.length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {localCommissions.length} total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border w-full">
        <div className="flex flex-col space-y-4 p-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-end">
          <Input
            placeholder="Search by client, policy, or insurer..."
            className="flex-1 min-w-[200px] max-w-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-muted-foreground">
                Start Date
              </label>
              <Input
                type="date"
                className="w-[160px]"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-xs text-muted-foreground">End Date</label>
              <Input
                type="date"
                className="w-[160px]"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={CommissionStatus.Paid}>Paid</SelectItem>
              <SelectItem value={CommissionStatus.Pending}>Pending</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setStatusFilter("all");
              setSearchTerm("");
            }}
            className={`whitespace-nowrap transition-opacity ${
              startDate || endDate || statusFilter !== "all" || searchTerm
                ? "opacity-100"
                : "opacity-30 pointer-events-none"
            }`}
            disabled={
              !(startDate || endDate || statusFilter !== "all" || searchTerm)
            }
          >
            Clear Filters
          </Button>
        </div>

        {/* Filter Summary */}
        {(startDate || endDate || statusFilter !== "all" || searchTerm) && (
          <div className="border-t bg-muted/30 px-4 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary">Search: "{searchTerm}"</Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">Status: {statusFilter}</Badge>
              )}
              {startDate && (
                <Badge variant="secondary">
                  From: {new Date(startDate).toLocaleDateString("en-KE")}
                </Badge>
              )}
              {endDate && (
                <Badge variant="secondary">
                  To: {new Date(endDate).toLocaleDateString("en-KE")}
                </Badge>
              )}
              <span className="ml-auto">
                Showing {filteredCommissions.length} of{" "}
                {localCommissions.length} commissions
              </span>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy & Client</TableHead>
              <TableHead>Insurer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCommissions.length > 0 ? (
              filteredCommissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell>
                    <div className="font-medium">
                      {commission.policy.policyNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {commission.policy.clientName}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {commission.policy.type
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {commission.policy.insurer}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(commission.amount)}
                  </TableCell>
                  <TableCell>
                    {commission.commissionDate.toLocaleDateString("en-KE", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        commission.status === CommissionStatus.Paid
                          ? "default"
                          : "secondary"
                      }
                      className={
                        commission.status === CommissionStatus.Paid
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      }
                    >
                      {commission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center space-x-1">
                      <EditCommissionDialog
                        commission={{
                          amount: commission.amount,
                          commissionDate: commission.commissionDate,
                          id: commission.id,
                          policy: commission.policy,
                          status: commission.status,
                          policyId: commission.policy.id,
                          createdAt: commission.createdAt,
                          updatedAt: commission.updatedAt,
                        }}
                      >
                        <Button variant="ghost" size="icon">
                          <PencilIcon className="h-4 w-4" />
                        </Button>
                      </EditCommissionDialog>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(commission.id)}
                        disabled={deletingId === commission.id}
                        aria-label="Delete commission"
                      >
                        {deletingId === commission.id ? (
                          <span className="h-4 w-4 animate-spin text-red-500">
                            &#8635;
                          </span>
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
