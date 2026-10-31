# ============================================================
# 阿里云百炼 · qwen-image 图像生成与编辑(生成+编辑一体模型)
# 实测可用:qwen-image-3.0-pro(原生多模态端点,base64 直传,同步返回)
# 注:百炼旧版 OutfitAnyone/aitryon 专用试衣 API 已下线,
#     现行方案为多图参考编辑(人物图 + 服装图 + 文字指令)。
# ============================================================

import base64
import mimetypes
from pathlib import Path

import httpx

DASHSCOPE_BASE = "https://dashscope.aliyuncs.com"
GEN_PATH = "/api/v1/services/aigc/multimodal-generation/generation"

DEFAULT_MODEL = "qwen-image-3.0-pro"  # 备选:qwen-image-2.1-pro


class DashScopeError(Exception):
    """百炼接口错误(含 HTTP 非 2xx 与业务错误)。"""


def image_b64(path: Path) -> str:
    """读本地素材图转 base64 data URL(素材不落公网,直传生成服务)。"""
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    data = base64.b64encode(path.read_bytes()).decode()
    return f"data:{mime};base64,{data}"


def build_prompt(garment_name: str, fabric: str, has_bottom: bool) -> str:
    """按服装构造换装指令:锁人脸/发型/姿态/背景,服装贴合身形。"""
    garment_desc = f"{garment_name}({fabric})" if fabric else garment_name
    if has_bottom:
        return (
            "让第一张图中的人物穿上第二张图所示的上装与第三张图所示的下装,"
            f"即{garment_desc}的整套穿搭。保持人物的脸型、发型、站姿和背景完全不变,"
            "服装自然贴合身形,真实照片质感。"
        )
    return (
        f"让第一张图中的人物穿上第二张图所示的{garment_desc}。"
        "保持人物的脸型、发型、站姿和背景完全不变,服装自然贴合身形,真实照片质感。"
    )


async def generate_tryon(
    client: httpx.AsyncClient,
    api_key: str,
    person: str,
    top: str,
    bottom: str | None,
    garment_name: str,
    fabric: str = "",
    model: str = DEFAULT_MODEL,
) -> str:
    """提交换装生成(同步接口,通常 20-60 秒),返回结果图 URL(24 小时有效)。"""
    content = [{"image": person}, {"image": top}]
    if bottom:
        content.append({"image": bottom})
    content.append({"text": build_prompt(garment_name, fabric, bool(bottom))})

    r = await client.post(
        DASHSCOPE_BASE + GEN_PATH,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={
            "model": model,
            "input": {"messages": [{"role": "user", "content": content}]},
        },
        timeout=httpx.Timeout(240, connect=30),
    )
    if r.status_code != 200:
        raise DashScopeError(f"生成失败 HTTP {r.status_code}: {r.text[:200]}")
    out = r.json().get("output", {})
    if out.get("rewrite_status", "success") != "success":
        raise DashScopeError(f"生成失败: {str(out)[:200]}")
    try:
        url = out["choices"][0]["message"]["content"][0]["image"]
    except (KeyError, IndexError):
        raise DashScopeError(f"返回中无结果图: {str(out)[:200]}")
    return url


async def download_image(client: httpx.AsyncClient, url: str, dest: Path) -> Path:
    """下载结果图到本地(云端 URL 24 小时失效,落盘供手机端扫码回看)。"""
    r = await client.get(url, timeout=60)
    r.raise_for_status()
    dest.write_bytes(r.content)
    return dest
