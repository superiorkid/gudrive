import os
import subprocess

from PIL import Image

from app.services.file_processor.base import BaseFileProcessor


class VideoProcessor(BaseFileProcessor):
    def supports(self, mime_type: str) -> bool:
        return mime_type.startswith("video/")

    def _extract_frame(
        self, input_path: str, output_path: str, seek: str | None
    ) -> tuple[bool, str]:
        cmd = ["ffmpeg"]
        if seek:
            cmd += ["-ss", seek]
        cmd += [
            "-i",
            input_path,
            "-vframes",
            "1",
            "-q:v",
            "2",
            "-y",
            output_path,
        ]
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=15,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return False, "ffmpeg timeout"

        if (
            result.returncode == 0
            and os.path.exists(output_path)
            and os.path.getsize(output_path) > 0
        ):
            return True, ""
        return False, result.stderr.decode(errors="ignore")[-500:]

    def process(self, input_path: str, output_path: str) -> dict:
        base_dir = os.path.dirname(output_path)
        os.makedirs(base_dir, exist_ok=True)

        temp_frame_path = f"{output_path}.temp.jpg"

        try:
            ok, err = self._extract_frame(input_path, temp_frame_path, "00:00:02")

            if not ok:
                ok, err = self._extract_frame(input_path, temp_frame_path, None)

            if not ok:
                raise RuntimeError(f"FFmpeg gagal extract frame: {err}")

            with Image.open(temp_frame_path) as img:
                if img.mode in ("RGBA", "P"):
                    img = img.convert("RGB")
                img.thumbnail((300, 300), Image.Resampling.LANCZOS)
                img.save(output_path, "JPEG", optimize=True, quality=85)

            return {"type": "video", "preview_path": output_path}

        finally:
            if os.path.exists(temp_frame_path):
                try:
                    os.remove(temp_frame_path)
                except Exception:
                    pass
