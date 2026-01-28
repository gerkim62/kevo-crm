"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Document, DocumentType } from "@prisma/client";
import { format } from "date-fns";
import {
  CalendarDays,
  Download,
  File as FileIcon,
  FileImage,
  FileText,
  Fingerprint,
  Search,
  ShieldCheck,
  Trash,
  Upload,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { deleteDocument } from "./_actions";
import {
  DocumentTypeMap,
  UploadDocumentDialog,
} from "./_upload-document-dialog";

export default function DocumentManager({
  documents,
}: {
  documents: Document[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter documents based on search query
  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) {
      return documents;
    }

    const query = searchQuery.toLowerCase().trim();
    return documents.filter(
      (doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.clientName.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  // Dynamically calculate stats from filtered documents
  const totalDocuments = filteredDocuments.length;
  const kycDocuments = filteredDocuments.filter(
    (doc) => doc.type === "kycId" || doc.type === "kycPin"
  ).length;
  const policyDocuments = filteredDocuments.filter(
    (doc) => doc.type === "policy"
  ).length;
  const thisMonthDocuments = filteredDocuments.filter((doc) => {
    const uploadDate = new Date(doc.createdAt);
    const now = new Date();
    return (
      uploadDate.getMonth() === now.getMonth() &&
      uploadDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const getBadgeVariant = (docType: DocumentType) => {
    if (docType === "policy") {
      return "secondary";
    }
    return "outline";
  };

  async function deleteFn(docId: string) {
    const result = await deleteDocument(docId);
    if (result) {
      window.location.reload();

      return {
        error: false,
        success: true,
        message: "Document deleted successfully.",
      };
    } else {
      return {
        error: true,
        success: false,
        message: "Failed to delete document.",
      };
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Document Manager
          </h1>
          <p className="text-muted-foreground">
            Manage client documents and files.
          </p>
        </div>
        <UploadDocumentDialog>
          <Button>
            <Upload className="mr-2 h-4 w-4" /> Upload Document
          </Button>
        </UploadDocumentDialog>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KYC Documents</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kycDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Policy Documents
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{policyDocuments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthDocuments}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="p-4">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
          <div className="relative flex-grow w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by filename, client..."
              className="pl-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Documents Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DOCUMENT</TableHead>
                <TableHead>CLIENT</TableHead>
                <TableHead>TYPE</TableHead>
                <TableHead>UPLOAD DATE</TableHead>
                <TableHead>SIZE</TableHead>
                <TableHead className="text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((doc, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {doc.name.endsWith(".pdf") ? (
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      ) : doc.name.endsWith(".jpg") ||
                        doc.name.endsWith(".png") ? (
                        <FileImage className="h-6 w-6 text-muted-foreground" />
                      ) : (
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.type === "kycId"
                            ? "KYC - ID"
                            : doc.type === "kycPin"
                            ? "KYC - PIN"
                            : doc.type === "policy"
                            ? "Policy Document"
                            : "Other"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{doc.clientName}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(doc.type)}>
                      {doc.type === "kycId" && (
                        <UserCheck className="mr-1 h-3 w-3" />
                      )}
                      {doc.type === "kycPin" && (
                        <Fingerprint className="mr-1 h-3 w-3" />
                      )}
                      {doc.type === "policy" && (
                        <ShieldCheck className="mr-1 h-3 w-3" />
                      )}
                      {DocumentTypeMap[doc.type] || doc.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(doc.createdAt), "dd MMM yyyy 'at' HH:mm")}
                  </TableCell>
                  <TableCell>
                    {
                      //   mb, kb, or gb based on size, or just bytes
                      doc.sizeBytes < 1024
                        ? `${doc.sizeBytes} bytes`
                        : doc.sizeBytes < 1024 * 1024
                        ? `${(doc.sizeBytes / 1024).toFixed(2)} KB`
                        : doc.sizeBytes < 1024 * 1024 * 1024
                        ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(2)} MB`
                        : `${(doc.sizeBytes / (1024 * 1024 * 1024)).toFixed(
                            2
                          )} GB`
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link download href={doc.url}>
                          <Download className="h-5 w-5" />
                        </Link>
                      </Button>
                      <ActionButton
                        asChild
                        variant="ghost"
                        requireAreYouSure
                        areYouSureDescription="Are you sure you want to delete this document?"
                        action={async () => {
                          const res = await deleteDocument(doc.id);
                          if (res) {
                            window.location.reload();
                            // Refresh to see updated lead
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
                      >
                        <div>
                          <Trash className="h-5 w-5 text-destructive" />
                        </div>
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredDocuments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {searchQuery.trim()
                      ? "No documents found matching your search"
                      : "No documents found"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
