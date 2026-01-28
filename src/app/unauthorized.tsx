
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function NotPermitted() {
  return (
    <div className="min-h-full flex items-center justify-center bg-muted px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="flex items-center gap-2">
          <AlertTriangle className="text-destructive" size={28} />
          <CardTitle className="text-xl">Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            You do not have permission to view this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
