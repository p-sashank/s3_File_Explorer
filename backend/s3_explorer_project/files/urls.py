from django.urls import path
from .views import FileUploadView, FileListView, FileDownloadView, FileModifyView

urlpatterns = [
    path('upload/', FileUploadView.as_view(), name='file-upload'),
    path('list/', FileListView.as_view(), name='file-list'),
    path('download/<int:pk>/', FileDownloadView.as_view(), name='file-download'),
    path('modify/<int:pk>/', FileModifyView.as_view(), name='file-modify'),
]
