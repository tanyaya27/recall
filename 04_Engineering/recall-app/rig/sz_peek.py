import sys
from PIL import Image
# usage: sz_peek.py out.png height f1 f2 ...
out, h = sys.argv[1], int(sys.argv[2]); ims = [Image.open(f).convert('RGB') for f in sys.argv[3:]]
ims = [i.resize((int(i.width * h / i.height), h), Image.LANCZOS) for i in ims]
W = sum(i.width for i in ims) + 10 * (len(ims) - 1); c = Image.new('RGB', (W, h), 'white'); x = 0
for i in ims: c.paste(i, (x, 0)); x += i.width + 10
c.save(out)
