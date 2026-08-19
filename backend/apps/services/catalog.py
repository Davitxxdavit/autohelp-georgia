"""Canonical service catalog. Used by data migration and seed_catalog command."""

CATALOG = [
    {
        "code": "BATTERY",
        "name": "Battery Assistance",
        "description": "Jump start and on-site battery help.",
        "problems": [
            ("DEAD_BATTERY", "Battery is dead", 10),
            ("WONT_START", "Car won't start", 20),
            ("WEAK_BATTERY", "Weak battery", 30),
            ("BATTERY_REPLACEMENT", "Battery replacement", 40),
            ("NOT_SURE", "I'm not sure", 50),
        ],
    },
    {
        "code": "DIAGNOSTICS",
        "name": "Diagnostics",
        "description": "On-site computer diagnostics.",
        "problems": [
            ("CHECK_ENGINE", "Check engine light", 10),
            ("RUNNING_POORLY", "Car running poorly", 20),
            ("PRE_TRIP", "Pre-trip check", 30),
            ("NOT_SURE", "I'm not sure", 40),
        ],
    },
    {
        "code": "AUTO_KEY",
        "name": "Auto Key",
        "description": "Lockout and key assistance. Price confirmed by specialist.",
        "problems": [
            ("LOCKED_OUT", "Locked out of my car", 10),
            ("LOST_KEY", "Lost my key", 20),
            ("KEY_NOT_WORKING", "Key is not working", 30),
            ("OTHER", "Other", 40),
        ],
    },
]


def seed_catalog(*, service_model, problem_model) -> None:
    for item in CATALOG:
        service, _ = service_model.objects.update_or_create(
            code=item["code"],
            defaults={
                "name": item["name"],
                "description": item["description"],
                "active": True,
            },
        )
        for code, label, sort_order in item["problems"]:
            problem_model.objects.update_or_create(
                service=service,
                code=code,
                defaults={
                    "label": label,
                    "active": True,
                    "sort_order": sort_order,
                },
            )
