from decimal import Decimal


def estimate_for_request(service, problem) -> Decimal | None:
    """
    Catalog estimates aligned with the current frontend mock.
    Not a pricing engine. Unknown prices stay None (never 0).
    """
    code = service.code
    problem_code = problem.code
    if code == "AUTO_KEY":
        return None
    if code == "DIAGNOSTICS":
        return Decimal("50.00")
    if code == "BATTERY":
        if problem_code == "BATTERY_REPLACEMENT":
            return Decimal("60.00")
        return Decimal("30.00")
    return None
