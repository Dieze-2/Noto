import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Building2, ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import GlassCard from "@/components/GlassCard";
import { useRoles } from "@/auth/RoleProvider";
import {
  isTrialEligible,
  startCheckout,
  openCustomerPortal,
  CoachPlan,
} from "@/db/coachSubscriptions";

const plans = [
  {
    key: "classic" as const,
    icon: Crown,
    color: "text-primary",
    bgColor: "bg-primary/10",
    price: "24,90",
    featured: false,
  },
  {
    key: "pro" as const,
    icon: Zap,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    price: "24,90",
    extraPrice: "1,50",
    featured: true,
  },
  {
    key: "club" as const,
    icon: Building2,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    price: "69,90",
    extraPrice: "1",
    featured: false,
  },
];

export default function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isCoach, subscription, refresh } = useRoles();
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [trialEligible, setTrialEligible] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);

  // Handle checkout success/cancel from URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("checkout=success")) {
      toast.success(t("pricing.checkoutSuccess", "Abonnement activé avec succès !"));
      refresh(); // Re-check subscription status
      window.location.hash = hash.replace(/[?&]checkout=success/, "");
    } else if (hash.includes("checkout=cancel")) {
      toast.info(t("pricing.checkoutCancelled", "Paiement annulé."));
      window.location.hash = hash.replace(/[?&]checkout=cancel/, "");
    }
  }, []);

  useEffect(() => {
    if (!isCoach) {
      isTrialEligible().then(setTrialEligible);
    }
  }, [isCoach]);

  const currentPlan = subscription?.plan ?? null;

  const handleSubscribe = async (planKey: CoachPlan, trial = false) => {
    setSubmitting(planKey + (trial ? "-trial" : ""));
    try {
      const url = await startCheckout(planKey, trial);
      if (url) window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(null);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const url = await openCustomerPortal();
      if (url) window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setManagingPortal(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pt-6 pb-32 lg:pb-8">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          {t("pricing.back")}
        </button>

        <div className="text-center space-y-2">
          <h1 className="text-noto-title text-3xl text-primary">{t("pricing.title")}</h1>
          <p className="text-sm text-muted-foreground font-bold max-w-md mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Plans grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const features = t(`pricing.${plan.key}.features`, { returnObjects: true }) as string[];
            const isSubmitting = submitting === plan.key;
            const isCurrent = isCoach && currentPlan === plan.key;
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <GlassCard
                  className={`p-6 rounded-3xl relative overflow-hidden ${
                    plan.featured ? "ring-2 ring-primary" : ""
                  } ${isCurrent ? "ring-2 ring-primary" : ""}`}
                >
                  {plan.featured && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                      {t("pricing.popular")}
                    </div>
                  )}

                  {isCurrent && (
                    <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-br-xl">
                      {t("pricing.currentPlan")}
                    </div>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${plan.bgColor} flex items-center justify-center ${plan.color}`}>
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-foreground">
                        {t(`pricing.${plan.key}.name`)}
                      </h3>
                      <p className="text-[10px] text-muted-foreground font-bold">
                        {t(`pricing.${plan.key}.tagline`)}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-foreground">{plan.price}€</span>
                      <span className="text-sm text-muted-foreground font-bold">/mois</span>
                    </div>
                    {plan.extraPrice && (
                      <p className="text-xs text-muted-foreground font-bold mt-1">
                        {t(`pricing.${plan.key}.extra`, { price: plan.extraPrice })}
                      </p>
                    )}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6">
                    {Array.isArray(features) && features.map((feat, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <Check size={14} className="text-primary mt-0.5 shrink-0" />
                        <span className="text-xs text-muted-foreground font-bold">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <button
                      onClick={handleManageSubscription}
                      disabled={managingPortal}
                      className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider bg-primary/10 text-primary text-center flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {managingPortal ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <ExternalLink size={14} />
                      )}
                      {t("pricing.manageSubscription", "Gérer mon abonnement")}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={!!submitting}
                      className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 ${
                        plan.featured
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                      {isCoach ? t("pricing.changePlan") : t("pricing.subscribe")}
                    </button>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Manage subscription via Stripe Portal */}
        {isCoach && (
          <div className="text-center">
            <button
              onClick={handleManageSubscription}
              disabled={managingPortal}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 flex items-center gap-1.5 mx-auto"
            >
              {managingPortal && <Loader2 size={12} className="animate-spin" />}
              <ExternalLink size={12} />
              {t("pricing.cancelSubscription")}
            </button>
          </div>
        )}

        {/* Free trial via Stripe (30 days, Classic plan) */}
        {!isCoach && trialEligible && (
          <GlassCard className="p-6 rounded-3xl text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Crown size={22} />
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
              {t("pricing.trialTitle")}
            </h3>
            <p className="text-xs text-muted-foreground font-bold max-w-sm mx-auto">
              {t("pricing.trialDesc")}
            </p>
            <button
              onClick={() => handleSubscribe("classic", true)}
              disabled={!!submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting === "classic-trial" && <Loader2 size={14} className="animate-spin" />}
              {t("pricing.requestTrial")}
            </button>
          </GlassCard>
        )}

        {/* Footer note */}
        <p className="text-center text-[10px] text-muted-foreground font-bold">
          {t("pricing.note")}
        </p>
      </motion.div>
    </div>
  );
}
