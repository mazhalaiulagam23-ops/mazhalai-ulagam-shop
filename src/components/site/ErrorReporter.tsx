import { useEffect } from "react";
import { logClientError } from "@/lib/security.functions";

/** Reports uncaught browser errors to the admin error log. */
export function ErrorReporter() {
  useEffect(() => {
    const send = (message: string, stack?: string) => {
      void logClientError({
        data: {
          message: message.slice(0, 500),
          stack: stack?.slice(0, 4000),
          path: window.location.pathname,
          level: "error",
        },
      }).catch(() => undefined);
    };

    const onError = (event: ErrorEvent) => send(event.message, event.error?.stack);
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string } | string | undefined;
      send(typeof reason === "string" ? reason : (reason?.message ?? "Unhandled promise rejection"), typeof reason === "object" ? reason?.stack : undefined);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
