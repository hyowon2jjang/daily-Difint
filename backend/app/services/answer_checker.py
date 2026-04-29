"""
Answer checking service.
Pipeline:
  1. Parse both answers with SymPy (CAS symbolic check)
  2. If CAS is inconclusive, fall back to numeric sampling
"""
import numpy as np
from sympy import symbols, sympify, simplify, SympifyError
from sympy.parsing.latex import parse_latex

x, y, t, C = symbols("x y t C")

SAMPLE_POINTS = 12
TOLERANCE = 1e-6


def _parse(latex_str: str):
    """Try to parse a LaTeX string into a SymPy expression."""
    try:
        expr = parse_latex(latex_str)
        return expr
    except Exception:
        try:
            # Fallback: try sympify directly (for simple expressions)
            return sympify(latex_str)
        except SympifyError:
            return None


def check_answer(user_latex: str, correct_latex: str) -> bool:
    """
    Return True if user_latex is mathematically equivalent to correct_latex.
    Handles indefinite integrals: checks that difference is a constant (C).
    """
    user_expr = _parse(user_latex)
    correct_expr = _parse(correct_latex)

    if user_expr is None or correct_expr is None:
        return False

    # CAS check: try to simplify the difference to 0 or a constant
    try:
        diff = simplify(user_expr - correct_expr)
        # If diff has no x/y/t dependence → constant difference → correct
        if not diff.free_symbols - {C}:
            return True
    except Exception:
        pass

    # Numeric fallback: sample random x values
    return _numeric_check(user_expr, correct_expr)


def _numeric_check(user_expr, correct_expr) -> bool:
    """Sample N random points, compare both expressions within tolerance."""
    try:
        rng = np.random.default_rng(42)
        sample_vals = rng.uniform(0.1, 3.0, SAMPLE_POINTS)

        for val in sample_vals:
            try:
                u = complex(user_expr.subs(x, val))
                c = complex(correct_expr.subs(x, val))
                if abs(u - c) > TOLERANCE:
                    # Allow for constant offset (indefinite integral)
                    # Compute offset at first point and check consistency
                    break
            except Exception:
                return False

        # Check with constant offset allowed
        offsets = []
        for val in sample_vals:
            try:
                u = complex(user_expr.subs(x, val))
                c = complex(correct_expr.subs(x, val))
                offsets.append(u - c)
            except Exception:
                return False

        if not offsets:
            return False

        # All offsets should be the same constant
        ref = offsets[0]
        return all(abs(o - ref) < TOLERANCE for o in offsets)

    except Exception:
        return False
