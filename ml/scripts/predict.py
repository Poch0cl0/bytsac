"""
Predice la probabilidad de renovación para una suscripción.

Uso:
    python ml/scripts/predict.py --from-csv ml/data/bytsac_renovacion_simulado.csv --limit 5
    python ml/scripts/predict.py --json '{"tenure_months":24,"contract":"anual",...}'
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import joblib
import pandas as pd

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import FEATURES_PATH, MODEL_PATH, OUTPUT_CSV  # noqa: E402


def _renewal_level(probability: float) -> str:
    if probability >= 0.70:
        return "alta"
    if probability >= 0.40:
        return "media"
    return "baja"


def predict_rows(rows: pd.DataFrame) -> list[dict]:
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No existe el modelo en {MODEL_PATH}. Ejecuta: python ml/scripts/train_model.py"
        )

    model = joblib.load(MODEL_PATH)
    feature_meta = json.loads(FEATURES_PATH.read_text(encoding="utf-8"))

    id_cols = set(feature_meta.get("id_columns", []))
    drop_cols = {feature_meta.get("target_column", "target_renovo")} | id_cols
    X = rows.drop(columns=[c for c in drop_cols if c in rows.columns], errors="ignore")

    probabilities = model.predict_proba(X)[:, 1]
    predictions = model.predict(X)

    results = []
    for idx, prob in enumerate(probabilities):
        prob_float = float(prob)
        row_result = {
            "probabilidad_renovacion": round(prob_float, 4),
            "probabilidad_no_renovacion": round(1.0 - prob_float, 4),
            "prediccion_renovara": int(predictions[idx]),
            "nivel_probabilidad_renovacion": _renewal_level(prob_float),
        }
        if "client_id" in rows.columns:
            row_result["client_id"] = rows.iloc[idx]["client_id"]
        results.append(row_result)

    return results


def main() -> None:
    parser = argparse.ArgumentParser(description="Predice renovación con el modelo BYTSAC")
    parser.add_argument("--from-csv", type=Path, help="CSV con filas a predecir")
    parser.add_argument("--limit", type=int, default=10, help="Máximo de filas si usa CSV")
    parser.add_argument("--json", type=str, help="Payload JSON de una sola fila")
    parser.add_argument("--input-file", type=Path, help="Archivo JSON con una fila de features")
    args = parser.parse_args()

    if args.input_file:
        payload = json.loads(args.input_file.read_text(encoding="utf-8"))

        if isinstance(payload, list):
            df = pd.DataFrame(payload)
            results = predict_rows(df)
            print(json.dumps(results, ensure_ascii=False))
            return

        df = pd.DataFrame([payload])
        results = predict_rows(df)
        print(json.dumps(results[0], ensure_ascii=False))
        return

    if args.json:
        payload = json.loads(args.json)
        df = pd.DataFrame([payload])
        results = predict_rows(df)
        print(json.dumps(results[0], indent=2, ensure_ascii=False))
        return

    csv_path = args.from_csv or OUTPUT_CSV
    if not csv_path.exists():
        raise FileNotFoundError(f"No se encontró CSV: {csv_path}")

    df = pd.read_csv(csv_path).head(args.limit)
    results = predict_rows(df)

    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
