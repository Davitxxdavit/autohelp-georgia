from rest_framework.exceptions import APIException


class Conflict(APIException):
    status_code = 409
    default_detail = "This action conflicts with the current request state."
    default_code = "conflict"
