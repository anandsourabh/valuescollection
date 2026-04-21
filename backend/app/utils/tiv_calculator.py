def calculate_total_tiv(data: dict) -> float:
    """Sum TIV across all buildings in a submission data payload."""
    buildings = data.get("buildings", [])
    if not buildings:
        # Flat submission (single building)
        building = float(data.get("building_tiv") or 0)
        contents = float(data.get("contents_tiv") or 0)
        bi = float(data.get("bi_12mo") or 0)
        return building + contents + bi

    total = 0.0
    for b in buildings:
        total += float(b.get("building_tiv") or 0)
        total += float(b.get("contents_tiv") or 0)
        total += float(b.get("bi_12mo") or 0)
    return total


def compute_change_flags(current_data: dict, prior_tiv: float | None, threshold_pct: float = 10.0) -> dict:
    """Return per-field change flags vs prior year."""
    current_total = calculate_total_tiv(current_data)
    if prior_tiv is None or prior_tiv == 0:
        return {"total_tiv_change_pct": None, "material_change": False}

    change_pct = ((current_total - prior_tiv) / prior_tiv) * 100
    return {
        "total_tiv_change_pct": round(change_pct, 2),
        "material_change": abs(change_pct) >= threshold_pct,
    }
