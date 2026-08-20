from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from apps.accounts.schema import (
    TokenObtainRequestSerializer,
    TokenObtainResponseSerializer,
    TokenRefreshRequestSerializer,
    TokenRefreshResponseSerializer,
)
from apps.common.schema import UNAUTHORIZED


class PhoneTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    DEVELOPMENT FOUNDATION ONLY.

    Token login currently uses phone + password so SimpleJWT works.
    Production auth will move to phone OTP. Do not treat password login
    as the product authentication model.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        username_field = self.fields["username"]
        self.fields["phone"] = username_field
        self.fields["phone"].label = "Phone"
        del self.fields["username"]

    def validate(self, attrs):
        attrs["username"] = attrs.get("phone")
        return super().validate(attrs)


@extend_schema(
    tags=["Authentication"],
    summary="Obtain JWT (development foundation)",
    description=(
        "Exchange phone + password for JWT access and refresh tokens.\n\n"
        "**Development foundation only.** Production auth will use phone OTP.\n\n"
        "Development customer example (`seed_dev`, DEBUG only): "
        "`+995555000001` / `Devpass123!`."
    ),
    request=TokenObtainRequestSerializer,
    responses={200: TokenObtainResponseSerializer, 401: UNAUTHORIZED},
    examples=[
        OpenApiExample(
            "Development customer",
            summary="seed_dev customer (DEBUG only, not production)",
            value={"phone": "+995555000001", "password": "Devpass123!"},
            request_only=True,
        )
    ],
    auth=None,
)
class PhoneTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = PhoneTokenObtainPairSerializer


@extend_schema(
    tags=["Authentication"],
    summary="Refresh JWT access token",
    request=TokenRefreshRequestSerializer,
    responses={200: TokenRefreshResponseSerializer, 401: UNAUTHORIZED},
    examples=[
        OpenApiExample(
            "Refresh",
            value={"refresh": "<refresh_token>"},
            request_only=True,
        )
    ],
    auth=None,
)
class PhoneTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
