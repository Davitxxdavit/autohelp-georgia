from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated

from apps.common.permissions import IsCustomer
from apps.ratings.models import Rating
from apps.ratings.serializers import RatingSerializer


class RatingCreateView(CreateAPIView):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated, IsCustomer]
