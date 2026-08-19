from rest_framework.routers import DefaultRouter

from apps.requests.views import ServiceRequestViewSet

router = DefaultRouter()
router.register("", ServiceRequestViewSet, basename="service-request")

urlpatterns = router.urls
