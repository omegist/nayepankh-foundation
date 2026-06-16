import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Feather, Heart, Users, Sparkles, HandHeart, GraduationCap, Stethoscope } from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const INTERESTS = ["education", "healthcare", "fundraising", "events", "social media"] as const;
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().regex(/^[+\d\s-]{7,20}$/, "Invalid phone number"),
  age: z.coerce.number().int().min(13, "Must be at least 13").max(120),
  address: z.string().trim().min(5, "Address is required").max(500),
  areas_of_interest: z.array(z.string()).min(1, "Pick at least one area"),
  availability_days: z.array(z.string()).min(1, "Select at least one day"),
  availability_hours: z.string().trim().min(1, "Required").max(100),
  prior_experience: z.string().max(2000).optional().or(z.literal("")),
  heard_from: z.string().max(200).optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

function HomePage() {
  const [submitted, setSubmitted] = useState<{ code: string; name: string } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      areas_of_interest: [],
      availability_days: [],
      prior_experience: "",
      heard_from: "",
    },
  });

  const interests = watch("areas_of_interest");
  const days = watch("availability_days");

  const toggle = (field: "areas_of_interest" | "availability_days", value: string) => {
    const current = watch(field) || [];
    setValue(
      field,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
      { shouldValidate: true }
    );
  };

  const onSubmit = async (values: FormValues) => {
    const { data, error } = await supabase
      .from("volunteers")
      .insert({
        full_name: values.full_name,
        email: values.email,
        phone: values.phone,
        age: values.age,
        address: values.address,
        areas_of_interest: values.areas_of_interest,
        availability_days: values.availability_days,
        availability_hours: values.availability_hours,
        prior_experience: values.prior_experience || null,
        heard_from: values.heard_from || null,
      })
      .select("volunteer_code, full_name")
      .single();

    if (error) {
      toast.error("Submission failed", { description: error.message });
      return;
    }
    setSubmitted({ code: data.volunteer_code, name: data.full_name });
    reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
              <Feather className="size-5 text-primary-foreground -rotate-12" />
            </div>
            <div>
              <div className="font-bold text-base leading-tight tracking-tight">NayePankh Foundation</div>
              <div className="text-xs text-muted-foreground leading-tight">Giving wings to change</div>
            </div>
          </Link>
          <Link to="/auth" className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            Staff access
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-12 md:py-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/15 text-accent-foreground border border-accent/30 px-3 py-1 text-xs font-semibold">
          <Sparkles className="size-3 text-accent" /> Volunteer Program 2026
        </div>
        <h1 className="mt-5 text-3xl md:text-5xl font-bold tracking-tight">
          Become a <span className="text-accent">NayePankh</span> volunteer.
        </h1>
        <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          NayePankh Foundation works with under-served communities across India on education,
          healthcare, and livelihoods. Volunteering with us means joining a friendly team of
          students and professionals — a few hours a week is enough to make a real difference.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5"><Users className="size-4 text-primary" /> 500+ active volunteers</div>
          <div className="flex items-center gap-1.5"><GraduationCap className="size-4 text-primary" /> 30+ schools supported</div>
          <div className="flex items-center gap-1.5"><Stethoscope className="size-4 text-primary" /> 20+ health camps / year</div>
        </div>
      </section>

      {/* Form */}
      <section className="container mx-auto px-4 pb-16">
        <Card className="max-w-3xl mx-auto shadow-sm">
          {submitted ? (
            <CardContent className="py-14 text-center">
              <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <CheckCircle2 className="size-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Thank you, {submitted.name}!</h2>
              <p className="mt-2 text-muted-foreground max-w-md mx-auto">
                Your registration has been received. Our team will reach out within 3–5 days.
              </p>
              <div className="mt-5 inline-block rounded-md border bg-muted px-4 py-2 font-mono text-sm">
                Volunteer ID: <span className="font-semibold text-primary">{submitted.code}</span>
              </div>
              <div className="mt-6">
                <Button onClick={() => setSubmitted(null)} variant="outline">
                  Register another volunteer
                </Button>
              </div>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b bg-muted/30 rounded-t-xl">
                <CardTitle className="text-xl flex items-center gap-2">
                  <HandHeart className="size-5 text-accent" /> Volunteer Registration
                </CardTitle>
                <CardDescription>
                  Takes about 2 minutes. Fields marked with <span className="text-accent font-semibold">*</span> are required.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="Full name *" error={errors.full_name?.message}>
                      <Input {...register("full_name")} placeholder="Your full name" />
                    </Field>
                    <Field label="Email *" error={errors.email?.message}>
                      <Input type="email" {...register("email")} placeholder="you@example.com" />
                    </Field>
                    <Field label="Phone *" error={errors.phone?.message}>
                      <Input {...register("phone")} placeholder="+91 ..." />
                    </Field>
                    <Field label="Age *" error={errors.age?.message}>
                      <Input type="number" {...register("age")} placeholder="25" />
                    </Field>
                  </div>

                  <Field label="Address *" error={errors.address?.message}>
                    <Textarea {...register("address")} placeholder="City, area, state" rows={2} />
                  </Field>

                  <Field label="Areas of interest *" error={errors.areas_of_interest?.message as string}>
                    <div className="flex flex-wrap gap-2">
                      {INTERESTS.map((i) => {
                        const active = interests?.includes(i);
                        return (
                          <button
                            type="button"
                            key={i}
                            onClick={() => toggle("areas_of_interest", i)}
                            className={`px-3.5 py-1.5 rounded-full text-sm border capitalize transition-all duration-150 ${
                              active
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background hover:bg-accent/10 hover:border-accent/40"
                            }`}
                          >
                            {i}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Available days *" error={errors.availability_days?.message as string}>
                    <div className="flex flex-wrap gap-2">
                      {DAYS.map((d) => {
                        const active = days?.includes(d);
                        return (
                          <button
                            type="button"
                            key={d}
                            onClick={() => toggle("availability_days", d)}
                            className={`px-3.5 py-1.5 rounded-md text-sm border font-medium transition-all duration-150 ${
                              active
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-background hover:bg-accent/10 hover:border-accent/40"
                            }`}
                          >
                            {d.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Available hours *" error={errors.availability_hours?.message}>
                    <Input {...register("availability_hours")} placeholder="e.g. Weekends 10am-2pm" />
                  </Field>

                  <Field label="Prior volunteer experience" error={errors.prior_experience?.message}>
                    <Textarea {...register("prior_experience")} placeholder="Optional" rows={3} />
                  </Field>

                  <Field label="How did you hear about us?" error={errors.heard_from?.message}>
                    <Input {...register("heard_from")} placeholder="Instagram, friend, event..." />
                  </Field>

                  <Button type="submit" disabled={isSubmitting} size="lg" className="w-full transition-transform hover:scale-[1.01]">
                    {isSubmitting ? "Submitting..." : "Submit registration"}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </section>

      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-1.5">
          <Heart className="size-3.5 text-accent" /> © 2026 NayePankh Foundation. Made with care.
        </div>
      </footer>
    </div>
  );
}


function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-sm font-semibold tracking-tight">{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
