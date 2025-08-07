from rest_framework import serializers
from .models import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')

    class Meta:
        model = UploadedFile
        fields = ('id', 'file_name', 's3_key', 'upload_date', 'file_type', 'owner_username')
        read_only_fields = ('s3_key', 'upload_date', 'owner_username')
