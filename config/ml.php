<?php

return [

    'enabled' => env('ML_PREDICTION_ENABLED', true),

    'python_binary' => env('ML_PYTHON_PATH', PHP_OS_FAMILY === 'Windows' ? 'py' : 'python'),

    'python_args' => array_values(array_filter(array_map(
        'trim',
        explode(' ', (string) env('ML_PYTHON_ARGS', PHP_OS_FAMILY === 'Windows' ? '-3' : ''))
    ))),

    'model_path' => env('ML_MODEL_PATH', base_path('ml/models/renovacion_model.pkl')),

    'predict_script' => base_path('ml/scripts/predict.py'),

];
