import React from "react";
import { toast } from "sonner";

/**
 * Props for the ExportToCsvButton component.
 * Uses a generic type T for the objects in the data array.
 */
interface ExportToCsvButtonProps<T> {
  /** The array of objects to export. */
  data: T[];
  /** The clickable element that triggers the export. */
  children: React.ReactNode;
  /** The name of the downloaded file. Defaults to 'export.csv'. */
  filename?: string;
}

/**
 * A helper function to convert an array of objects into a CSV-formatted string.
 * It handles escaping for values that contain commas, quotes, or newlines.
 */
function convertToCsv<T extends Record<string, any>>(data: T[]): string {
  if (!data || data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);

  // Escapes a cell value if it contains special characters.
  const escapeCell = (cell: any): string => {
    const cellStr = String(cell ?? ""); // Handle null or undefined values
    if (
      cellStr.includes(",") ||
      cellStr.includes('"') ||
      cellStr.includes("\n")
    ) {
      // Enclose in double quotes and escape any existing double quotes by doubling them.
      return `"${cellStr.replace(/"/g, '""')}"`;
    }
    return cellStr;
  };

  const headerRow = headers.map(escapeCell).join(",");

  const bodyRows = data.map((row) => {
    return headers.map((header) => escapeCell(row[header])).join(",");
  });

  return [headerRow, ...bodyRows].join("\n");
}

/**
 * A component that wraps its children to provide CSV export functionality.
 * When the children are clicked, it converts the `data` prop to a CSV file and downloads it.
 */
export function ExportCsv<T extends Record<string, any>>({
  data,
  children,
  filename = "export.csv",
}: ExportToCsvButtonProps<T>) {
  const handleExport = () => {
    if (!data || data.length === 0) {
      console.warn("No data available to export.");
      toast.error("No data available to export.");
      return;
    }

    const csvContent = convertToCsv(data);

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a temporary link element to trigger the download
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);

    // Simulate a click on the link and then remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    URL.revokeObjectURL(url);
  };

  // A wrapper is used to attach the onClick event, making any children clickable.
  return (
    <div onClick={handleExport} style={{ cursor: "pointer" }}>
      {children}
    </div>
  );
}
