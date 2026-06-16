import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Feather, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth" });
  };
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-card/90 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <Feather className="size-4 text-primary-foreground -rotate-12" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight tracking-tight">NayePankh Foundation</div>
              <div className="text-xs text-muted-foreground leading-tight">Admin · Volunteer Management</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Public site
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="transition-colors hover:text-accent">
              <LogOut className="size-4 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
