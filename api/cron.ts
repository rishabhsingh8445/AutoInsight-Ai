import { createClient } from "@supabase/supabase-js";

export default async function handler(req: any, res: any) {
  // 1. Verify Vercel Cron Secret to protect the endpoint
  // Vercel automatically sends this header: Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    // We MUST use the Service Role Key to bypass Row Level Security (RLS)
    // because the cron job runs as an admin/system, not as an authenticated user.
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date().toISOString();

    // 2. Find all expired datasets across ALL users
    const { data: expired, error: fetchError } = await supabaseAdmin
      .from("datasets")
      .select("id, storage_path")
      .lt("expires_at", now);

    if (fetchError) throw fetchError;

    if (!expired || expired.length === 0) {
      return res.status(200).json({ message: "No expired datasets to clean up." });
    }

    const paths = expired.map((r: any) => r.storage_path);
    const ids = expired.map((r: any) => r.id);

    // 3. Delete from Supabase Storage & Database
    const [storageRes, dbRes] = await Promise.all([
      supabaseAdmin.storage.from("datasets").remove(paths),
      supabaseAdmin.from("datasets").delete().in("id", ids),
    ]);

    if (storageRes.error) console.error("Storage Error:", storageRes.error);
    if (dbRes.error) console.error("DB Error:", dbRes.error);

    return res.status(200).json({
      message: `Successfully cleaned up ${expired.length} expired datasets.`,
      deletedIds: ids,
    });
  } catch (error: any) {
    console.error("Cron Cleanup Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
