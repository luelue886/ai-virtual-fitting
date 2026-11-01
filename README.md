# 「衣然 YIRAN」AI 虚拟试衣镜 · 原型

商场门店 AI 虚拟试衣大屏的简化版网页原型：大屏三步生成试穿效果，扫码带到手机端完成转化（领券 / 预约到店试穿 / 加购 / 分享）。

- **在线体验**：<https://luelue886.github.io/ai-virtual-fitting/>
- **大屏端**：`index.html`（建议电脑全屏 F11 演示）
- **手机端**：`phone.html`（由大屏结果页二维码进入，也可直接带参数访问，如 `phone.html?m=m2&c=c1`）

## 演示视频

![全流程演示](assets/demo.mp4)

49 秒完整链路：大屏选形象 → 挑服装 → **真实 AI 试穿生成**（百炼 qwen-image，等待段 8 倍速快进）→ 结果大图 + 二维码 → 手机扫码承接 → 领券 → 预约到店试穿。视频由 `record_demo.py` + `make_video.py` 自动录制合成。

## 本地运行

**方式一：带后端（推荐，支持真实 AI 生成 + 扫码真图回看）**

```bash
pip install -r server/requirements.txt
python server/app.py
# 浏览器打开 http://localhost:8177
```

**方式二：纯静态（Mock 演示模式，与 GitHub Pages 行为一致）**

```bash
python -m http.server 8177
```

前端启动时自动探测 `/api/health`：后端可用且已配置 Key 与素材 → 真实 AI 生成；否则自动回退 Mock（约 5 秒模拟生成，SVG 插画结果），两种模式页面与状态机代码完全一致。

## 切换为真实 AI 生成（阿里云百炼 qwen-image）

1. 注册并开通 [阿里云百炼](https://bailian.console.aliyun.com)（支付宝实名，新用户有免费额度），创建 API Key
2. 复制 `.env.example` 为 `.env`，填入 `DASHSCOPE_API_KEY=你的Key`
3. 按 [server/README-ASSETS.md](server/README-ASSETS.md) 规格放置模特照（`assets/models/`）与服装商品图（`assets/garments/`）
4. 重启 `python server/app.py`，大屏端自动切换为真实生成（约 20–60 秒/次，结果为真人试穿照片；手机扫码可查看同一张生成图）

生成链路：大屏 → 本地 FastAPI（`server/`，Key 只存本地不进前端）→ 百炼 `qwen-image-3.0-pro` 多图参考编辑（人物图 + 服装图 base64 直传，同步生成）→ 结果图落盘 `server/results/`（云端 URL 24 小时失效，落盘保证扫码回看）。

> 注：百炼旧版 OutfitAnyone 专用试衣 API 已下线；本方案使用 qwen-image 系列的统一生成与编辑能力，素材图 base64 直传、不落公网存储。模型可通过 `.env` 的 `QWEN_IMAGE_MODEL` 切换（备选 `qwen-image-2.1-pro`）。`.env` 改动需重启服务生效。

## 5 分钟演示脚本

1. **吸引页**：展示隐私声明 → 轻触开始（约 20s）
2. **门槛设计**：选形象（3 款体型/气质各异）→ 挑服装（即点即上身）→ 点"生成 AI 试穿效果"（约 60s）
3. **等待体验**：分步进度反馈（Mock 约 5 秒 / 真实 AI 约 20–60 秒）→ 结果大图 + 二维码（约 30s）
4. **失败处理**：按 `F` 键（或左下角"演示"面板勾选）武装失败 → 换一件再生成 → 展示友好失败页与一键重试（约 60s）
5. **手机承接**：用手机扫大屏二维码 → 结果落地页 → 领券 → 预约到店试穿 → 加购/分享（约 90s）
6. **隐私演示**：静置 45 秒 → 闲置倒计时 → 自动回首页并清除会话（约 60s）

漏斗埋点：全程打开浏览器控制台（F12），可看到 `screen_view / generate_start / qr_shown / coupon_receive / book_submit` 等事件日志。

## 项目结构

```
├── index.html            # 大屏端（状态机：吸引→选形象→挑服装→生成→结果/失败）
├── phone.html            # 手机端转化页（结果→详情/尺码推荐→领券→预约/加购/分享）
├── css/                  # screen.css（大屏）/ phone.css（手机）
├── js/
│   ├── data.js           # 品牌/模特/服装/门店/优惠 数据源（含素材图路径，改文案只动这里）
│   ├── art.js            # SVG 插画：3 基础形象 × 6 服装参数化合成（素材缺失时的回退）
│   ├── generator.js      # 生成器抽象：Mock（默认）/ API（百炼 outfit-any-one），启动自动探测
│   ├── screen.js         # 大屏状态机 + 闲置超时 + 演示控制
│   ├── phone.js          # 手机端参数解析与转化组件（含 r 参数真图回看）
│   └── track.js          # 漏斗埋点（console 演示级）
├── assets/               # 真实素材图（models/ 模特照、garments/ 服装图，规格见 server/README-ASSETS.md）
├── server/               # 本地 FastAPI：静态托管 + /api/tryon 百炼代理 + 结果图回放
└── docs/
    ├── 产品方案.md        # 交付物：一页产品方案
    └── AI工具使用说明.md  # 交付物：AI 工具、提示词与本人修改
```

## 设计要点速览

- **门槛**：全程 ≤5 次点击、零输入零登录；模特覆盖纤细/标准/大码，人人有"接近自己"的形象
- **等待**：分步文案 + 进度条 + 轮廓动效，预期管理
- **失败**：友好文案 + 一键重试（必成功）+ 换一件出口，无死胡同
- **隐私**：预设优先不强制拍照；拍照路径二次授权（仅本机/试后即删/不作他用）；二维码参数只含商品编号；无后端不落库；闲置自动清除
- **转化**：结果页→详情/尺码推荐→领券→预约到店（主）/加购（次）→分享
