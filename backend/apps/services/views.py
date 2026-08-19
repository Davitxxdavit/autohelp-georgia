from django.db.models import Prefetch
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.services.models import Service, ServiceProblem
from apps.services.serializers import ServiceSerializer


class ServiceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ServiceSerializer
    lookup_field = "pk"
    filterset_fields = ("code", "active")

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        problems = ServiceProblem.objects.all()
        user = self.request.user
        qs = Service.objects.all()
        if not (user.is_authenticated and user.is_staff):
            qs = qs.filter(active=True)
            problems = problems.filter(active=True)
        return qs.prefetch_related(Prefetch("problems", queryset=problems))
