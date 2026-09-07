from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.schema import (
    CurrentUserSerializer,
    CustomerRegisterRequestSerializer,
    CustomerRegisterResponseSerializer,
    MechanicRegisterRequestSerializer,
    MechanicRegisterResponseSerializer,
)
from apps.accounts.serializers import CustomerRegisterSerializer, MechanicRegisterSerializer
from apps.common.schema import UNAUTHORIZED, VALIDATION_ERROR


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


@extend_schema(
    tags=["Authentication"],
    summary="Register a mechanic application",
    description=(
        "Create a mechanic User + MechanicProfile and return a JWT pair.\n\n"
        "The account starts PENDING, unverified, and offline. It cannot go "
        "online or receive offers until an admin approves it.\n"
        "`services` must be one or more active catalog service IDs.\n"
        "Does not create a CustomerProfile. SMS OTP is not part of this endpoint."
    ),
    request=MechanicRegisterRequestSerializer,
    responses={
        201: MechanicRegisterResponseSerializer,
        400: VALIDATION_ERROR,
    },
    examples=[
        OpenApiExample(
            "Register mechanic",
            value={
                "phone": "+995555987654",
                "password": "StrongPassword123!",
                "first_name": "Giorgi",
                "services": ["00000000-0000-0000-0000-000000000002"],
            },
            request_only=True,
        )
    ],
    auth=None,
)
class MechanicRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = MechanicRegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        profile = user.mechanic_profile
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "phone": user.phone,
                    "role": user.role,
                    "first_name": profile.first_name,
                    "approval_status": profile.approval_status,
                    "verified": profile.verified,
                },
            },
            status=status.HTTP_201_CREATED,
        )


@extend_schema(
    tags=["Authentication"],
    summary="Get the authenticated user profile",
    description=(
        "Returns the signed-in user's phone, role, and first name. "
        "Does not include password or admin flags."
    ),
    responses={
        200: CurrentUserSerializer,
        401: UNAUTHORIZED,
    },
)
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        first_name = ""
        if hasattr(user, "customer_profile"):
            first_name = user.customer_profile.first_name
        elif hasattr(user, "mechanic_profile"):
            first_name = user.mechanic_profile.first_name
        return Response(
            {
                "id": str(user.id),
                "phone": user.phone,
                "role": user.role,
                "first_name": first_name,
            }
        )
