import { isAdmin, json, rateLimited } from "@/lib/api";
import { posterEnabled, posterReport } from "@/lib/poster";

/** GET /api/admin/poster → starea legăturii cu Poster: localul și potrivirea produselor. */
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    if (rateLimited(req, 10)) return json({ error: "rate_limited" }, 429);
    return json({ error: "unauthorized" }, 401);
  }
  if (!posterEnabled()) return json({ enabled: false });
  try {
    return json({ enabled: true, ...(await posterReport()) });
  } catch (err) {
    return json({ enabled: true, error: String(err instanceof Error ? err.message : err) });
  }
}
