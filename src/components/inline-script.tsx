"use client";

/**
 * An inline script that runs once, while the browser first reads the page (before React loads).
 * When React later renders it in the browser, it's marked as plain text, so it doesn't run twice and
 * React doesn't warn about script tags. The pattern comes from the Next.js "preventing flash" guide.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
