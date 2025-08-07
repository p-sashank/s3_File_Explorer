from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from rest_framework.views import APIView
from rest_framework.views import APIView # For APIView
from rest_framework.generics import CreateAPIView, GenericAPIView, RetrieveAPIView, ListAPIView # For the generic views

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,) 
    serializer_class = RegisterSerializer

class LoginView(GenericAPIView):
    permission_classes = (permissions.AllowAny,) 
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": token.key
        })

class UserView(RetrieveAPIView):
    permission_classes = (permissions.IsAuthenticated,) 
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        try:
            request.user.auth_token.delete()
        except:
            pass 
        logout(request)
        return Response(status=status.HTTP_200_OK)
