from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.requests.mechanic_views import MechanicActiveJobView, MechanicOfferViewSet

router = DefaultRouter()
router.register("offers", MechanicOfferViewSet, basename="mechanic-offer")

urlpatterns = [
    path("jobs/active/", MechanicActiveJobView.as_view(), name="mechanic-active-job"),
    path("", include(router.urls)),
]
