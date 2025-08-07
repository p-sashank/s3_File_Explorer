# backend/Dockerfile
FROM python:3.12-alpine

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app/backend


RUN apk update && apk add --no-cache \
    mariadb-dev \
    build-base \
    gcc \
    pkgconfig \
    curl \
    && rm -rf /var/cache/apk/*


COPY requirements.txt /app/backend/
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --no-cache-dir xlrd>=2.0.1 && \
    python -c "import xlrd; print(f'xlrd version: {xlrd.__version__}');"

COPY . /app/backend/


EXPOSE 8000


CMD ["sh", "-c", "python manage.py migrate && python manage.py runserver 0.0.0.0:8000"]