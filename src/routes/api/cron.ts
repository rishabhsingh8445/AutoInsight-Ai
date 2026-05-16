import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createClient } from "@supabase/supabase-js";

export const APIRoute = createAPIFileRoute('/api/cron')({
  GET: async ({ request }) => {
    const authHeader = request.headers.get("authorization");
    
    const cronSecret = import.meta.env.CRON_SECRET || process.env.CRON_SECRET;
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        status: 401,
        headers: { "Content-Type": "application/json" }
      });
    }

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Missing Supabase credentials (VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY)");
      }

      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
      const now = new Date().toISOString();

      const { data: expired, error: fetchError } = await supabaseAdmin
        .from("datasets")
        .select("id, storage_path")
        .lt("expires_at", now);

      if (fetchError) throw fetchError;

      if (!expired || expired.length === 0) {
        return new Response(JSON.stringify({ message: "No expired datasets to clean up." }), { 
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      const paths = expired.map((r: any) => r.storage_path);
      const ids = expired.map((r: any) => r.id);

      const [storageRes, dbRes] = await Promise.all([
        supabaseAdmin.storage.from("datasets").remove(paths),
        supabaseAdmin.from("datasets").delete().in("id", ids),
      ]);

      if (storageRes.error) console.error("Storage Error:", storageRes.error);
      if (dbRes.error) console.error("DB Error:", dbRes.error);

      return new Response(JSON.stringify({
        message: `Successfully cleaned up ${expired.length} expired datasets.`,
        deletedIds: ids,
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      console.error("Cron Cleanup Error:", error);
      return new Response(JSON.stringify({ error: error.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
});
