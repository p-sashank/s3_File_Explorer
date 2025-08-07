from django.db import models
from django.contrib.auth.models import User

class UploadedFile(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    file_name = models.CharField(max_length=255)
    s3_key = models.CharField(max_length=500, unique=True) # Path in MinIO/S3
    upload_date = models.DateTimeField(auto_now_add=True)
    file_type = models.CharField(max_length=100) # e.g., 'application/vnd.ms-excel'

    def __str__(self):
        return f"{self.file_name} ({self.owner.username})"
