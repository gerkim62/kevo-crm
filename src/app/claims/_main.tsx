"use client";

import { useMemo, useState } from "react";
import {
  Claim,
  ClaimStatus,
  ClaimType,
  EvidenceDocument,
  Policy,
} from "@prisma/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle,
  Clock,
  Download,
  FileText,
  Plus,
  DollarSign,
  Eye,
  Pencil,
  Link as LinkIcon,
  Trash2,
} from "lucide-react";
import { ExportCsv } from "@/components/export-csv";
import AddClaimPopup from "./_add-claim-popup";
import EditClaimPopup from "./_edit-claim-popup";
import { deleteClaim } from "./_actions";
import { authClient } from "@/lib/auth";

// We assume the incoming claims prop will have the related policy and evidence documents included.
type ClaimWithRelations = Claim & {
  policy: Policy;
  evidenceDocuments: EvidenceDocument[];
};

interface ClaimsTrackingPageProps {
  claims: ClaimWithRelations[];
}

export default function ClaimsTrackingPage({
  claims,
}: ClaimsTrackingPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalClaims = claims.length;
  const pendingClaims = claims.filter(
    (claim) => claim.status === ClaimStatus.Pending
  ).length;
  const approvedClaims = claims.filter(
    (claim) => claim.status === ClaimStatus.Approved
  ).length;
  const totalClaimValue = claims.reduce(
    (sum, claim) => sum + claim.estimatedLosKes,
    0
  );

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        claim.policy.policyNumber.toLowerCase().includes(searchLower) ||
        claim.policy.clientName.toLowerCase().includes(searchLower);

      const matchesStatus =
        statusFilter === "all" ? true : claim.status === statusFilter;
      const matchesType =
        typeFilter === "all" ? true : claim.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [claims, searchQuery, statusFilter, typeFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusVariant = (status: ClaimStatus) => {
    switch (status) {
      case ClaimStatus.Pending:
        return "secondary";
      case ClaimStatus.Approved:
        return "default";
      case ClaimStatus.Paid:
        return "outline";
      case ClaimStatus.Reject:
        return "destructive";
      default:
        return "outline";
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const exportableClaims = filteredClaims.map((claim) => ({
    policyNumber: claim.policy.policyNumber,
    clientName: claim.policy.clientName,
    type: claim.type,
    incidentDate: formatDate(claim.incidentDate),
    status: claim.status,
    estimatedLoss: `KSH ${claim.estimatedLosKes.toLocaleString()}`,
    description: claim.description,
  }));

  const userRole = authClient.useSession().data?.user.role;
  async function handleDelete(id: string) {
    if (userRole !== "admin") {
      alert("You do not have permission to delete claims.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this claim? This action cannot be undone."
      )
    )
      return;
    setDeletingId(id);
    const res = await deleteClaim(id);
    setDeletingId(null);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || "Failed to delete claim");
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-background">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Claims Tracking
          </h1>
          <p className="text-muted-foreground">
            Manage and track insurance claims
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <ExportCsv data={exportableClaims} filename="claims_.csv">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </ExportCsv>
          <AddClaimPopup>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Register Claim
            </Button>
          </AddClaimPopup>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Claims
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Approved Claims
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedClaims}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Claim Value
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(totalClaimValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-center gap-2 mb-4">
            <Input
              placeholder="Search by policy or client..."
              className="flex-grow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {Object.values(ClaimStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(ClaimType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy No.</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Policy Type</TableHead>
                  <TableHead>Incident Date</TableHead>
                  <TableHead>Claim Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Estimated Loss</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClaims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell className="font-medium">
                      {claim.policy.policyNumber}
                    </TableCell>
                    <TableCell>{claim.policy.clientName}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {claim.policy.type
                        .split("_")
                        .join(" ")
                        .toLocaleLowerCase()}
                    </TableCell>
                    <TableCell>{formatDate(claim.incidentDate)}</TableCell>
                    <TableCell>{claim.type}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(claim.status)}>
                        {claim.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(claim.estimatedLosKes)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* View Description */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Claim Description</DialogTitle>
                              <DialogDescription>
                                Full description for claim{" "}
                                {claim.id.slice(-6).toUpperCase()}.
                              </DialogDescription>
                            </DialogHeader>
                            <p className="py-4 text-sm text-muted-foreground">
                              {claim.description}
                            </p>
                          </DialogContent>
                        </Dialog>

                        {/* View Documents */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Evidence Documents</DialogTitle>
                              <DialogDescription>
                                Documents attached to claim{" "}
                                {claim.id.slice(-6).toUpperCase()}.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-2 py-4">
                              {claim.evidenceDocuments.length > 0 ? (
                                claim.evidenceDocuments.map((doc) => (
                                  <a
                                    href={doc.url}
                                    key={doc.id}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-2 rounded-md border hover:bg-accent"
                                  >
                                    <div>
                                      <p className="font-medium text-sm">
                                        {doc.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatBytes(doc.sizeBytes)}
                                      </p>
                                    </div>
                                    <LinkIcon className="h-4 w-4 text-primary" />
                                  </a>
                                ))
                              ) : (
                                <p className="text-sm text-center text-muted-foreground py-4">
                                  No documents attached.
                                </p>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Edit Button */}
                        <EditClaimPopup claim={claim}>
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </EditClaimPopup>
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Delete claim"
                          onClick={() => handleDelete(claim.id)}
                          disabled={deletingId === claim.id}
                        >
                          {deletingId === claim.id ? (
                            <svg
                              className="animate-spin h-4 w-4 text-destructive"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                              />
                            </svg>
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
