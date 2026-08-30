import { Link } from "@tanstack/react-router";
import { Clock, Facebook, Globe, Instagram, Mail, MapPin, Phone, Send, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useFooterLinks, useSiteCategories, useSiteSettings } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WhatsAppIcon } from "./Header";
import { QrCodes, SocialIcons } from "./SocialIcons";

const quickLinks = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Offers", to: "/offers" },
  { label: "Blog / Parenting Tips", to: "/blog" },
  { label: "About Us", to: "/about" },
  { label: "Contact Us", to: "/contact" },
] as const;

const serviceLinks = [
  { label: "My Account", to: "/account" },
  { label: "Order Tracking", to: "/order-tracking" },
  { label: "Wishlist", to: "/wishlist" },
  { label: "Cart", to: "/cart" },
  { label: "FAQ", to: "/faq" },
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Returns & Refunds", to: "/returns-refunds" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Terms & Conditions", to: "/terms" },
] as const;

export function Footer() {
  const [email, setEmail] = useState("");
  const { settings } = useSiteSettings();
  const categories = useSiteCategories();
  const { data: cmsLinks = [] } = useFooterLinks();
  const store = {
    name: settings.siteName,
    address: settings.address,
    phone: settings.phone,
    phoneHref: `tel:${settings.phone.replace(/[^+\d]/g, "")}`,
    email: settings.email,
    hours: "Mon-Sun, 9 AM - 8 PM",
    instagram: settings.instagram,
    facebook: settings.facebook,
    whatsapp: settings.whatsapp,
  };
  const groups = cmsLinks.reduce<Record<string, { label: string; href: string }[]>>((acc, l) => {
    (acc[l.group_name] ??= []).push({ label: l.label, href: l.href });
    return acc;
  }, {});
  const groupNames = Object.keys(groups);

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    toast.success("Thanks for subscribing! Offers are on the way.");
    setEmail("");
  };

  return (
    <footer className="mt-16">
      <div className="gradient-primary">
        <div className="container-page flex flex-col items-center gap-5 py-8 text-primary-foreground md:flex-row md:justify-between">
          <div className="flex items-center gap-3 text-center md:text-left">
            <Send className="h-8 w-8 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-lg font-bold">Stay updated</h2>
              <p className="text-sm opacity-90">Get offers, new arrivals and parenting tips.</p>
            </div>
          </div>
          <form onSubmit={subscribe} className="grid w-full max-w-md gap-2 min-[390px]:grid-cols-[minmax(0,1fr)_auto]">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <Input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="bg-card text-foreground"
            />
            <Button type="submit" variant="teal" className="w-full min-[390px]:w-auto">
              Subscribe
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-secondary/50">
        <div className="container-page grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <h2 className="font-display text-2xl font-semibold text-primary">{store.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {settings.footerNote ||
                "Your one-stop shop for baby products, return gifts, toys, stationery and more in Coimbatore."}
            </p>
            <SocialIcons placement="footer" className="mt-4 gap-1" />
            <QrCodes placement="footer" className="mt-4" />
          </div>

          {(groupNames.length
            ? groupNames.map((name) => ({ name, links: groups[name] }))
            : [
                { name: "Quick Links", links: quickLinks.map((l) => ({ label: l.label, href: l.to })) },
                { name: "Customer Service", links: serviceLinks.map((l) => ({ label: l.label, href: l.to })) },
              ]
          ).map((group) => (
            <nav key={group.name} aria-label={group.name}>
              <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">{group.name}</h3>
              <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                {group.links.map((l) => (
                  <li key={`${group.name}-${l.href}-${l.label}`}>
                    <a href={l.href} className="hover:text-primary">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <nav aria-label="Shop by category">
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Categories</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to="/category/$slug" params={{ slug: c.slug }} className="hover:text-primary">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>


          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Contact Us</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-primary" /> {store.address}
              </li>
              <li className="flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <a href={store.phoneHref} className="hover:text-primary">
                  {store.phone}
                </a>
              </li>
              <li className="flex gap-2">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <a href={`mailto:${store.email}`} className="hover:text-primary">
                  {store.email}
                </a>
              </li>
              <li className="flex gap-2">
                <Clock className="h-4 w-4 shrink-0 text-primary" /> {store.hours}
              </li>
              <li className="flex gap-2">
                <Globe className="h-4 w-4 shrink-0 text-primary" /> www.mazhalaiulagam.com
              </li>
            </ul>
            <Button variant="teal" size="sm" className="mt-4" asChild>
              <a href={store.whatsapp} target="_blank" rel="noreferrer">
                <WhatsAppIcon className="h-4 w-4" /> Order on WhatsApp
              </a>
            </Button>

            <h3 className="mt-6 font-display text-sm font-semibold uppercase tracking-[0.14em] text-foreground">We Accept</h3>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold">
              {["VISA", "Mastercard", "RuPay", "UPI", "Net Banking", "COD"].map((m) => (
                <span key={m} className="rounded-md border border-border bg-card px-2.5 py-1.5">
                  {m}
                </span>
              ))}
            </div>
            <p className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-teal" /> 100% secure payments
            </p>
          </div>
        </div>
      </div>

      <div className="gradient-teal">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-4 text-xs text-teal-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved.</p>
          <p>Made with love for little ones in Coimbatore, Tamil Nadu.</p>
        </div>
      </div>
    </footer>
  );
}
