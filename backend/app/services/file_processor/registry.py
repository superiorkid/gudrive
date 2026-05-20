from app.services.file_processor.document_processor import DocumentProcessor
from app.services.file_processor.image_processor import ImageProcessor
from app.services.file_processor.video_processor import VideoProcessor

processors = [ImageProcessor(), DocumentProcessor(), VideoProcessor()]


def get_processor(mime_type: str):
    for processor in processors:
        if processor.supports(mime_type):
            return processor
    return None
