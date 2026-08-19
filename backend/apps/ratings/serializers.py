from rest_framework import serializers

from apps.ratings.models import Rating
from apps.requests.models import RequestStatus, ServiceRequest


class RatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = (
            "id",
            "request",
            "stars",
            "feedback",
            "customer",
            "mechanic",
            "created_at",
        )
        read_only_fields = ("id", "customer", "mechanic", "created_at")

    def validate_request(self, request_obj: ServiceRequest):
        user = self.context["request"].user
        if not hasattr(user, "customer_profile"):
            raise serializers.ValidationError("Only customers can rate requests.")
        if request_obj.customer_id != user.customer_profile.id:
            raise serializers.ValidationError("You can only rate your own requests.")
        if request_obj.status != RequestStatus.COMPLETED:
            raise serializers.ValidationError("Only completed requests can be rated.")
        if request_obj.assigned_mechanic_id is None:
            raise serializers.ValidationError("Request has no assigned mechanic.")
        if Rating.objects.filter(request=request_obj).exists():
            raise serializers.ValidationError("This request already has a rating.")
        return request_obj

    def create(self, validated_data):
        request_obj: ServiceRequest = validated_data["request"]
        return Rating.objects.create(
            request=request_obj,
            customer=request_obj.customer,
            mechanic=request_obj.assigned_mechanic,
            stars=validated_data["stars"],
            feedback=validated_data.get("feedback", ""),
        )
