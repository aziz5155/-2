import subprocess, sys
from PIL import Image

CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"
OFFSET = 87  # empirically measured headless infobar offset in CSS px

def render(html_path, out_path, width=1920, height=1080, scale=2):
    win_h = height + OFFSET
    tmp = out_path + ".raw.png"
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
        f"--window-size={width},{win_h}",
        f"--force-device-scale-factor={scale}",
        f"--screenshot={tmp}",
        f"file://{html_path}"
    ], check=True, stderr=subprocess.DEVNULL)
    img = Image.open(tmp)
    cropped = img.crop((0, 0, width*scale, height*scale))
    cropped.save(out_path)
    print(out_path, cropped.size)

if __name__ == "__main__":
    html_path, out_path = sys.argv[1], sys.argv[2]
    width = int(sys.argv[3]) if len(sys.argv) > 3 else 1920
    height = int(sys.argv[4]) if len(sys.argv) > 4 else 1080
    scale = int(sys.argv[5]) if len(sys.argv) > 5 else 2
    render(html_path, out_path, width, height, scale)
