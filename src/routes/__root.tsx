import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ShopProvider } from "@/lib/shop-store";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { FloatingSocial } from "@/components/site/SocialIcons";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { CookieConsent } from "@/components/site/CookieConsent";
import { SessionGuard } from "@/components/site/SessionGuard";
import { ErrorReporter } from "@/components/site/ErrorReporter";
import { DesignTokens } from "@/components/site/DesignTokens";
import { MobileBottomNav } from "@/components/site/MobileBottomNav";

import { Toaster } from "@/components/ui/sonner";
import { useSiteSettings } from "@/lib/cms";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "MazhalaiHub – Baby & Kids Online Store" },
      {
        name: "description",
        content:
          "MazhalaiHub is Coimbatore's trusted online store for baby & kids products — safe toys, educational toys, baby care, kids fashion, stationery and return gifts at honest prices with fast pan-India delivery.",
      },
      {
        name: "keywords",
        content:
          "baby products online, kids store India, baby toys, educational toys, kids fashion, baby care, return gifts, stationery, MazhalaiHub, Coimbatore baby store",
      },
      { name: "author", content: "MazhalaiHub" },
      { property: "og:site_name", content: "MazhalaiHub" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://mazhalaihub.com/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap",
      },
      { rel: "icon", type: "image/png", href: "/favicon.png" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "OnlineStore",
          name: "MazhalaiHub",
          alternateName: "Mazhalai Ulagam",
          url: "https://mazhalaihub.com/",
          logo: "https://mazhalaihub.com/logo.png",
          image: "https://mazhalaihub.com/og-cover.jpg",
          description:
            "Online store for baby & kids products — toys, educational toys, baby care, kids fashion, stationery and return gifts, shipping across India from Coimbatore.",
          telephone: "+91 97867 97970",
          email: "info@mazhalaiulagam.com",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Coimbatore",
            addressRegion: "Tamil Nadu",
            addressCountry: "IN",
          },
          openingHours: "Mo-Sa 09:30-20:00",
          priceRange: "₹₹",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/** Applies the CMS-managed favicon to the document. */
function BrandHead() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (typeof document === "undefined" || !settings.faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.faviconUrl;
    link.removeAttribute("type");
  }, [settings.faviconUrl]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <ThemeProvider>
      <ShopProvider>
        <BrandHead />
        <DesignTokens />
        <div className="flex min-h-screen flex-col overflow-x-clip pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
          <Header />
          <main className="flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <Footer />
          <FloatingSocial />
          <SupportChatWidget />
           <MobileBottomNav />
          <CookieConsent />
          <SessionGuard />
          <ErrorReporter />


        </div>
        <Toaster position="top-center" richColors />
      </ShopProvider>
      </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}


