"""
Generates the program flowchart (flowchart.png and flowchart.pdf).
Requires: pip install matplotlib
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Polygon

W, H = 3.8, 1.0            # default shape width / height
DW, DH = 4.0, 1.25         # decision (diamond) width / height
COL = {"term": "#C8E6C9", "io": "#BBDEFB", "proc": "#FFF9C4",
       "dec": "#FFE0B2", "err": "#FFCDD2", "pass": "#A5D6A7", "fail": "#EF9A9A"}

fig, ax = plt.subplots(figsize=(12, 27))
ax.set_xlim(0, 12)
ax.set_ylim(11.6, 41.4)
ax.axis("off")


def terminal(x, y, text):
    ax.add_patch(FancyBboxPatch((x - 1.4, y - 0.4), 2.8, 0.8,
                 boxstyle="round,pad=0,rounding_size=0.4",
                 fc=COL["term"], ec="black", lw=1.6))
    ax.text(x, y, text, ha="center", va="center", fontsize=13, weight="bold")


def process(x, y, text, color="proc", w=W, h=H):
    ax.add_patch(plt.Rectangle((x - w / 2, y - h / 2), w, h,
                 fc=COL[color], ec="black", lw=1.4))
    ax.text(x, y, text, ha="center", va="center", fontsize=10.5)


def io(x, y, text, w=W, h=H):
    s = 0.3
    ax.add_patch(Polygon([(x - w / 2 + s, y + h / 2), (x + w / 2 + s, y + h / 2),
                          (x + w / 2 - s, y - h / 2), (x - w / 2 - s, y - h / 2)],
                 fc=COL["io"], ec="black", lw=1.4))
    ax.text(x, y, text, ha="center", va="center", fontsize=10.5)


def decision(x, y, text):
    ax.add_patch(Polygon([(x, y + DH / 2), (x + DW / 2, y), (x, y - DH / 2), (x - DW / 2, y)],
                 fc=COL["dec"], ec="black", lw=1.4))
    ax.text(x, y, text, ha="center", va="center", fontsize=10, weight="bold")


def arrow(points, label=None, label_at=0, offset=(0.15, 0.12)):
    """Draw a poly-line through points with an arrow head at the end."""
    for (x1, y1), (x2, y2) in zip(points[:-2], points[1:-1]):
        ax.plot([x1, x2], [y1, y2], color="black", lw=1.3)
    ax.annotate("", xy=points[-1], xytext=points[-2],
                arrowprops=dict(arrowstyle="-|>", color="black", lw=1.3, mutation_scale=16))
    if label:
        lx, ly = points[label_at]
        ax.text(lx + offset[0], ly + offset[1], label, fontsize=10.5, weight="bold",
                color="#1B5E20" if label == "Yes" else "#B71C1C")


X = 5.0          # main column
XE = 9.0         # error boxes column
XR = 11.3        # right connector line
XL1 = 0.6        # outer loop (another student)
XL2 = 2.1        # inner loop (subjects)

# ---- y positions ----
y_start, y_init, y_name, y_dname = 40.6, 39.2, 37.8, 36.2
y_initg, y_dloop, y_grade, y_dgrade, y_add = 34.6, 33.0, 31.4, 29.8, 28.2
y_calc, y_davg, y_status, y_save = 26.4, 24.8, 23.2, 21.6
y_ans, y_dans, y_dmore, y_out, y_end = 20.0, 18.4, 16.6, 14.6, 12.8

ax.text(6, 41.15, "Flowchart - Student Grades Management System",
        ha="center", fontsize=16, weight="bold")

terminal(X, y_start, "START")
process(X, y_init, "students = [ ]\n(empty list of records)")
io(X, y_name, "Input student name")
decision(X, y_dname, "Name valid?\n(letters only)")
process(XE, y_dname, "Display error:\ninvalid name", "err", w=2.8, h=0.9)
process(X, y_initg, "grades = [ ]\ni = 1  (subject counter)")
decision(X, y_dloop, "i <= 3 ?")
io(X, y_grade, "Input grade of subject i\n(Math, Science, English)")
decision(X, y_dgrade, "Number and\n0 <= grade <= 100?")
process(XE, y_dgrade, "Display error:\ninvalid grade", "err", w=2.8, h=0.9)
process(X, y_add, "Add grade to grades\ni = i + 1")
process(X, y_calc, "total = sum of grades\naverage = total / 3")
decision(X, y_davg, "average >= 50 ?")
process(2.6, y_status, "status = PASS", "pass", w=2.6, h=0.8)
process(7.4, y_status, "status = FAIL", "fail", w=2.6, h=0.8)
process(X, y_save, "Save record (name, grades, total,\naverage, status) & display it")
io(X, y_ans, "Input: Add another student? (y/n)")
decision(X, y_dans, "Answer is\ny or n ?")
process(XE, y_dans, "Display error:\nenter y or n", "err", w=2.8, h=0.9)
decision(X, y_dmore, "Answer = y ?")
io(X, y_out, "Display results table +\nsummary (passed, failed, class avg)", w=4.4, h=1.1)
terminal(X, y_end, "END")

# ---- main flow ----
arrow([(X, y_start - 0.4), (X, y_init + H / 2)])
arrow([(X, y_init - H / 2), (X, y_name + H / 2)])
arrow([(X, y_name - H / 2), (X, y_dname + DH / 2)])
arrow([(X, y_dname - DH / 2), (X, y_initg + H / 2)], "Yes", 0, (0.15, -0.35))
arrow([(X + DW / 2, y_dname), (XE - 1.4, y_dname)], "No", 0, (0.1, 0.12))
arrow([(XE, y_dname + 0.45), (XE, y_name), (X + W / 2 + 0.2, y_name)])

arrow([(X, y_initg - H / 2), (X, y_dloop + DH / 2)])
arrow([(X, y_dloop - DH / 2), (X, y_grade + H / 2)], "Yes", 0, (0.15, -0.35))
arrow([(X, y_grade - H / 2), (X, y_dgrade + DH / 2)])
arrow([(X + DW / 2, y_dgrade), (XE - 1.4, y_dgrade)], "No", 0, (0.1, 0.12))
arrow([(XE, y_dgrade + 0.45), (XE, y_grade), (X + W / 2 + 0.2, y_grade)])
arrow([(X, y_dgrade - DH / 2), (X, y_add + H / 2)], "Yes", 0, (0.15, -0.35))
# inner loop back to i <= 3
arrow([(X - W / 2, y_add), (XL2, y_add), (XL2, y_dloop), (X - DW / 2, y_dloop)])
ax.text(XL2 - 0.15, (y_add + y_dloop) / 2, "repeat for\nnext subject", rotation=90,
        ha="right", va="center", fontsize=9, style="italic")
# i > 3 -> calculations
arrow([(X + DW / 2, y_dloop), (XR, y_dloop), (XR, y_calc + 1.0), (X, y_calc + 1.0),
       (X, y_calc + H / 2)], "No", 0, (0.1, 0.12))

arrow([(X, y_calc - H / 2), (X, y_davg + DH / 2)])
arrow([(X - DW / 2, y_davg), (2.6, y_davg), (2.6, y_status + 0.4)], "Yes", 0, (-0.6, 0.12))
arrow([(X + DW / 2, y_davg), (7.4, y_davg), (7.4, y_status + 0.4)], "No", 0, (0.1, 0.12))
ax.plot([2.6, 2.6, 7.4, 7.4], [y_status - 0.4, y_save + 0.9, y_save + 0.9, y_status - 0.4],
        color="black", lw=1.3)
arrow([(X, y_save + 0.9), (X, y_save + H / 2)])

arrow([(X, y_save - H / 2), (X, y_ans + H / 2)])
arrow([(X, y_ans - H / 2), (X, y_dans + DH / 2)])
arrow([(X + DW / 2, y_dans), (XE - 1.4, y_dans)], "No", 0, (0.1, 0.12))
arrow([(XE, y_dans + 0.45), (XE, y_ans), (X + W / 2 + 0.2, y_ans)])
arrow([(X, y_dans - DH / 2), (X, y_dmore + DH / 2)], "Yes", 0, (0.15, -0.35))
# outer loop: another student
arrow([(X - DW / 2, y_dmore), (XL1, y_dmore), (XL1, y_name), (X - W / 2 - 0.2, y_name)],
      "Yes", 0, (-0.6, 0.12))
ax.text(XL1 - 0.15, 27, "next student", rotation=90, ha="right", va="center",
        fontsize=9, style="italic")
arrow([(X, y_dmore - DH / 2), (X, y_out + 0.55)], "No", 0, (0.15, -0.35))
arrow([(X, y_out - 0.55), (X, y_end + 0.4)])

# ---- legend ----
lx, ly = 8.1, 14.6
ax.text(lx, ly + 1.15, "Legend", fontsize=11, weight="bold")
for i, (name, c) in enumerate([("Start / End", "term"), ("Input / Output", "io"),
                               ("Process", "proc"), ("Decision", "dec"), ("Error message", "err")]):
    ax.add_patch(plt.Rectangle((lx, ly + 0.55 - i * 0.55), 0.5, 0.35, fc=COL[c], ec="black"))
    ax.text(lx + 0.7, ly + 0.72 - i * 0.55, name, va="center", fontsize=10)

plt.savefig("flowchart.png", dpi=150, bbox_inches="tight")
plt.savefig("flowchart.pdf", bbox_inches="tight")
print("Saved flowchart.png and flowchart.pdf")
