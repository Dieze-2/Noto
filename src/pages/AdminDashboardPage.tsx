import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, XCircle, UserCheck, Play } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import { useRoles } from "@/auth/RoleProvider";
import { grantCoachTrial, getPendingCancellations, approveCancellation, CoachPlan } from "@/db/coachSubscriptions";
import { createNotification } from "@/db/notifications";
import { getProfile, displayName } from "@/db/profiles";
import { supabase } from "@/lib/supabaseClient";

interface EnrichedCancellation {
  coach_id: string;
  plan: CoachPlan;
  profileName: string;
}

export default function AdminDashboardPage() {
  const { t } = useTranslation();
  const { isAdmin, loading: rolesLoading } = useRoles();
  const [cancellations, setCancellations] = useState<EnrichedCancellation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  // Trial grant
  const [trialEmail, setTrialEmail] = useState("");
  const [grantingTrial, setGrantingTrial] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const pendingCancels = await getPendingCancellations();

    const enrichedCancels = await Promise.all(
      pendingCancels.map(async (c) => {
        const profile = await getProfile(c.coach_id);
        return { ...c, profileName: profile ? displayName(profile) : c.coach_id.slice(0, 8) };
      })
    );

    setCancellations(enrichedCancels);
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin]);

  const handleApproveCancellation = async (coachId: string) => {
    setActionId(coachId);
    try {
      await approveCancellation(coachId);
      const profile = await getProfile(coachId);
      const name = profile ? displayName(profile) : "";
      await createNotification({
        coach_id: coachId,
        type: "cancellation_approved",
        athlete_email: name,
        athlete_id: coachId,
      });
      toast.success(t("admin.cancellationApproved"));
      setCancellations((prev) => prev.filter((c) => c.coach_id !== coachId));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setActionId(null);
    }
  };

  const handleGrantTrial = async () => {
    if (!trialEmail.trim()) return;
    setGrantingTrial(true);
    try {
      const { data: userId } = await supabase
        .rpc("get_user_id_by_email", { email_input: trialEmail.trim().toLowerCase() });

      if (!userId) {
        toast.error(t("admin.userNotFound"));
        setGrantingTrial(false);
        return;
      }

      await grantCoachTrial(userId);
      toast.success(t("admin.trialGranted"));
      setTrialEmail("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setGrantingTrial(false);
    }
  };

  if (rolesLoading) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-20 text-center space-y-4">
        <Shield size={48} className="mx-auto text-muted-foreground/40" />
        <p className="text-sm font-bold text-muted-foreground">{t("admin.notAdmin")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-32 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
            <Shield size={22} />
          </div>
          <h1 className="text-noto-title text-2xl text-primary">{t("admin.title")}</h1>
          <p className="text-xs text-muted-foreground font-bold">{t("admin.subtitle")}</p>
        </div>

        {/* Cancellation Requests */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle size={16} className="text-destructive" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              {t("admin.cancellationRequests")}
            </h2>
            {cancellations.length > 0 && (
              <span className="text-[10px] font-bold bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full">
                {cancellations.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : cancellations.length === 0 ? (
            <GlassCard className="p-8 rounded-2xl text-center">
              <p className="text-sm font-bold text-muted-foreground">{t("admin.noCancellations", "Aucune demande de résiliation en attente")}</p>
            </GlassCard>
          ) : (
            <div className="space-y-3">
              {cancellations.map((c, i) => (
                <motion.div key={c.coach_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive font-black text-sm">
                        {c.profileName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-foreground truncate">{c.profileName}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">
                          {t("admin.planLabel", { plan: c.plan.toUpperCase() })} · {t("admin.cancellationDesc")}
                        </p>
                      </div>
                      <button onClick={() => handleApproveCancellation(c.coach_id)} disabled={!!actionId}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive text-[10px] font-black uppercase tracking-wider hover:bg-destructive/20 transition-colors disabled:opacity-50">
                        {actionId === c.coach_id ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                        {t("admin.approveCancellation")}
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Grant Trial */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Play size={16} className="text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-foreground">
              {t("admin.grantTrial")}
            </h2>
          </div>
          <GlassCard className="p-4 rounded-2xl">
            <p className="text-[10px] text-muted-foreground font-bold mb-3">{t("admin.grantTrialDesc")}</p>
            <div className="flex gap-2">
              <input type="email" value={trialEmail} onChange={(e) => setTrialEmail(e.target.value)}
                placeholder={t("admin.trialEmailPlaceholder")}
                className="flex-1 glass rounded-xl px-4 py-2.5 text-sm font-bold text-foreground outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/40" />
              <button onClick={handleGrantTrial} disabled={grantingTrial || !trialEmail.trim()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50">
                {grantingTrial ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                {t("admin.startTrial")}
              </button>
            </div>
          </GlassCard>
        </div>
      </motion.div>
    </div>
  );
}
