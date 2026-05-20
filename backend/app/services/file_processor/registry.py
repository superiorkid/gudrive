from app.services.file_processor.image_processor import ImageProcessor
from app.services.file_processor.pdf_processor import PDFProcessor

processors = [ImageProcessor(), PDFProcessor()]


def get_processor(mime_type: str):
    for processor in processors:
        if processor.supports(mime_type):
            return processor
    return None
