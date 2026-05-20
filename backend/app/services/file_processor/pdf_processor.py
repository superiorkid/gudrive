import os

import pypdfium2 as pdfium
from PIL import Image

from app.services.file_processor.base import BaseFileProcessor


class PDFProcessor(BaseFileProcessor):
    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("application/pdf")

    def process(self, input_path: str, output_path: str) -> dict:
        pdf = pdfium.PdfDocument(input_path)
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

        page.close()
        pdf.close()

        return {
            "type": "pdf",
            "preview_path": output_path,
        }
