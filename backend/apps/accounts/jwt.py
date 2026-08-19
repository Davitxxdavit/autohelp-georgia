from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


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


class PhoneTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = PhoneTokenObtainPairSerializer


class PhoneTokenRefreshView(TokenRefreshView):
    permission_classes = [AllowAny]
