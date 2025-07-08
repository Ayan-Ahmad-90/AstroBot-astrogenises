@echo off
cd /d "%~dp0"
echo 🔧 Compiling PdfParser.java...
javac -cp ".;pdfbox-app-3.0.5.jar" PdfParser.java
echo ▶ Running PdfParser...
java -cp ".;pdfbox-app-3.0.5.jar" PdfParser
pause