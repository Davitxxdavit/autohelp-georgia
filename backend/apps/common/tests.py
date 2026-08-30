from django.test import SimpleTestCase
from rest_framework import status
from rest_framework.test import APITestCase

from config.database import postgres_config_from_url


class HealthEndpointTests(APITestCase):
    def test_health_returns_ok(self):
        response = self.client.get("/health/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"status": "ok"})


class DatabaseUrlTests(SimpleTestCase):
    def test_parses_postgres_url(self):
        config = postgres_config_from_url(
            "postgres://user:p%40ss@db.example:5432/autohelp?sslmode=require",
            conn_max_age=60,
        )
        self.assertEqual(config["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(config["NAME"], "autohelp")
        self.assertEqual(config["USER"], "user")
        self.assertEqual(config["PASSWORD"], "p@ss")
        self.assertEqual(config["HOST"], "db.example")
        self.assertEqual(config["PORT"], "5432")
        self.assertEqual(config["CONN_MAX_AGE"], 60)
        self.assertEqual(config["OPTIONS"]["sslmode"], "require")

    def test_rejects_non_postgres_scheme(self):
        with self.assertRaises(ValueError):
            postgres_config_from_url("mysql://user:pass@localhost/db", conn_max_age=0)
