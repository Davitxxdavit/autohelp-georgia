from django.db.models import Prefetch
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated

from apps.common.schema import NOT_FOUND
from apps.services.models import Service, ServiceProblem
from apps.services.serializers import ServiceSerializer


@extend_schema_view(
    list=extend_schema(
        tags=["Services"],
        summary="List services",
        description="Public catalog. Nested `problems` are included. Non-staff see active services only.",
        auth=None,
        responses={200: ServiceSerializer},
    ),
    retrieve=extend_schema(
        tags=["Services"],
        summary="Retrieve a service",
        auth=None,
        responses={200: ServiceSerializer, 404: NOT_FOUND},
    ),
)
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
