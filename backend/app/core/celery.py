"""

# Running the Project (Development)

## for windows
> celery -A celery_app.celery_app worker --loglevel=info --pool=solo --concurrency=1 --hostname=worker1

## for Ubuntu/linux
> celery -A celery_app.celery_app worker --loglevel=info --pool=prefork --concurrency=4 --hostname=worker1


# Production Setup (Ubuntu Server):
In production, you should never run Celery or FastAPI manually. Instead, use systemd services.

## Celery systemd Service

Create service file

> sudo nano /etc/systemd/system/celery.service

'[Unit]
Description=Celery Worker
After=network.target redis.service

[Service]
User=ubuntu
WorkingDirectory=/var/www/project
Environment="PATH=/var/www/project/venv/bin"
ExecStart=/var/www/project/venv/bin/celery \
  -A celery_app.celery_app worker \
  --loglevel=info \
  --pool=prefork \
  --concurrency=4 \
  --hostname=worker1
Restart=always

[Install]
WantedBy=multi-user.target
sudo systemctl daemon-reload
sudo systemctl enable celery
sudo systemctl start celery'
"""

from celery import Celery

from app.core.config import get_configs

settings = get_configs()

celery_app = Celery(
    "worker", broker=settings.celery_broker_url, backend=settings.celery_result_url
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
)


import app.tasks.uploads
