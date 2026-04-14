import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser, logoutDemoUser, type DemoUser } from "@/lib/demoAuth";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<DemoUser | null>(null);

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg border-border/60 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-2xl">Demo User Profile</CardTitle>
          <CardDescription>This is a local demo profile saved in browser storage.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border border-border bg-secondary/30 p-4">
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div className="rounded-md border border-border bg-secondary/30 p-4">
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/")}>Back to Dashboard</Button>
            <Button
              variant="outline"
              onClick={() => {
                logoutDemoUser();
                navigate("/login");
              }}
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
