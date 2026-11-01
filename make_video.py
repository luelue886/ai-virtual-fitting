# -*- coding: utf-8 -*-
# 后期:大屏等待段 8 倍速 → 与手机段(居中补边)拼合 → H.264 mp4
# 时间戳来自 record_demo.py 产出的 .video-tmp/timestamps.json
import glob
import json
import subprocess
import sys

V1 = glob.glob('.video-tmp/vid1/*.webm')[0]
V2 = glob.glob('.video-tmp/vid2/*.webm')[0]
TS = json.loads(open('.video-tmp/timestamps.json', 'rb').read().decode('utf-8'))
A, B = TS['gen_start'], TS['gen_end']   # 生成等待段起止(秒)
SPD = 8


def run(*args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-y', *args],
                       capture_output=True, text=True, encoding='utf-8', errors='ignore')
    if r.returncode != 0:
        print(r.stderr[-800:])
        sys.exit(1)


# 段1:交互段(原速) 段2:生成等待(8x) 段3:结果展示(原速) —— 统一 25fps h264 中间件
run('-ss', '0', '-t', str(A), '-i', V1,
    '-vf', 'fps=25', '-c:v', 'libx264', '-crf', '22', '-preset', 'fast', '-an', '.video-tmp/p1.mp4')
run('-ss', str(A), '-t', str(B - A), '-i', V1,
    '-vf', f'setpts=(PTS-STARTPTS)/{SPD},fps=25', '-c:v', 'libx264', '-crf', '22', '-preset', 'fast', '-an', '.video-tmp/p2.mp4')
run('-ss', str(B), '-i', V1,
    '-vf', 'fps=25', '-c:v', 'libx264', '-crf', '22', '-preset', 'fast', '-an', '.video-tmp/p3.mp4')
# 段4:手机段 → 等高 900、居中补边到 1600x900
run('-i', V2,
    '-vf', 'fps=25,scale=-2:900,pad=1600:900:(ow-iw)/2:0:black,setsar=1',
    '-c:v', 'libx264', '-crf', '22', '-preset', 'fast', '-an', '.video-tmp/p4.mp4')

# 拼合 4 段 → 最终 mp4
run('-i', '.video-tmp/p1.mp4', '-i', '.video-tmp/p2.mp4',
    '-i', '.video-tmp/p3.mp4', '-i', '.video-tmp/p4.mp4',
    '-filter_complex', '[0:v][1:v][2:v][3:v]concat=n=4:v=1:a=0[out]',
    '-map', '[out]', '-c:v', 'libx264', '-crf', '25', '-preset', 'medium',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'assets/demo.mp4')

r = subprocess.run(['ffmpeg', '-hide_banner', '-i', 'assets/demo.mp4'],
                   capture_output=True, text=True, encoding='utf-8', errors='ignore')
for line in r.stderr.splitlines():
    if 'Duration' in line or 'Video:' in line:
        print(line.strip())
print('DONE')
