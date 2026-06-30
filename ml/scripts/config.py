from pathlib import Path

ML_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ML_ROOT / "data"
MODELS_DIR = ML_ROOT / "models"

SOURCE_GLOB = ("*.xlsx", "*.xls", "*.csv")
OUTPUT_CSV = DATA_DIR / "bytsac_renovacion_simulado.csv"
MODEL_PATH = MODELS_DIR / "renovacion_model.pkl"
METRICS_PATH = MODELS_DIR / "training_metrics.json"
FEATURES_PATH = MODELS_DIR / "feature_columns.json"

DEFAULT_ROWS = 5000
RANDOM_SEED = 42

# Columnas del dataset Telco que se usan como referencia
TELCO_TENURE = ("Tenure Months", "tenure months", "tenure_months")
TELCO_MONTHLY = ("Monthly Charges", "monthly charges", "monthly_charges")
TELCO_TOTAL = ("Total Charges", "total charges", "total_charges")
TELCO_CONTRACT = ("Contract", "contract")
TELCO_CHURN = ("Churn Value", "churn value", "churn_value", "Churn Label", "churn label")
