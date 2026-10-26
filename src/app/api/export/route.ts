import { loadTracker, requireUserId } from "@/lib/dal";

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return Response.json({ error: "Sign in to export your data." }, { status: 401 });
  }
  const data = await loadTracker(userId);
  if (!data) return Response.json({ error: "Nothing to export yet." }, { status: 404 });

  const backup = {
    app: "reclaim180",
    version: 2,
    exportedAt: new Date().toISOString(),
    profile: data.profile,
    habits: data.habits.map(({ id, name, kind, target, unit }) => ({ id, name, kind, target, unit })),
    logs: Object.values(data.logs),
    relapses: data.relapses.map(({ at, trigger, note }) => ({ at, trigger, note })),
  };
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="reclaim180-backup-${day}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
