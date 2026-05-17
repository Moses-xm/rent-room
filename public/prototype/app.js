const BASE_IMG = "http://127.0.0.1:8088";

const images = [
  "/public/upload/avatar/20260515/1778907756574.jpg",
  "/public/upload/avatar/20210615/1623733850102.jpg",
  "/public/upload/avatar/20210609/1623220439617.jpeg",
  "/public/upload/avatar/20210608/1623147093171.jpeg",
  "/public/upload/avatar/20210520/1621499559661.jpg",
  "/public/upload/avatar/20210512/1620783761954.jpg",
  "/public/upload/avatar/20210510/1620658391216.jpeg",
  "/public/upload/avatar/20210510/1620636417239.jpg",
  "/public/upload/avatar/20210508/1620479856149.jpeg",
  "/public/upload/avatar/20210418/1618740248023.jpg",
];

const rooms = [
  {
    id: 15,
    name: "测试房源啦啦啦",
    cmy: "滨兴家园",
    district: "滨江区",
    street: "滨兴路",
    bedroom: 3,
    parlour: 1,
    bathroom: 1,
    area: 88,
    price: 1000,
    direction: "朝东",
    type: "普通住宅",
    floor: "3/10层",
    subway: "6号线",
    img: images[0],
    broker: "wushuang",
    phone: "13800000000",
  },
  {
    id: 12,
    name: "杭州大厦 武林广场 温馨家园 海华广场配套齐全 首回出租",
    cmy: "温馨家园",
    district: "下城区",
    street: "头营巷43号",
    bedroom: 2,
    parlour: 2,
    bathroom: 2,
    area: 128,
    price: 4550,
    direction: "朝南",
    type: "普通住宅",
    floor: "4/7层",
    subway: "近武林广场",
    img: images[2],
    broker: "小苹果",
    phone: "13800000000",
  },
  {
    id: 11,
    name: "北景月桂苑 浙医健医院 中大银泰 精装修领包入住",
    cmy: "北景月桂苑",
    district: "拱墅区",
    street: "回龙路312",
    bedroom: 2,
    parlour: 1,
    bathroom: 1,
    area: 66,
    price: 1800,
    direction: "南北",
    type: "普通住宅",
    floor: "8/8层",
    subway: "公交便利",
    img: images[3],
    broker: "小苹果",
    phone: "13800000000",
  },
  {
    id: 10,
    name: "碧桂园深蓝国际 奥体嘉润公馆 博地 一线江景 随时看房",
    cmy: "碧桂园深蓝国际中心",
    district: "萧山区",
    street: "博奥路",
    bedroom: 1,
    parlour: 1,
    bathroom: 1,
    area: 54,
    price: 3800,
    direction: "南北",
    type: "普通住宅",
    floor: "45/47层",
    subway: "2号线 / 6号线",
    img: images[4],
    broker: "小苹果",
    phone: "13800000000",
  },
  {
    id: 9,
    name: "南肖埠 杭九中 四季青 华家池校区 凯林巷 花鸟市场",
    cmy: "南肖埠北景东苑",
    district: "上城区",
    street: "凤起东路112号",
    bedroom: 3,
    parlour: 2,
    bathroom: 1,
    area: 89,
    price: 3900,
    direction: "朝南",
    type: "普通住宅",
    floor: "5/8层",
    subway: "2号线 / 4号线 / 5号线",
    img: images[5],
    broker: "sunxian",
    phone: "13800000000",
  },
  {
    id: 8,
    name: "滨兴家园~阿里附近~乐通科技园~滨兴北苑西苑~长河5号地铁口",
    cmy: "滨兴家园",
    district: "滨江区",
    street: "滨兴路",
    bedroom: 1,
    parlour: 1,
    bathroom: 1,
    area: 30,
    price: 1200,
    direction: "朝南",
    type: "公寓",
    floor: "20/32层",
    subway: "6号线",
    img: images[6],
    broker: "汤姆",
    phone: "13800000000",
  },
];

const communities = [
  { name: "滨兴家园", district: "浙江省 杭州市 滨江区", street: "滨兴路", rooms: 3, img: images[6], subway: "6号线" },
  { name: "温馨家园", district: "浙江省 杭州市 下城区", street: "头营巷43号", rooms: 2, img: images[1], subway: "武林商圈" },
  { name: "北景月桂苑", district: "浙江省 杭州市 拱墅区", street: "回龙路312", rooms: 1, img: images[3], subway: "生活配套齐全" },
  { name: "杭州金地广场", district: "浙江省 杭州市 余杭区", street: "古墩路", rooms: 2, img: images[7], subway: "2号线" },
  { name: "复兴南苑", district: "浙江省 杭州市 上城区", street: "之江路525", rooms: 2, img: images[9], subway: "4号线 / 5号线" },
];

function img(src, cls = "") {
  const resolved = src.startsWith("http") || src.startsWith(".") ? src : BASE_IMG + src;
  return `<img class="${cls}" src="${resolved}" onerror="this.replaceWith(makePlaceholder(this))" />`;
}

function makePlaceholder(el) {
  const div = document.createElement("div");
  div.className = `placeholder ${el.className || ""}`;
  div.style.width = `${el.width || el.clientWidth || 180}px`;
  div.style.height = `${el.height || el.clientHeight || 120}px`;
  return div;
}

function navPath() {
  return location.hash.replace(/^#/, "") || "/welcome";
}

function go(path) {
  location.hash = path;
}

function baseLayout(content) {
  const path = navPath();
  return `
    <div class="page-shell">
      <header class="global-header">
        <div class="global-header-left">
          <a class="brand" onclick="go('/welcome')">雅阁租房</a>
          <div class="city-select">当前城市：<span>杭州</span></div>
        </div>
        <div class="global-header-right">
          <div class="search-box"><input placeholder="请输入区域、小区或房源关键词" /><button>搜索</button></div>
          <div class="user-links"><a onclick="go('/login')">登录</a> <span class="separator">|</span> <a onclick="go('/register')">注册</a> <span class="separator">|</span> <a onclick="go('/mine/info')">个人中心</a></div>
        </div>
      </header>
      <nav class="top-menu">
        ${menuLink("/welcome", "首页", path)}
        ${menuLink("/areaRoom", "区域找房", path)}
        ${menuLink("/subwayRoom", "地铁找房", path)}
        ${menuLink("/cmyRoom", "小区找房", path)}
        ${menuLink("/mapRoom", "地图找房", path)}
        ${menuLink("/sharedRoom/createRoom", "我要出租", path)}
      </nav>
      <main class="main-container">${content}</main>
    </div>
    ${footer()}
  `;
}

function menuLink(path, label, current) {
  return `<a class="${current.startsWith(path) ? "active" : ""}" onclick="go('${path}')">${label}</a>`;
}

function footer() {
  return `
    <footer class="footer-full">
      <div class="footer">
        <div class="footer-line"><a>关于我们</a><span class="separator">|</span><a>联系我们</a><span class="separator">|</span><a>用户协议</a><span class="separator">|</span><a>隐私政策</a></div>
        <div class="footer-line">Copyright © 2026 雅阁租房系统 All Rights Reserved</div>
      </div>
    </footer>
  `;
}

function homeCard(item, isCommunity = false) {
  return `
    <div class="home-card" onclick="go('${isCommunity ? "/cmyRoom/roomlist" : `/roomDetail?id=${item.id}`}')">
      <div class="home-cover">${img(item.img)}</div>
      <h3>${item.name}</h3>
      <div class="home-info">
        <span>${isCommunity ? item.district.split(" ").slice(-2).join(" ") : `${item.bedroom}室${item.parlour}厅`}</span>
        <span class="price">${isCommunity ? `${item.rooms}套在租` : `${item.price}元/月`}</span>
      </div>
    </div>
  `;
}

function renderWelcome() {
  return baseLayout(`
    <div class="hero-carousel"><img src="./assets/home_bg.png" /></div>
    <section class="section">
      <div class="section-title">最新上架</div>
      <div class="home-grid">${rooms.slice(0, 4).map((r) => homeCard(r)).join("")}</div>
    </section>
    <section class="section">
      <div class="section-title">小区精选</div>
      <div class="home-grid">${communities.slice(0, 4).map((c) => homeCard(c, true)).join("")}</div>
    </section>
    <section class="section">
      <div class="section-title">热门推荐</div>
      <div class="home-grid">${rooms.slice(2, 6).map((r) => homeCard(r)).join("")}</div>
    </section>
  `);
}

function filters(type = "area") {
  const first = type === "subway" ? ["1号线", "2号线", "4号线", "5号线", "6号线", "7号线", "16号线"] : ["上城区", "下城区", "滨江区", "拱墅区", "萧山区", "余杭区", "西湖区", "钱塘区"];
  return `
    <div class="filter-room">
      <div class="filter-line"><div class="filter-label">${type === "subway" ? "线路" : "区域"}</div><div class="filter-values"><span class="active">全部</span>${first.map((x) => `<span>${x}</span>`).join("")}</div></div>
      <div class="filter-line"><div class="filter-label">租金</div><div class="filter-values"><span class="active">全部</span><span>1000以下</span><span>1000-1500</span><span>1500-2000</span><span>2000-3000</span><span>3000-5000</span><span>5000以上</span></div></div>
      <div class="filter-line"><div class="filter-label">更多</div><div class="filter-values"><div class="select-chip">房型 ▾</div><div class="select-chip">朝向 ▾</div><div class="select-chip">类型 ▾</div><span>□ 近地铁</span><span>□ 有电梯</span></div></div>
    </div>
  `;
}

function roomRow(r) {
  return `
    <div class="room-row" onclick="go('/roomDetail?id=${r.id}')">
      <div class="row-main">
        ${img(r.img)}
        <div class="row-info">
          <h3><a>${r.name}</a></h3>
          <p>${r.bedroom}室${r.parlour}厅<span class="separator">|</span>${r.area}平方米<span class="separator">|</span>${r.direction}<span class="separator">|</span>${r.floor}</p>
          <p>${r.cmy} <span class="separator">|</span>${r.district} ${r.street}</p>
          <div class="tags"><span class="tag tag-red">${r.type}</span><span class="tag tag-green">${r.direction}</span><span class="tag tag-blue">有电梯</span><span class="tag tag-yellow">${r.subway}</span></div>
        </div>
      </div>
      <div class="room-price">${r.price}元/月</div>
    </div>
  `;
}

function renderRoomList(kind = "area") {
  const title = kind === "subway" ? "地铁找房" : "区域找房";
  return baseLayout(`
    ${filters(kind)}
    <div class="content-two-col">
      <div class="room-part">
        ${rooms.map(roomRow).join("")}
        <div class="pagination"><span>‹</span><span class="active">1</span><span>2</span><span>›</span></div>
      </div>
      <aside class="adver-part"><div class="adv-box"><img src="./assets/adv.jpg" /></div><div class="adv-box"><img src="./assets/adv.jpg" /></div></aside>
    </div>
  `);
}

function communityRow(c) {
  return `
    <div class="community-row" onclick="go('/cmyRoom/roomlist')">
      <div class="row-main">
        ${img(c.img)}
        <div class="row-info">
          <h3><a>${c.name}</a></h3>
          <p>${c.district}<span class="separator">|</span>${c.street}</p>
          <div class="tags"><span class="tag tag-yellow">${c.subway}</span><span class="tag tag-blue">${c.rooms}套房源</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderCmyRoom() {
  return baseLayout(`
    ${filters("area")}
    <div class="content-two-col">
      <div class="room-part">${communities.map(communityRow).join("")}<div class="pagination"><span>‹</span><span class="active">1</span><span>›</span></div></div>
      <aside class="adver-part"><div class="adv-box"><img src="./assets/adv.jpg" /></div></aside>
    </div>
  `);
}

function renderCmyRoomList() {
  return baseLayout(`
    <div class="section">
      <div class="section-title">滨兴家园</div>
      <div class="filter-room">
        <div class="filter-line"><div class="filter-label">地址</div><div class="filter-values"><span>浙江省 杭州市 滨江区 滨兴路</span></div></div>
        <div class="filter-line"><div class="filter-label">交通</div><div class="filter-values"><span class="active">6号线</span><span>长河地铁口</span><span>阿里网易周边</span></div></div>
      </div>
      <div class="room-part">${rooms.filter((r) => r.cmy === "滨兴家园").concat(rooms.slice(1, 4)).map(roomRow).join("")}</div>
    </div>
  `);
}

function renderRoomDetail() {
  const r = rooms[1];
  return baseLayout(`
    <h1 class="room-title">${r.name}</h1>
    <div class="title-basic-info">
      <span class="info-tag light">${r.price}元/月</span>
      <span class="info-tag">${r.bedroom}室${r.parlour}厅</span>
      <span class="info-tag">${r.area}平方米</span>
      <span class="tag tag-red">整租</span><span class="tag tag-green">${r.direction}</span><span class="tag tag-blue">${r.subway}</span>
      <span style="margin-left:10px;color:#666">☆ 收藏</span>
    </div>
    <div class="detail-content">
      <div class="detail-left">
        <div class="detail-images">${img(r.img)}</div>
        <div class="house-info-head"><span>房屋信息</span><small>房源编号：1623220553461016，浏览 53 次</small></div>
        <div class="house-info-detail">
          <div class="full-line"><span class="price"><b>${r.price}</b> 元/月</span> 押一付三，最短租期 12 个月</div>
          <div class="house-info-item">户型：${r.bedroom}室${r.parlour}厅${r.bathroom}卫</div>
          <div class="house-info-item">面积：${r.area}平方米</div>
          <div class="house-info-item">朝向：${r.direction}</div>
          <div class="house-info-item">楼层：${r.floor}</div>
          <div class="house-info-item wide">小区：<span class="link">${r.cmy}</span></div>
          <div class="house-info-item wide">地址：${r.district} ${r.street}</div>
          <div class="full-line">房源描述：本店房源众多，总会有那么一套属于您自己的家，欢迎致电。家具家电齐全，价格合理，看房方便。</div>
        </div>
        <div class="house-info-head"><span>位置及周边</span></div>
        <div class="detail-map"><span class="map-label">${r.cmy}</span></div>
      </div>
      <aside class="detail-right">
        <div class="broker-card">
          <img class="broker-avatar" src="./assets/defaultAvatar.jpeg" />
          <div class="broker-name">${r.broker}</div>
          <div class="broker-info">电话：${r.phone}</div>
          <div class="broker-info">邮箱：user@example.com</div>
          <div class="broker-info">服务区域：杭州 ${r.district}</div>
          <div class="outline-btn">立即预约看房</div>
          <div class="outline-btn">申请租房</div>
        </div>
      </aside>
    </div>
  `);
}

function authLayout(kind) {
  const isLogin = kind === "login";
  return `
    <div class="auth-shell">
      <header class="auth-header"><a class="brand" onclick="go('/welcome')">雅阁租房</a><nav class="auth-nav"><a onclick="go('/login')">登录</a><span class="separator">|</span><a onclick="go('/register')">注册</a></nav></header>
      <div class="auth-card">
        <div class="auth-main">
          <div class="auth-title">${isLogin ? "账户登录" : "用户注册"}</div>
          <div class="tabs"><span class="active">${isLogin ? "密码登录" : "普通注册"}</span><span>${isLogin ? "手机号登录" : "房东注册"}</span></div>
          <div class="form-row"><input placeholder="用户名" /></div>
          ${!isLogin ? `<div class="form-row"><input placeholder="手机号" /></div><div class="form-row"><input placeholder="邮箱" /></div>` : ""}
          <div class="form-row"><input type="password" placeholder="密码" /></div>
          ${!isLogin ? `<div class="form-row"><input type="password" placeholder="确认密码" /></div>` : ""}
          <button class="primary-btn">${isLogin ? "登录" : "注册"}</button>
        </div>
      </div>
    </div>
  `;
}

function renderMine(page = "info") {
  const titles = { info: "我的资料", collection: "我的收藏", appointment: "我的预约", room: "我的房源", contract: "我的合同", order: "我的订单" };
  return `
    <div class="mine-page">
      <div class="mine-header-full"><div class="mine-header"><div class="mine-logo"><span class="mine-logo-name">雅阁租房</span><span class="split">|</span><span class="center-name">个人中心</span></div><a class="quit" onclick="go('/welcome')">退出</a></div></div>
      <div class="mine-sub-full"><div class="mine-sub"><img class="mine-avatar" src="./assets/defaultAvatar.jpeg" /><div class="mine-user-info"><div><span class="hello">下午好，wushuang</span><span>普通用户</span></div><div>欢迎来到雅阁租房系统个人中心</div></div></div></div>
      <div class="mine-content">
        <aside class="mine-sider">${Object.entries(titles).map(([k, v]) => `<div class="mine-menu-item ${page === k ? "active" : ""}" onclick="go('/mine/${k}')">▸ ${v}</div>`).join("")}</aside>
        <main class="mine-container"><div class="mine-title">${titles[page] || "我的资料"}</div>${mineBody(page)}</main>
      </div>
    </div>
  `;
}

function mineBody(page) {
  if (page === "info") {
    return `<div class="info-list">
      ${infoItem("头像", `<img class="mine-avatar" style="margin-top:5px" src="./assets/defaultAvatar.jpeg" />`)}
      ${infoItem("用户名", "wushuang")}
      ${infoItem("真实姓名", "wushuang")}
      ${infoItem("手机号", "13800000000")}
      ${infoItem("邮箱", "user@example.com")}
      ${infoItem("性别", "不愿透露")}
      ${infoItem("钱包余额", "￥ 8600.00")}
    </div>`;
  }
  const rows = {
    collection: ["收藏房源", "收藏时间", "租金", "小区", "操作"],
    appointment: ["预约房源", "预约时间", "联系人", "状态", "操作"],
    room: ["房源名称", "发布时间", "租金", "状态", "操作"],
    contract: ["合同房源", "签约时间", "租期", "状态", "操作"],
    order: ["订单房源", "创建时间", "金额", "状态", "操作"],
  };
  return table(rows[page] || rows.order);
}

function infoItem(label, value) {
  return `<div class="info-item"><div class="info-label">${label}</div><div class="info-content">${value}</div><button class="small-btn">修改</button></div>`;
}

function table(heads) {
  return `<div class="table-card"><div class="table-head">${heads.map((h) => `<div>${h}</div>`).join("")}</div>${rooms.slice(0, 4).map((r, i) => `<div class="table-row"><div>${r.name}</div><div>2026-05-${10 + i}</div><div>${i % 2 ? r.price + "元/月" : "￥" + r.price}</div><div>${i % 2 ? "已完成" : "进行中"}</div><div><a class="link">查看</a></div></div>`).join("")}</div><div class="pagination" style="margin:20px"><span>‹</span><span class="active">1</span><span>›</span></div>`;
}

function renderShared(kind = "room") {
  const isCmy = kind === "cmy";
  return baseLayout(`
    <div class="shared-room">
      <div class="shared-tabs"><a class="${!isCmy ? "active" : ""}" onclick="go('/sharedRoom/createRoom')">发布房源</a><a class="${isCmy ? "active" : ""}" onclick="go('/sharedRoom/createCmy')">创建小区</a></div>
      <div class="shared-content">
        <div class="form-grid">
          <div class="form-row"><label>${isCmy ? "小区名称" : "房源名称"}</label><input value="${isCmy ? "滨兴家园" : "滨兴家园 精装一室 拎包入住"}" /></div>
          <div class="form-row"><label>所在城市</label><input value="浙江省 杭州市" /></div>
          <div class="form-row"><label>区域</label><select><option>滨江区</option><option>上城区</option></select></div>
          <div class="form-row"><label>${isCmy ? "详细地址" : "租金"}</label><input value="${isCmy ? "滨兴路" : "1200"}" /></div>
          ${!isCmy ? `<div class="form-row"><label>户型</label><input value="1室1厅1卫" /></div><div class="form-row"><label>面积</label><input value="30平方米" /></div>` : ""}
          <div class="form-row full"><label>图片上传</label><div class="placeholder" style="width:180px;height:120px"></div></div>
          <div class="form-row full"><label>描述</label><textarea rows="5">房源真实可靠，交通便利，家具家电齐全。</textarea></div>
          <div class="form-row full"><button class="primary-btn">提交</button></div>
        </div>
      </div>
    </div>
  `);
}

function renderMapRoom() {
  return baseLayout(`
    <div class="map-page">
      <aside class="map-side"><h3>地图找房</h3>${rooms
        .slice(0, 3)
        .map((r) => `<div class="map-list-item"><strong>${r.cmy}</strong><span>${r.district} ${r.street}</span><em>${r.price}元/月起</em></div>`)
        .join("")}</aside>
      <div class="map-marker" style="left:610px;top:160px">滨兴家园</div>
      <div class="map-marker" style="left:820px;top:260px">温馨家园</div>
      <div class="map-marker" style="left:520px;top:390px">金地广场</div>
    </div>
  `);
}

function renderStatus(code) {
  return baseLayout(`<div class="status-code"><h1>${code}</h1><p>${code === 403 ? "抱歉，您暂无权限访问该页面" : "抱歉，您访问的页面不存在"}</p><button class="primary-btn" style="width:160px" onclick="go('/welcome')">返回首页</button></div>`);
}

function render() {
  const path = navPath().split("?")[0];
  let html;
  if (path === "/login") html = authLayout("login");
  else if (path === "/register") html = authLayout("register");
  else if (path === "/welcome" || path === "/") html = renderWelcome();
  else if (path === "/areaRoom") html = renderRoomList("area");
  else if (path === "/subwayRoom") html = renderRoomList("subway");
  else if (path === "/cmyRoom") html = renderCmyRoom();
  else if (path === "/cmyRoom/roomlist") html = renderCmyRoomList();
  else if (path === "/roomDetail") html = renderRoomDetail();
  else if (path === "/mapRoom") html = renderMapRoom();
  else if (path === "/sharedRoom/createRoom") html = renderShared("room");
  else if (path === "/sharedRoom/createCmy") html = renderShared("cmy");
  else if (path === "/sharedRoom/success") html = baseLayout(`<div class="success-page"><div class="success-icon">✓</div><h2>提交成功</h2><p>您的信息已提交，等待平台审核。</p></div>`);
  else if (path === "/noAccess" || path === "/sharedRoom/noAccess") html = baseLayout(`<div class="empty-page"><h2>暂无访问权限</h2><p>静态原型中已放开业务限制，此页用于展示原系统状态。</p></div>`);
  else if (path.startsWith("/mine/contract/contractInfo")) html = renderMine("contract");
  else if (path.startsWith("/mine/")) html = renderMine(path.split("/")[2] || "info");
  else if (path === "/403") html = renderStatus(403);
  else html = renderStatus(404);
  document.getElementById("app").innerHTML = html;
  window.scrollTo(0, 0);
}

window.addEventListener("hashchange", render);
render();
