from django.urls import include, path

from apps.accounts.jwt import PhoneTokenObtainPairView, PhoneTokenRefreshView

urlpatterns = [
    path("auth/token/", PhoneTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", PhoneTokenRefreshView.as_view(), name="token_refresh"),
    path("services/", include("apps.services.urls")),
    path("vehicles/", include("apps.vehicles.urls")),
    path("requests/", include("apps.requests.urls")),
    path("ratings/", include("apps.ratings.urls")),
]
