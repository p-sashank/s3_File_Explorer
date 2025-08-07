from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('s3_explorer_project.authentication.urls')),
    path('api/files/', include('s3_explorer_project.files.urls')),
]
