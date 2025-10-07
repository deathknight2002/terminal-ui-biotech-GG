"""
Biotech Terminal Platform Core

Open-source biotech intelligence platform with data providers,
financial modeling, and pharmaceutical analytics.

This package intentionally shares its name with Python's built-in
``platform`` module. To keep third-party tooling (e.g. Poetry) and
stdlib helpers that rely on ``import platform`` working, we lazily load
the stdlib module and re-export its public API into this namespace.
"""

from __future__ import annotations

import importlib.machinery
import importlib.util
import sysconfig
from types import ModuleType
from typing import Iterable

__version__ = "1.0.0"
__author__ = "Biotech Terminal Team"

__all__ = ["__version__", "__author__"]


def _load_stdlib_platform() -> ModuleType | None:
    """
    Load the genuine stdlib ``platform`` module even though this package
    shadows it on ``sys.path``. Returns ``None`` if the module cannot be
    resolved (e.g. non-CPython environments).
    """

    try:
        stdlib_path = sysconfig.get_paths()["stdlib"]
    except (KeyError, ModuleNotFoundError, OSError):
        return None

    spec = importlib.machinery.PathFinder.find_spec("platform", [stdlib_path])
    if spec is None or spec.loader is None:
        return None

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[func-returns-value]
    return module


def _re_export_stdlib(module: ModuleType) -> None:
    """
    Copy selected public attributes from the stdlib module into this
    package's namespace without clobbering project specific symbols.
    """

    public_members: Iterable[str]
    if hasattr(module, "__all__") and isinstance(module.__all__, (list, tuple)):
        public_members = module.__all__  # type: ignore[assignment]
    else:
        public_members = (name for name in dir(module) if not name.startswith("_"))

    current_globals = globals()
    for name in public_members:
        if name in current_globals:
            continue
        current_globals[name] = getattr(module, name)
        __all__.append(name)  # type: ignore[arg-type]


_stdlib_platform = _load_stdlib_platform()
if _stdlib_platform is not None:
    _re_export_stdlib(_stdlib_platform)
