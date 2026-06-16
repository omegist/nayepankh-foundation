import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Pie, PieChart, Cell, Legend,
} from "recharts";
import { Download, Search, Users, UserCheck, Clock, TrendingUp, ArrowUpDown } from "lucide-react";
import { downloadCSV, toCSV } from "@/lib/csv";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

type Volunteer = {
  id: string;
  volunteer_code: string;
  full_name: string;
  email: string;
  phone: string;
  age: number;
  address: string;
  areas_of_interest: string[];
  availability_days: string[];
  availability_hours: string;
  prior_experience: string | null;
  heard_from: string | null;
  status: "Pending" | "Contacted" | "Active" | "Inactive" | "Archived";
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800",
  Contacted: "bg-sky-100 text-sky-900 border border-sky-200 dark:bg-sky-900/30 dark:text-sky-100 dark:border-sky-800",
  Active: "bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-100 dark:border-teal-800",
  Inactive: "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800/50 dark:text-slate-200 dark:border-slate-700",
  Archived: "bg-rose-100 text-rose-900 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:border-rose-800",
};

// Brand-aligned chart palette: teal, coral, amber, indigo, sage
const CHART_COLORS = [
  "oklch(0.55 0.11 195)",
  "oklch(0.72 0.16 35)",
  "oklch(0.78 0.15 75)",
  "oklch(0.50 0.13 265)",
  "oklch(0.65 0.10 150)",
];
const CHART_PRIMARY = "oklch(0.55 0.11 195)";
const CHART_ACCENT = "oklch(0.72 0.16 35)";

function Dashboard() {
  const [search, setSearch] = useState("");
  const [interest, setInterest] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"created_at" | "full_name" | "status">("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const { data: volunteers = [], isLoading, refetch } = useQuery({
    queryKey: ["volunteers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("volunteers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Volunteer[];
    },
  });

  const filtered = useMemo(() => {
    let rows = volunteers;
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (v) =>
          v.full_name.toLowerCase().includes(q) ||
          v.email.toLowerCase().includes(q) ||
          v.phone.includes(q) ||
          v.volunteer_code.toLowerCase().includes(q)
      );
    }
    if (interest !== "all") rows = rows.filter((v) => v.areas_of_interest.includes(interest));
    if (statusFilter !== "all") rows = rows.filter((v) => v.status === statusFilter);
    if (dateFrom) rows = rows.filter((v) => v.created_at >= dateFrom);
    if (dateTo) rows = rows.filter((v) => v.created_at <= dateTo + "T23:59:59");
    rows = [...rows].sort((a, b) => {
      const av = (a as any)[sortBy];
      const bv = (b as any)[sortBy];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [volunteers, search, interest, statusFilter, dateFrom, dateTo, sortBy, sortDir]);

  // Stats
  const total = volunteers.length;
  const active = volunteers.filter((v) => v.status === "Active").length;
  const pending = volunteers.filter((v) => v.status === "Pending").length;
  const last30 = volunteers.filter(
    (v) => new Date(v.created_at) > new Date(Date.now() - 30 * 86400000)
  ).length;

  const interestData = useMemo(() => {
    const m: Record<string, number> = {};
    volunteers.forEach((v) => v.areas_of_interest.forEach((i) => (m[i] = (m[i] || 0) + 1)));
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [volunteers]);

  const availabilityData = useMemo(() => {
    const m: Record<string, number> = {};
    volunteers.forEach((v) => v.availability_days.forEach((d) => (m[d] = (m[d] || 0) + 1)));
    const order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    return order.map((d) => ({ day: d.slice(0, 3), count: m[d] || 0 }));
  }, [volunteers]);

  const timeData = useMemo(() => {
    const m: Record<string, number> = {};
    volunteers.forEach((v) => {
      const d = v.created_at.slice(0, 10);
      m[d] = (m[d] || 0) + 1;
    });
    return Object.entries(m)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, count]) => ({ date: date.slice(5), count }));
  }, [volunteers]);

  const exportCsv = () => {
    const rows = filtered.map((v) => ({
      volunteer_id: v.volunteer_code,
      full_name: v.full_name,
      email: v.email,
      phone: v.phone,
      age: v.age,
      address: v.address,
      areas_of_interest: v.areas_of_interest,
      availability_days: v.availability_days,
      availability_hours: v.availability_hours,
      prior_experience: v.prior_experience,
      heard_from: v.heard_from,
      status: v.status,
      registered_at: v.created_at,
    }));
    downloadCSV(`volunteers-${new Date().toISOString().slice(0, 10)}.csv`, toCSV(rows));
  };

  const toggleSort = (col: "created_at" | "full_name" | "status") => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortBy(col);
      setSortDir("asc");
    }
  };

  const updateStatus = async (volunteerId: string, newStatus: string) => {
    const { error } = await supabase
      .from("volunteers")
      .update({ status: newStatus as "Pending" | "Contacted" | "Active" | "Inactive" | "Archived" })
      .eq("id", volunteerId);
    
    if (error) {
      toast.error("Failed to update status", { description: error.message });
      return;
    }
    
    toast.success("Status updated successfully");
    refetch();
  };

  return (
    <div className="grid gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total volunteers" value={total} icon={<Users className="size-4" />} />
        <StatCard label="Active" value={active} icon={<UserCheck className="size-4" />} />
        <StatCard label="Pending" value={pending} icon={<Clock className="size-4" />} />
        <StatCard label="Last 30 days" value={last30} icon={<TrendingUp className="size-4" />} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 transition-shadow hover:shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold tracking-tight">Areas of interest</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[220px] w-full">
              <PieChart>
                <Pie data={interestData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {interestData.map((_, i) => (<Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 transition-shadow hover:shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold tracking-tight">Availability by day</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[220px] w-full">
              <BarChart data={availabilityData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill={CHART_PRIMARY} radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 transition-shadow hover:shadow-md">
          <CardHeader className="pb-2"><CardTitle className="text-base font-semibold tracking-tight">Registrations over time</CardTitle></CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[220px] w-full">
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke={CHART_ACCENT} strokeWidth={2.5} dot={{ r: 3, fill: CHART_ACCENT }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>


      {/* Filters + Table */}
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="text-lg font-semibold tracking-tight">Volunteer registrations</CardTitle>
            <Button onClick={exportCsv} size="sm" variant="outline" className="transition-colors hover:bg-accent/10 hover:text-accent-foreground hover:border-accent/40">
              <Download className="size-4 mr-1.5" /> Export CSV
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-3">
            <div className="relative md:col-span-2">
              <Search className="size-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone, ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={interest} onValueChange={setInterest}>
              <SelectTrigger><SelectValue placeholder="Interest" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All interests</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="fundraising">Fundraising</SelectItem>
                <SelectItem value="events">Events</SelectItem>
                <SelectItem value="social media">Social media</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Contacted">Contacted</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="From" />
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="To" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort("full_name")}>
                      Name <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Interests</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
                      Status <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort("created_at")}>
                      Date <ArrowUpDown className="size-3" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="size-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        <span className="text-sm">Loading volunteers…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-14">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                          <Users className="size-5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No volunteers match your filters</p>
                        <p className="text-xs">Try adjusting search, interest, or date range.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((v) => (
                    <TableRow key={v.id} className="cursor-pointer transition-colors hover:bg-accent/5">
                      <TableCell className="font-mono text-xs">
                        <Link to="/admin/$id" params={{ id: v.id }} className="text-primary hover:underline">
                          {v.volunteer_code}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link to="/admin/$id" params={{ id: v.id }} className="font-medium hover:underline">
                          {v.full_name}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">
                        <div>{v.email}</div>
                        <div className="text-muted-foreground text-xs">{v.phone}</div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {v.areas_of_interest.slice(0, 3).map((i) => (
                            <Badge key={i} variant="secondary" className="text-xs capitalize">{i}</Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={v.status}
                          onValueChange={(value) => updateStatus(v.id, value)}
                        >
                          <SelectTrigger className="h-7 w-[130px] text-xs border-0 focus:ring-1 focus:ring-primary">
                            <SelectValue>
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[v.status]}`}>
                                {v.status}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Contacted">Contacted</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(v.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>

            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</span>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="text-3xl font-bold mt-2 tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
