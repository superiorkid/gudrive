import os
import subprocess
import tempfile

import pypdfium2 as pdfium
from PIL import Image

from app.services.file_processor.base import BaseFileProcessor


# TODO: .pptx issue take to long time to finish
class DocumentProcessor(BaseFileProcessor):
    def supports(self, mime_type: str) -> bool:
        supported_types = (
            # PDFs
            "application/pdf",
            # Word / Text Documents
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/msword",
            "application/wps-office.docx",
            "application/wps-office.doc",
            "application/rtf",
            "text/rtf",
            # Excel / Spreadsheets / CSV
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",  # .xlsx
            "application/vnd.ms-excel",  # .xls
            "application/wps-office.xlsx",
            "application/wps-office.xls",
            "text/csv",
            # PowerPoint / Presentations
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-powerpoint",
            "application/wps-office.pptx",
            "application/wps-office.ppt",
        )
        return mime_type in supported_types

    def process(self, input_path: str, output_path: str) -> dict:
        is_pdf = input_path.lower().endswith(".pdf")
        is_spreadsheet = any(
            input_path.lower().endswith(ext) for ext in [".xlsx", ".xls", ".csv"]
        )

        with tempfile.TemporaryDirectory() as temp_dir:
            if not is_pdf:
                user_profile_path = os.path.join(temp_dir, "lo_profile")

                cmd = [
                    "libreoffice",
                    "--headless",
                    "--norestore",
                    f"-env:UserInstallation=file://{user_profile_path}",  # fixed concurrent .lock
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
