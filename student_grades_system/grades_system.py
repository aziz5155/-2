"""
Student Grades Management System

Topic 3: Programming (Python)

The program:
    1. Reads a student's name and grades in three subjects (with validation).
    2. Calculates the total and the average.
    3. Decides the status: PASS if average >= 50, otherwise FAIL.
    4. Repeats for as many students as the user wants.
    5. Displays all results in an organized table plus a class summary.
"""

# ----------------------------------------------------------------------
# Constants
# ----------------------------------------------------------------------
SUBJECTS = ("Math", "Science", "English")   # the three subjects
MIN_GRADE = 0                                # lowest allowed grade
MAX_GRADE = 100                              # highest allowed grade
PASS_MARK = 50                               # minimum average to pass


# ----------------------------------------------------------------------
# Input functions with validation
# ----------------------------------------------------------------------
def is_valid_name(name):
    """A valid name is not empty and contains only letters and spaces."""
    name = name.strip()
    if name == "":
        return False
    return all(ch.isalpha() or ch == " " for ch in name)


def get_student_name():
    """Ask for the student's name until a valid one is entered."""
    while True:
        name = input("Enter student name: ").strip()
        if is_valid_name(name):
            return name
        print("  [Error] Name must not be empty and must contain letters only.")


def parse_grade(text):
    """
    Convert text to a grade.
    Returns the grade as float if valid (number between 0 and 100),
    otherwise returns None.
    """
    try:
        grade = float(text)
    except ValueError:
        return None
    if grade != grade:            # rejects "nan"
        return None
    if MIN_GRADE <= grade <= MAX_GRADE:
        return grade
    return None


def get_grade(subject):
    """Ask for a subject grade until a valid number (0-100) is entered."""
    while True:
        grade = parse_grade(input(f"  Enter {subject} grade (0-100): ").strip())
        if grade is not None:
            return grade
        print(f"  [Error] Grade must be a number between {MIN_GRADE} and {MAX_GRADE}.")


def ask_continue():
    """Ask whether to add another student. Accepts y/yes or n/no only."""
    while True:
        answer = input("Add another student? (y/n): ").strip().lower()
        if answer in ("y", "yes"):
            return True
        if answer in ("n", "no"):
            return False
        print("  [Error] Please enter 'y' or 'n'.")


# ----------------------------------------------------------------------
# Processing functions
# ----------------------------------------------------------------------
def calculate_total(grades):
    """Return the sum of the grades."""
    total = 0
    for grade in grades:
        total += grade
    return total


def calculate_average(total, count):
    """Return the average = total / count."""
    return total / count


def determine_status(average):
    """Return 'PASS' if the average is >= PASS_MARK, otherwise 'FAIL'."""
    if average >= PASS_MARK:
        return "PASS"
    return "FAIL"


def build_student_record(name, grades):
    """Process one student's data and return a dictionary record."""
    total = calculate_total(grades)
    average = calculate_average(total, len(grades))
    status = determine_status(average)
    return {
        "name": name,
        "grades": grades,
        "total": total,
        "average": average,
        "status": status,
    }


# ----------------------------------------------------------------------
# Output function
# ----------------------------------------------------------------------
def display_results(students):
    """Print all students in a table, followed by a class summary."""
    line = "=" * 78
    print("\n" + line)
    print("STUDENT RESULTS".center(78))
    print(line)
    header = f"{'No.':<4}{'Name':<18}"
    for subject in SUBJECTS:
        header += f"{subject:>9}"
    header += f"{'Total':>9}{'Average':>9}{'Status':>8}"
    print(header)
    print("-" * 78)

    passed = 0
    for number, student in enumerate(students, start=1):
        row = f"{number:<4}{student['name'][:17]:<18}"
        for grade in student["grades"]:
            row += f"{grade:>9.1f}"
        row += f"{student['total']:>9.1f}{student['average']:>9.2f}{student['status']:>8}"
        print(row)
        if student["status"] == "PASS":
            passed += 1

    failed = len(students) - passed
    class_average = calculate_average(
        calculate_total([s["average"] for s in students]), len(students)
    )
    print("-" * 78)
    print(f"Number of students : {len(students)}")
    print(f"Passed             : {passed}")
    print(f"Failed             : {failed}")
    print(f"Class average      : {class_average:.2f}")
    print(line)


# ----------------------------------------------------------------------
# Main program
# ----------------------------------------------------------------------
def main():
    print("=" * 78)
    print("STUDENT GRADES MANAGEMENT SYSTEM".center(78))
    print(f"Subjects: {', '.join(SUBJECTS)}  |  Pass mark (average): {PASS_MARK}".center(78))
    print("=" * 78)

    students = []                     # list that stores all student records
    more = True
    while more:                       # loop: one iteration per student
        print(f"\n--- Student #{len(students) + 1} ---")
        name = get_student_name()
        grades = []
        for subject in SUBJECTS:      # loop: one iteration per subject
            grades.append(get_grade(subject))
        record = build_student_record(name, grades)
        students.append(record)
        print(f"  -> Total = {record['total']:.1f}, "
              f"Average = {record['average']:.2f}, Status = {record['status']}")
        more = ask_continue()

    display_results(students)
    print("Program finished. Goodbye!")


if __name__ == "__main__":
    try:
        main()
    except (KeyboardInterrupt, EOFError):
        print("\nInput ended. Program stopped.")
