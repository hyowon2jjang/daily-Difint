from app.services.answer_checker import check_answer

print(check_answer(r"\frac{x^3}{3}", r"\frac{x^3}{3}"))   # should be True
print(check_answer(r"\frac{x^3}{3} + C", r"\frac{x^3}{3}"))  # should be True
print(check_answer(r"x^3/3", r"\frac{x^3}{3}"))              # should be True
print(check_answer(r"x^2", r"\frac{x^3}{3}"))                # should be False
