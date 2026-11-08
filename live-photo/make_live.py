"""Build an Apple Live Photo pair (JPEG + MOV) from a video.

usage: make_live.py <video> <out_dir> <still_seconds>
"""
import os, struct, subprocess, sys, uuid
from PIL import Image

src, out_dir, still_t = sys.argv[1], sys.argv[2], float(sys.argv[3])
os.makedirs(out_dir, exist_ok=True)
cid = str(uuid.uuid4()).upper()
jpg = os.path.join(out_dir, "IMG_4080.JPG")
mov = os.path.join(out_dir, "IMG_4080.MOV")
tmp_mov = os.path.join(out_dir, "_tmp.mov")

# ---------- photo ----------
raw = os.path.join(out_dir, "_frame.png")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(still_t), "-i", src,
                "-frames:v", "1", raw], check=True)

def apple_makernote(content_id: str) -> bytes:
    # "Apple iOS\0" + version 1 + "MM", IFD at offset 14, offsets relative to start
    head = b"Apple iOS\x00" + struct.pack(">H", 1) + b"MM"
    s = content_id.encode() + b"\x00"
    n = 2
    ifd_len = 2 + n * 12 + 4
    data_off = len(head) + ifd_len
    ifd = struct.pack(">H", n)
    ifd += struct.pack(">HHI", 0x0001, 9, 1) + struct.pack(">i", 14)  # MakerNoteVersion
    ifd += struct.pack(">HHII", 0x0011, 2, len(s), data_off)          # ContentIdentifier
    ifd += struct.pack(">I", 0)
    return head + ifd + s

im = Image.open(raw).convert("RGB")
exif = Image.Exif()
exif[0x010F] = "Apple"
exif[0x0110] = "iPhone"
exif[0x0112] = 1
sub = exif.get_ifd(0x8769)
sub[0x927C] = apple_makernote(cid)
im.save(jpg, "JPEG", quality=95, exif=exif.tobytes())
os.remove(raw)

# ---------- video ----------
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-map", "0", "-c", "copy",
                "-f", "mov", "-movflags", "use_metadata_tags",
                "-metadata", f"com.apple.quicktime.content.identifier={cid}",
                tmp_mov], check=True)

data = open(tmp_mov, "rb").read()

def boxes(buf, start=0, end=None):
    end = len(buf) if end is None else end
    i = start
    while i < end:
        size, typ = struct.unpack(">I4s", buf[i:i + 8])
        hdr = 8
        if size == 1:
            size = struct.unpack(">Q", buf[i + 8:i + 16])[0]; hdr = 16
        elif size == 0:
            size = end - i
        yield typ.decode("latin1"), i, size, hdr
        i += size

def box(typ, payload):
    return struct.pack(">I4s", 8 + len(payload), typ.encode()) + payload

def fbox(typ, ver, flags, payload):
    return box(typ, struct.pack(">I", (ver << 24) | flags) + payload)

top = list(boxes(data))
names = [t for t, *_ in top]
assert names.index("mdat") < names.index("moov"), names
moov_t, moov_off, moov_size, moov_hdr = next(b for b in top if b[0] == "moov")
before_moov = data[:moov_off]
moov_children = data[moov_off + moov_hdr: moov_off + moov_size]

# movie timescale / next track id from mvhd
mv = next(b for b in boxes(moov_children) if b[0] == "mvhd")
mvhd = bytearray(moov_children[mv[1]: mv[1] + mv[2]])
ver = mvhd[8]
if ver == 0:
    movie_ts, movie_dur = struct.unpack(">II", mvhd[20:28])
    ntid_off = 8 + 4 + 4 + 4 + 4 + 4 + 4 + 2 + 10 + 36 + 24
else:
    movie_ts, movie_dur = struct.unpack(">IQ", mvhd[28:40])
    ntid_off = 8 + 4 + 8 + 8 + 4 + 8 + 4 + 2 + 10 + 36 + 24
next_tid = struct.unpack(">I", mvhd[ntid_off:ntid_off + 4])[0]
struct.pack_into(">I", mvhd, ntid_off, next_tid + 1)

# sample: [size][local key id = 1][int8 -1]
sample = struct.pack(">II", 9, 1) + b"\xff"
mdat2 = box("mdat", sample)
sample_off = len(before_moov) + 8

media_ts = 30000
frame_dur = 1001
still_movie = int(round(still_t * movie_ts))
frame_movie = max(1, int(round(frame_dur / media_ts * movie_ts)))
tid = next_tid
matrix = struct.pack(">9I", 0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000)

tkhd = fbox("tkhd", 0, 0xF, struct.pack(">IIII", 0, 0, tid, 0) +
            struct.pack(">I", still_movie + frame_movie) + b"\x00" * 8 +
            struct.pack(">hhhH", 0, 0, 0, 0) + matrix + struct.pack(">II", 0, 0))
elst = fbox("elst", 0, 0, struct.pack(">I", 2) +
            struct.pack(">Iih", still_movie, -1, 1) + b"\x00\x00" +
            struct.pack(">Iih", frame_movie, 0, 1) + b"\x00\x00")
edts = box("edts", elst)
mdhd = fbox("mdhd", 0, 0, struct.pack(">IIII", 0, 0, media_ts, frame_dur) +
            struct.pack(">HH", 0x55C4, 0))
hdlr = fbox("hdlr", 0, 0, b"mhlr" + b"meta" + b"\x00" * 12 + b"\x00")
dref = fbox("dref", 0, 0, struct.pack(">I", 1) + fbox("alis", 0, 1, b""))
dinf = box("dinf", dref)
dhdlr = fbox("hdlr", 0, 0, b"dhlr" + b"alis" + b"\x00" * 12 + b"\x00")

key = "com.apple.quicktime.still-image-time".encode()
keyd = box("keyd", b"mdta" + key)
dtyp = box("dtyp", struct.pack(">II", 0, 0x41))  # well-known type: signed int8
key_entry = struct.pack(">I", 8 + len(keyd) + len(dtyp)) + struct.pack(">I", 1) + keyd + dtyp
keys = box("keys", key_entry)
mebx = box("mebx", b"\x00" * 6 + struct.pack(">H", 1) + keys)
stsd = fbox("stsd", 0, 0, struct.pack(">I", 1) + mebx)
stts = fbox("stts", 0, 0, struct.pack(">III", 1, 1, frame_dur))
stsc = fbox("stsc", 0, 0, struct.pack(">IIII", 1, 1, 1, 1))
stsz = fbox("stsz", 0, 0, struct.pack(">III", 0, 1, len(sample)))
stco = fbox("stco", 0, 0, struct.pack(">II", 1, sample_off))
stbl = box("stbl", stsd + stts + stsc + stsz + stco)
gmhd = box("gmhd", fbox("gmin", 0, 0, struct.pack(">HHHHHH", 0x40, 0x8000, 0x8000, 0x8000, 0, 0)))
minf = box("minf", gmhd + dhdlr + dinf + stbl)
mdia = box("mdia", mdhd + hdlr + minf)
trak = box("trak", tkhd + edts + mdia)

new_children = b""
for t, off, size, hdr in boxes(moov_children):
    if t == "mvhd":
        new_children += bytes(mvhd)
    else:
        new_children += moov_children[off:off + size]
    if t == "mvhd":
        pass
# insert the metadata track after the last trak
parts = list(boxes(new_children))
last_trak_end = max(off + size for t, off, size, _ in parts if t == "trak")
new_children = new_children[:last_trak_end] + trak + new_children[last_trak_end:]

with open(mov, "wb") as f:
    f.write(before_moov + mdat2 + box("moov", new_children))
os.remove(tmp_mov)

# stamp photo date to match the video
subprocess.run(["exiftool", "-q", "-overwrite_original",
                "-tagsFromFile", mov,
                "-DateTimeOriginal<CreateDate", "-CreateDate<CreateDate", jpg], check=False)
print(cid)
