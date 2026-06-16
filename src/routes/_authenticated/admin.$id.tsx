import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/admin/$id")({
  component: VolunteerDetail,
});

function VolunteerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const { data: v, isLoading, refetch } = useQuery({
    queryKey: ["volunteer", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("volunteers").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (status: string) => {
    const { error } = await supabase
      .from("volunteers")
      .update({ status: status as "Pending" | "Contacted" | "Active" | "Inactive" | "Archived" })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status updated");
    refetch();
  };

  const archive = async () => {
    const { error } = await supabase.from("volunteers").update({ status: "Archived" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Archived");
    refetch();
  };

  const remove = async () => {
    const { error } = await supabase.from("volunteers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Volunteer deleted");
    navigate({ to: "/admin" });
  };

  if (isLoading) return <div className="text-muted-foreground">Loading...</div>;
  if (!v) return <div>Not found</div>;

  return (
    <div className="grid gap-4 max-w-3xl">
      <Link to="/admin" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4 mr-1" /> Back to dashboard
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="text-2xl">{v.full_name}</CardTitle>
              <p className="text-xs font-mono text-muted-foreground mt-1">{v.volunteer_code}</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={v.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={archive} title="Archive">
                <Archive className="size-4" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" title="Delete">
                    <Trash2 className="size-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this registration?</AlertDialogTitle>
                    <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <Row label="Email" value={v.email} />
          <Row label="Phone" value={v.phone} />
          <Row label="Age" value={String(v.age)} />
          <Row label="Address" value={v.address} />
          <div>
            <div className="text-muted-foreground text-xs mb-1">Areas of interest</div>
            <div className="flex flex-wrap gap-1">
              {v.areas_of_interest.map((i: string) => (
                <Badge key={i} variant="secondary" className="capitalize">{i}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground text-xs mb-1">Available days</div>
            <div className="flex flex-wrap gap-1">
              {v.availability_days.map((d: string) => (
                <Badge key={d} variant="outline">{d}</Badge>
              ))}
            </div>
          </div>
          <Row label="Available hours" value={v.availability_hours} />
          <Row label="Prior experience" value={v.prior_experience || "—"} />
          <Row label="Heard about us" value={v.heard_from || "—"} />
          <Row label="Registered" value={new Date(v.created_at).toLocaleString()} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="col-span-2">{value}</div>
    </div>
  );
}
