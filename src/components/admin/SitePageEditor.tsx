import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

type Form = {
  title: string;
  subtitle: string;
  body_html: string;
  seo_title: string;
  seo_description: string;
};

const empty: Form = { title: "", subtitle: "", body_html: "", seo_title: "", seo_description: "" };

/** Editor for a single CMS page such as About Us or Contact Us. */
export function SitePageEditor({ slug, label }: { slug: string; label: string }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(empty);

  const { data, isLoading } = useQuery({
    queryKey: ["cms-admin", "site_pages", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_pages").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      title: data.title ?? "",
      subtitle: data.subtitle ?? "",
      body_html: data.body_html ?? "",
      seo_title: data.seo_title ?? "",
      seo_description: data.seo_description ?? "",
    });
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_pages")
        .upsert({ slug, is_published: true, ...form }, { onConflict: "slug" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cms"] });
      void qc.invalidateQueries({ queryKey: ["cms-admin", "site_pages", slug] });
      toast.success(`${label} saved`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <section className="surface-card space-y-4 p-5">
      <h2 className="font-display text-lg font-bold">{label}</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="space-y-1.5">
            <Label htmlFor={`${slug}-title`}>Page title</Label>
            <Input
              id={`${slug}-title`}
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${slug}-subtitle`}>Subtitle</Label>
            <Input
              id={`${slug}-subtitle`}
              value={form.subtitle}
              onChange={(e) => setForm((s) => ({ ...s, subtitle: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Content</Label>
            <RichTextEditor
              value={form.body_html}
              placeholder="Write your page content…"
              onChange={(html) => setForm((s) => ({ ...s, body_html: html }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${slug}-seo-title`}>SEO title</Label>
              <Input
                id={`${slug}-seo-title`}
                value={form.seo_title}
                onChange={(e) => setForm((s) => ({ ...s, seo_title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${slug}-seo-desc`}>SEO description</Label>
              <Textarea
                id={`${slug}-seo-desc`}
                value={form.seo_description}
                onChange={(e) => setForm((s) => ({ ...s, seo_description: e.target.value }))}
              />
            </div>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save {label}
          </Button>
        </>
      )}
    </section>
  );
}
