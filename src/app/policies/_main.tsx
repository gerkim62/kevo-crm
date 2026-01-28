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
import { Policy, PolicyStatus, PolicyType } from "@prisma/client";
import {
  CalendarIcon,
  Download,
  Edit,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useMemo, useState } from "react";
import { NewPolicyPopup } from "./_new-policy-popup";
import { EditPolicyPopup } from "./_edit-policy-popup";
import { ExportCsv } from "@/components/export-csv";
import { deletePolicy } from "./_actions";
import { authClient } from "@/lib/auth";

// Helper to format dates
const formatDate = (date: Date) => date.toISOString().split("T")[0];

// Calculate date difference in days
const getDaysUntilExpiry = (expiryDate: Date) => {
  const today = new Date();
  const diffTime = expiryDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export default function PolicyManagement({ policies }: { policies: Policy[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localPolicies, setLocalPolicies] = useState(policies);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "startDate", direction: "asc" });

  const userRole = authClient.useSession().data?.user.role; //admin or user or undefined

  const isExpiringSoon = (policy: Policy) =>
    policy.status === "active" &&
    getDaysUntilExpiry(new Date(policy.expiryDate)) <= 10 &&
    getDaysUntilExpiry(new Date(policy.expiryDate)) > 0;

  const isExpired = (policy: Policy) =>
    getDaysUntilExpiry(new Date(policy.expiryDate)) <= 0;

  const activeCount = useMemo(
    () =>
      policies.filter(
        (p) =>
          p.status === PolicyStatus.active &&
          !isExpired(p) &&
          !isExpiringSoon(p)
      ).length,
    []
  );

  const expiringSoonCount = useMemo(
    () => policies.filter(isExpiringSoon).length,
    []
  );

  const expiredCount = useMemo(() => policies.filter(isExpired).length, []);

  const pendingCount = useMemo(
    () => policies.filter((p) => p.status === PolicyStatus.pending).length,
    []
  );

  const filteredPolicies = useMemo(() => {
    let filtered = localPolicies;

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "expired") {
        filtered = filtered.filter(isExpired);
      } else if (statusFilter === "expiring_soon") {
        filtered = filtered.filter(isExpiringSoon);
      } else {
        filtered = filtered.filter((p) => p.status === statusFilter);
      }
    }

    // Date range filter (using policy start date)
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter((p) => {
        const policyStartDate = new Date(p.startDate);
        policyStartDate.setHours(0, 0, 0, 0);
        return policyStartDate >= start;
      });
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((p) => {
        const policyStartDate = new Date(p.startDate);
        return policyStartDate <= end;
      });
    }

    // Search term filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.clientName.toLowerCase().includes(q) ||
          p.policyNumber.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.insurer.toLowerCase().includes(q) ||
          (p.vehicleRegistrationNumber &&
            p.vehicleRegistrationNumber.toLowerCase().includes(q))
      );
    }

    // Sort by the selected column
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case "startDate":
          case "expiryDate":
            aValue = new Date(
              a[sortConfig.key as keyof Policy] as string | Date
            ).getTime();
            bValue = new Date(
              b[sortConfig.key as keyof Policy] as string | Date
            ).getTime();
            break;
          case "clientName":
          case "policyNumber":
          case "insurer":
          case "type":
          case "vehicleRegistrationNumber":
            aValue =
              (a[sortConfig.key as keyof Policy] as string)?.toLowerCase() ||
              "";
            bValue =
              (b[sortConfig.key as keyof Policy] as string)?.toLowerCase() ||
              "";
            break;
          case "premium":
          case "sumInsured":
            aValue = Number(a[sortConfig.key as keyof Policy]);
            bValue = Number(b[sortConfig.key as keyof Policy]);
            break;
          default:
            return 0;
        }

        if (sortConfig.direction === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      });
    }

    return filtered;
  }, [
    searchQuery,
    localPolicies,
    statusFilter,
    startDate,
    endDate,
    isExpired,
    isExpiringSoon,
    sortConfig,
  ]);
  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-4 w-4 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-blue-600" />
    );
  };

  const SortableHeader = ({
    children,
    sortKey,
  }: {
    children: React.ReactNode;
    sortKey: string;
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(sortKey)}
        className="h-auto p-1 font-medium hover:bg-muted/50 rounded-md border-2 border-transparent hover:border-muted-foreground/20 transition-all"
      >
        <div className="flex items-center gap-1">
          {children}
          {getSortIcon(sortKey)}
        </div>
      </Button>
    </TableHead>
  );

  async function handleDelete(id: string) {
    if (userRole !== "admin") {
      alert("You do not have permission to delete policies.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this policy? This action cannot be undone."
      )
    ) {
      return;
    }
    setDeletingId(id);
    const res = await deletePolicy(id);
    if (res.success) {
      setLocalPolicies((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(res.error || "Failed to delete policy");
    }
    setDeletingId(null);
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 bg-background w-full max-w-none">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Policy Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all insurance policies
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportCsv data={policies} filename="policies.csv">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </ExportCsv>
          <NewPolicyPopup>
            <Button>+ Add New Policy</Button>
          </NewPolicyPopup>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {expiringSoonCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {expiredCount}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border w-full">
        <div className="flex flex-col space-y-4 p-4 lg:flex-row lg:space-y-0 lg:space-x-4 lg:items-end">
          <Input
            type="search"
            placeholder="Search by client, policy number, type, insurer, or vehicle registration..."
            className="flex-1 min-w-[200px] max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
              <SelectItem value={PolicyStatus.active}>Active</SelectItem>
              <SelectItem value={PolicyStatus.pending}>Pending</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setStartDate("");
              setEndDate("");
              setSortConfig({ key: "startDate", direction: "asc" });
            }}
            className={`whitespace-nowrap transition-opacity ${
              searchQuery ||
              statusFilter !== "all" ||
              startDate ||
              endDate ||
              !(
                sortConfig.key === "startDate" && sortConfig.direction === "asc"
              )
                ? "opacity-100"
                : "opacity-30 pointer-events-none"
            }`}
            disabled={
              !(
                searchQuery ||
                statusFilter !== "all" ||
                startDate ||
                endDate ||
                !(
                  sortConfig.key === "startDate" &&
                  sortConfig.direction === "asc"
                )
              )
            }
          >
            Clear Filters
          </Button>
        </div>

        {/* Filter Summary */}
        {(searchQuery ||
          statusFilter !== "all" ||
          startDate ||
          endDate ||
          sortConfig.key) && (
          <div className="border-t bg-muted/30 px-4 py-2">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchQuery && (
                <Badge variant="secondary">Search: "{searchQuery}"</Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">
                  Status:{" "}
                  {statusFilter === "expiring_soon"
                    ? "Expiring Soon"
                    : statusFilter === "expired"
                    ? "Expired"
                    : statusFilter}
                </Badge>
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
              {sortConfig.key && (
                <Badge variant="secondary">
                  Sort:{" "}
                  {sortConfig.key === "startDate"
                    ? "Start Date"
                    : sortConfig.key === "expiryDate"
                    ? "Expiry Date"
                    : sortConfig.key === "clientName"
                    ? "Client Name"
                    : sortConfig.key === "policyNumber"
                    ? "Policy Number"
                    : sortConfig.key === "insurer"
                    ? "Insurer"
                    : sortConfig.key === "vehicleRegistrationNumber"
                    ? "Vehicle Registration"
                    : sortConfig.key === "premium"
                    ? "Premium"
                    : sortConfig.key === "sumInsured"
                    ? "Sum Insured"
                    : sortConfig.key === "type"
                    ? "Type"
                    : sortConfig.key}{" "}
                  (
                  {sortConfig.direction === "desc" ? "Descending" : "Ascending"}
                  )
                </Badge>
              )}
              <span className="ml-auto">
                Showing {filteredPolicies.length} of {localPolicies.length}{" "}
                policies
              </span>
            </div>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader sortKey="policyNumber">
                Policy Details
              </SortableHeader>
              <SortableHeader sortKey="clientName">Client</SortableHeader>
              <TableHead>Phone</TableHead>
              <SortableHeader sortKey="vehicleRegistrationNumber">
                Vehicle Reg.
              </SortableHeader>
              <SortableHeader sortKey="insurer">Insurer</SortableHeader>
              <SortableHeader sortKey="startDate">Start Date</SortableHeader>
              <SortableHeader sortKey="sumInsured">Sum Insured</SortableHeader>
              <SortableHeader sortKey="expiryDate">Expiry</SortableHeader>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPolicies.map((policy) => {
              const statusLabel = isExpired(policy)
                ? "Expired"
                : isExpiringSoon(policy)
                ? "Expiring Soon"
                : policy.status;

              const badgeClass =
                statusLabel === "Expired"
                  ? "bg-red-100 text-red-800"
                  : statusLabel === "Expiring Soon"
                  ? "bg-orange-100 text-orange-800"
                  : policy.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800";

              return (
                <TableRow key={policy.id}>
                  <TableCell>
                    <div className="font-bold">{policy.policyNumber}</div>
                    <div>{policy.type.replace(/_/g, " ")}</div>
                  </TableCell>
                  <TableCell>{policy.clientName}</TableCell>
                  <TableCell>{policy.clientPhone || "-"}</TableCell>
                  <TableCell>
                    {policy.vehicleRegistrationNumber || "-"}
                  </TableCell>
                  <TableCell>{policy.insurer}</TableCell>
                  <TableCell>
                    <div className="font-bold">
                      <span>{formatDate(new Date(policy.startDate))}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {policy.premium.toLocaleString()}/year
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">
                      {policy.sumInsured.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span>{formatDate(new Date(policy.expiryDate))}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={badgeClass}>{statusLabel}</Badge>
                  </TableCell>
                  <TableCell className="flex gap-2">
                    <EditPolicyPopup policy={policy}>
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </EditPolicyPopup>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(policy.id)}
                      disabled={deletingId === policy.id}
                      aria-label="Delete policy"
                    >
                      {deletingId === policy.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-red-500" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}

            {filteredPolicies.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center text-muted-foreground"
                >
                  No policies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
