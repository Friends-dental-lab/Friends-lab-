const SB_URL = "https://twirzkwvgdpqprbinosk.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3aXJ6a3d2Z2RwcXByYmlub3NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyMzk2NjgsImV4cCI6MjEwNjgxNTY2OH0.jGCo6I0GO0fpi9JDTwlU7uMNlCmcUCjgJ2ARs7bQpvA"; // مفتاح عام (anon)، الحماية من قواعد RLS
const sb = supabase.createClient(SB_URL, SB_KEY);
// رقم الهاتف يتحول إلى بريد داخلي للدخول
const toEmail = p => { p = String(p).replace(/\D/g, ""); if (p.startsWith("0")) p = CONFIG.country + p.slice(1); return p + "@doctor.friendslab.app"; };
const ST_AR = { pending: "جديد (بانتظار الاعتماد)", approved: "معتمد", suspended: "موقوف" };
