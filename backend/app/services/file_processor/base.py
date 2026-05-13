from abc import ABC, abstractmethod


class BaseFileProcessor(ABC):
    @abstractmethod
    def supports(self, mime_type: str) -> bool:
        pass

    @abstractmethod
    def process(self, input_path: str, output_path: str) -> dict:
        pass
