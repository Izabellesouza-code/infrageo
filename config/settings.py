"""Configuração central do InfraGeo AM (dev / produção / serverless)."""
from __future__ import annotations

import os
from pathlib import Path


def project_root() -> Path:
    return Path(__file__).resolve().parent.parent


def runtime_env() -> str:
    return os.environ.get("INFRAGEO_ENV", os.environ.get("FLASK_ENV", "development")).strip().lower()


def is_production() -> bool:
    return runtime_env() in ("production", "prod")


def assets_dir() -> Path:
    override = os.environ.get("INFRAGEO_ASSETS_DIR", "").strip()
    if override:
        return Path(override)
    return project_root() / "assets"


def uploads_dir() -> Path:
    override = os.environ.get("INFRAGEO_UPLOADS_DIR", "").strip()
    if override:
        return Path(override)
    return project_root() / "uploads"


def data_dir() -> Path:
    override = os.environ.get("INFRAGEO_DATA_DIR", "").strip()
    if override:
        return Path(override)
    return project_root() / "data"


def logs_dir() -> Path:
    override = os.environ.get("INFRAGEO_LOGS_DIR", "").strip()
    if override:
        return Path(override)
    return project_root() / "logs"


def storage_dir() -> Path:
    override = os.environ.get("INFRAGEO_STORAGE_DIR", "").strip()
    if override:
        return Path(override)
    return project_root() / "storage"
