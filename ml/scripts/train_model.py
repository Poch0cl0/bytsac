"""
Entrena el modelo de predicción de renovación de suscripciones BYTSAC.

Uso:
    python ml/scripts/train_model.py
    python ml/scripts/train_model.py --input ml/data/bytsac_renovacion_simulado.csv
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import FEATURES_PATH, METRICS_PATH, MODEL_PATH, MODELS_DIR, OUTPUT_CSV  # noqa: E402

TARGET_COLUMN = "target_renovo"
ID_COLUMNS = {"client_id", "subscription_id"}


def _build_feature_lists(df: pd.DataFrame) -> tuple[list[str], list[str]]:
    feature_df = df.drop(columns=[TARGET_COLUMN], errors="ignore")
    feature_df = feature_df.drop(columns=[c for c in ID_COLUMNS if c in feature_df.columns])

    categorical = feature_df.select_dtypes(include=["object", "bool"]).columns.tolist()
    numeric = feature_df.select_dtypes(include=["number"]).columns.tolist()

    return categorical, numeric


def train(input_csv: Path, test_size: float = 0.2, random_state: int = 42) -> dict:
    if not input_csv.exists():
        raise FileNotFoundError(
            f"No existe {input_csv}. Ejecuta primero: python ml/scripts/generate_simulated_dataset.py"
        )

    df = pd.read_csv(input_csv)

    if TARGET_COLUMN not in df.columns:
        raise ValueError(f"El CSV debe incluir la columna '{TARGET_COLUMN}'")

    y = df[TARGET_COLUMN].astype(int)
    X = df.drop(columns=[TARGET_COLUMN])

    cat_cols, num_cols = _build_feature_lists(df)

    preprocess = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                cat_cols,
            ),
            ("num", "passthrough", num_cols),
        ]
    )

    model = Pipeline(
        steps=[
            ("preprocess", preprocess),
            (
                "classifier",
                GradientBoostingClassifier(
                    n_estimators=200,
                    learning_rate=0.08,
                    max_depth=4,
                    min_samples_leaf=20,
                    random_state=random_state,
                ),
            ),
        ]
    )

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=random_state,
        stratify=y,
    )

    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        "trained_at": datetime.now(UTC).isoformat(),
        "input_file": str(input_csv),
        "rows_total": int(len(df)),
        "rows_train": int(len(X_train)),
        "rows_test": int(len(X_test)),
        "target_renovo_rate": float(y.mean()),
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(
            y_test, y_pred, target_names=["no_renova", "renova"], output_dict=True
        ),
        "categorical_features": cat_cols,
        "numeric_features": num_cols,
        "algorithm": "GradientBoostingClassifier",
    }

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    feature_payload = {
        "categorical_features": cat_cols,
        "numeric_features": num_cols,
        "target_column": TARGET_COLUMN,
        "id_columns": sorted(ID_COLUMNS),
    }
    FEATURES_PATH.write_text(json.dumps(feature_payload, indent=2, ensure_ascii=False), encoding="utf-8")
    METRICS_PATH.write_text(json.dumps(metrics, indent=2, ensure_ascii=False), encoding="utf-8")

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Entrena modelo de renovación BYTSAC")
    parser.add_argument("--input", type=Path, default=OUTPUT_CSV, help="CSV de entrenamiento")
    parser.add_argument("--test-size", type=float, default=0.2, help="Proporción de test")
    args = parser.parse_args()

    metrics = train(args.input, test_size=args.test_size)

    print("Modelo entrenado y guardado:")
    print(f"  {MODEL_PATH}")
    print(f"  {METRICS_PATH}")
    print(f"  {FEATURES_PATH}")
    print("\nMétricas:")
    print(f"  Accuracy : {metrics['accuracy']:.4f}")
    print(f"  F1 Score : {metrics['f1_score']:.4f}")
    print(f"  ROC-AUC  : {metrics['roc_auc']:.4f}")
    print(f"  Matriz de confusión: {metrics['confusion_matrix']}")
    print("\nPredicción de ejemplo:")
    print("  python ml/scripts/predict.py --help")


if __name__ == "__main__":
    main()
