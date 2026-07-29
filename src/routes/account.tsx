import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Mazhalai Ulagam" },
      { name: "description", content: "Login or create your Mazhalai Ulagam account to track orders and save favourites." },
      { property: "og:title", content: "My Account | Mazhalai Ulagam" },
      { property: "og:description", content: "Login or register to manage your orders and wishlist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Account,
});

function Account() {
  const [pending, setPending] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    toast.info("Accounts activate once the backend is connected in the next build step.");
    setPending(false);
  };

  return (
    <>
      <PageHeader title="My Account" crumbs={[{ label: "My Account" }]} />
      <div className="container-page py-10">
        <div className="surface-card mx-auto max-w-md p-6">
          <Tabs defaultValue="login">
            <TabsList className="w-full">
              <TabsTrigger value="login" className="flex-1">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="flex-1">
                Register
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={submit} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input id="login-email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="login-password">Password</Label>
                  <Input id="login-password" type="password" required minLength={6} className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Login
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={submit} className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="reg-name">Full name</Label>
                  <Input id="reg-name" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="reg-email">Email</Label>
                  <Input id="reg-email" type="email" required className="mt-1.5" />
                </div>
                <div>
                  <Label htmlFor="reg-password">Password</Label>
                  <Input id="reg-password" type="password" required minLength={6} className="mt-1.5" />
                </div>
                <Button type="submit" className="w-full" disabled={pending}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
