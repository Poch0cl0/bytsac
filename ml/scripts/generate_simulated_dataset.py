"""
Genera un CSV simulado alineado a BYTSAC para entrenar el modelo de renovación.

Uso:
    python ml/scripts/generate_simulated_dataset.py
    python ml/scripts/generate_simulated_dataset.py --rows 8000

Coloca tu dataset Telco (.xlsx o .csv) en ml/data/ antes de ejecutar.
Si no hay archivo fuente, se usan distribuciones por defecto del dominio telecom.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import (  # noqa: E402
    DATA_DIR,
    DEFAULT_ROWS,
    OUTPUT_CSV,
    RANDOM_SEED,
    SOURCE_GLOB,
    TELCO_CHURN,
    TELCO_CONTRACT,
    TELCO_MONTHLY,
    TELCO_TENURE,
    TELCO_TOTAL,
)


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def _find_column(df: pd.DataFrame, candidates: tuple[str, ...]) -> str | None:
    for name in candidates:
        key = name.lower()
        if key in df.columns:
            return key
    return None


def _find_source_file() -> Path | None:
    files: list[Path] = []
    for pattern in SOURCE_GLOB:
        files.extend(DATA_DIR.glob(pattern))

    # Excluir el CSV de salida simulado
    files = [f for f in files if f.name != OUTPUT_CSV.name]

    if not files:
        return None

    return sorted(files, key=lambda p: p.stat().st_mtime, reverse=True)[0]


def _load_source(path: Path) -> pd.DataFrame:
    if path.suffix.lower() in {".xlsx", ".xls"}:
        return pd.read_excel(path)
    return pd.read_csv(path)


def _contract_map(raw: str) -> str:
    value = str(raw).strip().lower()
    if "two year" in value or "2 year" in value or "enterprise" in value:
        return "enterprise"
    if "one year" in value or "1 year" in value or "anual" in value:
        return "anual"
    return "mensual"


def _extract_profile(source: pd.DataFrame) -> dict:
    source = _normalize_columns(source)
    profile: dict = {
        "source_file": None,
        "tenure_mean": 32.0,
        "tenure_std": 24.0,
        "tenure_min": 1,
        "tenure_max": 72,
        "monthly_mean": 65.0,
        "monthly_std": 30.0,
        "monthly_min": 18.0,
        "monthly_max": 120.0,
        "total_mean": 2283.0,
        "contract_probs": {"mensual": 0.55, "anual": 0.30, "enterprise": 0.15},
        "churn_rate": 0.27,
        "n_rows_source": len(source),
    }

    tenure_col = _find_column(source, TELCO_TENURE)
    monthly_col = _find_column(source, TELCO_MONTHLY)
    total_col = _find_column(source, TELCO_TOTAL)
    contract_col = _find_column(source, TELCO_CONTRACT)
    churn_col = _find_column(source, TELCO_CHURN)

    if tenure_col:
        tenure = pd.to_numeric(source[tenure_col], errors="coerce").dropna()
        if not tenure.empty:
            profile["tenure_mean"] = float(tenure.mean())
            profile["tenure_std"] = float(tenure.std() or 12.0)
            profile["tenure_min"] = int(max(1, tenure.min()))
            profile["tenure_max"] = int(min(120, max(tenure.max(), 12)))

    if monthly_col:
        monthly = pd.to_numeric(source[monthly_col], errors="coerce").dropna()
        if not monthly.empty:
            profile["monthly_mean"] = float(monthly.mean())
            profile["monthly_std"] = float(monthly.std() or 15.0)
            profile["monthly_min"] = float(max(10.0, monthly.min()))
            profile["monthly_max"] = float(monthly.max() * 1.2)

    if total_col:
        total = pd.to_numeric(source[total_col], errors="coerce").dropna()
        if not total.empty:
            profile["total_mean"] = float(total.mean())

    if contract_col:
        mapped = source[contract_col].astype(str).map(_contract_map)
        counts = mapped.value_counts(normalize=True)
        profile["contract_probs"] = {
            "mensual": float(counts.get("mensual", 0.55)),
            "anual": float(counts.get("anual", 0.30)),
            "enterprise": float(counts.get("enterprise", 0.15)),
        }

    if churn_col:
        churn_series = source[churn_col]
        if churn_series.dtype == object:
            churn_rate = (churn_series.astype(str).str.lower().isin(["yes", "1", "true"])).mean()
        else:
            churn_rate = pd.to_numeric(churn_series, errors="coerce").fillna(0).mean()
        profile["churn_rate"] = float(churn_rate)

    return profile


def _sample_tenure(n: int, rng: np.random.Generator, profile: dict) -> np.ndarray:
    samples = rng.normal(profile["tenure_mean"], profile["tenure_std"], n)
    samples = np.clip(samples, profile["tenure_min"], profile["tenure_max"])
    return samples.astype(int)


def _sample_monthly(n: int, rng: np.random.Generator, profile: dict, contract: np.ndarray) -> np.ndarray:
    base = rng.normal(profile["monthly_mean"], profile["monthly_std"], n)
    base = np.clip(base, profile["monthly_min"], profile["monthly_max"])

    # Escalar a precios BYTSAC (S/.) según tipo de contrato
    multiplier = np.where(
        contract == "mensual",
        rng.uniform(1.4, 2.2, n),
        np.where(contract == "anual", rng.uniform(2.2, 3.5, n), rng.uniform(3.5, 5.5, n)),
    )
    return np.round(base * multiplier, 2)


def generate_dataset(rows: int, profile: dict, seed: int = RANDOM_SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    probs = profile["contract_probs"]
    contract_labels = list(probs.keys())
    contract_p = np.array([probs[k] for k in contract_labels])
    contract_p = contract_p / contract_p.sum()

    contract = rng.choice(contract_labels, size=rows, p=contract_p)
    tenure_months = _sample_tenure(rows, rng, profile)
    monthly_charges = _sample_monthly(rows, rng, profile, contract)

    total_factor = rng.uniform(0.75, 1.05, rows)
    total_charges = np.round(monthly_charges * tenure_months * total_factor, 2)

    duracion_ciclo = np.where(
        contract == "mensual",
        30,
        365,
    ).astype(int)

    cycle_number = np.maximum(1, (tenure_months / np.maximum(duracion_ciclo / 30, 1)).astype(int))
    renovaciones_previas = np.maximum(0, cycle_number - 1)

    renovacion_automatica = (
        (contract != "mensual") & (rng.random(rows) > 0.28)
    ).astype(int)

    dias_restantes = rng.integers(1, 46, rows)
    alertas_enviadas = ((dias_restantes <= 14) & (rng.random(rows) > 0.25)).astype(int)

    nivel_reportes = rng.choice(
        ["basico", "avanzado", "premium"],
        size=rows,
        p=[0.38, 0.42, 0.20],
    )
    control_stock = rng.choice([0, 1], size=rows, p=[0.48, 0.52])
    payment_method = rng.choice(
        ["tarjeta", "transferencia", "yape", "factura"],
        size=rows,
        p=[0.35, 0.30, 0.20, 0.15],
    )
    paperless_billing = rng.choice([0, 1], size=rows, p=[0.55, 0.45])
    region = rng.choice(
        ["Lima", "Arequipa", "Trujillo", "Cusco", "Piura", "Chiclayo"],
        size=rows,
        p=[0.45, 0.15, 0.12, 0.10, 0.10, 0.08],
    )
    client_estado = rng.choice(
        ["activo", "activo", "activo", "inactivo", "suspendido"],
        size=rows,
        p=[0.70, 0.15, 0.05, 0.08, 0.02],
    )
    partner = rng.choice(["si", "no"], size=rows, p=[0.45, 0.55])
    dependents = rng.choice(["si", "no"], size=rows, p=[0.35, 0.65])

    # Target con lógica BYTSAC (renovación = 1 - churn)
    logit = (
        -0.8
        + 0.035 * tenure_months
        + 0.85 * renovacion_automatica
        + 0.55 * (contract == "anual").astype(float)
        + 0.75 * (contract == "enterprise").astype(float)
        - 0.55 * (contract == "mensual").astype(float)
        + 0.18 * renovaciones_previas
        + 0.25 * alertas_enviadas
        - 0.004 * monthly_charges
        - 0.45 * (client_estado != "activo").astype(float)
        + 0.15 * (nivel_reportes == "premium").astype(float)
        + rng.normal(0, 0.85, rows)
    )

    prob_renovar = 1.0 / (1.0 + np.exp(-logit))

    # Calibrar: churn_rate = proporción que NO renueva (target=0)
    churn_rate = profile["churn_rate"]
    threshold = float(np.quantile(prob_renovar, churn_rate))
    target_renovo = (prob_renovar >= threshold).astype(int)

    df = pd.DataFrame(
        {
            "client_id": [f"CL-{i:05d}" for i in range(1, rows + 1)],
            "subscription_id": rng.integers(1, max(rows // 2, 2), rows),
            "cycle_number": cycle_number,
            "tenure_months": tenure_months,
            "contract": contract,
            "monthly_charges": monthly_charges,
            "total_charges": total_charges,
            "payment_method": payment_method,
            "paperless_billing": paperless_billing,
            "nivel_reportes": nivel_reportes,
            "control_stock": control_stock,
            "duracion_ciclo_dias": duracion_ciclo,
            "dias_restantes_al_corte": dias_restantes,
            "renovacion_automatica": renovacion_automatica,
            "alertas_enviadas": alertas_enviadas,
            "renovaciones_previas": renovaciones_previas,
            "region": region,
            "client_estado": client_estado,
            "partner": partner,
            "dependents": dependents,
            "target_renovo": target_renovo,
        }
    )

    return df


def main() -> None:
    parser = argparse.ArgumentParser(description="Genera dataset simulado BYTSAC para ML")
    parser.add_argument("--rows", type=int, default=DEFAULT_ROWS, help="Cantidad de filas")
    parser.add_argument("--seed", type=int, default=RANDOM_SEED, help="Semilla aleatoria")
    args = parser.parse_args()

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    source_path = _find_source_file()
    if source_path:
        print(f"Dataset fuente detectado: {source_path.name}")
        source_df = _load_source(source_path)
        profile = _extract_profile(source_df)
        profile["source_file"] = source_path.name
        print(f"  Filas fuente: {profile['n_rows_source']}")
        print(f"  Tasa churn/no-renovación referencia: {profile['churn_rate']:.2%}")
    else:
        print("No se encontró .xlsx/.csv en ml/data/. Usando distribuciones por defecto.")
        profile = _extract_profile(pd.DataFrame())

    df = generate_dataset(args.rows, profile, seed=args.seed)
    df.to_csv(OUTPUT_CSV, index=False)

    renovacion_rate = df["target_renovo"].mean()
    print(f"\nDataset generado: {OUTPUT_CSV}")
    print(f"  Filas: {len(df)}")
    print(f"  Tasa renovación (target=1): {renovacion_rate:.2%}")
    print(f"  Tasa no renovación (target=0): {1 - renovacion_rate:.2%}")
    print("\nSiguiente paso: python ml/scripts/train_model.py")


if __name__ == "__main__":
    main()
