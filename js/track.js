// 漏斗埋点（演示级）：正式版替换为数据上报 SDK
function track(event, props) {
  const line = props ? event + ' ' + JSON.stringify(props) : event;
  console.log('%c[埋点] ' + line, 'color:#2F5D50');
}
