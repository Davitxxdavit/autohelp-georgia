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


class CustomerRegisterRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(help_text="E.164 phone number, e.g. +995555123456.")
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()


class CustomerRegisterUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    phone = serializers.CharField()
    role = serializers.CharField()
    first_name = serializers.CharField()


class CustomerRegisterResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = CustomerRegisterUserSerializer()


class MechanicRegisterRequestSerializer(serializers.Serializer):
    phone = serializers.CharField(help_text="E.164 phone number, e.g. +995555123456.")
    password = serializers.CharField(write_only=True)
    first_name = serializers.CharField()
    services = serializers.ListField(
        child=serializers.UUIDField(),
        help_text="Active catalog service IDs.",
    )


class MechanicRegisterUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    phone = serializers.CharField()
    role = serializers.CharField()
    first_name = serializers.CharField()
    approval_status = serializers.CharField()
    verified = serializers.BooleanField()


class MechanicRegisterResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = MechanicRegisterUserSerializer()


class CurrentUserSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    phone = serializers.CharField()
    role = serializers.CharField()
    first_name = serializers.CharField()


class CurrentUserUpdateSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=80)

    def validate_first_name(self, value: str) -> str:
        name = value.strip()
        if not name:
            raise serializers.ValidationError("This field may not be blank.")
        return name
