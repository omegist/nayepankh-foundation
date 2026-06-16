import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminExists, setAdminExists] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });

    // Check if admin already exists using the public function
    const checkAdminExists = async () => {
      const { data, error } = await supabase.rpc('admin_exists');
      
      if (!error) {
        setAdminExists(data === true);
      } else {
        console.error('Error checking admin existence:', error);
        // If error, assume no admin exists for first-time setup
        setAdminExists(false);
      }
    };

    checkAdminExists();
  }, [navigate]);

  const signIn = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Sign in failed", { description: error.message });
    toast.success("Welcome back");
    navigate({ to: "/admin" });
  };

  const signUp = async () => {
    setLoading(true);
    
    try {
      // Step 1: Sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      
      if (signUpError) {
        setLoading(false);
        console.error('Signup error:', signUpError);
        return toast.error("Sign up failed", { description: signUpError.message });
      }

      console.log('User created:', signUpData);
      
      // Step 2: Sign in immediately
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (signInError) {
        setLoading(false);
        console.error('Sign in error:', signInError);
        return toast.error("Sign in failed", { description: signInError.message });
      }

      console.log('User signed in:', signInData);
      
      // Step 3: Check if user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', signInData.user.id)
        .single();
      
      console.log('User role:', roleData);
      
      setLoading(false);
      
      if (roleData?.role === 'admin') {
        toast.success("Admin account created", {
          description: "You are the first admin. Redirecting...",
        });
        setTimeout(() => navigate({ to: "/admin" }), 1000);
      } else {
        toast.success("Account created", {
          description: "Your account has been created. Please contact an admin for access.",
        });
      }
    } catch (err) {
      setLoading(false);
      console.error('Unexpected error:', err);
      toast.error("An error occurred", { description: String(err) });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="size-9 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="size-5 text-primary-foreground" />
          </div>
          <span className="font-bold">NayePankh Foundation</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Admin access</CardTitle>
            <CardDescription>
              {adminExists === null 
                ? "Loading..."
                : adminExists 
                  ? "Sign in to manage volunteer registrations."
                  : "Create the first admin account to get started."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminExists === null ? (
              <div className="flex justify-center py-8">
                <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
            ) : adminExists ? (
              // Only show sign in if admin exists
              <div className="grid gap-3">
                <Field label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Password">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Button onClick={signIn} disabled={loading}>
                  {loading ? "..." : "Sign in"}
                </Button>
              </div>
            ) : (
              // Show create admin form if no admin exists
              <div className="grid gap-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 text-sm">
                  <p className="font-semibold text-amber-900 dark:text-amber-100">First-time setup</p>
                  <p className="text-amber-800 dark:text-amber-200 mt-1">
                    You're creating the first admin account. This account will have full access to manage volunteers.
                  </p>
                </div>
                <Field label="Email">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
                <Field label="Password (min 6 chars)">
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </Field>
                <Button onClick={signUp} disabled={loading}>
                  {loading ? "..." : "Create admin account"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
