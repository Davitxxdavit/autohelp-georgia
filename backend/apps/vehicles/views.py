from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.accounts.models import Role
from apps.common.permissions import IsCustomer
from apps.vehicles.models import Vehicle
from apps.vehicles.serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, IsCustomer]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Vehicle.objects.select_related("customer").all()
        if user.role != Role.CUSTOMER or not hasattr(user, "customer_profile"):
            return Vehicle.objects.none()
        return Vehicle.objects.filter(customer=user.customer_profile)

    def get_permissions(self):
        if self.request.user.is_staff:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(customer=self.request.user.customer_profile)
