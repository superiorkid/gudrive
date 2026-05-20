import os
import subprocess
import tempfile

import pypdfium2 as pdfium
from PIL import Image

from app.services.file_processor.base import BaseFileProcessor


class DocumentProcessor(BaseFileProcessor):
    def supports(self, mime_type: str) -> bool:
        supported_types = (
            # ----------------------------------------------------
            # 1. NATIVE PDFs
            # ----------------------------------------------------
            "application/pdf",
            # ----------------------------------------------------
            # 2. WORD PROCESSING & TEXT DOCUMENTS
            # ----------------------------------------------------
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
            "application/vnd.ms-word.document.macroEnabled.12",  # .docm (Macro-Enabled)
            "application/msword",  # .doc
            "application/wps-office.docx",  # WPS .docx override
            "application/wps-office.doc",  # WPS .doc override
            "application/vnd.oasis.opendocument.text",  # .odt (OpenDocument Text)
            "application/rtf",  # .rtf
            "text/rtf",  # .rtf alternative
            "text/plain",  # .txt (Plain Text)
            "application/vnd.apple.pages",  # Apple Pages (.pages)
            # ----------------------------------------------------
            # 3. SPREADSHEETS & DATA TABLES
            # ----------------------------------------------------
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
            "application/vnd.ms-excel.sheet.macroEnabled.12",  # .xlsm (Macro-Enabled)
            "application/vnd.ms-excel",  # .xls
            "application/wps-office.xlsx",  # WPS .xlsx override
            "application/wps-office.xls",  # WPS .xls override
            "application/vnd.oasis.opendocument.spreadsheet",  # .ods (OpenDocument Calc)
            "text/csv",  # .csv
            "application/vnd.apple.numbers",  # Apple Numbers (.numbers)
            # ----------------------------------------------------
            # 4. PRESENTATIONS & SLIDE DECKS
            # ----------------------------------------------------
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",  # .pptx
            "application/vnd.ms-powerpoint.presentation.macroEnabled.12",  # .pptm (Macro-Enabled)
            "application/vnd.ms-powerpoint",  # .ppt
            "application/vnd.openxmlformats-officedocument.presentationml.slideshow",  # .ppsx (PowerPoint Show)
            "application/vnd.ms-powerpoint.slideshow.macroEnabled.12",  # .ppsm
            "application/wps-office.pptx",  # WPS .pptx override
            "application/wps-office.ppt",  # WPS .ppt override
            "application/vnd.oasis.opendocument.presentation",  # .odp (OpenDocument Impress)
            "application/vnd.apple.keynote",  # Apple Keynote (.keynote)
        )
        return mime_type in supported_types

    def process(self, input_path: str, output_path: str) -> dict:
        is_pdf = input_path.lower().endswith(".pdf")

        # Capture all structural spreadsheet extensions to keep layout fitting columns constrained
        is_spreadsheet = any(
            input_path.lower().endswith(ext)
            for ext in [".xlsx", ".xlsm", ".xls", ".ods", ".csv", ".numbers"]
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            if not is_pdf:
                user_profile_path = os.path.join(temp_dir, "lo_profile")

                cmd = [
                    "xvfb-run",
                    "--auto-servernum",
                    "libreoffice",
                    "--headless",
                    "--norestore",
                    f"-env:UserInstallation=file://{user_profile_path}",
                ]

                if is_spreadsheet:
                    cmd.append("--infilter=Excel Office Open XML:SinglePageSheets=true")

                cmd.extend(["--convert-to", "pdf", "--outdir", temp_dir, input_path])

                subprocess.run(
                    cmd,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                    timeout=45,
                    check=True,
                )

                base_name = os.path.splitext(os.path.basename(input_path))[0]
                pdf_target_path = os.path.join(temp_dir, f"{base_name}.pdf")
            else:
                pdf_target_path = input_path

            # Render page layout via pypdfium2 context
            pdf = pdfium.PdfDocument(pdf_target_path)
            page = pdf.get_page(0)

            bitmap = page.render(
                scale=1,
                fill_color=(255, 255, 255, 255),
            )
            img = bitmap.to_pil()

            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.thumbnail((300, 300), Image.Resampling.LANCZOS)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            img.save(output_path, "JPEG", optimize=True, quality=85)

            bitmap.close()
            page.close()
            pdf.close()

        return {
            "type": "document",
            "preview_path": output_path,
        }
