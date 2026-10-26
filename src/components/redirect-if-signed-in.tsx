import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal";

/** Sends visitors who are already signed in straight to their tracker. Render inside <Suspense>. */
export async function RedirectIfSignedIn() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return null;
}
