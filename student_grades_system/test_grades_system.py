"""Unit tests for grades_system.py  —  run with:  python3 -m unittest -v"""
import builtins
import io
import unittest
from contextlib import redirect_stdout
from unittest import mock

import grades_system as gs


class TestValidation(unittest.TestCase):
    def test_valid_names(self):
        self.assertTrue(gs.is_valid_name("Ahmed Ali"))
        self.assertTrue(gs.is_valid_name("سارة محمد"))     # Arabic letters

    def test_invalid_names(self):
        for bad in ("", "   ", "Ali123", "Sara!", "42"):
            self.assertFalse(gs.is_valid_name(bad), bad)

    def test_valid_grades(self):
        self.assertEqual(gs.parse_grade("0"), 0)
        self.assertEqual(gs.parse_grade("100"), 100)
        self.assertEqual(gs.parse_grade("72.5"), 72.5)

    def test_invalid_grades(self):
        for bad in ("", "abc", "-1", "100.1", "150", "nan", "inf"):
            self.assertIsNone(gs.parse_grade(bad), bad)


class TestProcessing(unittest.TestCase):
    def test_total_and_average(self):
        total = gs.calculate_total([85, 90, 78])
        self.assertEqual(total, 253)
        self.assertAlmostEqual(gs.calculate_average(total, 3), 84.3333, places=3)

    def test_status_pass(self):
        self.assertEqual(gs.determine_status(84.33), "PASS")

    def test_status_fail(self):
        self.assertEqual(gs.determine_status(41.67), "FAIL")

    def test_status_boundary(self):
        self.assertEqual(gs.determine_status(50), "PASS")       # exactly 50 passes
        self.assertEqual(gs.determine_status(49.99), "FAIL")

    def test_record(self):
        r = gs.build_student_record("Sara", [40, 35, 50])
        self.assertEqual(r["total"], 125)
        self.assertEqual(r["status"], "FAIL")


class TestFullProgram(unittest.TestCase):
    def run_main(self, answers):
        out = io.StringIO()
        with mock.patch.object(builtins, "input", side_effect=answers), redirect_stdout(out):
            gs.main()
        return out.getvalue()

    def test_pass_and_fail_students(self):
        out = self.run_main(["Ahmed Ali", "85", "90", "78", "y",
                             "Sara", "40", "35", "50", "n"])
        self.assertIn("Average = 84.33, Status = PASS", out)
        self.assertIn("Average = 41.67, Status = FAIL", out)
        self.assertIn("Passed             : 1", out)
        self.assertIn("Failed             : 1", out)

    def test_invalid_inputs_are_rejected_then_accepted(self):
        out = self.run_main(["", "Omar99", "Omar", "abc", "120", "-5", "60",
                             "70", "80", "maybe", "n"])
        self.assertEqual(out.count("[Error] Name"), 2)
        self.assertEqual(out.count("[Error] Grade"), 3)
        self.assertEqual(out.count("[Error] Please enter"), 1)
        self.assertIn("Status = PASS", out)


if __name__ == "__main__":
    unittest.main(verbosity=2)
