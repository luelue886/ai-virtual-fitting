// ============================================================
// 手机端落地页：扫码进入 → 试穿结果 → 商品/领券/预约（转化承接）
// URL 参数只含商品编号（?m=模特&c=服装），无任何个人信息
// ============================================================

(() => {
  const $ = (s) => document.querySelector(s);

  // ---------- 参数解析与兜底 ----------
  const qs = new URLSearchParams(location.search);
  const model = MODELS.find((m) => m.id === qs.get('m'));
  const garment = GARMENTS.find((g) => g.id === qs.get('c'));
  const isDemo = !model || !garment;
  const M = model || MODELS[1];
  const G = garment || GARMENTS[2];

  // ---------- 渲染 ----------
  function render() {
    if (isDemo) $('#demoBanner').classList.remove('hidden');

    $('#heroFigure').innerHTML = ART.composeFitting(M, G);
    $('#heroCaption').textContent =
      `${G.name} · 试穿形象「${M.name}」（${M.desc}）`;

    $('#pName').textContent = G.name;
    $('#pFabric').textContent = `${G.category} · ${G.fabric} · ${G.fitNote}`;
    $('#pPrice').textContent = `¥${G.price}`;

    $('#sizeChips').innerHTML = SIZES.map((s) =>
      `<button class="size-chip${s === M.size ? ' rec' : ''}" data-size="${s}">${s}</button>`
    ).join('');
    $('#sizeNote').textContent =
      `依据试穿形象「${M.name}」的身形推荐 ${M.size} 码，到店可获精准量体`;

    $('#couponAmount').textContent = COUPON.amount;
    $('#couponName').innerHTML = `${COUPON.name}<br>${COUPON.note}`;

    $('#storeName').textContent = STORE.name;
    $('#storeAddr').textContent = STORE.address;

    $('#slotGrid').innerHTML = STORE.slots.map((s) =>
      `<button class="slot" data-slot="${s}">${s}</button>`
    ).join('');
  }

  // ---------- 交互 ----------
  let couponGot = false;
  let booked = false;

  function toast(text) {
    const el = $('#toast');
    el.textContent = text;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 1800);
  }

  // 领券
  function receiveCoupon() {
    if (couponGot) return;
    couponGot = true;
    const btn = $('#couponBtn');
    btn.textContent = `已领取 ${COUPON.code}`;
    btn.classList.add('got');
    btn.disabled = true;
    track('coupon_receive', { coupon: COUPON.code });
    toast(`领券成功：${COUPON.name} ¥${COUPON.amount}`);
  }
  $('#couponBtn').addEventListener('click', receiveCoupon);

  // 尺码点击
  $('#sizeChips').addEventListener('click', (e) => {
    const chip = e.target.closest('.size-chip');
    if (chip) track('size_click', { size: chip.dataset.size });
  });

  // 预约
  let pickedSlot = null;
  function openBook() {
    track('book_click');
    $('#bookModal').classList.remove('hidden');
  }
  function closeBook() {
    $('#bookModal').classList.add('hidden');
  }
  $('#bookBtn').addEventListener('click', openBook);
  $('#bookBtn2').addEventListener('click', openBook);
  $('#bookCancel').addEventListener('click', closeBook);

  $('#slotGrid').addEventListener('click', (e) => {
    const slot = e.target.closest('.slot');
    if (!slot) return;
    pickedSlot = slot.dataset.slot;
    $$('#slotGrid .slot').forEach((s) => s.classList.remove('sel'));
    slot.classList.add('sel');
    $('#bookConfirm').disabled = false;
  });

  function $$(s) { return document.querySelectorAll(s); }

  $('#bookConfirm').addEventListener('click', () => {
    if (!pickedSlot) return;
    booked = true;
    closeBook();
    const code = 'YR-' + Date.now().toString().slice(-6);
    $('#bookDoneText').innerHTML =
      `${STORE.name} · ${pickedSlot}<br>试穿款：${G.name}（已按推荐尺码 ${M.size} 备好）`;
    $('#bookCode').textContent = code;
    $('#bookDone').classList.remove('hidden');
    track('book_submit', { slot: pickedSlot, garment: G.id });
  });
  $('#bookDoneOk').addEventListener('click', () => {
    $('#bookDone').classList.add('hidden');
    toast('预约已保存，到店出示此页面即可');
  });

  // 加购 / 分享 / 更多
  function addCart() {
    track('add_cart', { garment: G.id });
    toast('已加入购物袋（演示）');
  }
  $('#cartBtn').addEventListener('click', addCart);
  $('#cartBtn2').addEventListener('click', addCart);

  $('#shareBtn').addEventListener('click', async () => {
    track('share_click');
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `衣然试穿 · ${G.name}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('链接已复制，去分享给朋友吧');
      }
    } catch (e) {
      toast('链接：' + url);
    }
  });

  $('#moreBtn').addEventListener('click', () => {
    track('more_garments_click');
    toast('完整系列请到店选购 · 原型演示');
  });

  render();
  track('tryon_result_view', { model: M.id, garment: G.id, demo: isDemo });
})();
