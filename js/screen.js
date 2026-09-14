// ============================================================
// 大屏端状态机
// idle → model → garment → generating → result / error
// 含：45s 闲置回归、失败演示开关、拍照入口隐私弹窗、二维码生成
// ============================================================

(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => document.querySelectorAll(s);

  const state = {
    screen: 'idle',
    model: null,
    garment: null,
    failArmed: false,
  };

  // ---------- 渲染 ----------

  function renderModelCards() {
    $('#modelGrid').innerHTML = MODELS.map((m) => `
      <button class="model-card${state.model && state.model.id === m.id ? ' sel' : ''}" data-id="${m.id}">
        <div class="fig">${ART.composeFitting(m, GARMENTS[0], true)}</div>
        <h3>${m.name}</h3>
        <p class="m-desc">${m.desc}</p>
        <div class="m-tags">${m.tags.map((t) => `<span>${t}</span>`).join('')}</div>
      </button>
    `).join('');
  }

  function renderGarmentCards() {
    $('#garmentGrid').innerHTML = GARMENTS.map((g) => `
      <button class="garment-card${state.garment && state.garment.id === g.id ? ' sel' : ''}" data-id="${g.id}">
        <div class="thumb">${ART.garmentThumb(g)}</div>
        <div class="g-info">
          <div class="g-name">${g.name}</div>
          <div class="g-cat">${g.category} · ${g.fabric}</div>
          <div class="g-price">¥${g.price}</div>
        </div>
      </button>
    `).join('');
  }

  function updatePreview() {
    if (!state.model) {
      $('#previewStage').innerHTML =
        `<div class="placeholder-tip">点击右侧任意款式，立即上身预览</div>`;
      $('#previewMeta').innerHTML = `<p class="p-info">等待选择形象</p>`;
      $('#startGen').disabled = true;
      return;
    }
    if (state.garment) {
      $('#previewStage').innerHTML = ART.composeFitting(state.model, state.garment);
      $('#previewMeta').innerHTML = `
        <p class="p-name">${state.garment.name}</p>
        <p class="p-info">${state.garment.fabric} · ${state.garment.fitNote}</p>`;
      $('#startGen').disabled = false;
      $('#genHint').textContent = 'AI 生成约需 5 秒 · 生成完成可扫码带走';
    } else {
      $('#previewStage').innerHTML =
        `<div class="placeholder-tip">点击右侧任意款式，立即上身预览</div>`;
      $('#previewMeta').innerHTML = `<p class="p-name">${state.model.name} · ${state.model.desc}</p>
        <p class="p-info">等待选择服装</p>`;
      $('#startGen').disabled = true;
      $('#genHint').textContent = '先在上方选一件服装 · AI 生成约需 5 秒';
    }
  }

  // ---------- 状态切换 ----------

  const STEP_MAP = { model: 0, garment: 1, generating: 2, result: 2, error: 2 };

  function go(name) {
    $$('.screen').forEach((el) => el.classList.remove('active'));
    $('#s-' + name).classList.add('active');
    $('#topBar').classList.toggle('hidden', name === 'idle');
    $$('.steps li').forEach((li, i) => li.classList.toggle('on', i === STEP_MAP[name]));
    state.screen = name;
    track('screen_view', { screen: name });
    resetIdleWatch();
  }

  // ---------- 生成流程 ----------

  function startGeneration() {
    if (!state.model || !state.garment) return;
    track('generate_start', { model: state.model.id, garment: state.garment.id });
    go('generating');
    $('#genFigure').innerHTML = ART.composeFitting(state.model, state.garment, true);
    $('#genProgress').style.width = '4%';
    $('#genStepText').textContent = '正在准备…';

    Generator.generate(state.model, state.garment, (text, pct) => {
      $('#genStepText').textContent = text;
      $('#genProgress').style.width = pct + '%';
    }, { fail: state.failArmed })
      .then(() => {
        track('generate_success');
        state.failArmed = false;
        $('#demoFail').checked = false;
        showResult();
      })
      .catch(() => {
        track('generate_fail');
        go('error');
      });
  }

  function showResult() {
    $('#resultFigure').innerHTML = ART.composeFitting(state.model, state.garment);
    $('#resultName').textContent = state.garment.name;
    $('#resultMeta').innerHTML =
      `试穿形象：${state.model.name}（${state.model.desc}）<br>` +
      `${state.garment.fabric} · ${state.garment.fitNote}`;

    // 二维码：链接 + 试衣参数，参数只含商品编号，不含任何个人信息
    const base = location.href.replace(/index\.html(\?.*)?(#.*)?$/, '');
    const url = `${base}phone.html?m=${state.model.id}&c=${state.garment.id}`;
    $('#qrCode').innerHTML = '';
    new QRCode($('#qrCode'), {
      text: url,
      width: 190,
      height: 190,
      colorDark: '#2B2B2B',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.M,
    });
    track('qr_shown', { url });
    go('result');
  }

  function clearSession() {
    state.model = null;
    state.garment = null;
    renderModelCards();
    renderGarmentCards();
    $('#toGarment').disabled = true;
    updatePreview();
  }

  // ---------- 闲置监测：45s 无操作 → 倒计时 10s → 回首页并清除会话 ----------

  const IDLE_MS = 45000;
  const COUNTDOWN_S = 10;
  let idleTimer = null;
  let countdownTimer = null;

  function resetIdleWatch() {
    clearTimeout(idleTimer);
    hideOverlay('#idleOverlay');
    clearInterval(countdownTimer);
    if (state.screen === 'idle') return;
    idleTimer = setTimeout(showIdleOverlay, IDLE_MS);
  }

  function showIdleOverlay() {
    let left = COUNTDOWN_S;
    $('#idleCountdown').textContent = left;
    $('#idleOverlay').classList.remove('hidden');
    track('idle_timeout_prompt');
    countdownTimer = setInterval(() => {
      left -= 1;
      $('#idleCountdown').textContent = left;
      if (left <= 0) {
        clearInterval(countdownTimer);
        hideOverlay('#idleOverlay');
        track('idle_timeout_return');
        clearSession();
        go('idle');
      }
    }, 1000);
  }

  function hideOverlay(sel) {
    $(sel).classList.add('hidden');
  }

  // ---------- 事件绑定 ----------

  $('#startBtn').addEventListener('click', () => {
    track('tap_start');
    go('model');
  });

  $('#modelGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.model-card');
    if (!card) return;
    state.model = MODELS.find((m) => m.id === card.dataset.id);
    track('model_select', { model: state.model.id });
    renderModelCards();
    $('#toGarment').disabled = false;
    updatePreview();
  });

  $('#toGarment').addEventListener('click', () => go('garment'));

  $('#garmentGrid').addEventListener('click', (e) => {
    const card = e.target.closest('.garment-card');
    if (!card) return;
    state.garment = GARMENTS.find((g) => g.id === card.dataset.id);
    track('garment_select', { garment: state.garment.id });
    renderGarmentCards();
    updatePreview();
  });

  $('#backToModel').addEventListener('click', () => go('model'));
  $('#startGen').addEventListener('click', startGeneration);
  $('#retryGen').addEventListener('click', () => {
    track('generate_retry');
    state.failArmed = false;
    $('#demoFail').checked = false;
    startGeneration();
  });
  $('#errorChangeGarment').addEventListener('click', () => go('garment'));
  $('#changeGarment').addEventListener('click', () => go('garment'));
  $('#changeModel').addEventListener('click', () => go('model'));

  $('#stayBtn').addEventListener('click', () => {
    track('idle_stay');
    resetIdleWatch();
  });

  // 拍照入口：隐私授权弹窗
  $('#photoEntry').addEventListener('click', () => {
    track('photo_entry_view');
    $('#photoModal').classList.remove('hidden');
  });
  $('#photoOk').addEventListener('click', () => {
    track('photo_privacy_ack');
    hideOverlay('#photoModal');
    resetIdleWatch();
  });

  // 演示控制
  $('#demoGear').addEventListener('click', () => {
    $('#demoPanel').classList.toggle('hidden');
  });
  $('#demoFail').addEventListener('change', (e) => {
    state.failArmed = e.target.checked;
    track('demo_fail_armed', { armed: state.failArmed });
  });
  $('#demoReset').addEventListener('click', () => {
    clearSession();
    go('idle');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      const cb = $('#demoFail');
      cb.checked = !cb.checked;
      state.failArmed = cb.checked;
    }
  });

  // 任意操作重置闲置计时
  ['pointerdown', 'keydown'].forEach((evt) =>
    document.addEventListener(evt, () => {
      if (state.screen !== 'idle') resetIdleWatch();
    })
  );

  // 初始化
  renderModelCards();
  renderGarmentCards();
  track('screen_view', { screen: 'idle' });
})();
