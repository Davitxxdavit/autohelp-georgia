from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.requests.mechanic_views import (
    MechanicActiveJobView,
    MechanicArriveView,
    MechanicCompleteJobView,
    MechanicEarningsView,
    MechanicLocationView,
    MechanicMeView,
    MechanicOfferViewSet,
    MechanicProposePriceView,
    MechanicStartDrivingView,
    MechanicStartServiceView,
)

router = DefaultRouter()
router.register("offers", MechanicOfferViewSet, basename="mechanic-offer")

urlpatterns = [
    path("me/", MechanicMeView.as_view(), name="mechanic-me"),
    path("location/", MechanicLocationView.as_view(), name="mechanic-location"),
    path("earnings/", MechanicEarningsView.as_view(), name="mechanic-earnings"),
    path("jobs/active/", MechanicActiveJobView.as_view(), name="mechanic-active-job"),
    path(
        "jobs/<uuid:request_id>/start-driving/",
        MechanicStartDrivingView.as_view(),
        name="mechanic-job-start-driving",
    ),
    path(
        "jobs/<uuid:request_id>/arrive/",
        MechanicArriveView.as_view(),
        name="mechanic-job-arrive",
    ),
    path(
        "jobs/<uuid:request_id>/start-service/",
        MechanicStartServiceView.as_view(),
        name="mechanic-job-start-service",
    ),
    path(
        "jobs/<uuid:request_id>/complete/",
        MechanicCompleteJobView.as_view(),
        name="mechanic-job-complete",
    ),
    path(
        "jobs/<uuid:request_id>/price/",
        MechanicProposePriceView.as_view(),
        name="mechanic-job-price",
    ),
    path("", include(router.urls)),
]
