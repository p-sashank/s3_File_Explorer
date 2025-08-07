from django.shortcuts import render
import boto3
import pandas as pd
from io import BytesIO
from django.conf import settings
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import UploadedFile
from .serializers import UploadedFileSerializer
from django.http import FileResponse, Http404 
from django.shortcuts import get_object_or_404 
from django.conf import settings 
from django.utils.encoding import escape_uri_path


s3_client = boto3.client(
    's3',
    endpoint_url=settings.AWS_S3_ENDPOINT_URL,
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    verify=settings.AWS_S3_VERIFY_SSL if hasattr(settings, 'AWS_S3_VERIFY_SSL') else True,
    use_ssl=settings.AWS_S3_USE_SSL
)

class FileUploadView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)
    serializer_class = UploadedFileSerializer

    def post(self, request, *args, **kwargs):
        file_obj = request.data.get('file')
        if not file_obj:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        if not (file_obj.name.endswith('.xls') or file_obj.name.endswith('.xlsx')):
            return Response({"detail": "Only XLS and XLSX files are allowed."}, status=status.HTTP_400_BAD_REQUEST)

        file_name = file_obj.name
        s3_key = f"{request.user.username}/{file_name}" # Store files under user's directory

        try:
            # Upload file to MinIO
            s3_client.upload_fileobj(file_obj, settings.AWS_STORAGE_BUCKET_NAME, s3_key)

            
            uploaded_file = UploadedFile.objects.create(
                owner=request.user,
                file_name=file_name,
                s3_key=s3_key,
                file_type=file_obj.content_type
            )
            serializer = self.get_serializer(uploaded_file)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileListView(generics.ListAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UploadedFileSerializer

    def get_queryset(self):
        return UploadedFile.objects.filter(owner=self.request.user).order_by('-upload_date')

class FileDownloadView(generics.RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = UploadedFile.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to download this file."},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            file_buffer = BytesIO()
            s3_client.download_fileobj(settings.AWS_STORAGE_BUCKET_NAME, instance.s3_key, file_buffer)
            file_buffer.seek(0)

            response = FileResponse(file_buffer, content_type=instance.file_type)
            filename = escape_uri_path(instance.file_name)

            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FileModifyView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    queryset = UploadedFile.objects.all()
    serializer_class = UploadedFileSerializer # Not strictly used for update, but good practice

    def post(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.owner != request.user:
            return Response({"detail": "You do not have permission to modify this file."},
                            status=status.HTTP_403_FORBIDDEN)

        if not (instance.file_name.endswith('.xls') or instance.file_name.endswith('.xlsx')):
            return Response({"detail": "Only XLS and XLSX files can be modified."}, status=status.HTTP_400_BAD_REQUEST)

        modification_type = request.data.get('modification_type')
        column_name = request.data.get('column_name')
        new_value = request.data.get('new_value')
        row_index = request.data.get('row_index') 

        try:
            file_buffer = BytesIO()
            s3_client.download_fileobj(settings.AWS_STORAGE_BUCKET_NAME, instance.s3_key, file_buffer)
            file_buffer.seek(0)

            df = pd.read_excel(file_buffer)
            if modification_type == 'add_column' and column_name and new_value is not None:
                df[column_name] = new_value
                message = f"Added column '{column_name}' with value '{new_value}'."
            elif modification_type == 'update_cell' and column_name and row_index is not None and new_value is not None:
                try:
                    row_index = int(row_index)
                    if 0 <= row_index < len(df) and column_name in df.columns:
                        df.loc[row_index, column_name] = new_value
                        message = f"Updated cell at row {row_index}, column '{column_name}' to '{new_value}'."
                    else:
                        return Response({"detail": "Invalid row index or column name."}, status=status.HTTP_400_BAD_REQUEST)
                except ValueError:
                    return Response({"detail": "Row index must be an integer."}, status=status.HTTP_400_BAD_REQUEST)
            elif modification_type == 'delete_column' and column_name:
                if column_name in df.columns:
                    df = df.drop(columns=[column_name])
                    message = f"Deleted column '{column_name}'."
                else:
                    return Response({"detail": "Column not found."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"detail": "Invalid modification type or missing parameters."}, status=status.HTTP_400_BAD_REQUEST)
            output_buffer = BytesIO()
            with pd.ExcelWriter(output_buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Sheet1')
            output_buffer.seek(0)

            s3_client.upload_fileobj(output_buffer, settings.AWS_STORAGE_BUCKET_NAME, instance.s3_key)

            return Response({"detail": f"File '{instance.file_name}' modified successfully. {message}"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"detail": f"Error modifying file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
