# Módulo de Machine Learning — BYTSAC

Predicción de probabilidad de **renovación de suscripciones**.

## Estructura

```
ml/
├── data/          ← Coloca aquí tu .xlsx o .csv Telco (dataset fuente)
├── scripts/       ← Scripts Python
├── models/        ← Modelo entrenado (.pkl) y métricas
└── requirements.txt
```

## Requisitos

```bash
pip install -r ml/requirements.txt
```

## Flujo

### 1. Coloca tu dataset fuente

Copia tu archivo Telco en `ml/data/` (por ejemplo `WA_Fn-UseC_-Telco-Customer-Churn.xlsx`).

### 2. Genera el CSV simulado BYTSAC

```bash
python ml/scripts/generate_simulated_dataset.py
python ml/scripts/generate_simulated_dataset.py --rows 8000
```

Salida: `ml/data/bytsac_renovacion_simulado.csv`

### 3. Entrena el modelo

```bash
python ml/scripts/train_model.py
```

Salida:
- `ml/models/renovacion_model.pkl`
- `ml/models/training_metrics.json`
- `ml/models/feature_columns.json`

### 4. Prueba predicciones

```bash
python ml/scripts/predict.py --from-csv ml/data/bytsac_renovacion_simulado.csv --limit 5
```

## Target

| Valor | Significado |
|-------|-------------|
| `target_renovo = 1` | El cliente **renovará** |
| `target_renovo = 0` | El cliente **no renovará** |

## Nota

Los datos simulados sirven para el **prototipo IA** del proyecto. Para producción, reentrena con historial real exportado desde la BD de BYTSAC.

## Integración con Laravel (backend)

Endpoint disponible (requiere token Sanctum y permiso `view subscriptions`):

```http
GET /api/subscriptions/{id}/renewal-prediction
Authorization: Bearer {token}
```

Respuesta de ejemplo:

```json
{
  "message": "Predicción generada correctamente.",
  "prediction": {
    "probabilidad_renovacion": 0.8142,
    "probabilidad_no_renovacion": 0.1858,
    "prediccion_renovara": true,
    "nivel_probabilidad_renovacion": "alta",
    "subscription_id": 1,
    "client_id": 1
  }
}
```

Variables de entorno en `.env`:

```env
ML_PREDICTION_ENABLED=true
ML_PYTHON_PATH=py
ML_PYTHON_ARGS=-3
```

**Windows:** usa `py -3` en lugar de `python`. Tras cambiar `.env` o el código, **reinicia** `php artisan serve`.

Si el endpoint devuelve 500, verifica:
1. `pip install -r ml/requirements.txt`
2. `python ml/scripts/train_model.py`
3. Reiniciar el servidor Laravel
