from app.services.file_processor.document_processor import DocumentProcessor
from app.services.file_processor.image_processor import ImageProcessor

processors = [ImageProcessor(), DocumentProcessor()]


def get_processor(mime_type: str):
    for processor in processors:
        if processor.supports(mime_type):
            return processor
    return None
