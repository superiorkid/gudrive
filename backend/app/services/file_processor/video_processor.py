import os
import subprocess

from PIL import Image

from app.services.file_processor.base import BaseFileProcessor


class VideoProcessor(BaseFileProcessor):
    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("video/")

    def process(self, input_path: str, output_path: str) -> dict:
        base_dir = os.path.dirname(output_path)
        os.makedirs(base_dir, exist_ok=True)

        temp_frame_path = f"{output_path}.temp.jpg"

        try:
            # FFmpeg Command Flags broken down:
            # -ss 00:00:02 -> Fast forward directly to 2 seconds in (skips black intros)
            # -i input_path -> Target input video file path
            # -vframes 1 -> Tell the engine to drop exactly 1 image frame and quit
            # -q:v 2 -> Set high-quality JPEG matrix scale factor (2-5 is optimal)
            # -y -> Overwrite the file if it exists without asking
            cmd = [
                "ffmpeg",
                "-ss",
                "00:00:02",
                "-i",
                input_path,
                "-vframes",
                "1",
                "-q:v",
                "2",
                "-y",
                temp_frame_path,
            ]

            subprocess.run(
                cmd,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                timeout=15,
                check=True,
            )

            if not os.path.exists(temp_frame_path):
                raise RuntimeError(
                    "FFmpeg failed to output an intermediate video frame snapshot."
                )

            with Image.open(temp_frame_path) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")

                img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                img.save(output_path, "JPEG", optimize=True, quality=85)

            return {
                "type": "video",
                "preview_path": output_path,
            }

        finally:
            if os.path.exists(temp_frame_path):
                try:
                    os.remove(temp_frame_path)
                except Exception:
                    pass
