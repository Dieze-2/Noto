import { useEffect, useMemo, useRef } from "react";
import uPlot, { Options } from "uplot";

type SeriesSpec = {
  label: string;
  stroke: string;
  width?: number;
  valueFormatter?: (v: number) => string;
};

type Datum = {
  x: number; // timestamp ms
  y: number;
};

function ddmm(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}`;
}

export default function UPlotLineChart(props: {
  data: Datum[];
  height: number;
  width: number;
  series: SeriesSpec;
  yLabel?: string; // "KG"
  tooltipLabel?: string; // "kg"
  debug?: boolean;
  debugWindow?: number; // ex 2 => 2 before / 2 after
}) {
  const {
    data,
    height,
    width,
    series,
    yLabel = "",
    tooltipLabel = "kg",
    debug = false,
    debugWindow = 2,
  } = props;

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const plotRef = useRef<uPlot | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const debugRef = useRef<HTMLDivElement | null>(null);

  const aligned = useMemo(() => {
    const xs: number[] = [];
    const ys: number[] = [];
    for (const p of data) {
      xs.push(p.x);
      ys.push(p.y);
    }
    return [xs, ys] as [number[], number[]];
  }, [data]);

  const opts: Options = useMemo(() => {
    const valFmt = series.valueFormatter ?? ((v) => v.toFixed(1));

    return {
      width,
      height,
      tzDate: (ts) => new Date(ts),
      padding: [10, 10, 10, 10],
      scales: {
        x: { time: true },
        y: { auto: true },
      },
      axes: [
        {
          stroke: "rgba(255,255,255,0.25)",
          grid: { stroke: "rgba(255,255,255,0.06)" },
          ticks: { stroke: "rgba(255,255,255,0.12)" },
          font: "800 10px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          values: (u, ticks) => ticks.map((t) => ddmm(t as number)),
        },
        {
          stroke: "rgba(255,255,255,0.25)",
          grid: { stroke: "rgba(255,255,255,0.06)" },
          ticks: { stroke: "rgba(255,255,255,0.12)" },
          font: "800 10px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          label: yLabel || undefined,
          labelSize: yLabel ? 34 : 0,
          labelFont:
            "900 10px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          values: (u, ticks) =>
            ticks.map((t) => (typeof t === "number" ? String(t) : `${t}`)),
        },
      ],
      series: [
        {},
        {
          label: series.label,
          stroke: series.stroke,
          width: series.width ?? 3,
          points: {
            show: true,
            size: 6,
            stroke: series.stroke,
            fill: series.stroke,
          },
          value: (u, v) => (v == null ? "" : `${valFmt(v as number)}`),
        },
      ],
      legend: { show: false },
      cursor: {
        focus: { prox: 24 },
        drag: { x: false, y: false },
        points: {
          size: 10,
          width: 3,
          stroke: series.stroke,
          fill: "#ffffff",
        },
      },
    };
  }, [width, height, series, yLabel]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    // destroy previous
    if (plotRef.current) {
      plotRef.current.destroy();
      plotRef.current = null;
    }

    const u = new uPlot(opts, aligned, el);
    plotRef.current = u;

    // tooltip
    let tip = tooltipRef.current;
    if (!tip) {
      tip = document.createElement("div");
      tip.style.position = "absolute";
      tip.style.pointerEvents = "none";
      tip.style.zIndex = "5";
      tip.style.background = "rgba(0,0,0,0.9)";
      tip.style.border = "1px solid rgba(255,255,255,0.10)";
      tip.style.borderRadius = "16px";
      tip.style.padding = "10px 12px";
      tip.style.backdropFilter = "blur(8px)";
      tip.style.webkitBackdropFilter = "blur(8px)";
      tip.style.display = "none";
      el.style.position = "relative";
      el.appendChild(tip);
      tooltipRef.current = tip;
    }

    // debug panel
    let dbg = debugRef.current;
    if (!dbg) {
      dbg = document.createElement("div");
      dbg.style.position = "absolute";
      dbg.style.pointerEvents = "none";
      dbg.style.zIndex = "6";
      dbg.style.left = "12px";
      dbg.style.bottom = "12px";
      dbg.style.maxWidth = "min(520px, calc(100% - 24px))";
      dbg.style.background = "rgba(0,0,0,0.75)";
      dbg.style.border = "1px solid rgba(255,255,255,0.10)";
      dbg.style.borderRadius = "16px";
      dbg.style.padding = "10px 12px";
      dbg.style.backdropFilter = "blur(8px)";
      dbg.style.webkitBackdropFilter = "blur(8px)";
      dbg.style.display = "none";
      el.appendChild(dbg);
      debugRef.current = dbg;
    }

    const valFmt = series.valueFormatter ?? ((v: number) => v.toFixed(1));

    const render = () => {
      const idx = u.cursor.idx;

      if (idx == null || idx < 0) {
        tip!.style.display = "none";
        if (dbg) dbg.style.display = "none";
        return;
      }

      const xVal = aligned[0][idx];
      const yVal = aligned[1][idx];

      if (xVal == null || yVal == null) {
        tip!.style.display = "none";
        if (dbg) dbg.style.display = "none";
        return;
      }

      // tooltip content
      tip!.innerHTML = `
        <div style="font-weight:900;font-size:18px;color:white;line-height:1">${ddmm(xVal)}</div>
        <div style="margin-top:6px;font-weight:900;font-size:16px;color:${series.stroke}">${tooltipLabel}: ${valFmt(yVal)}</div>
      `;

      // tooltip position near cursor
      const left = Math.min(u.cursor.left + 16, width - 180);
      const top = Math.max(u.cursor.top - 20, 8);
      tip!.style.transform = `translate(${left}px, ${top}px)`;
      tip!.style.display = "block";

      if (dbg) {
        if (!debug) {
          dbg.style.display = "none";
          return;
        }

        const w = Math.max(0, debugWindow);
        const start = Math.max(0, idx - w);
        const end = Math.min(aligned[0].length - 1, idx + w);

        const rows: string[] = [];
        for (let i = start; i <= end; i++) {
          const xx = aligned[0][i];
          const yy = aligned[1][i];
          const mark = i === idx ? "▶" : " ";
          rows.push(`${mark} ${ddmm(xx)}  ${valFmt(yy)}`);
        }

        dbg.innerHTML = `
          <div style="font-weight:900;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.55)">DEBUG</div>
          <div style="margin-top:6px;font-weight:900;font-size:12px;color:white">idx=${idx}/${aligned[0].length - 1}</div>
          <pre style="margin:6px 0 0 0;font-size:12px;font-weight:900;color:rgba(255,255,255,.8);white-space:pre-wrap">${rows.join("\n")}</pre>
        `;
        dbg.style.display = "block";
      }
    };

    u.root.addEventListener("mousemove", render);
    u.root.addEventListener("mouseleave", () => {
      if (tip) tip.style.display = "none";
      if (dbg) dbg.style.display = "none";
    });

    return () => {
      u.root.removeEventListener("mousemove", render);
      u.destroy();
      plotRef.current = null;
    };
  }, [opts, aligned, width, series, tooltipLabel, debug, debugWindow]);

  useEffect(() => {
    const u = plotRef.current;
    if (!u) return;
    u.setSize({ width, height });
  }, [width, height]);

  return <div ref={wrapRef} />;
}
