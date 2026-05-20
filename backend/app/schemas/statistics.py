from pydantic import BaseModel


class FileTypeStatistics(BaseModel):
    images: int
    videos: int
    documents: int
    audio_other: int


class StatisticsResponse(BaseModel):
    total_files: int
    library_size: int
    recent_uploads: int
    starred_items: int
    types: FileTypeStatistics
