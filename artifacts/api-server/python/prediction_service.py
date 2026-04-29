"""
PredictionService — ML-based temperature trend analysis.

Uses the 48h hourly forecast from Open-Meteo and fits a polynomial
regression model (scikit-learn + NumPy) to:
  - Smooth the forecast curve and identify the underlying temperature trend
  - Find predicted peak and low over the next 24 hours
  - Compute R² goodness-of-fit score
  - Return per-hour smoothed predictions with confidence scores

The model operates WITHIN the forecast window (no risky extrapolation),
fitting a smooth curve to the messy hourly data and reporting its analysis.

This is the Python/ML core of the SkyPulse final-year project.
"""

import numpy as np
from sklearn.preprocessing import PolynomialFeatures
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.metrics import r2_score

from models import PredictionResponse, TemperaturePoint, WeatherResponse


class PredictionService:
    def __init__(self, poly_degree: int = 4):
        self.poly_degree = poly_degree

    def predict(self, weather: WeatherResponse) -> PredictionResponse:
        """
        Fit a polynomial regression on the 48-hour hourly temperature forecast.
        Analyze the FIRST 24 hours using the full 48-hour fitted curve.
        """
        temps_raw = np.array(weather.hourly.temperature_2m, dtype=float)
        # Work with up to 48 hours of actual forecast
        n = min(48, len(temps_raw))
        y = temps_raw[:n]
        X = np.arange(n, dtype=float).reshape(-1, 1)

        # Build and fit Ridge + Polynomial pipeline (Ridge avoids overfitting)
        model = make_pipeline(
            PolynomialFeatures(degree=self.poly_degree, include_bias=True),
            Ridge(alpha=10.0),
        )
        model.fit(X, y)

        # Evaluate full 48h fit
        y_fitted = model.predict(X)
        r2 = float(r2_score(y, y_fitted))

        # Focus on first 24 hours (the "next day" prediction)
        X_24 = np.arange(0, 24, dtype=float).reshape(-1, 1)
        y_24 = model.predict(X_24)

        # Compute residuals for confidence
        residuals = np.abs(y - y_fitted)
        residual_std = float(np.std(residuals)) + 1e-6

        hourly_predictions = []
        for i, temp in enumerate(y_24):
            # Confidence decays slightly over time; also reduced when residuals are high
            time_decay = 1 - (i / 48.0)
            noise_factor = max(0, 1 - residual_std / 3.0)
            conf = float(np.clip(time_decay * noise_factor * 0.85 + 0.1, 0.15, 0.95))
            # Clamp prediction within a realistic range (±5°C from raw data)
            raw_temp = float(temps_raw[i]) if i < len(temps_raw) else float(y_24[i])
            clamped = float(np.clip(temp, raw_temp - 5, raw_temp + 5))
            hourly_predictions.append(TemperaturePoint(
                hour=i,
                predicted_temp=round(clamped, 1),
                confidence=round(conf, 2),
            ))

        pred_temps = [p.predicted_temp for p in hourly_predictions]
        predicted_high = round(float(max(pred_temps)), 1)
        predicted_low = round(float(min(pred_temps)), 1)
        high_hour = int(np.argmax(pred_temps))
        low_hour = int(np.argmin(pred_temps))

        # Trend: compare first 6h vs last 6h of predictions
        first_6 = float(np.mean(pred_temps[:6]))
        last_6 = float(np.mean(pred_temps[-6:]))
        trend_delta = round(last_6 - first_6, 1)

        if trend_delta > 1.5:
            trend = "rising"
        elif trend_delta < -1.5:
            trend = "falling"
        else:
            trend = "stable"

        current_temp = round(float(temps_raw[0]), 1)
        summary = self._build_summary(current_temp, predicted_high, predicted_low, trend, trend_delta, r2)

        return PredictionResponse(
            model=f"Polynomial Regression (degree={self.poly_degree}, Ridge α=10) via scikit-learn",
            predicted_high=predicted_high,
            predicted_low=predicted_low,
            predicted_high_at_hour=high_hour,
            predicted_low_at_hour=low_hour,
            r2_score=round(r2, 3),
            trend=trend,
            trend_delta=trend_delta,
            hourly_predictions=hourly_predictions,
            summary=summary,
        )

    def _build_summary(
        self,
        current: float,
        high: float,
        low: float,
        trend: str,
        delta: float,
        r2: float,
    ) -> str:
        quality = "high" if r2 > 0.85 else "moderate" if r2 > 0.55 else "low"
        trend_desc = {
            "rising": f"warming by ~{abs(delta):.1f}°C",
            "falling": f"cooling by ~{abs(delta):.1f}°C",
            "stable": "staying steady",
        }[trend]
        return (
            f"Currently {current}°C. Over the next 24 hours, temperatures are {trend_desc}, "
            f"with a predicted high of {high}°C and low of {low}°C. "
            f"Model confidence: {quality} (R²={r2:.2f})."
        )
