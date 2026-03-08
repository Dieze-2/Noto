import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useRoles } from "@/auth/RoleProvider";
import { getMyPrograms, Program } from "@/db/programs";
import ProgramViewer from "@/components/ProgramViewer";

export default function ProgramPage() {
  const { t } = useTranslation();
  const { isCoach } = useRoles();
  const navigate = useNavigate();
  const { programId } = useParams<{ programId: string }>();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selected, setSelected] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyPrograms().then((p) => {
      setPrograms(p);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (programId && programs.length > 0) {
      const found = programs.find((p) => p.id === programId);
      if (found) setSelected(found);
    }
  }, [programId, programs]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6 pb-32">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {selected ? (
          <>
            <button
              onClick={() => { setSelected(null); navigate("/program"); }}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={16} /> {t("program.backToList")}
            </button>
            <ProgramViewer program={selected} />
          </>
        ) : (
          <>
            <h1 className="text-noto-title text-3xl text-primary text-center mb-6">
              {t("program.title")}
            </h1>

            {programs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <ClipboardList className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">{t("program.empty")}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {programs.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); navigate(`/program/${p.id}`); }}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl glass hover:bg-muted/50 transition-colors text-left"
                  >
                    <ClipboardList size={16} className="text-primary" />
                    <span className="text-sm font-bold text-foreground flex-1 truncate">{p.title}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}
