import java.io.*;
import java.util.*;
public class ParseTelemetry {
    public static void main(String[] args) {
        String logFile = "telemetry_data.log";
        try (BufferedReader br = new BufferedReader(new FileReader(logFile))) {
            String line;
            int lineNumber = 0;
            while ((line = br.readLine()) != null) {
                lineNumber++;
                if (line.contains("TEMP") && line.contains("PRESSURE")) {
                    Map<String, String> data = extractData(line);
                    System.out.println("📄 Line " + lineNumber + ": " + data);
                    String status = evaluateTelemetry(data);
                    System.out.println("🧠 AI Status: " + status);
                    System.out.println("--------------------------------------------------");
                }
            }
        } catch (IOException e) {
            System.err.println("❌ Error reading log file: " + e.getMessage());
        }
    }
    public static Map<String, String> extractData(String line) {
        Map<String, String> map = new HashMap<>();
        line = line.replace("[", "").replace("]", "").trim();
        String[] parts = line.split("\\s+");
        for (String part : parts) {
            String[] keyValue = part.split(":");
            if (keyValue.length == 2) {
                map.put(keyValue[0].trim(), keyValue[1].trim());
            }
        }
        return map;
    }
    public static String evaluateTelemetry(Map<String, String> data) {
        try {
            double temp = Double.parseDouble(data.getOrDefault("TEMP", "0"));
            double pressure = Double.parseDouble(data.getOrDefault("PRESSURE", "0"));
            if (temp > 80 || pressure > 110) {
                return "⚠️ Anomaly Detected!";
            } else {
                return "✅ Normal";
            }
        } catch (NumberFormatException e) {
            return "❌ Invalid number format in telemetry data";
        }
    }
}
