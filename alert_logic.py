def detect_anomaly(temperature, pressure):
    if temperature > 80 or pressure > 110:
        return "⚠️ Anomaly Detected!"
    return "✅ All normal."
