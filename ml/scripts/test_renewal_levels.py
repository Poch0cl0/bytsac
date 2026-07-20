"""
Pruebas unitarias de umbrales de nivel de probabilidad de renovación.
Ejecutar: python ml/scripts/test_renewal_levels.py
"""

from __future__ import annotations

import unittest

from predict import _renewal_level


class RenewalLevelTests(unittest.TestCase):
    """Casos de clasificación alta / media / baja según probabilidad."""

    def test_probabilidad_alta(self) -> None:
        self.assertEqual(_renewal_level(0.70), "alta")
        self.assertEqual(_renewal_level(0.95), "alta")

    def test_probabilidad_media(self) -> None:
        self.assertEqual(_renewal_level(0.40), "media")
        self.assertEqual(_renewal_level(0.69), "media")

    def test_probabilidad_baja(self) -> None:
        self.assertEqual(_renewal_level(0.39), "baja")
        self.assertEqual(_renewal_level(0.10), "baja")


if __name__ == "__main__":
    unittest.main()
