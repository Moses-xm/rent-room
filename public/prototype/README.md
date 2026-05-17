# 雅阁租房系统静态高保真原型

直接在浏览器打开 `index.html` 即可查看。页面使用 hash 路由，不依赖登录权限和后端业务逻辑。

## 页面路径

- `#/welcome` 首页
- `#/areaRoom` 区域找房
- `#/subwayRoom` 地铁找房
- `#/cmyRoom` 小区找房
- `#/cmyRoom/roomlist` 小区房源列表
- `#/roomDetail` 房源详情
- `#/mapRoom` 地图找房
- `#/login` 登录
- `#/register` 注册
- `#/sharedRoom/createRoom` 发布房源
- `#/sharedRoom/createCmy` 创建小区
- `#/sharedRoom/success` 提交成功
- `#/mine/info` 我的资料
- `#/mine/collection` 我的收藏
- `#/mine/appointment` 我的预约
- `#/mine/room` 我的房源
- `#/mine/contract` 我的合同
- `#/mine/order` 我的订单
- `#/403`、`#/404` 状态页

房源图片优先引用当前本机后端 `http://127.0.0.1:8088` 的上传资源；加载失败会自动替换成同尺寸图片占位。
