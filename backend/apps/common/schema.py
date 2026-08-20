from drf_spectacular.utils import OpenApiResponse

VALIDATION_ERROR = OpenApiResponse(description="Validation error.")
UNAUTHORIZED = OpenApiResponse(description="Missing or invalid JWT bearer token.")
FORBIDDEN = OpenApiResponse(description="Authenticated but not allowed for this resource.")
NOT_FOUND = OpenApiResponse(description="Resource not found.")
