// ============================================================
// 数据单一来源：品牌 / 模特 / 服装 / 门店 / 优惠
// 品牌为虚构占位，如需更换只改 BRAND 一处即可
// ============================================================

const BRAND = {
  name: '衣然',
  en: 'YIRAN',
  tagline: '穿上你的可能',
};

const STORE = {
  name: '衣然 · 万象城店',
  address: '商场 2 层 L2-08（扶梯旁）',
  slots: ['今天 15:00', '今天 16:30', '今天 18:00', '明天 11:00', '明天 14:30'],
};

const COUPON = {
  name: '新客试穿礼',
  amount: 30,
  code: 'YR-TRY30',
  note: '到店试穿任意款可用 · 有效期 7 天',
};

// 预设试穿形象：覆盖不同体型/气质,让每位顾客都能找到接近自己的形象
// fit：服装图层相对「标准版型(m2)」的贴合变换参数
// photo：真实试穿用的模特照片（server/README-ASSETS.md,缺省时回退 SVG 插画）
const MODELS = [
  {
    id: 'm1',
    name: '小雨',
    desc: '青年 · 纤细',
    tags: ['校园风', '小个子'],
    skin: '#F3D3BC',
    hair: '#4A3728',
    hairStyle: 'long',
    fit: { sx: 0.88, sy: 0.98, dx: 0, dy: 2 },
    size: 'S',
    photo: 'assets/models/m1.jpg',
  },
  {
    id: 'm2',
    name: '安然',
    desc: '轻熟 · 标准',
    tags: ['通勤', '气质'],
    skin: '#EBC3A4',
    hair: '#2F2B29',
    hairStyle: 'bob',
    fit: { sx: 1, sy: 1, dx: 0, dy: 0 },
    size: 'M',
    photo: 'assets/models/m2.jpg',
  },
  {
    id: 'm3',
    name: '曼曼',
    desc: '青年 · 大码',
    tags: ['甜酷', '自信'],
    skin: '#D8A88B',
    hair: '#5C4733',
    hairStyle: 'curly',
    fit: { sx: 1.17, sy: 1.03, dx: 0, dy: 4 },
    size: 'XL',
    photo: 'assets/models/m3.jpg',
  },
];

// 服装（每款在插画中为完整穿搭,避免出现"半身"效果）
// topImage/bottomImage：真实试穿用的商品平铺图（连身款只填 topImage）
const GARMENTS = [
  {
    id: 'c1',
    name: '焦糖色长风衣',
    price: 599,
    category: '外套',
    fabric: '棉混纺 · 防泼水面料',
    fitNote: '宽松直筒 · 显瘦遮胯',
    topImage: 'assets/garments/c1_top.jpg',
  },
  {
    id: 'c2',
    name: '米白麻花针织衫',
    price: 329,
    category: '上衣',
    fabric: '羊毛混纺 · 亲肤不扎',
    fitNote: '微落肩慵懒款 · 配炭灰直筒裤',
    topImage: 'assets/garments/c2_top.jpg',
    bottomImage: 'assets/garments/c2_bottom.jpg',
  },
  {
    id: 'c3',
    name: '墨绿收腰连衣裙',
    price: 459,
    category: '连衣裙',
    fabric: '垂感醋酸面料',
    fitNote: '收腰 A 字裙摆 · 显腿长',
    topImage: 'assets/garments/c3_top.jpg',
  },
  {
    id: 'c4',
    name: '雾霾蓝宽松衬衫',
    price: 279,
    category: '上衣',
    fabric: '天丝棉 · 透气垂坠',
    fitNote: '落肩设计 · 配燕麦阔腿裤',
    topImage: 'assets/garments/c4_top.jpg',
    bottomImage: 'assets/garments/c4_bottom.jpg',
  },
  {
    id: 'c5',
    name: '驼色羊绒大衣',
    price: 899,
    category: '外套',
    fabric: '双面羊绒 · 含毛量 90%',
    fitNote: '过膝直身 · 气场剪裁',
    topImage: 'assets/garments/c5_top.jpg',
  },
  {
    id: 'c6',
    name: '格纹呢料连衣裙',
    price: 359,
    category: '连衣裙',
    fabric: '粗纺呢料 · 挺括保形',
    fitNote: '复古百褶裙摆 · 学院风',
    topImage: 'assets/garments/c6_top.jpg',
  },
];

const SIZES = ['S', 'M', 'L', 'XL'];
