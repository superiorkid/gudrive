from app.services.file_processor.image_processor import ImageProcessor

processors = [
    ImageProcessor(),
]


def get_processor(mime_type: str):
    for processor in processors:
        if processor.supports(mime_type):
            return processor
    return None
