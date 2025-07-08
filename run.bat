@echo off
echo 🔧 Compiling PdfParser.java...
javac -cp ".;pdfbox-2.0.29.jar" PdfParser.java

if exist PdfParser.class (
    echo ✅ Compilation successful.
    echo 🏃 Running PdfParser...
    java -cp ".;pdfbox-2.0.29.jar" PdfParser
) else (
    echo ❌ Compilation failed. Check for errors.
)

pause
