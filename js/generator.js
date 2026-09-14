// ============================================================
// 生成器抽象层：本地模拟生成，预留真实 AI 服务切换点
// 正式版将 MockGenerator 替换为 APIGenerator 并实现其接口即可，
// 大屏状态机与页面代码无需任何改动。
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

// 预留：真实生成服务接口（示例）
const APIGenerator = {
  name: 'api',
  generate(model, garment, onProgress) {
    return fetch('/api/tryon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modelId: model.id, garmentId: garment.id }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('GENERATION_FAILED'))))
      .then((data) => {
        onProgress('生成完成', 100);
        return data;
      });
  },
};

// 切换点：正式版改为 APIGenerator
const Generator = MockGenerator;
