"""
Runs grades_system.py with prepared test cases and prints a full transcript
(prompts + the typed input) so that the run can be documented.
Usage:  python3 run_test_cases.py
"""
import builtins

import grades_system as gs

TEST_CASES = {
    "Test 1 - Passing student": ["Ahmed Ali", "85", "90", "78", "n"],
    "Test 2 - Failing student": ["Sara Hassan", "40", "35", "50", "n"],
    "Test 3 - Boundary case (average exactly 50 -> PASS)": ["Khalid", "50", "50", "50", "n"],
    "Test 4 - Boundary case (average 49.67 -> FAIL)": ["Mona", "49", "50", "50", "n"],
    "Test 5 - Invalid inputs (validation)": [
        "", "Omar99", "Omar Saleh", "abc", "120", "-5", "60", "70.5", "80", "maybe", "n"],
    "Test 6 - Several students (full class)": [
        "Ahmed Ali", "85", "90", "78", "y",
        "Sara Hassan", "40", "35", "50", "y",
        "Khalid", "100", "100", "100", "Y",
        "Mona", "0", "20", "30", "y",
        "Fatimah", "55", "45", "60", "no"],
}


def run_case(title, answers):
    feed = iter(answers)

    def fake_input(prompt=""):
        value = next(feed)
        print(prompt + value)          # echo what the user "typed"
        return value

    print("#" * 78)
    print(f"# {title}")
    print("#" * 78)
    original = builtins.input
    builtins.input = fake_input
    try:
        gs.main()
    finally:
        builtins.input = original
    print()


if __name__ == "__main__":
    for title, answers in TEST_CASES.items():
        run_case(title, answers)
