# -*- coding: utf-8 -*-
# 全流程演示视频录制:大屏端(真实 AI 生成)+ 手机端(扫码承接)
# 产出:.video-tmp/vid1/*.webm(大屏)、.video-tmp/vid2/*.webm(手机)、timestamps.json
import asyncio
import json
import time
from pathlib import Path

from playwright.async_api import async_playwright

BASE = "http://localhost:8177"
OUT = Path(".video-tmp")
TS = {}


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # ---------- 大屏端 ----------
        ctx = await browser.new_context(
            viewport={"width": 1600, "height": 900},
            record_video_dir=str(OUT / "vid1"),
            record_video_size={"width": 1600, "height": 900},
        )
        page = await ctx.new_page()
        t0 = time.time()

        def vt():
            return round(time.time() - t0, 2)

        await page.goto(BASE, wait_until="networkidle")
        await page.wait_for_timeout(4500)                       # 吸引页动效
        await page.click("#startBtn", force=True)
        await page.wait_for_timeout(2200)
        await page.click(".model-card[data-id='m2']", force=True)           # 选形象·安然
        await page.wait_for_timeout(1800)
        await page.click("#toGarment", force=True)
        await page.wait_for_timeout(1800)
        await page.click(".garment-card[data-id='c3']", force=True)         # 挑服装·墨绿连衣裙
        await page.wait_for_timeout(1800)

        await page.click("#startGen", force=True)                            # 开始真实 AI 生成
        TS["gen_start"] = vt() + 0.2

        # 轮询结果(0.5s 精度),拿到精确出现时刻与 taskId
        for _ in range(500):
            img = await page.query_selector("#resultFigure img[src*='/api/result/']")
            if img:
                break
            await page.wait_for_timeout(500)
        else:
            raise RuntimeError("生成超时")
        TS["gen_end"] = vt() - 0.3
        src = await img.get_attribute("src")
        task_id = src.rsplit("/", 1)[-1]
        await page.wait_for_timeout(5500)                        # 展示结果大图 + 二维码
        TS["screen_end"] = vt()

        v1 = page.video
        await ctx.close()
        TS["v1"] = str(await v1.path())

        # ---------- 手机端(扫码承接,复用刚生成的结果) ----------
        ctx2 = await browser.new_context(
            viewport={"width": 390, "height": 780},
            record_video_dir=str(OUT / "vid2"),
            record_video_size={"width": 390, "height": 780},
            device_scale_factor=2,
            is_mobile=True,
            has_touch=True,
        )
        page2 = await ctx2.new_page()
        await page2.goto(f"{BASE}/phone.html?m=m2&c=c3&r={task_id}", wait_until="networkidle")
        await page2.wait_for_timeout(3000)
        for y in (500, 500, 500, 500):                           # 缓慢滚动浏览
            await page2.mouse.wheel(0, y)
            await page2.wait_for_timeout(800)
        await page2.evaluate("window.scrollTo(0, 0)")
        await page2.wait_for_timeout(900)

        await page2.locator("#couponBtn").scroll_into_view_if_needed()
        await page2.wait_for_timeout(500)
        await page2.tap("#couponBtn", force=True)                            # 领券
        await page2.wait_for_timeout(1600)

        await page2.tap("#bookBtn2", force=True)                             # 预约(底部常驻按钮)
        await page2.wait_for_timeout(1100)
        await page2.tap("#slotGrid .slot:nth-child(2)", force=True)
        await page2.wait_for_timeout(700)
        await page2.tap("#bookConfirm", force=True)
        await page2.wait_for_timeout(2800)

        v2 = page2.video
        await ctx2.close()
        TS["v2"] = str(await v2.path())
        TS["task_id"] = task_id
        await browser.close()

    (OUT / "timestamps.json").write_text(json.dumps(TS, ensure_ascii=False, indent=1), encoding="utf-8")
    print(json.dumps(TS, ensure_ascii=False, indent=1))


asyncio.run(main())
