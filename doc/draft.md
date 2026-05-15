## 租房系统

注：关于位置，设想可以直接调百度地图接口，获取所有的省市区，而不再在数据库中做存储备份

在登记房源信息时，可以直接将房源位置存储到房源表上

小区和房源：一对多

#### 百度地图

百度地图所需字段：省、市、区、地铁线、小区、经纬度

百度地图可提供：地址解析服务和逆地址解析服务

点击地图上某一点，可以获取到其省市区路街道（addressComponents: {streetNumber: "", street: "创意路", district: "西湖区", city: "杭州市", province: "浙江省"}；address: "浙江省杭州市西湖区创意路"），经纬度



定位功能，在后台管理中设置定位功能，位置首先被定位到市，然后地图的加载中心点就是该市，级联列表也会自动选中到市级，在此基础上进行更细节的选择

管理员在添加小区的时候，此时已自动选中省市，鼠标点击地图可以直接继续自动填充区，街道，经纬度，街道号码（可为空）等，然后进行填写小区名，地铁线等，提交表单，信息入库，小区添加完成

管理员利用地图添加小区，房东也可使用此方法，快速定位自己的房源位置

在添加小区的时候，也可以不使用地图，直接用级联列表选择区，街道，街道号，此时利用逆地址解析服务立即将地图定位到所选位置

用户在发布房源的时候，第一步是选择小区，如果没有的话就进行创建小区，选择好小区之后第二步才是创建房源，进行各项房源信息的登记

管理员在发布房源的时候，第一步也是选择小区，没有则创建，第二步创建房源

## 步骤

### 用户端（定导航）

首页导航模块：用户端（C端）

区域找房

地铁找房

地图找房

小区找房

我要出租

#### 分类：

##### 一级分类：

- 区域找房

- 地铁找房
- 地图找房
- 小区找房

- 我要出租

##### 二级分类（一些筛选条件）

区域找房

- 位置：区
- 方式：整租合租
- 价格（区间、可自定义）
- 房型（n居室）
- 楼层：低中高
- 朝向
- 更多筛选：房屋类型（公寓、普通楼房、别墅）、近地铁、电梯房

地铁找房

- 位置：地铁线
- 方式：整租合租
- 价格（区间、可自定义）
- 房型（n居室）
- 楼层：低中高
- 朝向
- 更多筛选：房屋类型（公寓、普通楼房、别墅）、近地铁、电梯房

小区找房

- 位置：区
- 方式：整租合租
- 价格（区间、可自定义）
- 房型（n居室）
- 楼层：低中高
- 朝向
- 更多筛选：房屋类型（公寓、普通楼房、别墅）、近地铁、电梯房

##### 三级分类

- 综合排序
- 最新上架
- 价格
- 面积

#### 首页设计

轮播图

热门推荐

热门房源

热门小区

#### 我的模块

我的资料：用户的一些信息，可以进行增删改查

我的收藏：收藏的房源，有取消收藏的功能

我的房源（我发布的房源）：有用户对房源增删改查功能

我的预约：用户在点击预约看房后会选择看房时间，确定后向预约看房表中添加一条数据，此时房东会在“我的消息”中收到一条未读消息，点击会变成已读，当时间过了预约时间5小时后，看房状态变为已看房

我的合同：存放合同信息

我的订单：分为我的付款和我的收款

#### 租房交易模块

##### 支付模块

用户在房屋详情页面点击出租按钮即可进入租房交易页面

选择出租时间：一年、 6个月，然后选择开始时间，系统会自动计算出结束时间：

yyyy-mm-dd 00:00:00 - yyyy-mm-dd 00:00:00

用户点击确认支付，进行钱包余额扣除操作，若余额不足则提示用户充值，终止支付，若余额足够则继续扣除，支付成功，进入查看订单页面

##### 租房成功后要做的事情

对于用户：当前租户余额减少，房东（发布者）余额增加

对于房源：房源状态变为已出租，租期开始时间和结束时间更新为租户所填写的时间，房源的租出人renter更新为当前用户

向合同表中插入一条记录

向订单表中插入一条记录

#### 订单模块

查询订单表即可

订单只可进行查看，不可操作

#### 搜索模块

首页设搜索框，可以输入小区名字、地址等进行查询，发送网络请求，对相应字段进行模糊查询

#### 是否需要登录

关于用户端，用户在查看首页、房源等页面时不需要登录

需要登录才可以的操作：预定、租房、预约看房

### 后台管理系统（定路由）

#### 路由

欢迎页面(/home)

首页管理（/index）

- 轮播图管理(/index/carousel)
- 数据统计：echarts图形图表(/index/analyse)

管理员管理（/admin）

- 管理员列表（/admin/list）

权限管理

- 角色列表
- 权限列表

用户管理

- 用户列表

房源管理

- 小区列表

- 房源列表
- 房屋设施列表

收藏预约管理

- 收藏列表
- 预约看房列表

租房管理

- 合同列表
- 退房列表

订单管理

- 订单列表

#### echarts

需要统计的项：

租房量

- 柱形图为每月的，有日租房量，月租房量，年租房量，总租房量选项

订单量

- 按时间线展示订单量，日月年总订单量

收藏量

- 按收藏量从高到低展示热门房源和热门小区（查房源表）
- 可按时间线展示收藏量，日月年总收藏量

浏览量：

- 按浏览量从高到低展示房源

预定量

- 按时间线展示预定量，日月年总预定量

发布量

- 按时间线展示发布量，日月年总发布量
- 按发布房源数量从高到低排列可展示出热门房东



### 设计数据库表

用户：

1. 超级管理员（后台）：有最高权限
2. 普通管理员（后台）：由超级管理员分配权限
3. 普通用户（前台）：身份为租户
4. 高级用户（前台）：身份为房东

用户角色：

超级管理员（一个）

普通管理员（多个，账号密码由超级管理员分配）

用户（多个）：在前台页面进行注册，成功之后默认为普通用户

房东（多个）：用户想出租自己的房源时需进行认证，通过之后身份转为房东，才可登记房源信息

#### 轮播图表（carousel）

| 列名    | 类型    | 长度 | 是否为空 | 描述     |
| ------- | ------- | ---- | -------- | -------- |
| id      | int     | 11   | 主键自增 | 轮播图id |
| image   | varchar | 500  | 不为空   | 图片     |
| path    | varchar | 500  | 不为空   | 跳转路径 |
| created | varchar | 15   | 默认Now  | 创建日期 |
| deleted | int     | 1    | 默认0    | 是否删除 |

#### 管理员表（admin）

| 列名     | 类型    | 长度 | 是否为空     | 描述     |
| -------- | ------- | ---- | ------------ | -------- |
| id       | int     | 11   | 主键自增     | 管理员id |
| username | varchar | 15   | 不为空，唯一 | 用户名   |
| password | varchar | 15   | 不为空       | 密码     |
| role_id  | int     | 11   | 不为空       | 角色id   |
| avatar   | varchar | 500  | 空           | 头像     |
| created  | varchar | 15   | 默认Now      | 创建日期 |
| deleted  | int     | 1    | 默认0        | 是否删除 |

头像不上传默认放一张

#### 用户表（user）

| 列名     | 类型    | 长度 | 是否为空     | 描述                            |
| -------- | ------- | ---- | ------------ | ------------------------------- |
| id       | int     | 11   | 主键自增     | 用户id                          |
| username | varchar | 15   | 不为空，唯一 | 用户名                          |
| password | varchar | 15   | 不为空       | 用户密码                        |
| phone    | varchar | 20   | 不为空       | 用户电话                        |
| nickname | varchar | 15   | 空           | 用户昵称                        |
| realname | varchar | 15   | 空           | 用户真实名字                    |
| gender   | int     | 1    | 默认3        | 用户性别（1男，2女，3不愿透露） |
| identity | int     | 1    | 默认1        | 用户身份（1为用户，2为房东）    |
| avatar   | varchar | 500  | 空           | 用户头像                        |
| email    | varchar | 50   | 空           | 用户邮箱                        |
| province | varchar | 30   | 空           | 省                              |
| city     | varchar | 30   | 空           | 市                              |
| district | varchar | 30   | 空           | 县区                            |
| address  | varchar | 100  | 空           | 用户详细地址                    |
| wallet   | double  | -    | 默认0        | 用户钱包                        |
| pay_code | varchar | 10   | 空           | 支付密码（默认值000000）        |
| created  | varchar | 15   | 默认Now      | 创建日期                        |
| deleted  | int     | 1    | 默认0        | 是否删除                        |

注：用户真实名字可为空，在实名认证之后录入，用户在租房或者出租房屋时必须要实名认证

用户头像可为空，为空的话会展示一张默认图片

#### 角色表（role）

| 列名        | 类型    | 长度 | 是否为空 | 描述                 |
| ----------- | ------- | ---- | -------- | -------------------- |
| id          | int     | 11   | 主键自增 | 角色id               |
| name        | varchar | 20   | 不为空   | 角色名               |
| permissions | varchar | 5000 | 不为空   | 角色权限列表（json） |
| created     | varchar | 15   | 默认Now  | 创建日期             |
| deleted     | int     | 1    | 默认0    | 是否删除             |

#### 权限表（permission）

| 列名    | 类型    | 长度 | 是否为空 | 描述       |
| ------- | ------- | ---- | -------- | ---------- |
| id      | int     | 11   | 主键自增 | 权限id     |
| pid     | int     | 11   | 不为空   | 权限父级id |
| name    | varchar | 50   | 不为空   | 权限名     |
| path    | varchar | 100  | 不为空   | 权限路径   |
| created | varchar | 15   | 默认Now  | 创建日期   |
| deleted | int     | 1    | 默认0    | 是否删除   |

#### 小区表（community）

| 列名         | 类型    | 长度 | 是否为空 | 描述                          |
| ------------ | ------- | ---- | -------- | ----------------------------- |
| id           | int     | 11   | 主键自增 | 小区id                        |
| name         | varchar | 50   | 不为空   | 小区名字                      |
| province     | varchar | 30   | 不为空   | 省                            |
| city         | varchar | 30   | 不为空   | 市                            |
| district     | varchar | 30   | 不为空   | 县区                          |
| street       | varchar | 30   | 空       | 街道                          |
| streetNumber | varchar | 20   | 空       | 街道号                        |
| subway_line  | varchar | 50   | 空       | 地铁线(可输入多条线路，如2/3) |
| lng          | double  | -    | 不为空   | 经度                          |
| lat          | double  | -    | 不为空   | 纬度                          |
| cover        | varchar | 500  | 不为空   | 小区封面（一张）              |
| created      | varchar | 15   | 默认Now  | 创建日期                      |
| deleted      | int     | 1    | 默认0    | 是否删除                      |

#### 房源表（room）

| 列名         | 类型    | 长度 | 是否为空 | 描述                                       |
| ------------ | ------- | ---- | -------- | ------------------------------------------ |
| id           | int     | 11   | 主键自增 | 房源id                                     |
| name         | varchar | 100  | 不为空   | 房源名字                                   |
| cmy_id       | int     | 11   | 不为空   | 小区id（根据小区可以定地址）               |
| rent_type    | int     | 1    | 不为空   | 租房类型：整租、合租（1为整租，2为合租）   |
| min_tenancy  | int     | -    | 不为空   | 最短租期（月）                             |
| bedroom      | int     | 1    | 不为空   | 户型：几室（1，2，3，4，5）                |
| parlour      | int     | 1    | 不为空   | 几厅                                       |
| bathroom     | int     | 1    | 不为空   | 几卫                                       |
| room_type    | varchar | 20   | 不为空   | 房屋类型（普通住宅、公寓）                 |
| direction    | varchar | 10   | 不为空   | 朝向：东西南北选项（文本）                 |
| price        | double  | -    | 不为空   | 价格：元/月                                |
| area         | int     | -    | 不为空   | 面积：平方米                               |
| pledge       | int     | 1    | 不为空   | 押几                                       |
| pay          | int     | 1    | 不为空   | 付几（押1付1/押1付2/押1付3）               |
| floor        | int     | -    | 不为空   | 楼层：第几层                               |
| floors       | int     | -    | 不为空   | 共几层                                     |
| level        | int     | 1    | 不为空   | 低中高层（1，2，3）                        |
| lift         | int     | 1    | 不为空   | 是否有电梯（1无，2有）                     |
| desc         | varchar | 9000 | 不为空   | 房源描述（房屋概况）：（富文本编辑）       |
| cover        | varchar | 500  | 不为空   | 房屋封面（一张）                           |
| images       | varchar | 9000 | 不为空   | 房源图片（支持多张）                       |
| facility_ids | varchar | 500  | 不为空   | 房屋设施id，可以选择多个设施（json）       |
| publisher_id | int     | 11   | 不为空   | 发布人id                                   |
| ispublished  | int     | 1    | 不为空   | 是否发布(2已发布和1未发布)                 |
| publish_time | varchar | 15   | 空       | 发布时间                                   |
| room_code    | varchar | 20   | 不为空   | 房屋编码（随机生成16位数字，可使用时间戳） |
| isrented     | int     | 1    | 默认1    | 是否租出（1未租出，2已租出）               |
| views        | int     | -    | 默认0    | 浏览量（只要房源被查看自增1）              |
| times        | int     | -    | 默认0    | 房屋被出租次数                             |
| income       | double  | -    | 默认0    | 房屋总收益                                 |
| created      | varchar | 15   | 默认Now  | 创建日期                                   |
| deleted      | int     | 1    | 默认0    | 是否删除                                   |

房源详情中的房屋信息可以满足，其余信息需查看房屋设施表

房屋信息：出租类型、户型、面积、公共卫生间、地铁近（几号线）、小区、类型、发布时间

关于浏览量，数据需要进行处理，当变为四位数时要转化为千，五位数时要转化为万

整租和合租的区别：

整租：朝向为南北居多，即朝向加一个南北，安居客朝向选项全部拿过来；

房屋配套分类只有一级，展示所有项，未选中项置空图标

合租：房屋配套分类有两级，分别为卧室设施和公共设施，只展示选中项

关于房源发布：

一个人可以发布多套房源，一个房源只能被一个人发布

用户既然有发布房源的权利，也就相应的有了自己发布房源的修改、删除权利，自然也有发布新房源的权利

用户在发布房源的时候，首先会先选择小区或创建小区，然后创建房源，完成后可以点击“保存并发布”，房源状态直接变为已发布并且有发布时间，也可以点击“保存为草稿”，房源和小区以创建，但房源状态为未发布，发布时间为空，用户在管理自己房源信息的时候可以操作发布房源和撤回房源

#### 房屋设施表（facility）

| 列名    | 类型    | 长度 | 是否为空 | 描述     |
| ------- | ------- | ---- | -------- | -------- |
| id      | int     | 11   | 主键自增 | 设施id   |
| name    | varchar | 50   | 不为空   | 设施名字 |
| icon    | varchar | 100  | 不为空   | 设施图标 |
| created | varchar | 15   | 默认Now  | 创建日期 |
| deleted | int     | 1    | 默认0    | 是否删除 |

这些设施只能是有无，有则将id填进房屋设施facility_ids的数组中，无则不填

房屋配置（整租）：空调、冰箱、洗衣机、热水器、宽带、开放式厨房、阳台、电视、衣柜、独立卫生间、公共卫生间、智能门锁、沙发、燃气灶、停车位...

服务设施（合租）：（

公共设施：WIF、空调、冰箱、洗衣机、电视、电梯、饮水机、暖气、智能门锁、阳台、衣柜

卧室设施：独立卫生间、热水器

）（二级分类列表的pid不为零）

注：房屋设施模块数据库存取有些复杂，还需进一步设计

#### 收藏表（collection）

| 列名    | 类型    | 长度 | 是否为空 | 描述       |
| ------- | ------- | ---- | -------- | ---------- |
| id      | int     | 11   | 主键自增 | 收藏id     |
| user_id | int     | 11   | 不为空   | 收藏人id   |
| room_id | int     | 11   | 不为空   | 收藏房源id |
| created | varchar | 15   | 默认Now  | 创建日期   |
| deleted | int     | 1    | 默认0    | 是否删除   |

注：此表为多对多关系

用户取消收藏的时候，表中该记录删除即可

操作：

添加一条收藏记录时，要更新房源表，收藏次数加一，

取消收藏时，即删除该表记录时，房源表收藏次数减一

请求房源下拉框时，只请求已发布的房源，未发布的房源用户看不到

#### 预约看房表（appointment）

| 列名             | 类型    | 长度 | 是否为空 | 描述                           |
| ---------------- | ------- | ---- | -------- | ------------------------------ |
| id               | int     | 11   | 主键自增 | 预约id                         |
| user_id          | int     | 11   | 不为空   | 预约人id                       |
| room_id          | int     | 11   | 不为空   | 预约房源id                     |
| landlord_id      | int     | 11   | 不为空   | 被约房东id                     |
| appointment_time | varchar | 15   | 不为空   | 预约时间                       |
| landlord_deleted | int     | 1    | 默认1    | 房东是否删除记录（1否，2是）   |
| user_deleted     | int     | 1    | 默认1    | 预约人是否删除记录（1否，2是） |
| created          | varchar | 15   | 默认Now  | 创建日期                       |
| deleted          | int     | 1    | 默认0    | 是否删除                       |

用户在点击预约看房后会选择看房时间，确定后向预约看房表中添加一条数据，当时间过了预约时间某小时后，我的预约中看房状态变为已看房

此表供“我的预约”模块使用

请求房源下拉框时，只请求已发布和未租出的房源，未发布和已租出的房源用户不可以预约

预约看房时，用户点击预约看房，选好时间之后，点击确定，向该表中插入一条记录

当预约看房时间过去5小时，看房状态变为已看房

我的预约中有预约看房列表，有待看房和已看房两种状态

#### 合同表（contract）

| 列名             | 类型    | 长度 | 是否为空 | 描述                                                        |
| ---------------- | ------- | ---- | -------- | ----------------------------------------------------------- |
| id               | int     | 11   | 主键自增 | 合同id                                                      |
| user_id          | int     | 11   | 不为空   | 租房人id                                                    |
| room_id          | int     | 11   | 不为空   | 房源id                                                      |
| landlord_id      | int     | 11   | 不为空   | 房东id                                                      |
| tenancy          | int     | -    | 不为空   | 租期：月（用户第一次会选择，续签之后增加）                  |
| onlinetime       | varchar | 20   | 不为空   | 租出时间：开始时间"2020.05.05"                              |
| offlinetime      | varchar | 20   | 不为空   | 租出时间：结束时间"2021.05.05"                              |
| pledge           | double  | -    | 不为空   | 已付押金                                                    |
| fee              | double  | -    | 不为空   | 每次应交房租                                                |
| paid_period      | varchar | 1000 | 不为空   | 已付房租所达期限["2020.1.1-2020.4.1","2020.4.1-2020.7.1"]   |
| paying_period    | varchar | 1000 | 不为空   | 应付房租所达期限["2020.7.1-2020.10.1","2020.10.1-2021.1.1"] |
| renew_times      | int     | -    | 默认0    | 续租次数                                                    |
| landlord_deleted | int     | 1    | 默认1    | 房东是否删除合同（1否，2是）                                |
| user_deleted     | int     | 1    | 默认1    | 用户是否删除合同（1否，2是）                                |
| ischeckout       | int     | 1    | 默认1    | 用户是否退房（1否，2是）                                    |
| checkout_time    | varchar | 15   | 默认Now  | 退房时间                                                    |
| refund           | int     | 1    | 不为空   | 是否退押金(1不退，2退)                                      |
| created          | varchar | 15   | 默认Now  | 创建日期                                                    |
| deleted          | int     | 1    | 默认0    | 是否删除                                                    |

注：此表为一对多关系

一个用户可以租赁多个房屋，一个房源只能被一个人租赁

在此表中可以查询已出租的房源以及租房人

操作：

当添加一条合同记录时，要更新房源表，租房状态改为已出租，租出次数加一，房源收益加押金和房租

当续签时，更新该条记录，应付房租所达期限数组更新，截止时间更新，租期更新，续租次数加一

当点击退房时，更新该条记录，退房改为已退房，填写退房时间，是否退押金，更新房源表，租房状态改为未租出

当点击续交房租时，更新该条记录，paid_period和paying_period数组更新，更新房源表，房源收益增加，更新订单表，添加一条订单记录

请求房源下拉框时，只请求已发布的房源，未发布的房源用户看不到

分析：用户点击租房，选择签约期限（例如一年），计算押金和月房租（1，2，3）之和，进行第一次付款签约，付款成功后，生成一张合同表，有签约时间（即租房开始时间），已交房租，押金，待交房租，中间还需交几次房租，每次房租什么时候交，交的房租所到达的期限是从什么时候到什么时候，每当离交房租时间还有24个小时之内会提醒交费，交费之后会更新合同，然后下一个时间继续提醒

签合同所依据的有关计算：根据房源的pledge，pay可知道是押几付几，根据price可以知道月付多少钱，比如说押一付三，签一年合同，月付1000，2020.1.1开始租房，截止时间则为2021.1.1，则第一次付款需付押金+第一个月房租=1000\*1+1000*3=4000，期限为2020.1.1-2020.4.1，此时会生成合同

关于合同续签：

用户在第一次付款之后任意时刻可进行合同续签，合同只允许向后延期，不允许向前缩短，所以一旦续签合同之后无法回退，就只能等待合同完成正常退房，否则押金不退还，用户需慎重考虑续签。每次续签必须是最短续期的整数倍，点击续签之后，系统计算应交房租的次数和金额，更新合同供用户浏览，用户点击确定后续签合同成功

比如说上一份合同我再续签半年，系统计算，加的时间段为2021.1.1-2021.7.1，付款次数为6/3=2次，分别为2021.1.1-2021.4.1，付3000元，2021.4.1-2021.7.1，付3000元，将这两个时段加进paying_period数组，然后更新租期和截止时间即可

##### 签合同消息通知

当用户点击租房后，选择时间，支付成功后，会生成合同

当距离交房租时间已经过去24小时以后，向用户发送一条提醒消息

您出租的XXX房屋的房租已经到期了，现已超期24小时，超期10天将强制非法退房，请您尽快续交房租！

（id为用户，now-应付房租所达期限数组[0]的开始时间>24，是否删除：false）

用户在房源到达合同截止日期前24小时，用户收到消息：

您出租的XXX房屋，还有不到24小时即将到达合同截止日期，请您及时收拾好行李准备退房，若您想继续租赁此房，请点击续签合同进行合同的续签，如果您没有及时退房的话，在房屋到期24小时后将自动退房，会将押金自动退还给您！【已读】

（id为用户，结束时间-现在<24h，是否删除：false）

关于退房：

用户点击退房，首先会先判断是否是合法退房，用户点击确定后会在该表中将退房更新为true

非法退房的情况：用户提前退房，即合同上最后一次付款还未完成前，可以判断paying_period数组是否为空，如果为空，说明最后一笔付款已完成，用户进行提前退房是合法的，退还押金并提前结束合同；如果是在最后一笔付款结束之前点击退房，即paying_period数组还不为空时，则为非法退房，此时不退换押金并提前结束合同；

关于房源超期的处理：如不点击，到期后超过12小时自动退房，退还押金，租房结束，房子变为可出租状态，合同结束，交易结束

##### 合法退房消息通知

用户进行合法退房，会弹窗提示：您将要退房，请稍后联系房东，届时会将押金退还给您！

确认后退房成功，在该表中将退房更新为true，在房源表将已租出更新为未出租

#####非法退房消息通知

用户非法退房，会弹窗提示：您的合同还未完成，如果此时退房的话属于非法退房，押金将不会退还给您，您真的要退房吗？

用户点击确定后，退房成功，在该表中将退房更新为true，在房源表将已租出更新为未出租

当距离交房租时间已经过去10天后，强制非法退房，然后向用户发送消息告知：

您出租的XXX房屋的房租已经超期未交房租或者非法退房，房屋已经退订，请您及时搬出，谢谢配合！

#### 订单表（order）

| 列名        | 类型    | 长度 | 是否为空 | 描述                                  |
| ----------- | ------- | ---- | -------- | ------------------------------------- |
| id          | int     | 11   | 主键自增 | 订单id                                |
| payer_id    | int     | 11   | 不为空   | 付款人id                              |
| room_id     | int     | 11   | 不为空   | 作用房源id                            |
| payee_id    | int     | 11   | 不为空   | 收款人id                              |
| fee         | double  | -    | 空       | 支付额                                |
| pledge      | double  | -    | 空       | 支付押金                              |
| paid_period | varchar | 50   | 空       | 已付房租所达期限("2020.1.1-2020.4.1") |
| created     | varchar | 15   | 默认Now  | 创建日期                              |
| deleted     | int     | 1    | 默认0    | 是否删除                              |

注：此表用来存放每一笔支付记录

每个人的订单存放在“我的订单”模块，可分为我的付款和我的收款

在每一次进行付款操作的时候，对应的向该表中插入一条记录

用户在刚开始点击租房时，会计算出所付押金和第一次房租，并已付房租所达期限["2020.1.1-2020.4.1","2020.4.1-2020.7.1"]，所以订单从这时开始产生，示例为：

您已支付4000元给XXX，包括房租和押金，期限为2020.1.1-2020.4.1","2020.4.1-2020.7.1，支付日期：created

您已收款4000元来自XXX，包括房租和押金，期限为2020.1.1-2020.4.1","2020.4.1-2020.7.1，收款日期：created

### 合同

#### 合同示例：

您已经成功出租XXX房屋，租房时间为2020.1.1-2021.1.1，已付押金1000元

已付房租3000元，时间为2020.1.1-2020.4.1；

还应支付金额为：

2020.4.1-2020.7.1，应付3000元；

2020.7.1-2020.10.1，应付3000元；

2020.10.1-2021.1.1，应付3000元；

在离交房租日期24小时以内，系统会提醒您付款

如果您超期没有付款，房东会联系您需交房租

超过10天没有处理，系统将强制退房，届时押金将不退还，请您注意系统消息并及时续租！

交费之后更新合同：

您已经成功出租XXX房屋，租房时间为2020.1.1-2021.1.1，已付押金1000元

已付房租3000元，时间为2020.1.1-2020.4.1；

已付房租3000元，时间为2020.4.1-2020.7.1；

还应支付金额为：

2020.7.1-2020.10.1，应付3000元；

2020.10.1-2021.1.1，应付3000元；

在离交房租日期24小时以内，系统会提醒您付款

如果您超期没有付款，房东会联系您需交房租

超过10天没有处理，系统将强制退房，届时押金将不退还，请您注意系统消息并及时续租！

#### 续签合同示例

续签后更新合同示例：

您已经续签了XXX房屋的合同，续签之后合同将变为：

您已经成功出租XXX房屋，租房时间为2020.1.1-2021.7.1，已付押金1000元

已付房租3000元，时间为2020.1.1-2020.4.1；

已付房租3000元，时间为2020.4.1-2020.7.1；

还应支付金额为：

2020.7.1-2020.10.1，应付3000元；

2020.10.1-2021.1.1，应付3000元；

2021.1.1-2021.4.1，应付3000元；

2021.4.1-2021.7.1，应付3000元；

在离交房租日期24小时以内，系统会提醒您付款

如果您超期没有付款，房东会联系您需交房租

超过10天没有处理，系统将强制退房，届时押金将不退还，请您注意系统消息并及时续租！

接口文档：
## 接口文档

### 管理员

#### 管理员登录

请求URL

```
admin/login
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明   |
| -------- | ---- | ------ | ------ |
| username | 是   | string | 用户名 |
| password | 是   | string | 密码   |

查询数据库

```
select * from admin where username=? and password=? where deleted=false
```

返回示例

#### 获取所有管理员列表

请求URL

```
admin/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from admin where deleted=false
```

返回示例

#### 添加管理员

请求URL

```
admin/add
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明     |
| -------- | ---- | ------ | -------- |
| id       | 是   | number | 管理员id |
| username | 是   | string | 用户名   |
| password | 是   | string | 密码     |
| role_id  | 是   | string | 角色id   |
| ...      | 否   |        |          |

查询数据库

```
insert('admin', addObj);
```

返回示例

#### 修改管理员

请求URL

```
admin/update
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明     |
| -------- | ---- | ------ | -------- |
| id       | 是   | number | 管理员id |
| username | 是   | string | 用户名   |
| password | 是   | string | 密码     |
| role_id  | 是   | string | 角色id   |
| ...      | 否   |        |          |

查询数据库

```
mysql.update('admin', addObj)
```

返回示例

#### 删除管理员

请求URL

```
admin/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| id     | 是   | number | 管理员id |

查询数据库

```
mysql.update('admin', { id, deleted: true })
```

返回示例

### 角色

#### 获取角色列表

请求URL

```
role/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from role where deleted=false
```

返回示例

#### 添加角色

请求URL

```
role/add
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明                 |
| ----------- | ---- | ------ | -------------------- |
| id          | 是   | number | 角色id               |
| name        | 是   | string | 角色名               |
| permissions | 是   | string | 角色权限列表（json） |
| ...         | 否   |        |                      |

查询数据库

```
insert('role', addObj);
```

返回示例

#### 修改角色

请求URL

```
role/update
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明                 |
| ----------- | ---- | ------ | -------------------- |
| id          | 是   | number | 角色id               |
| name        | 是   | string | 角色名               |
| permissions | 是   | string | 角色权限列表（json） |
| ...         | 否   |        |                      |

查询数据库

```
mysql.update('role', addObj)
```

返回示例

#### 删除角色

请求URL

```
role/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 角色id |

查询数据库

```
mysql.update('role', { id, deleted: true })
```

返回示例

### 权限管理

#### 获取权限列表

请求URL

```
permission/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from permission where deleted=false
```

返回示例

#### 添加权限

请求URL

```
permission/add
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明       |
| ------ | ---- | ------ | ---------- |
| id     | 是   | number | 权限id     |
| pid    | 是   | number | 权限父级id |
| name   | 是   | string | 权限名     |
| path   | 是   | string | 权限路径   |
| ...    | 否   |        |            |

查询数据库

```
insert('permission', addObj);
```

返回示例

#### 修改权限

请求URL

```
permission/update
```

请求方式

```
post
```

| 参数名 | 必选 | 类型   | 说明       |
| ------ | ---- | ------ | ---------- |
| id     | 是   | number | 权限id     |
| pid    | 是   | number | 权限父级id |
| name   | 是   | string | 权限名     |
| path   | 是   | string | 权限路径   |
| ...    | 否   |        |            |

查询数据库

```
mysql.update('permission', addObj)
```

返回示例

#### 删除权限

请求URL

```
permission/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 权限id |

查询数据库

```
mysql.update('permission', { id, deleted: true })
```

返回示例

### 用户管理

#### 用户登录

请求URL

```
user/login
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明   |
| -------- | ---- | ------ | ------ |
| username | 是   | string | 用户名 |
| password | 是   | string | 密码   |

查询数据库

```
select * from user where username=? and password=? where deleted=false
```

返回示例

#### 用户注册

请求URL

```
user/register
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明     |
| -------- | ---- | ------ | -------- |
| username | 是   | string | 用户名   |
| password | 是   | string | 密码     |
| phone    | 是   | string | 用户电话 |

查询数据库

```
insert('user', { username: 'admin', password: '123456',  phone: ''})
```

返回示例

#### 获取所有用户列表

请求URL

```
user/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from user where deleted=false
```

返回示例

#### 获取用户信息详情

请求URL

```
user/list/id
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from user where deleted=false and id=?
```

返回示例

#### 添加用户

请求URL

```
user/add
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明     |
| -------- | ---- | ------ | -------- |
| username | 是   | string | 用户名   |
| password | 是   | string | 密码     |
| phone    | 是   | string | 用户电话 |
| ...      | 否   |        |          |

查询数据库

```
insert('user', addObj);
```

返回示例

#### 修改用户

请求URL

```
user/update
```

请求方式

```
post
```

参数

| 参数名   | 必选 | 类型   | 说明     |
| -------- | ---- | ------ | -------- |
| id       | 是   | number | 用户id   |
| username | 是   | string | 用户名   |
| password | 是   | string | 密码     |
| phone    | 是   | string | 用户电话 |
| ...      | 否   |        |          |

查询数据库

```
mysql.update('user', addObj)
```

返回示例

#### 删除用户

请求URL

```
user/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 用户id |

查询数据库

```
mysql.update('user', { id, deleted: true })
```

返回示例

### 小区管理

#### 获取小区列表

请求URL

```
community/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from community where deleted=false
```

返回示例

#### 获取小区详情

请求URL

```
community/list/id
```

请求方式

```
get
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 小区id |

查询数据库

```
select * from community where deleted=false and where id=id
```

返回示例

#### 添加小区

请求URL

```
community/add
```

请求方式

```
post
```

参数

| 参数名    | 必选 | 类型   | 说明     |
| --------- | ---- | ------ | -------- |
| name      | 是   | string | 小区名字 |
| province  | 是   | string | 省       |
| city      | 是   | string | 市       |
| district  | 是   | string | 区       |
| longitude | 是   |        | 经度     |
| latitude  | 是   |        | 纬度     |
| ...       | 否   |        |          |

查询数据库

```
insert('community', addObj);
```

返回示例

#### 修改小区

请求URL

```
community/update
```

请求方式

```
post
```

参数

| 参数名    | 必选 | 类型   | 说明     |
| --------- | ---- | ------ | -------- |
| id        | 是   | number | 小区id   |
| name      | 是   | string | 小区名字 |
| province  | 是   | string | 省       |
| city      | 是   | string | 市       |
| district  | 是   | string | 区       |
| longitude | 是   |        | 经度     |
| latitude  | 是   |        | 纬度     |
| ...       | 否   |        |          |

查询数据库

```
mysql.update('community', addObj)
```

返回示例

#### 删除小区

请求URL

```
community/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 小区id |

查询数据库

```
mysql.update('community', { id, deleted: true })
```

返回示例

### 房源管理

#### 获取房源列表

请求URL

```
room/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from room where deleted=false
```

返回示例

#### 按条件获取房源

请求URL

```
room/list/...
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from room where deleted=false and ...
```

返回示例

#### 获取热门房源列表

请求URL

```
room/hot/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from room where deleted=false and ...
```

返回示例

#### 获取某用户发布房源列表

请求URL

```
room/publish/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from room where deleted=false and publisher_id=id
```

返回示例

#### 获取房源详情

请求URL

```
room/list/id
```

请求方式

```
get
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 房源id |

查询数据库

```
select * from room where deleted=false and where id=id
```

返回示例

#### 添加房源

请求URL

```
room/add
```

请求方式

```
post
```

参数

| 参数名       | 必选 | 类型   | 说明     |
| ------------ | ---- | ------ | -------- |
| name         | 是   | string | 房源名字 |
| cmy_id       | 是   | number | 小区id   |
| publisher_id | 是   | number | 发布人id |
| ...          | 否   |        |          |

查询数据库

```
insert('room', addObj);
```

返回示例

#### 修改房源

请求URL

```
room/update
```

请求方式

```
post
```

参数

| 参数名       | 必选 | 类型   | 说明     |
| ------------ | ---- | ------ | -------- |
| id           | 是   | number | 房源id   |
| name         | 是   | string | 房源名字 |
| cmy_id       | 是   | number | 小区id   |
| publisher_id | 是   | number | 发布人id |
| ...          | 否   |        |          |

查询数据库

```
mysql.update('room', addObj)
```

返回示例

#### 删除房源

请求URL

```
room/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 房源id |

查询数据库

```
mysql.update('room', { id, deleted: true })
```

返回示例

### 房屋设施管理

#### 获取房屋设施列表

请求URL

```
facility/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from facility where deleted=false
```

返回示例

#### 添加房屋设施

请求URL

```
facility/add
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明           |
| ------ | ---- | ------ | -------------- |
| id     | 是   | number | 房屋设施id     |
| pid    | 是   | number | 房屋设施父级id |
| name   | 是   | string | 房屋设施名     |
| icon   | 是   | string | 房屋设施图标   |
| ...    | 否   |        |                |

查询数据库

```
insert('facility', addObj);
```

返回示例

#### 修改房屋设施

请求URL

```
facility/update
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明           |
| ------ | ---- | ------ | -------------- |
| id     | 是   | number | 房屋设施id     |
| pid    | 是   | number | 房屋设施父级id |
| name   | 是   | string | 房屋设施名     |
| icon   | 是   | string | 房屋设施图标   |
| ...    | 否   |        |                |

查询数据库

```
mysql.update('facility', addObj)
```

返回示例

#### 删除房屋设施

请求URL

```
facility/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明       |
| ------ | ---- | ------ | ---------- |
| id     | 是   | number | 房屋设施id |

查询数据库

```
mysql.update('facility', { id, deleted: true })
```

返回示例

### 收藏管理

#### 获取收藏列表

请求URL

```
collection/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from collection where deleted=false
```

返回示例

#### 获取某用户收藏列表

请求URL

```
collection/list/id
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from collection where deleted=false and id=?
```

返回示例

#### 添加收藏

请求URL

```
collection/add
```

请求方式

```
post
```

参数

| 参数名  | 必选 | 类型   | 说明       |
| ------- | ---- | ------ | ---------- |
| id      | 是   | number | 收藏id     |
| user_id | 是   | number | 收藏人id   |
| room_id | 是   | number | 收藏房源id |
| ...     | 否   |        |            |

查询数据库

```
insert('collection', addObj);
```

返回示例

#### 修改收藏

请求URL

```
collection/update
```

请求方式

```
post
```

参数

| 参数名  | 必选 | 类型   | 说明       |
| ------- | ---- | ------ | ---------- |
| id      | 是   | number | 收藏id     |
| user_id | 是   | number | 收藏人id   |
| room_id | 是   | number | 收藏房源id |
| ...     | 否   |        |            |

查询数据库

```
mysql.update('collection', addObj)
```

返回示例

#### 删除收藏

请求URL

```
collection/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 收藏id |

查询数据库

```
mysql.update('collection', { id, deleted: true })
```

返回示例

#### 用户取消收藏房源

请求URL

```
user/collection/delete
```

请求方式

```
post
```

参数

| 参数名  | 必选 | 类型   | 说明       |
| ------- | ---- | ------ | ---------- |
| user_id | 是   | number | 收藏人id   |
| room_id | 是   | number | 收藏房源id |
| ...     | 否   |        |            |

查询数据库

```
mysql.update('collection', { id, deleted: true } where user_id and room_id)
```

返回示例

### 预约看房管理

#### 获取预约看房列表

请求URL

```
appointment/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from appointment where deleted=false
```

返回示例

#### 获取某用户预约看房列表

#### 获取某房东预约看房列表

请求URL

```
appointment/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from appointment where deleted=false
```

返回示例

#### 添加预约

请求URL

```
appointment/add
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明       |
| ----------- | ---- | ------ | ---------- |
| id          | 是   | number | 预约id     |
| user_id     | 是   | number | 预约人id   |
| room_id     | 是   | number | 预约房源id |
| landlord_id | 是   | number | 被约房东id |
| ...         | 否   |        |            |

查询数据库

```
insert('appointment', addObj);
```

返回示例

#### 修改预约

请求URL

```
appointment/update
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明       |
| ----------- | ---- | ------ | ---------- |
| id          | 是   | number | 预约id     |
| user_id     | 是   | number | 预约人id   |
| room_id     | 是   | number | 预约房源id |
| landlord_id | 是   | number | 被约房东id |
| ...         | 否   |        |            |

查询数据库

```
mysql.update('appointment', addObj)
```

返回示例

#### 删除预约

请求URL

```
appointment/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 预约id |

查询数据库

```
mysql.update('appointment', { id, deleted: true })
```

返回示例

### 合同管理

#### 获取合同列表

请求URL

```
contract/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from contract where deleted=false
```

返回示例

#### 获取某用户的合同列表

请求URL

```
contract/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from contract where deleted=false and user_id=?
```

返回示例

#### 获取某房东的合同列表

请求URL

```
contract/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from contract where deleted=false and landlord_id=?
```

返回示例

#### 添加合同

请求URL

```
contract/add
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明     |
| ----------- | ---- | ------ | -------- |
| id          | 是   | number | 合同id   |
| user_id     | 是   | number | 租房人id |
| room_id     | 是   | number | 房源id   |
| landlord_id | 是   | number | 房东id   |
| ...         | 否   |        |          |

查询数据库

```
insert('contract', addObj);
```

返回示例

#### 修改合同

请求URL

```
contract/update
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明     |
| ----------- | ---- | ------ | -------- |
| id          | 是   | number | 合同id   |
| user_id     | 是   | number | 租房人id |
| room_id     | 是   | number | 房源id   |
| landlord_id | 是   | number | 房东id   |
| ...         | 否   |        |          |

查询数据库

```
mysql.update('contract', addObj)
```

返回示例

#### 删除合同

请求URL

```
contract/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 合同id |

查询数据库

```
mysql.update('contract', { id, deleted: true })
```

返回示例

### 退房通知管理

#### 获取退房通知列表

请求URL

```
checkout/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from checkout where deleted=false
```

返回示例

#### 添加退房通知

请求URL

```
checkout/add
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明     |
| ----------- | ---- | ------ | -------- |
| id          | 是   | number | 退房id   |
| user_id     | 是   | number | 租房人id |
| room_id     | 是   | number | 房源id   |
| landlord_id | 是   | number | 房东id   |
| ...         | 否   |        |          |

查询数据库

```
insert('checkout', addObj);
```

返回示例

#### 修改退房通知

请求URL

```
checkout/update
```

请求方式

```
post
```

参数

| 参数名      | 必选 | 类型   | 说明     |
| ----------- | ---- | ------ | -------- |
| id          | 是   | number | 退房id   |
| user_id     | 是   | number | 租房人id |
| room_id     | 是   | number | 房源id   |
| landlord_id | 是   | number | 房东id   |
| ...         | 否   |        |          |

查询数据库

```
mysql.update('checkout', addObj)
```

返回示例

#### 删除退房通知

请求URL

```
checkout/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 退房id |

查询数据库

```
mysql.update('checkout', { id, deleted: true })
```

返回示例

### 订单管理

#### 获取订单列表

请求URL

```
order/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from order where deleted=false
```

返回示例

#### 获取某用户订单列表

请求URL

```
order/list/id
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from order where deleted=false where 
```

返回示例

#### 添加订单

请求URL

```
order/add
```

请求方式

```
post
```

参数

| 参数名     | 必选 | 类型   | 说明                             |
| ---------- | ---- | ------ | -------------------------------- |
| id         | 是   | number | 订单id                           |
| order_type | 是   | number | 订单类型（1支付房租，2退还押金） |
| payer_id   | 是   | number | 付款人id                         |
| room_id    | 是   | number | 作用房源id                       |
| payee_id   | 是   | number | 收款人id                         |
| ...        | 否   |        |                                  |

查询数据库

```
insert('order', addObj);
```

返回示例

#### 修改订单

请求URL

```
order/update
```

请求方式

```
post
```

参数

| 参数名     | 必选 | 类型   | 说明                             |
| ---------- | ---- | ------ | -------------------------------- |
| id         | 是   | number | 订单id                           |
| order_type | 是   | number | 订单类型（1支付房租，2退还押金） |
| payer_id   | 是   | number | 付款人id                         |
| room_id    | 是   | number | 作用房源id                       |
| payee_id   | 是   | number | 收款人id                         |
| ...        | 否   |        |                                  |

查询数据库

```
mysql.update('order', addObj)
```

返回示例

#### 删除订单

请求URL

```
order/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明   |
| ------ | ---- | ------ | ------ |
| id     | 是   | number | 订单id |

查询数据库

```
mysql.update('order', { id, deleted: true })
```

返回示例

### 轮播图管理

#### 获取轮播图列表

请求URL

```
carousel/list
```

请求方式

```
get
```

参数

无

查询数据库

```
select * from carousel where deleted=false
```

返回示例

#### 添加轮播图

请求URL

```
carousel/add
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| id     | 是   | number | 轮播图id |
| image  | 是   | string | 图片     |
| path   | 是   | string | 跳转路径 |
| ...    | 否   |        |          |

查询数据库

```
insert('carousel', addObj);
```

返回示例

#### 修改轮播图

请求URL

```
carousel/update
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| id     | 是   | number | 轮播图id |
| image  | 是   | string | 图片     |
| path   | 是   | string | 跳转路径 |
| ...    | 否   |        |          |

查询数据库

```
mysql.update('carousel', addObj)
```

返回示例

#### 删除轮播图

请求URL

```
carousel/delete
```

请求方式

```
post
```

参数

| 参数名 | 必选 | 类型   | 说明     |
| ------ | ---- | ------ | -------- |
| id     | 是   | number | 轮播图id |

查询数据库

```
mysql.update('carousel', { id, deleted: true })
```

返回示例



这个是我之前设计的雅阁租房系统的设计文档和接口文档，现在我想把它用
Framework: Next.js 15 (App Router)
UI: shadcn/ui + Tailwind CSS v4
Database: Neon Postgres + Prisma ORM
Auth: JWT (jose)
Deployment: Vercel
这种技术栈重构掉，以前的数据库用的mysql，而且已经有很多老的数据了，现在为了想把老数据成功迁移到新的数据库Postgres中，所以数据库的字段和对应的主外键关系还是保持和老的一样，可以允许有一些小的优化和修改，但是整体还是尽量保持把以往的数据格式相同。
每个数据库新增创建时间和修改时间的字段，存储为时间格式，到时候可以把老的数据用脚本转化成新的数据格式存储到数据库中，每个表格的delete字段去掉，如果已经删除的话就直接采用硬删除了，如果有依赖关系的话会自动提示不可删除，到时候用脚本转化老数据的时候，如果delete字段为true，就直接认为这条数据不存在了。
重构后的项目不做权限和角色的功能，把这两个表直接删掉即可。
整个项目的接口文档仅供参考，可以按照新的技术和最标准的规范优化掉，可以不按照这个接口文档来指定新的接口，只是为了参考老的设计而已。
项目引用了百度地图的API，为的是使用一些地图和有关地址解析的API，这个在重构之后仍然会继续使用。
除了项目的数据库最好还是和之前一致，其他的地方可以优化的都可以进行优化，包括页面级别的优化，后端设计的优化等。

以前的数据库的老数据如下，可以进行一个参考：
/*
 Navicat Premium Data Transfer

 Source Server         : Mason
 Source Server Type    : MySQL
 Source Server Version : 80021
 Source Host           : localhost:3306
 Source Schema         : rent_room_db

 Target Server Type    : MySQL
 Target Server Version : 80021
 File Encoding         : 65001

 Date: 29/10/2021 20:39:49
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin
-- ----------------------------
DROP TABLE IF EXISTS `admin`;
CREATE TABLE `admin` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '管理员id',
  `username` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '密码',
  `role_id` int DEFAULT NULL COMMENT '角色id',
  `avatar` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '头像',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='管理员表';

-- ----------------------------
-- Records of admin
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for appointment
-- ----------------------------
DROP TABLE IF EXISTS `appointment`;
CREATE TABLE `appointment` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '预约id',
  `user_id` int NOT NULL COMMENT '预约人id',
  `room_id` int NOT NULL COMMENT '预约房源id',
  `landlord_id` int NOT NULL COMMENT '被约房东id',
  `appointment_time` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '预约时间',
  `landlord_deleted` int NOT NULL DEFAULT '1' COMMENT '房东是否删除预约记录（1否，2是）',
  `user_deleted` int NOT NULL DEFAULT '1' COMMENT '预约人是否删除预约记录（1否，2是）',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='预约看房表';

-- ----------------------------
-- Records of appointment
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for carousel
-- ----------------------------
DROP TABLE IF EXISTS `carousel`;
CREATE TABLE `carousel` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '轮播图id',
  `image` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '图片',
  `path` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '跳转路径',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='轮播图表';

-- ----------------------------
-- Records of carousel
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for collection
-- ----------------------------
DROP TABLE IF EXISTS `collection`;
CREATE TABLE `collection` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '收藏id',
  `user_id` int NOT NULL COMMENT '收藏人id',
  `room_id` int NOT NULL COMMENT '收藏房源id',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='收藏表';

-- ----------------------------
-- Records of collection
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for community
-- ----------------------------
DROP TABLE IF EXISTS `community`;
CREATE TABLE `community` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '小区id',
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '小区名字',
  `province` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '省',
  `city` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '市',
  `district` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '县区',
  `street` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '街道',
  `streetNumber` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '街道号',
  `subway_line` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '地铁线(可输入多条线路，如2/3)',
  `lng` double NOT NULL COMMENT '经度',
  `lat` double NOT NULL COMMENT '纬度',
  `cover` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '小区封面（一张）',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='小区表';

-- ----------------------------
-- Records of community
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for contract
-- ----------------------------
DROP TABLE IF EXISTS `contract`;
CREATE TABLE `contract` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '合同id',
  `user_id` int NOT NULL COMMENT '租房人id',
  `room_id` int NOT NULL COMMENT '房源id',
  `landlord_id` int NOT NULL COMMENT '房东id',
  `tenancy` int NOT NULL COMMENT '租期：月（用户第一次会选择，续签之后增加）',
  `onlinetime` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '租出时间：开始时间"2020.05.05"',
  `offlinetime` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '租出时间：结束时间"2021.05.05"',
  `pledge` double NOT NULL COMMENT '已付押金',
  `fee` double NOT NULL COMMENT '每次应交房租',
  `paid_period` varchar(5000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '已付房租所达期限["2020.1.1-2020.4.1","2020.4.1-2020.7.1"]',
  `paying_period` varchar(5000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '应付房租所达期限["2020.7.1-2020.10.1","2020.10.1-2021.1.1"]',
  `renew_times` int NOT NULL DEFAULT '0' COMMENT '续租次数',
  `ischeckout` int NOT NULL DEFAULT '1' COMMENT '是否退房（1未退，2已退）',
  `refund` int DEFAULT NULL COMMENT '是否退押金(1不退，2退)',
  `checkout_time` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '退房时间',
  `landlord_deleted` int NOT NULL DEFAULT '1' COMMENT '房东是否删除合同（1否，2是）',
  `user_deleted` int NOT NULL DEFAULT '1' COMMENT '用户是否删除合同（1否，2是）',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='合同表';

-- ----------------------------
-- Records of contract
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for facility
-- ----------------------------
DROP TABLE IF EXISTS `facility`;
CREATE TABLE `facility` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '设施id',
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '设施名字',
  `icon` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '设施图标',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='房屋设施表';

-- ----------------------------
-- Records of facility
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for order
-- ----------------------------
DROP TABLE IF EXISTS `order`;
CREATE TABLE `order` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '订单id',
  `payer_id` int NOT NULL COMMENT '付款人id',
  `room_id` int NOT NULL COMMENT '作用房源id',
  `payee_id` int NOT NULL COMMENT '收款人id',
  `fee` double DEFAULT NULL COMMENT '支付额',
  `pledge` double DEFAULT NULL COMMENT '支付押金',
  `paid_period` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '已付房租所达期限("2020.1.1-2020.4.1")',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='订单表';

-- ----------------------------
-- Records of order
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for permission
-- ----------------------------
DROP TABLE IF EXISTS `permission`;
CREATE TABLE `permission` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '角色id',
  `pid` int NOT NULL DEFAULT '0' COMMENT '父级id',
  `name` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '权限名',
  `path` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '权限路径',
  `level` int NOT NULL DEFAULT '1' COMMENT '权限等级',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='权限表';

-- ----------------------------
-- Records of permission
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '角色id',
  `name` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '角色名',
  `permissions` varchar(5000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '角色权限列表（json）',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='角色表';

-- ----------------------------
-- Records of role
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for room
-- ----------------------------
DROP TABLE IF EXISTS `room`;
CREATE TABLE `room` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '房源id',
  `name` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '房源名字',
  `cmy_id` int NOT NULL COMMENT '小区id（根据小区可以定地址）',
  `rent_type` int NOT NULL COMMENT '租房类型：整租、合租（1为整租，2为合租）',
  `min_tenancy` int NOT NULL COMMENT '最短租期（月）',
  `bedroom` int NOT NULL COMMENT '户型：几室（1，2，3，4，5）',
  `parlour` int NOT NULL COMMENT '几厅',
  `bathroom` int NOT NULL COMMENT '几卫',
  `room_type` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '房屋类型（普通住宅、公寓）',
  `direction` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '朝向：东西南北选项（文本）',
  `price` double NOT NULL COMMENT '价格：元/月',
  `area` int NOT NULL COMMENT '面积：平方米',
  `pledge` int NOT NULL COMMENT '押几',
  `pay` int NOT NULL COMMENT '付几（押1付1/押1付2/押1付3）',
  `floor` int NOT NULL COMMENT '楼层：第几层',
  `floors` int NOT NULL COMMENT '共几层',
  `level` int NOT NULL COMMENT '低中高层（1，2，3）',
  `lift` int NOT NULL COMMENT '是否有电梯（1无，2有）',
  `desc` varchar(9000) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '房源描述（房屋概况）：（富文本编辑）',
  `cover` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '房屋封面（一张）',
  `images` varchar(9000) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '房源图片（支持多张）',
  `facility_ids` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '房屋设施id，可以选择多个设施（json）',
  `publisher_id` int NOT NULL COMMENT '发布人id',
  `ispublished` int NOT NULL DEFAULT '2' COMMENT '是否发布(2已发布和1未发布)',
  `publish_time` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '发布时间',
  `room_code` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '房屋编码（随机生成16位数字，可使用时间戳）',
  `isrented` int DEFAULT '1' COMMENT '是否租出（1未租出，2已租出）',
  `views` int DEFAULT '0' COMMENT '浏览量（只要房源被查看自增1）',
  `times` int DEFAULT '0' COMMENT '房屋被出租次数',
  `income` double DEFAULT '0' COMMENT '房屋总收益',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='房源表';

-- ----------------------------
-- Records of room
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '用户id',
  `username` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '用户名',
  `password` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '用户密码',
  `phone` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户电话',
  `nickname` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户昵称',
  `realname` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户真实名字',
  `gender` int DEFAULT '3' COMMENT '用户性别（1男，2女，3不愿透露）',
  `identity` int DEFAULT '1' COMMENT '用户身份（1为用户，2为房东）',
  `avatar` varchar(500) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户头像',
  `email` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户邮箱',
  `province` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '省',
  `city` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '市',
  `district` varchar(30) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '县区',
  `address` varchar(100) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL COMMENT '用户详细地址',
  `wallet` double DEFAULT '0' COMMENT '用户钱包',
  `pay_code` varchar(10) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT '000000' COMMENT '支付密码（默认值000000）',
  `created` varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL COMMENT '创建日期',
  `deleted` int NOT NULL DEFAULT '0' COMMENT '是否删除',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='用户表';

-- ----------------------------
-- Records of user
-- ----------------------------
BEGIN;
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
-- (sample data row removed)
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;


根据这些已经提供的信息，帮我重新写一篇设计文档，专业性更强，让开发者看了之后可以清楚的知道应该怎么做。
这个项目分为管理平台和用户平台，管理平台的用户管理已经做出来了，用户管理的增删改查可以当做一个示例，之后的模块的设计也会延续这种，不管是前端还是后端还是数据库，都会以用户管理做一个标准，你可以去看一下现在的用户管理是怎么实现的，然后去设计其他的未实现的模块。上传图片的功能也已经实现了，现在上传的图片都存储在了Vercel的blob上，之后的有关上传图片的模块也会用这种上传方式。
本项目的管理平台和用户平台都完全实现响应式布局，在移动端也可以正常访问没有bug，用户体验也很好。

根据这些已有的信息，帮我写一个专业的design文档，直接生成在项目的doc目录下面。






## Claude design
这个是我的雅阁租房系统的设计文档，一共分为两个平台，一个是管理平台manage，一个是用户平台portal。现在帮我设计一下整个平台的前端的页面，管理平台可以设计成左侧菜单栏、顶栏、中间内容区的结构，左侧菜单栏可以折叠或者打开，顶栏有城市切换功能、个人中心，内容区就是点击所有的菜单所呈现出来的内容，dashboard是一些统计数据，剩下的页面大都是一些表格表单、增删改查等。用户平台的布局是分为顶栏菜单栏、中间内容区和footer版权，顶栏包括所有的菜单项如设计文档中所提供的，还有城市切换按钮、个人中心，点击到个人中心之后，是一个左右布局的内容，分为左侧的菜单栏和右侧的内容区。帮我设计一下这个系统的前端页面，先把架构搭建出来，然后对于管理平台，可以设计出dashboard和用户管理的页面，对于用户平台，可以把所有的页面都设计出来，参考国内安居客租房平台的设计风格，颜色和布局、字体都可以模仿安居客，因为我当时做第一版的时候就是参考的安居客，现在是对这个项目整体再重构优化一遍。好了，现在开始帮我设计吧



## 关于合同、订单、钱包消费记录的交互
按照design文档，现在准备开始完成合同管理，合同的创建也是源自于portal平台用户的动作，用户在选择一个房源进行出租的时候，选择出租的起始时间和结束时间，然后会自动产生一个合同记录，合同上会有出租人、房源、房东、开始时间和结束时间，押付情况，第一次需要支付的金额为押金和前n个月的房租，之后每次需要付房租的金额和时间，用户如果付了第一次的金额就会创建成功这个合同，合同创建成功，房东会收到一个通知信息，用户在个人中心中可以看到我的合同模块，就可以查看到自己的这份合同，合同创建成功之后用户不得单方面删除，点进去这个合同之后，可以选择提前付下一次的房租，如果租约快到期的话，也可以进行续租，每一次续租renewTimes就会加1，paidPeriod和payingPeriod分别表示已经付过房租的时间段数组和未来应该付房租的时间段数组，在每个下一个时间段快到来的时候，租客收到一条系统消息，提醒租客几几年几月几号该交房租了，金额是多少，如果逾期半个月不交的话会强制退房，并且不退押金，refund字段就是记录租客是不是合法退房，如果按照租期快到了正常退房的话，就会收到房东的退款，如果提前退房或者逾期不交房租半个月就是非法退房，就不会收到退款，合同这个时候就会被标记已完成（合法退房或者非法退房），一旦合同完成，租客就允许可以把合同删掉了，但是租客删的只是自己的，房东还是可以看到这个合同的，房东如果自己删掉了就看不到了，isCheckout表示是否退房，不管是合法退房还是非常退房，只要退房了这个字段就是true，checkoutTime就是退房的时间点。关于付款功能，用户可以在自己的个人中心的我的钱包中看到自己的余额，可以给自己充钱，充钱的时候和付钱的时候都需要用自己的支付密码，这里的充钱和付钱都是虚拟的，不会接入真实的付款功能，用户也可以像充多少钱充多少钱，在支付的时候，也就是在租房子创建合同的时候，会先要求支付押金和第一期的房租，输入支付密码之后支付成功之后，就会创建合同出来，同时也会创建一个订单，订单上就会有付款人、房源、收款人、房租金额、押金金额、paidPeriod表示本次支付的房租的时间段信息，订单上就会记录这些信息，就如同Order上定义的这些字段，创建订单的时候，收款人和付款人都会收到通知，一个通知付款成功，一个通知收款成功，付款的时候付款人的钱包会减少相应数量的金额，收款人的钱包会增加相应数量的金额，所以，每一次付款，都会创建订单，创建通知，钱包做相应的加减金额的操作。如果可行的话，可以再多加一个用户钱包消费记录的功能，用户充值的时候就会多一条收入的记录，支付的时候就会多一条支出记录，房东收款的时候就会多一条收入记录，用户拿到退押金也会多一条收入记录，每一条记录都会记录发生的时间，交易的类型、动作等信息。关于我描述的上述交互，是有关portal的相应模块的交互以及管理平台中合同管理和订单管理的模块，根据这些信息先帮我把design文档更新一下，把portal的交互逻辑补充上去，把管理平台的数据库表如果需要优化修改的话就修改一下，关于钱包消费记录如果可以增加的话也更新在文档上，先帮我更新文档，先不要写代码