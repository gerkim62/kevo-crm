"use client";

import { ExportCsv } from "@/components/export-csv";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Download,
  Edit,
  Eye,
  Plus,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  Zap,
  XCircle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { AddLeadDialog } from "./_add-lead-dialog";
import { NotesPopup } from "./_notes-dialog";
import { EditLeadDialog } from "./_edit-lead-dialog";
import { ActionButton } from "@/components/ui/action-button";
import { Lead } from "@prisma/client";
import { convertLead, deleteLead } from "./_actions";
import { authClient } from "@/lib/auth";

export default function LeadManagement({ leads }: { leads: Lead[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "low":
        return "bg-green-400/20 text-green-600 border-green-300";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-primary/10 text-primary border-primary/20";
      case "converted":
        return "bg-purple-400/20 text-purple-600 border-purple-300";
      case "lost":
        return "bg-red-400/20 text-red-600 border-red-300";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.email?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      lead.source.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || lead.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: leads.length,
    new: leads.filter((l) => l.status === "new").length,
    converted: leads.filter((l) => l.status === "converted").length,
    lost: leads.filter((l) => l.status === "lost").length,
  };

  const statusCards = [
    {
      title: "All",
      value: counts.all.toString(),
      icon: Users,
      color: "text-muted-foreground",
    },
    {
      title: "New",
      value: counts.new.toString(),
      icon: UserPlus,
      color: "text-primary",
    },
    {
      title: "Converted",
      value: counts.converted.toString(),
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      title: "Lost",
      value: counts.lost.toString(),
      icon: XCircle,
      color: "text-red-500",
    },
  ];

  const userRole = authClient.useSession().data?.user.role;
  async function handleDelete(id: string) {
    if (userRole !== "admin") {
      alert("You do not have permission to delete leads.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this lead? This action cannot be undone."
      )
    )
      return;
    const res = await deleteLead(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error || "Failed to delete lead");
    }
  }

  return (
    <div className="bg-muted/40 p-6 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Lead Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and manage your sales leads
            </p>
          </div>
          <div className="flex gap-3">
            <ExportCsv data={leads as any} filename="leads.csv">
              <Button variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </ExportCsv>
            <AddLeadDialog>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add New Lead
              </Button>
            </AddLeadDialog>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {card.title}
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {card.value}
                      </p>
                    </div>
                    <Icon className={`h-8 w-8 ${card.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by name, phone, email, or source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="converted">Converted</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Data Table */}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead Info</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">
                        {lead.fullName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lead.phoneNumber}
                      </div>
                      {lead.email && (
                        <div className="text-sm text-muted-foreground">
                          {lead.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-foreground">
                        {lead.source}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getStatusColor(lead.status)}
                    >
                      {lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={getPriorityColor(lead.priority)}
                    >
                      {lead.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <NotesPopup notes={lead.notes || "No notes available"}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </NotesPopup>
                      <EditLeadDialog
                        lead={{
                          id: lead.id,
                          fullName: lead.fullName,
                          phoneNumber: lead.phoneNumber,
                          email: lead.email || "",
                          status: lead.status,
                          priority: lead.priority,
                          notes: lead.notes,
                          source: lead.source,
                          createdAt: lead.createdAt,
                          updatedAt: lead.updatedAt,
                        }}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4 text-primary" />
                        </Button>
                      </EditLeadDialog>
                      <ActionButton
                        areYouSureDescription={`You are about to convert the lead: ${lead.fullName} to a customer.`}
                        variant={"ghost"}
                        requireAreYouSure
                        action={async () => {
                          const res = await convertLead(lead.id);
                          if (res) {
                            window.location.reload(); // Refresh to see updated lead
                            return {
                              success: true,
                              error: false,
                              message: "Lead converted successfully",
                            };
                          } else
                            return {
                              error: true,
                              message: "Failed to convert lead",
                            };
                        }}
                        asChild
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Zap className="h-4 w-4 text-purple-500" />
                        </Button>
                      </ActionButton>
                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete lead"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <Trash2 
                        className="text-red-600"
                        />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredLeads.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No leads found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
