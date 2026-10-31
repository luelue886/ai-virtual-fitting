// ============================================================
// 生成器抽象层：本地 Mock 与真实 AI 试穿（百炼 qwen-image 多图参考编辑）
// 接口不变：Generator.generate(model, garment, onProgress, opts) → Promise
//   resolve({ok, imageUrl?, taskId?})  /  reject(Error('GENERATION_FAILED'))
// 启动时探测 /api/health：后端就绪且已配 Key/素材 → APIGenerator,
// 否则（纯静态托管/GitHub Pages/离线）自动回退 MockGenerator。
// ============================================================

const MockGenerator = {
  name: 'mock',

  // steps：分步进度回调（文案、进度 0-100）
  // opts.fail = true 时模拟失败（用于演示失败处理路径）
  generate(model, garment, onProgress, opts = {}) {
    const steps = [
      { text: '正在分析服装版型…', at: 0, pct: 12 },
      { text: '正在贴合身形曲线…', at: 1700, pct: 46 },
      { text: '正在渲染面料光影…', at: 3400, pct: 82 },
    ];
    steps.forEach((s) => setTimeout(() => onProgress(s.text, s.pct), s.at));
    const total = opts.fast ? 2600 : 5200;
    return new Promise((resolve, reject) => {
      if (opts.fail) {
        setTimeout(() => reject(new Error('GENERATION_FAILED')), total - 1500);
      } else {
        setTimeout(() => resolve({ ok: true }), total);
      }
    });
  },
};

// 真实生成：提交本地后端 → 轮询任务 → 返回结果图地址
const APIGenerator = {
  name: 'api',

  async generate(model, garment, onProgress, opts = {}) {
    // 演示失败开关：不真实调接口（不消耗额度）
    if (opts.fail) {
      onProgress('正在分析服装版型…', 18);
      await new Promise((r) => setTimeout(r, 2600));
      throw new Error('GENERATION_FAILED');
    }

    // ① 提交任务
    onProgress('正在提交试穿任务…', 6);
    let taskId;
    try {
      const res = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: model.id,
          garmentId: garment.id,
          personImage: model.photo,
          topImage: garment.topImage,
          bottomImage: garment.bottomImage || null,
          garmentName: garment.name,
          fabric: garment.fabric,
        }),
      });
      if (!res.ok) throw new Error('GENERATION_FAILED');
      taskId = (await res.json()).taskId;
    } catch (e) {
      throw new Error('GENERATION_FAILED');
    }

    // ② 轮询（2s 一次），进度文案按时段推进，贴合真实 20-60s 耗时
    const stages = [
      { text: '正在分析服装版型…', at: 0, pct: 14 },
      { text: '正在贴合身形曲线…', at: 12000, pct: 42 },
      { text: '正在渲染面料光影…', at: 30000, pct: 74 },
    ];
    const t0 = Date.now();
    const tick = setInterval(() => {
      const el = Date.now() - t0;
      const st = [...stages].reverse().find((s) => el >= s.at);
      if (st) onProgress(st.text, st.pct);
    }, 800);

    try {
      for (;;) {
        await new Promise((r) => setTimeout(r, 2000));
        let data;
        try {
          const res = await fetch('/api/tryon/' + taskId);
          data = await res.json();
        } catch (e) {
          continue; // 单次网络抖动不致命，继续轮询
        }
        if (data.status === 'succeeded') {
          onProgress('生成完成', 100);
          return { ok: true, imageUrl: data.imageUrl, taskId };
        }
        if (data.status === 'failed') throw new Error('GENERATION_FAILED');
      }
    } finally {
      clearInterval(tick);
    }
  },
};

// 切换点：启动时探测后端能力自动选择（默认 Mock,保证纯静态部署不白屏）
// GeneratorInfo：探测结果（assetsReady=false 时前端不加载素材图,避免 404 噪音）
// GeneratorReady：探测 Promise,完成后 Generator.name 可用于区分文案
let Generator = MockGenerator;
const GeneratorInfo = { mode: 'mock', assetsReady: false, lanUrl: null };
const GeneratorReady = (async () => {
  try {
    const r = await fetch('/api/health', { cache: 'no-store' });
    if (r.ok) {
      const h = await r.json();
      GeneratorInfo.mode = h.mode;
      GeneratorInfo.assetsReady = !!h.assetsReady;
      GeneratorInfo.lanUrl = h.lanUrl || null; // 本机局域网地址,手机扫码可达
      if (h.mode === 'api') Generator = APIGenerator;
    }
  } catch (e) {
    /* 无后端（如 GitHub Pages）→ 保持 Mock */
  }
})();
