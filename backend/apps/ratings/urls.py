from django.urls import path

from apps.ratings.views import RatingCreateView

urlpatterns = [
    path("", RatingCreateView.as_view(), name="rating-create"),
]
