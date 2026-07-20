import { createClient } from "@supabase/supabase-js";

// Retrieve environment variables safely across node/Vercel (process.env) and Vite client (import.meta.env)
const getSupabaseCredentials = () => {
  let url = "";
  let key = "";

  // 1. Try process.env first (ideal for Vercel backend/serverless and Node context)
  try {
    if (typeof process !== "undefined" && process.env) {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dprawgvrjrzumnijrgnl.supabase.co";
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    }
  } catch (e) {
    // process is not defined in standard browser client environment
  }

  // 2. Fall back to import.meta.env for browser clients compiled via Vite
  if (!url || !key) {
    try {
      // @ts-ignore
      url = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL || "https://dprawgvrjrzumnijrgnl.supabase.co";
      // @ts-ignore
      key = import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    } catch (e) {
      // environment variables not accessible
    }
  }

  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseCredentials();

// Initialize Supabase client if keys are present and URL is valid
const isValidSupabaseUrl = (str: string) => {
  if (!str) return false;
  try {
    return /^https?:\/\//i.test(str.trim());
  } catch (e) {
    return false;
  }
};

export const supabase = (supabaseUrl && supabaseAnonKey && isValidSupabaseUrl(supabaseUrl)) 
  ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim()) 
  : null;

if (supabaseUrl && supabaseAnonKey && !isValidSupabaseUrl(supabaseUrl)) {
  console.warn("[Supabase Tracker] Invalid NEXT_PUBLIC_SUPABASE_URL format. It must start with http:// or https://. Supabase tracking is deactivated.");
}

/**
 * Capture user interactions, page loads, and transactional triggers.
 * Asynchronously inserts records into the existing 'tracking_data' table
 * matching the columns 'event_name' and 'event_data'.
 */
export async function captureEvent(name: string, metadata: Record<string, any> = {}) {
  // Enrich telemetry with client context details
  const enrichedData = {
    ...metadata,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server-Side",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    href: typeof window !== "undefined" ? window.location.href : "Server"
  };

  console.log(`[Supabase Tracker] Event: "${name}"`, enrichedData);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("tracking_data")
        .insert([
          {
            event_name: name,
            event_data: enrichedData
          }
        ]);

      if (error) {
        console.error("[Supabase Tracker] Error inserting tracking event:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err: any) {
      console.error("[Supabase Tracker] Failed to transmit event data:", err?.message || err);
      return { success: false, error: err?.message || String(err) };
    }
  } else {
    // If client is uninitialized, fall back to our server express API proxy which logs it
    if (typeof window !== "undefined") {
      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_name: name, event_data: enrichedData })
        });
        if (res.ok) {
          const json = await res.json();
          return { success: true, fromProxy: true, data: json };
        }
      } catch (proxyErr) {
        // Safe fail
      }
    }
    console.warn("[Supabase Tracker] Supabase is not configured yet. Event cached locally:", name);
    return { success: false, reason: "Credentials not available" };
  }
}

// Keep trackEvent alias for absolute backwards-compatibility with previous telemetry calls
export const trackEvent = captureEvent;
