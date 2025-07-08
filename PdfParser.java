import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;

public class PdfParser {
    public static void main(String[] args) {
        String pdfFile = "sample.pdf";         // Input PDF file
        String outputFile = "raw_text.txt";    // Output text file

        File input = new File(pdfFile);
        if (!input.exists()) {
            System.err.println("❌ PDF file not found: " + pdfFile);
            return;
        }

            try (PDDocument document = PDDocument.load(new File(pdfFile))) {
        PDFTextStripper stripper = new PDFTextStripper();
        String text = stripper.getText(document);
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(textFile))) {
            writer.write(text);
        }
        System.out.println("✅ Text extracted to " + textFile);
    } catch (IOException e) {
        System.err.println("❌ Error reading PDF: " + e.getMessage());
    }
}

}
