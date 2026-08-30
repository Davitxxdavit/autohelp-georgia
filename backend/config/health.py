from django.http import JsonResponse
from django.views.decorators.http import require_GET


@require_GET
def health(_request):
    """Public liveness probe. No secrets, no database access."""
    return JsonResponse({"status": "ok"})
