"""Pure-Python SVG chart generator for 4-candidate optimization sprawl & held-out Pareto plots."""

from __future__ import annotations

import html
from pathlib import Path
from typing import Any

_COLORS: dict[str, tuple[str, str]] = {
    "A_Baseline_v6_1": ("#f85149", "A: Baseline v6.1"),
    "B_Coupled_HMM": ("#58a6ff", "B: Coupled HMM"),
    "C_2D_Occupancy_Grid": ("#2dd4bf", "C: 2D Raycast Grid"),
    "D_RFS_PHD_HSMM": ("#f59e0b", "D: RFS-PHD + HSMM"),
}


def _esc(s: str) -> str:
    return html.escape(str(s), quote=True)


def _star_points(cx: float, cy: float, r_outer: float = 8.0, r_inner: float = 3.8) -> str:
    import math

    pts: list[str] = []
    for i in range(10):
        ang = -math.pi / 2.0 + i * math.pi / 5.0
        r = r_outer if i % 2 == 0 else r_inner
        pts.append(f"{cx + r * math.cos(ang):.1f},{cy + r * math.sin(ang):.1f}")
    return " ".join(pts)


def generate_pareto_frontier_svg(results: dict[str, Any], out_path: Path) -> Path:
    """Render 2-panel SVG: Train sprawl & Pareto frontier (left) + Held-Out Brier vs Latency (right)."""
    out_path.parent.mkdir(parents=True, exist_ok=True)

    w, h = 1220, 560
    lx0, ly0, lw, lh = 78, 86, 485, 370
    rx0, ry0, rw, rh = 665, 86, 485, 370

    # Collect sprawl points for B, C, D and baseline A
    train_sprawl: dict[str, list[dict[str, Any]]] = results.get("train_sprawl", {})
    train_pareto: dict[str, list[dict[str, Any]]] = results.get("train_pareto", {})
    heldout: dict[str, Any] = results.get("heldout_validation", {})

    # Determine zoomed axis bounds for B, C, D safe points so frontier isn't squashed by outlier A
    all_bcd_safe = [
        p
        for cname in ("B_Coupled_HMM", "C_2D_Occupancy_Grid", "D_RFS_PHD_HSMM")
        for p in train_sprawl.get(cname, [])
        if int(p.get("total_safety_violations", 0)) == 0
    ]
    if not all_bcd_safe:
        all_bcd_safe = [p for pts in train_sprawl.values() for p in pts]

    fp_vals = [float(p["total_fp_sec"]) for p in all_bcd_safe] or [100.0]
    fn_vals = [float(p["total_actionable_fn_sec"]) for p in all_bcd_safe] or [100.0]
    fp_vals_s = sorted(fp_vals)
    fn_vals_s = sorted(fn_vals)
    # Trim extreme worst 10% of random LHS outliers from axis max while showing note if clamped
    fp_max = max(200.0, fp_vals_s[min(len(fp_vals_s) - 1, int(0.88 * len(fp_vals_s)))] * 1.15)
    fn_max = max(200.0, fn_vals_s[min(len(fn_vals_s) - 1, int(0.88 * len(fn_vals_s)))] * 1.15)

    def map_l(fp: float, fn: float) -> tuple[float, float, bool]:
        clamped = fp > fp_max or fn > fn_max
        px = lx0 + min(1.0, max(0.0, fp / fp_max)) * lw
        py = ly0 + lh - min(1.0, max(0.0, fn / fn_max)) * lh
        return px, py, clamped

    lines: list[str] = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
        "<style>",
        "  text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; }",
        "  .title { font-size: 18px; font-weight: 700; fill: #f0f6fc; }",
        "  .sub { font-size: 12px; fill: #8b949e; }",
        "  .ptitle { font-size: 14px; font-weight: 600; fill: #e6edf3; }",
        "  .ax { font-size: 11px; fill: #8b949e; }",
        "  .ann { font-size: 10.5px; font-weight: 600; fill: #e6edf3; }",
        "  .leg { font-size: 12px; fill: #e6edf3; }",
        "</style>",
        f'<rect width="{w}" height="{h}" rx="12" fill="#0d1117" stroke="#30363d"/>',
        f'<text x="{w / 2:.0f}" y="30" text-anchor="middle" class="title">'
        "4-Candidate Signal-Processing Optimization Sprawl &amp; Held-Out Pareto Frontier</text>",
        f'<text x="{w / 2:.0f}" y="50" text-anchor="middle" class="sub">'
        "Train split (seeds 42, 101, 202 = 48 runs/config) vs. Unseen Held-Out Validation (seeds 303, 404, 505 = 48 runs)</text>",
        # Panel backgrounds
        f'<rect x="{lx0}" y="{ly0}" width="{lw}" height="{lh}" fill="#161b22" stroke="#30363d"/>',
        f'<rect x="{rx0}" y="{ry0}" width="{rw}" height="{rh}" fill="#161b22" stroke="#30363d"/>',
        f'<text x="{lx0 + lw / 2:.0f}" y="{ly0 - 10}" text-anchor="middle" class="ptitle">'
        "Train Pareto Search Space: False Positives vs. Actionable False Negatives (lower-left = better)</text>",
        f'<text x="{rx0 + rw / 2:.0f}" y="{ry0 - 10}" text-anchor="middle" class="ptitle">'
        "Held-Out Validation (Seeds 303, 404, 505): Brier Calibration vs. Entry Latency</text>",
    ]

    # Left panel gridlines & ticks
    for i in range(6):
        gx = lx0 + i * (lw / 5.0)
        gy = ly0 + i * (lh / 5.0)
        lines.append(
            f'<line x1="{gx:.1f}" y1="{ly0}" x2="{gx:.1f}" y2="{ly0 + lh}" stroke="#21262d"/>'
        )
        lines.append(
            f'<line x1="{lx0}" y1="{gy:.1f}" x2="{lx0 + lw}" y2="{gy:.1f}" stroke="#21262d"/>'
        )
        xval = i * (fp_max / 5.0)
        yval = (5 - i) * (fn_max / 5.0)
        lines.append(
            f'<text x="{gx:.1f}" y="{ly0 + lh + 16}" text-anchor="middle" class="ax">{xval:.0f}s</text>'
        )
        lines.append(
            f'<text x="{lx0 - 8}" y="{gy + 4:.1f}" text-anchor="end" class="ax">{yval:.0f}s</text>'
        )

    lines.append(
        f'<text x="{lx0 + lw / 2:.0f}" y="{ly0 + lh + 34}" text-anchor="middle" class="ax">'
        "Total False Positive Seconds (across 48 runs)</text>"
    )
    lines.append(
        f'<text x="22" y="{ly0 + lh / 2:.0f}" text-anchor="middle" transform="rotate(-90 22 {ly0 + lh / 2:.0f})" class="ax">'
        "Actionable False Negative Seconds (excl. unmonitored Front Entry)</text>"
    )

    # Scatter all LHS + refined train points + draw Pareto frontier polylines
    for cname in ("B_Coupled_HMM", "C_2D_Occupancy_Grid", "D_RFS_PHD_HSMM"):
        col, _ = _COLORS[cname]
        for pt in train_sprawl.get(cname, []):
            fp = float(pt["total_fp_sec"])
            fn = float(pt["total_actionable_fn_sec"])
            if fp > fp_max or fn > fn_max:
                continue
            px, py, _ = map_l(fp, fn)
            safe = int(pt.get("total_safety_violations", 0)) == 0
            if safe:
                lines.append(
                    f'<circle cx="{px:.1f}" cy="{py:.1f}" r="3.2" fill="{col}" fill-opacity="0.32"/>'
                )
            else:
                lines.append(
                    f'<text x="{px:.1f}" y="{py + 3:.1f}" text-anchor="middle" font-size="9" fill="{col}" fill-opacity="0.45">x</text>'
                )

        ppts = train_pareto.get(cname, [])
        if ppts:
            poly: list[str] = []
            for pp in ppts:
                px, py, _ = map_l(float(pp["total_fp_sec"]), float(pp["total_actionable_fn_sec"]))
                poly.append(f"{px:.1f},{py:.1f}")
            if len(poly) >= 2:
                lines.append(
                    f'<polyline points="{" ".join(poly)}" fill="none" stroke="{col}" stroke-width="2.2" stroke-opacity="0.9"/>'
                )
            for pp in ppts:
                px, py, _ = map_l(float(pp["total_fp_sec"]), float(pp["total_actionable_fn_sec"]))
                lines.append(
                    f'<circle cx="{px:.1f}" cy="{py:.1f}" r="4.8" fill="{col}" stroke="#0d1117" stroke-width="1.2"/>'
                )

        # Highlight Train Balanced Winner with a Star
        win = (results.get("train_winners", {}).get(cname) or {}).get("balanced")
        if win:
            px, py, _ = map_l(float(win["total_fp_sec"]), float(win["total_actionable_fn_sec"]))
            lines.append(
                f'<polygon points="{_star_points(px, py, 9.0, 4.2)}" fill="{col}" stroke="#ffffff" stroke-width="1.2"/>'
            )

    # Candidate A Baseline on train panel
    a_train = results.get("train_baseline_a")
    if a_train:
        afp = float(a_train["total_fp_sec"])
        afn = float(a_train["total_actionable_fn_sec"])
        px, py, clamped = map_l(afp, afn)
        acol = _COLORS["A_Baseline_v6_1"][0]
        if clamped:
            bx = lx0 + lw - 14
            by = max(ly0 + 18, min(ly0 + lh - 18, py))
            lines.append(
                f'<polygon points="{bx},{by - 7} {bx + 7},{by} {bx},{by + 7} {bx - 7},{by}" fill="{acol}" stroke="#ffffff" stroke-width="1.1"/>'
            )
            lines.append(
                f'<text x="{bx - 12}" y="{by + 4}" text-anchor="end" class="ann" fill="{acol}">'
                f"A Baseline: FP={afp:.0f}s, FN={afn:.0f}s &gt;</text>"
            )
        else:
            lines.append(
                f'<polygon points="{px:.1f},{py - 7:.1f} {px + 7:.1f},{py:.1f} {px:.1f},{py + 7:.1f} {px - 7:.1f},{py:.1f}" fill="{acol}" stroke="#ffffff" stroke-width="1.1"/>'
            )
            lines.append(
                f'<text x="{px - 10:.1f}" y="{py - 10:.1f}" text-anchor="end" class="ann" fill="{acol}">A ({afp:.0f}s, {afn:.0f}s)</text>'
            )

    # Right panel: Held-out Brier Score (y) vs Mean Entry Latency (x)
    ho_items: list[tuple[str, str, dict[str, Any]]] = []
    if "A_Baseline_v6_1" in heldout:
        ho_items.append(("A_Baseline_v6_1", "A v6.1", heldout["A_Baseline_v6_1"]))
    for cname, short in (
        ("B_Coupled_HMM", "B (HMM)"),
        ("C_2D_Occupancy_Grid", "C (Grid)"),
        ("D_RFS_PHD_HSMM", "D (RFS-PHD)"),
    ):
        bal = (heldout.get(cname) or {}).get("balanced")
        if bal:
            ho_items.append((cname, short, bal))

    lats = [float(it[2]["mean_entry_latency_sec"]) for it in ho_items] or [3.0]
    briers = [float(it[2]["mean_brier"]) for it in ho_items] or [0.02]
    lat_min = 0.0
    lat_max = max(5.0, max(lats) * 1.2)
    br_max = max(0.02, max(briers) * 1.25)

    for i in range(6):
        gx = rx0 + i * (rw / 5.0)
        gy = ry0 + i * (rh / 5.0)
        lines.append(
            f'<line x1="{gx:.1f}" y1="{ry0}" x2="{gx:.1f}" y2="{ry0 + rh}" stroke="#21262d"/>'
        )
        lines.append(
            f'<line x1="{rx0}" y1="{gy:.1f}" x2="{rx0 + rw}" y2="{gy:.1f}" stroke="#21262d"/>'
        )
        lval = lat_min + i * ((lat_max - lat_min) / 5.0)
        bval = (5 - i) * (br_max / 5.0)
        lines.append(
            f'<text x="{gx:.1f}" y="{ry0 + rh + 16}" text-anchor="middle" class="ax">{lval:.1f}s</text>'
        )
        lines.append(
            f'<text x="{rx0 - 8}" y="{gy + 4:.1f}" text-anchor="end" class="ax">{bval:.4f}</text>'
        )

    lines.append(
        f'<text x="{rx0 + rw / 2:.0f}" y="{ry0 + rh + 34}" text-anchor="middle" class="ax">'
        "Mean Entry Latency (seconds — lower = faster lights-on)</text>"
    )
    lines.append(
        f'<text x="608" y="{ry0 + rh / 2:.0f}" text-anchor="middle" transform="rotate(-90 608 {ry0 + rh / 2:.0f})" class="ax">'
        "Mean Brier Score (probability error^2 — lower = better calibrated)</text>"
    )

    # Non-overlapping callout placement inside right panel [rx0..rx0+rw]
    callout_cfg: dict[str, tuple[float, float, str]] = {
        "A_Baseline_v6_1": (0.0, -16.0, "middle"),
        "B_Coupled_HMM": (-14.0, -48.0, "end"),
        "C_2D_Occupancy_Grid": (-14.0, -82.0, "end"),
        "D_RFS_PHD_HSMM": (-14.0, 26.0, "end"),
    }
    for _idx, (cname, short, data) in enumerate(ho_items):
        col = _COLORS[cname][0]
        lat_v = float(data["mean_entry_latency_sec"])
        br_v = float(data["mean_brier"])
        px = rx0 + ((lat_v - lat_min) / max(1e-6, lat_max - lat_min)) * rw
        py = ry0 + rh - (br_v / br_max) * rh
        ox, oy, anchor = callout_cfg.get(cname, (0.0, -14.0, "middle"))
        if cname == "A_Baseline_v6_1":
            lines.append(
                f'<polygon points="{px:.1f},{py - 8:.1f} {px + 8:.1f},{py:.1f} {px:.1f},{py + 8:.1f} {px - 8:.1f},{py:.1f}" fill="{col}" stroke="#ffffff" stroke-width="1.2"/>'
            )
        else:
            lines.append(
                f'<polygon points="{_star_points(px, py, 9.5, 4.4)}" fill="{col}" stroke="#ffffff" stroke-width="1.2"/>'
            )
        tx = (
            max(rx0 + 110, min(rx0 + rw - 110, px + ox))
            if anchor == "middle"
            else max(rx0 + 215, min(rx0 + rw - 10, px + ox))
        )
        ty = max(ry0 + 20, min(ry0 + rh - 10, py + oy))
        if abs(ox) > 5 or abs(oy) > 20:
            lines.append(
                f'<line x1="{px:.1f}" y1="{py:.1f}" x2="{tx:.1f}" y2="{ty - 4:.1f}" stroke="{col}" stroke-width="1.0" stroke-dasharray="3,2" stroke-opacity="0.7"/>'
            )
        tag = f"{short}: {data['scenarios_passed']}/{data['scenarios_total']} | FP={data['total_fp_sec']}s | Flaps={data['total_flaps']}"
        lines.append(
            f'<text x="{tx:.1f}" y="{ty:.1f}" text-anchor="{anchor}" class="ann" fill="{col}">{_esc(tag)}</text>'
        )

    # Bottom Legend
    leg_y = h - 22
    leg_x = 45.0
    for cname in ("A_Baseline_v6_1", "B_Coupled_HMM", "C_2D_Occupancy_Grid", "D_RFS_PHD_HSMM"):
        col, label = _COLORS[cname]
        lines.append(f'<circle cx="{leg_x:.1f}" cy="{leg_y - 4}" r="5.5" fill="{col}"/>')
        lines.append(f'<text x="{leg_x + 11:.1f}" y="{leg_y}" class="leg">{_esc(label)}</text>')
        leg_x += 172.0
    lines.append(
        f'<text x="{w - 28}" y="{leg_y}" text-anchor="end" class="ax">'
        "Stars = Balanced Winner | Polyline = Safe Pareto Frontier | x = Safety Violation</text>"
    )
    lines.append("</svg>")

    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path


def generate_comparison_bars_svg(results: dict[str, Any], out_path: Path) -> Path:
    """Render 6-panel held-out comparison bar chart across Candidates A, B, C, D."""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    heldout: dict[str, Any] = results.get("heldout_validation", {})

    cands: list[tuple[str, str, dict[str, Any]]] = []
    if "A_Baseline_v6_1" in heldout:
        cands.append(("A_Baseline_v6_1", "A Base", heldout["A_Baseline_v6_1"]))
    for cname, short in (
        ("B_Coupled_HMM", "B HMM"),
        ("C_2D_Occupancy_Grid", "C Grid"),
        ("D_RFS_PHD_HSMM", "D PHD"),
    ):
        bal = (heldout.get(cname) or {}).get("balanced")
        if bal:
            cands.append((cname, short, bal))

    panels = [
        ("Pass Rate (%) [higher = better]", "pass_rate_pct", "{:.1f}%"),
        ("False Positive Seconds [lower = better]", "total_fp_sec", "{:.0f}s"),
        ("Actionable FN Seconds [lower = better]", "total_actionable_fn_sec", "{:.0f}s"),
        ("Total Room Flaps [lower = better]", "total_flaps", "{:.0f}"),
        ("Mean Brier Score [lower = better]", "mean_brier", "{:.4f}"),
        ("Vision-LLM Ambiguity Band [0.35, 0.70] (%)", "ambig_pct", "{:.2f}%"),
    ]

    w, h = 1180, 540
    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">',
        "<style>",
        "  text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace; }",
        "  .title { font-size: 18px; font-weight: 700; fill: #f0f6fc; }",
        "  .sub { font-size: 12px; fill: #8b949e; }",
        "  .ptitle { font-size: 13px; font-weight: 600; fill: #e6edf3; }",
        "  .val { font-size: 11px; font-weight: 700; fill: #f0f6fc; }",
        "  .ax { font-size: 11px; fill: #8b949e; }",
        "</style>",
        f'<rect width="{w}" height="{h}" rx="12" fill="#0d1117" stroke="#30363d"/>',
        f'<text x="{w / 2:.0f}" y="28" text-anchor="middle" class="title">'
        "Held-Out Validation Scorecard &amp; Calibration Comparison (Seeds 303, 404, 505)</text>",
        f'<text x="{w / 2:.0f}" y="48" text-anchor="middle" class="sub">'
        "48 Unseen Stress-Fuzzed Timelines per Candidate | Balanced Pareto Winners vs. v6.1 Production Baseline</text>",
    ]

    pw, ph = 350, 182
    col_xs = [45, 418, 791]
    row_ys = [84, 315]

    for pidx, (ptitle, key, fmt) in enumerate(panels):
        px0 = col_xs[pidx % 3]
        py0 = row_ys[pidx // 3]
        lines.append(
            f'<rect x="{px0}" y="{py0}" width="{pw}" height="{ph}" rx="6" fill="#161b22" stroke="#30363d"/>'
        )
        lines.append(
            f'<text x="{px0 + pw / 2:.0f}" y="{py0 - 8}" text-anchor="middle" class="ptitle">{_esc(ptitle)}</text>'
        )

        vals: list[float] = []
        for _cn, _sh, d in cands:
            if key == "pass_rate_pct":
                vals.append(float(d["pass_rate"]) * 100.0)
            elif key == "ambig_pct":
                vals.append(float(d["mean_ambiguity_rate"]) * 100.0)
            else:
                vals.append(float(d[key]))

        vmax = max(vals) if vals and max(vals) > 0 else 1.0
        if key == "pass_rate_pct":
            vmax = 105.0
        else:
            vmax *= 1.22

        bar_area_top = py0 + 22
        bar_area_h = ph - 48
        base_y = bar_area_top + bar_area_h
        lines.append(
            f'<line x1="{px0 + 14}" y1="{base_y}" x2="{px0 + pw - 14}" y2="{base_y}" stroke="#30363d"/>'
        )

        n_c = max(1, len(cands))
        slot = (pw - 36) / n_c
        bar_w = min(54.0, slot * 0.65)
        for i, (cname, short, _d) in enumerate(cands):
            col = _COLORS[cname][0]
            v = vals[i]
            bh = (v / vmax) * bar_area_h if vmax > 0 else 0.0
            bx = px0 + 18 + i * slot + (slot - bar_w) / 2.0
            by = base_y - bh
            lines.append(
                f'<rect x="{bx:.1f}" y="{by:.1f}" width="{bar_w:.1f}" height="{max(1.5, bh):.1f}" rx="3" fill="{col}"/>'
            )
            vtxt = fmt.format(v)
            lines.append(
                f'<text x="{bx + bar_w / 2:.1f}" y="{by - 6:.1f}" text-anchor="middle" class="val">{_esc(vtxt)}</text>'
            )
            lines.append(
                f'<text x="{bx + bar_w / 2:.1f}" y="{base_y + 15:.1f}" text-anchor="middle" class="ax">{_esc(short)}</text>'
            )

    lines.append("</svg>")
    out_path.write_text("\n".join(lines), encoding="utf-8")
    return out_path
