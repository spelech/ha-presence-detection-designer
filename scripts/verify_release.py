#!/usr/bin/env python3
"""Release and Version Verification Engine for ha-presence-detection-designer.

Validates version consistency across pyproject.toml and manifest.json.
"""

from __future__ import annotations

import argparse
import json
import sys
import tomllib
from pathlib import Path


def check_version_sync(root_dir: Path) -> bool:
    """Verify version consistency between pyproject.toml and manifest.json."""
    print("🔍 Checking version consistency across manifests...")
    pyproject_file = root_dir / "pyproject.toml"
    manifest_file = (
        root_dir / "custom_components" / "presence_detection_designer" / "manifest.json"
    )

    if not pyproject_file.is_file():
        print(f"❌ Missing pyproject.toml at {pyproject_file}")
        return False
    if not manifest_file.is_file():
        print(f"❌ Missing manifest.json at {manifest_file}")
        return False

    with open(pyproject_file, "rb") as f:
        pyproject_data = tomllib.load(f)
    pyproject_version = pyproject_data.get("project", {}).get("version")

    with open(manifest_file, encoding="utf-8") as f:
        manifest_data = json.load(f)
    manifest_version = manifest_data.get("version")

    if not pyproject_version:
        print("❌ No version found in pyproject.toml")
        return False

    if not manifest_version:
        print("❌ No version found in manifest.json")
        return False

    if pyproject_version != manifest_version:
        print(
            f"❌ Version mismatch! pyproject.toml ({pyproject_version}) != "
            f"manifest.json ({manifest_version})"
        )
        return False

    print(f"✅ Version synchronized: v{pyproject_version}")
    return True


def main() -> int:
    """CLI entrypoint."""
    parser = argparse.ArgumentParser(description="Verify release integrity.")
    parser.add_argument("--ci", action="store_true", help="Run in CI mode.")
    parser.parse_args()

    root_dir = Path(__file__).resolve().parent.parent
    if not check_version_sync(root_dir):
        return 1

    print("🎉 All release checks passed!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
