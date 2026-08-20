from rest_framework import serializers


class TokenObtainRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(
        help_text="E.164 phone number. Development foundation only; production will use OTP."
    )
    password = serializers.CharField(write_only=True)


class TokenObtainResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()


class TokenRefreshRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class TokenRefreshResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
