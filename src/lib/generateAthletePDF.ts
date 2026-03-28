import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

// ASCII-safe helper: strip diacritics so jsPDF default fonts render correctly
function ascii(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Format number with space as thousands separator (ASCII-safe for jsPDF)
function fmtNum(n: number): string {
  const s = Math.round(n).toString();
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

interface PDFSession {
  name: string;
  exercises: { exercise_name: string; sets: number | string; reps: string; rest: string; work_type: string; note: string | null }[];
}

interface PDFPersonalRecord {
  name: string;
  e1rm: number;
  date: string;
}

interface PDFMuscleGroup {
  name: string;
  count: number;
  pct: number;
}

interface PDFProgression {
  name: string;
  progressionPct: number;
}

interface AthletePDFData {
  athleteName: string;
  stats: {
    currentWeight: number | null;
    weightTrend: number;
    avgSteps: number | null;
    avgKcal: number | null;
    workoutCount: number;
    totalWorkouts: number;
  };
  weeklyRows: {
    label: string;
    avgWeight: number | null;
    avgSteps: number | null;
    avgKcal: number | null;
    sessionsCount: number;
    weightVariation: number | null;
  }[];
  muscleGroups: PDFMuscleGroup[];
  personalRecords: PDFPersonalRecord[];
  topProgressions: PDFProgression[];
  sessions: PDFSession[];
  frequencyAvg: number;
  t: (key: string, opts?: any) => string;
}

// Brand colors (menthe / ardoise)
const MENTHE: [number, number, number] = [0, 255, 163];
const ARDOISE: [number, number, number] = [41, 42, 45];
const ARDOISE_LIGHT: [number, number, number] = [60, 62, 66];
const TEXT_DARK: [number, number, number] = [30, 30, 30];
const TEXT_MUTED: [number, number, number] = [120, 120, 120];
const CARD_BG: [number, number, number] = [240, 242, 238];

export function generateAthletePDF(data: AthletePDFData) {
  const { athleteName, stats, weeklyRows, muscleGroups, personalRecords, topProgressions, sessions, frequencyAvg, t } = data;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 16;
  let y = 20;

  // ── Header (ardoise background, menthe accent) ──
  doc.setFillColor(...ARDOISE);
  doc.rect(0, 0, pageWidth, 36, "F");
  // Menthe accent line
  doc.setFillColor(...MENTHE);
  doc.rect(0, 34, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(ascii(athleteName), margin, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(ascii(`${t("pdf.generatedOn")} ${format(new Date(), "dd/MM/yyyy")}`), margin, 28);
  doc.setTextColor(...MENTHE);
  doc.text(ascii(t("pdf.bilanTitle")), pageWidth - margin, 18, { align: "right" });

  y = 46;

  // ── Summary cards ──
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(ascii(t("coach.overview")), margin, y);
  y += 8;

  const cardW = (pageWidth - margin * 2 - 12) / 4;
  const cards = [
    { label: ascii(t("dashboard.weight")), value: stats.currentWeight != null ? `${stats.currentWeight.toFixed(1)} kg` : "--", sub: stats.weightTrend !== 0 ? `${stats.weightTrend > 0 ? "+" : ""}${stats.weightTrend.toFixed(1)} kg` : "" },
    { label: ascii(t("coach.workouts")), value: `${frequencyAvg.toFixed(1)}`, sub: `/ ${ascii(t("coach.perWeek"))} - ${stats.totalWorkouts} total` },
    { label: ascii(t("coach.avgSteps")), value: stats.avgSteps != null ? fmtNum(stats.avgSteps) : "--", sub: "" },
    { label: ascii(t("coach.avgKcal")), value: stats.avgKcal != null ? fmtNum(stats.avgKcal) : "--", sub: "" },
  ];

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, y, cardW, 22, 3, 3, "F");
    doc.setTextColor(...TEXT_MUTED);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(ascii(card.label.toUpperCase()), x + 4, y + 6);
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(card.value, x + 4, y + 15);
    if (card.sub) {
      doc.setTextColor(...TEXT_MUTED);
      doc.setFontSize(7);
      doc.text(card.sub, x + 4, y + 20);
    }
  });

  y += 30;

  // ── Training frequency ──
  doc.setTextColor(...TEXT_DARK);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(ascii(`${t("coach.trainingFrequency")}  o ${frequencyAvg.toFixed(1)} / ${t("coach.perWeek")}`), margin, y);
  y += 6;

  // ── Weekly metrics table ──
  if (weeklyRows.length > 0) {
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(ascii(t("coach.weeklyView")), margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [[ascii(t("coach.period")), ascii(t("coach.avgSteps")), ascii(t("coach.avgKcal")), ascii(t("dashboard.weight")), "%", ascii(t("coach.workouts"))]],
      body: weeklyRows.slice(0, 12).map((r) => [
        r.label,
        r.avgSteps != null ? fmtNum(r.avgSteps) : "--",
        r.avgKcal != null ? Math.round(r.avgKcal).toString() : "--",
        r.avgWeight != null ? r.avgWeight.toFixed(1) : "--",
        r.weightVariation != null ? `${r.weightVariation > 0 ? "+" : ""}${r.weightVariation.toFixed(2)}%` : "--",
        r.sessionsCount.toString(),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [...ARDOISE], textColor: 255, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Top 3 Progressions ──
  if (topProgressions.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(ascii("Top 3 Progressions"), margin, y);
    y += 6;

    const medals = ["🥇", "🥈", "🥉"];
    topProgressions.slice(0, 3).forEach((prog, i) => {
      doc.setFillColor(...CARD_BG);
      doc.roundedRect(margin, y - 3.5, pageWidth - margin * 2, 8, 2, 2, "F");

      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}.`, margin + 3, y + 1);
      doc.setFont("helvetica", "normal");
      doc.text(ascii(prog.name), margin + 10, y + 1);

      // Progression %
      const pctText = `+${prog.progressionPct.toFixed(1)}%`;
      doc.setTextColor(...MENTHE);
      doc.setFont("helvetica", "bold");
      doc.text(pctText, pageWidth - margin - 3, y + 1, { align: "right" });

      y += 9;
    });
    y += 4;
  }

  // ── Muscle groups ──
  if (muscleGroups.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(ascii(t("coach.muscleGroups")), margin, y);
    y += 6;

    muscleGroups.forEach((mg) => {
      doc.setTextColor(...TEXT_DARK);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(ascii(mg.name), margin, y);
      doc.text(`${mg.pct}%`, margin + 50, y);
      // Bar
      const barW = 80;
      doc.setFillColor(230, 230, 235);
      doc.roundedRect(margin + 60, y - 3, barW, 4, 2, 2, "F");
      doc.setFillColor(...MENTHE);
      doc.roundedRect(margin + 60, y - 3, barW * mg.pct / 100, 4, 2, 2, "F");
      y += 7;
    });
    y += 4;
  }

  // ── Personal records ──
  if (personalRecords.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(ascii(t("coach.personalRecords")), margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", ascii(t("program.exercise")), "e1RM (kg)", "Date"]],
      body: personalRecords.map((pr, i) => [
        (i + 1).toString(),
        ascii(pr.name),
        pr.e1rm.toFixed(1),
        format(new Date(pr.date), "dd/MM/yy"),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [...ARDOISE], textColor: 255, fontStyle: "bold", fontSize: 7 },
      alternateRowStyles: { fillColor: [248, 248, 252] },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // ── Program / Sessions ──
  if (sessions.length > 0) {
    if (y > 220) { doc.addPage(); y = 20; }
    doc.setTextColor(...TEXT_DARK);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(ascii(t("coach.sessionsTab")), margin, y);
    y += 4;

    sessions.forEach((session) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setTextColor(...MENTHE);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(ascii(session.name), margin, y + 4);
      y += 6;

      if (session.exercises.length > 0) {
        autoTable(doc, {
          startY: y,
          margin: { left: margin, right: margin },
          head: [[ascii(t("program.exercise")), ascii(t("program.sets")), ascii(t("program.reps")), ascii(t("program.rest")), ascii(t("program.workType")), ascii(t("program.note"))]],
          body: session.exercises.map((ex) => [
            ascii(ex.exercise_name),
            ex.sets.toString(),
            ex.reps,
            ex.rest,
            ex.work_type,
            ascii(ex.note ?? ""),
          ]),
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [...ARDOISE], textColor: 255, fontStyle: "bold", fontSize: 7 },
          alternateRowStyles: { fillColor: [248, 248, 252] },
        });
        y = (doc as any).lastAutoTable.finalY + 6;
      }
    });
  }

  // ── Footer on each page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...TEXT_MUTED);
    doc.text(
      ascii(`${t("pdf.bilanTitle")} -- ${athleteName} -- ${format(new Date(), "dd/MM/yyyy")} -- p.${i}/${pageCount}`),
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" }
    );
  }

  doc.save(`bilan-${athleteName.replace(/\s+/g, "_")}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}
