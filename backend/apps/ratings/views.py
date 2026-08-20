from drf_spectacular.utils import extend_schema
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsCustomer
from apps.common.schema import FORBIDDEN, UNAUTHORIZED, VALIDATION_ERROR
from apps.ratings.models import Rating
from apps.ratings.serializers import RatingSerializer


class RatingCreateView(CreateAPIView):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated, IsCustomer]

    @extend_schema(
        tags=["Ratings"],
        summary="Rate a completed request",
        description=(
            "Writable fields: `request`, `stars` (1–5), optional `feedback`.\n\n"
            "Customer and mechanic are taken from the ServiceRequest. "
            "The request must be COMPLETED, belong to the customer, have an assigned "
            "mechanic, and have no existing rating."
        ),
        request=RatingSerializer,
        responses={
            201: RatingSerializer,
            400: VALIDATION_ERROR,
            401: UNAUTHORIZED,
            403: FORBIDDEN,
        },
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)
