import java.io.*;
public class clean_text {
    public static void main(String[] args) {
        String inputFile = "raw_text.txt";
        String outputFile = "cleaned_text.txt";
        try (BufferedReader reader = new BufferedReader(new FileReader(inputFile));
            BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                String cleaned = line.trim().replaceAll("\\s+", " ").toLowerCase();
                writer.write(cleaned + "\n");
            }
            System.out.println("✅ Text cleaned and saved to " + outputFile);
        } catch (IOException e) {
            System.err.println("❌ Error cleaning text: " + e.getMessage());
        }
    }
}