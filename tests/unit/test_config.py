import unittest

from config import is_production, project_root, runtime_env


class ConfigTests(unittest.TestCase):
    def test_project_root_has_assets_or_app(self):
        root = project_root()
        self.assertTrue((root / "app.py").exists())
        self.assertTrue((root / "config").is_dir())

    def test_runtime_env_is_string(self):
        self.assertIsInstance(runtime_env(), str)
        self.assertIsInstance(is_production(), bool)


if __name__ == "__main__":
    unittest.main()
