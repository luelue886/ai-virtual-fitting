# ============================================================
# 「衣然」本地后端：静态托管 + 真实 AI 试穿生成
#
#   python server/app.py            → http://localhost:8177
#   （取代原 python -m http.server，原纯静态模式仍可用于 GitHub Pages）
#
# 生成链路（实测可用）：百炼 qwen-image-3.0-pro 多图参考编辑
#   人物图 + 服装图(base64 直传) → 同步生成 20-60s → 结果图落盘
#   注:旧版 OutfitAnyone 试衣 API 已被百炼下线,故改用此方案。
#
# 接口约定（前端 js/generator.js 依赖,对外契约不变）：
#   GET  /api/health          → {ok, mode: "api"|"mock", assetsReady}
#   POST /api/tryon           → {taskId}   启动后台生成(不占住 HTTP 连接)
#   GET  /api/tryon/{taskId}  → {status: running|succeeded|failed, imageUrl?}
#   GET  /api/result/{taskId} → 结果图片文件
#
# 环境变量（读项目根 .env,见 .env.example）：
#   DASHSCOPE_API_KEY    百炼 API Key,未配置时 mode=mock(前端自动回退 Mock)
#   QWEN_IMAGE_MODEL     可选,默认 qwen-image-3.0-pro(备选 qwen-image-2.1-pro)
#   注意:.env 修改后需重启本服务才生效。
# ============================================================

import asyncio
import os
import re
import socket
import sys
import uuid
from pathlib import Path

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).resolve().parent))
import dashscope  # noqa: E402  （同目录导入）

ROOT = Path(__file__).resolve().parent.parent
SERVER_DIR = Path(__file__).resolve().parent
RESULTS_DIR = SERVER_DIR / "results"
RESULTS_DIR.mkdir(exist_ok=True)
ASSETS_DIR = ROOT / "assets"


# ---------- .env 加载（零依赖解析,只在启动时读一次,改动需重启） ----------
# 注意:.env 中的值【强制覆盖】继承的环境变量——避免系统里残留的同名旧值
# (如曾用 setx 设置过的 DASHSCOPE_API_KEY)把服务指向错误 Key。

def load_dotenv() -> None:
    env_file = ROOT / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        if value.strip():  # 空值不覆盖(避免误清空)
            os.environ[key.strip()] = value.strip()


load_dotenv()

DASHSCOPE_API_KEY = os.environ.get("DASHSCOPE_API_KEY", "").strip()
QWEN_IMAGE_MODEL = os.environ.get("QWEN_IMAGE_MODEL", dashscope.DEFAULT_MODEL).strip()

TASK_ID_RE = re.compile(r"^[A-Za-z0-9\-_]+$")
PORT = 8177


def assets_ready() -> bool:
    """素材是否已就位（至少 1 张模特照 + 1 张上装图）。"""
    models = list((ASSETS_DIR / "models").glob("*.j*g")) if (ASSETS_DIR / "models").exists() else []
    garments = list((ASSETS_DIR / "garments").glob("*_top.j*g")) if (ASSETS_DIR / "garments").exists() else []
    return bool(models and garments)


def resolve_asset(rel_path: str) -> Path:
    """把前端传来的素材相对路径解析为仓库内文件,拒绝越界路径。"""
    p = (ROOT / rel_path).resolve()
    if not p.is_file() or ASSETS_DIR.resolve() not in p.parents:
        raise HTTPException(status_code=400, detail=f"素材不存在或越界: {rel_path}")
    return p


def lan_base_url() -> str | None:
    """探测本机局域网地址,供前端生成手机可访问的二维码 URL。

    手机扫 localhost 二维码会访问手机自身,必须用局域网 IP;
    探测失败(无网络)返回 None,前端回退当前页面地址(部署场景)。
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("223.5.5.5", 80))  # 不真正发包,仅取本机出口 IP
        ip = s.getsockname()[0]
        s.close()
        return f"http://{ip}:{PORT}"
    except OSError:
        return None


app = FastAPI(title="衣然 YIRAN 本地服务", docs_url=None, redoc_url=None)
http = httpx.AsyncClient(timeout=300)

# 生成任务表(内存态:重启丢运行中任务,轮询方会收到 failed,可重试)
TASKS: dict[str, dict] = {}


class TryonRequest(BaseModel):
    modelId: str
    garmentId: str
    personImage: str
    topImage: str
    bottomImage: str | None = None
    garmentName: str = ""
    fabric: str = ""
    fail: bool = False  # 演示失败开关(与前端演示面板联动)


async def run_generation(task_id: str, person: Path, top: Path, bottom: Path | None,
                         garment_name: str, fabric: str) -> None:
    """后台执行真实生成:调百炼 → 下载结果图落盘 → 更新任务状态。"""
    try:
        url = await dashscope.generate_tryon(
            http, DASHSCOPE_API_KEY,
            person=dashscope.image_b64(person),
            top=dashscope.image_b64(top),
            bottom=dashscope.image_b64(bottom) if bottom else None,
            garment_name=garment_name or "服装",
            fabric=fabric,
            model=QWEN_IMAGE_MODEL,
        )
        dest = RESULTS_DIR / f"{task_id}.png"
        await dashscope.download_image(http, url, dest)
        TASKS[task_id] = {"status": "succeeded", "path": str(dest)}
    except Exception as e:  # noqa: BLE001  演示服务:任何异常都转为失败态
        TASKS[task_id] = {"status": "failed", "detail": str(e)[:200]}


@app.get("/api/health")
async def health():
    ready = assets_ready()
    mode = "api" if (DASHSCOPE_API_KEY and ready) else "mock"
    return {"ok": True, "mode": mode, "assetsReady": ready, "lanUrl": lan_base_url()}


@app.post("/api/tryon")
async def create_tryon(req: TryonRequest):
    if req.fail:
        # 演示失败:不消耗 API 额度,直接报错走前端失败页
        raise HTTPException(status_code=502, detail="GENERATION_FAILED (demo)")
    if not DASHSCOPE_API_KEY:
        raise HTTPException(status_code=503, detail="未配置 DASHSCOPE_API_KEY")
    if not assets_ready():
        raise HTTPException(status_code=503, detail="素材图未就位,请按 server/README-ASSETS.md 放置")

    person = resolve_asset(req.personImage)
    top = resolve_asset(req.topImage)
    bottom = resolve_asset(req.bottomImage) if req.bottomImage else None

    task_id = uuid.uuid4().hex[:16]
    TASKS[task_id] = {"status": "running"}
    asyncio.create_task(run_generation(
        task_id, person, top, bottom, req.garmentName, req.fabric))
    return {"taskId": task_id}


@app.get("/api/tryon/{task_id}")
async def poll_tryon(task_id: str):
    if not TASK_ID_RE.match(task_id):
        raise HTTPException(status_code=400, detail="非法 taskId")
    t = TASKS.get(task_id)
    if t is None:
        return {"status": "failed", "detail": "任务不存在(服务可能已重启)"}
    if t["status"] == "succeeded":
        return {"status": "succeeded", "imageUrl": f"/api/result/{task_id}"}
    if t["status"] == "failed":
        return {"status": "failed", "detail": t.get("detail", "")}
    return {"status": "running"}


@app.get("/api/result/{task_id}")
async def get_result(task_id: str):
    if not TASK_ID_RE.match(task_id):
        raise HTTPException(status_code=400, detail="非法 taskId")
    for ext in (".png", ".jpg", ".jpeg"):
        f = RESULTS_DIR / f"{task_id}{ext}"
        if f.exists():
            return FileResponse(f, media_type="image/png" if ext == ".png" else "image/jpeg")
    raise HTTPException(status_code=404, detail="结果不存在或已过期")


# 静态托管放最后:/api/* 路由优先匹配,其余走仓库根目录
app.mount("/", StaticFiles(directory=ROOT, html=True), name="static")


if __name__ == "__main__":
    print(
        f"* 衣然本地服务  http://localhost:8177\n"
        f"* 生成模式: {'真实 AI(' + QWEN_IMAGE_MODEL + ')' if DASHSCOPE_API_KEY and assets_ready() else 'Mock(配置 DASHSCOPE_API_KEY 并放置素材后自动切换)'}\n"
        f"* 素材就位: {'是' if assets_ready() else '否(见 server/README-ASSETS.md)'}"
    )
    uvicorn.run(app, host="0.0.0.0", port=PORT, log_level="warning")
