import os

from PIL import Image

from app.services.file_processor.base import BaseFileProcessor


class ImageProcessor(BaseFileProcessor):
    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("image/")

    def process(self, input_path: str, output_path: str) -> dict:
        with Image.open(input_path) as img:
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            img.thumbnail((300, 300), Image.Resampling.LANCZOS)
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            img.save(output_path, "JPEG", optimize=True, quality=85)

        return {
            "type": "image",
            "preview_path": output_path,
        }
