"""Add a simple native PowerPoint fade transition to every slide of a .pptx."""
import re
import sys
import zipfile
import shutil
import os

def add_fade_transitions(pptx_path):
    tmp_path = pptx_path + ".tmp"
    with zipfile.ZipFile(pptx_path, "r") as zin:
        names = zin.namelist()
        slide_names = sorted(
            [n for n in names if re.match(r"ppt/slides/slide\d+\.xml$", n)],
            key=lambda n: int(re.search(r"\d+", os.path.basename(n)).group())
        )
        with zipfile.ZipFile(tmp_path, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                data = zin.read(item.filename)
                if item.filename in slide_names:
                    text = data.decode("utf-8")
                    if "<p:transition" not in text:
                        text = text.replace(
                            "</p:cSld>",
                            '</p:cSld><p:transition spd="med"><p:fade/></p:transition>',
                            1
                        )
                    data = text.encode("utf-8")
                zout.writestr(item, data)
    shutil.move(tmp_path, pptx_path)
    print(f"added fade transition to {len(slide_names)} slides in {pptx_path}")

if __name__ == "__main__":
    add_fade_transitions(sys.argv[1])
