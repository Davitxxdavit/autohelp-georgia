from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.schema import (
    CustomerRegisterRequestSerializer,
    CustomerRegisterResponseSerializer,
)
from apps.accounts.serializers import CustomerRegisterSerializer
from apps.common.schema import VALIDATION_ERROR


@extend_schema(
    tags=["Authentication"],
    summary="Register a customer account",
    description=(
        "Create a customer User + CustomerProfile and return a JWT pair.\n\n"
        "Phone must be E.164. Password is hashed with Django's password hasher.\n"
        "Does not create a MechanicProfile. SMS OTP is not part of this endpoint."
    ),
    request=CustomerRegisterRequestSerializer,
    responses={
        201: CustomerRegisterResponseSerializer,
        400: VALIDATION_ERROR,
    },
    examples=[
        OpenApiExample(
            "Register customer",
            value={
                "phone": "+995555123456",
                "password": "StrongPassword123!",
                "first_name": "Davit",
            },
            request_only=True,
        )
    ],
    auth=None,
)
class CustomerRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CustomerRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "phone": user.phone,
                    "role": user.role,
                    "first_name": user.customer_profile.first_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )
