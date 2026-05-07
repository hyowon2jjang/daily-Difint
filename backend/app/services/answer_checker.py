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


SAMPLE_RANGES = [
    (1.5, 8.0),    # avoids x=1 singularity and log(negative) for (x-1)/(x+1)
    (0.1, 0.9),    # (0,1) domain for arcsin/arccos type answers
    (8.0, 20.0),   # large x
    (-0.9, -0.1),  # negative domain
    (-8.0, -1.5),  # large negative
]


def _numeric_check(user_expr, correct_expr) -> bool:
    """Try multiple sample ranges; accept if any range gives consistent real offsets."""
    rng = np.random.default_rng(42)

    for lo, hi in SAMPLE_RANGES:
        samples = rng.uniform(lo, hi, SAMPLE_POINTS)
        offsets = []
        valid = True

        for val in samples:
            try:
                u = complex(user_expr.subs(x, val))
                c = complex(correct_expr.subs(x, val))
                if not (np.isfinite(u.real) and np.isfinite(c.real)):
                    valid = False
                    break
                # Skip range if either expression is complex on this domain
                if abs(u.imag) > 1e-6 or abs(c.imag) > 1e-6:
                    valid = False
                    break
                offsets.append(u.real - c.real)
            except Exception:
                valid = False
                break

        if not valid or len(offsets) < SAMPLE_POINTS:
            continue

        ref = offsets[0]
        if all(abs(o - ref) < TOLERANCE for o in offsets):
            return True

    return False
