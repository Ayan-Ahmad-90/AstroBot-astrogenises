import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

public class PdfParser {
    public static void main(String[] args) {
        String pdfFile = "sample.pdf"; // Your input PDF file
        String outputFile = "raw_text.txt"; // Output text file

        try (PDDocument document = PDDocument.load(new File(pdfFile))) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(document);

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(outputFile))) {
                writer.write(text);
            }

            System.out.println("✅ Text extracted successfully to " + outputFile);
        } catch (IOException e) {
            System.err.println("❌ Error: " + e.getMessage());
        }
    }
}
