# Tiger网球俱乐部 H5应用 技术设计文档 v1.0

> 本文档描述系统架构、项目结构、数据库设计、API接口规范，作为开发实现的技术依据。与 prd-v1.0.md 配套使用。

---

## 一、技术选型

| 层 | 选型 | 说明 |
|----|------|------|
| 前端框架 | Taro 4.x (React) | 编译H5，未来一键切换微信小程序 |
| UI组件库 | NutUI-React | Taro官方推荐，同时支持H5和小程序 |
| 后端框架 | Hono | 轻量Node.js框架，TypeScript原生支持 |
| 数据库 | PostgreSQL | Zeabur托管，免运维 |
| ORM | Prisma | 类型安全，迁移管理方便 |
| 认证 | JWT (jsonwebtoken) | 手机号+密码登录，token存localStorage |
| 图片存储 | Cloudflare R2 | 免费10GB，无需实名，用于头像/Banner/套餐图 |
| 部署 | Zeabur | 前后端数据库一站式部署 |

### 为什么选Hono而不是Next.js

Taro是纯前端框架，编译产物是静态H5文件，不能内置后端。需要独立的API服务。Hono轻量、TypeScript友好、适合这个项目体量。

### 未来迁移微信小程序的路径

```
现在：Taro编译H5 → 浏览器访问
未来：修改Taro编译目标为weapp → 微信小程序
后端API：完全不需要改动
```

---

## 二、项目结构（Monorepo）

```
tennis-app/
├── apps/
│   ├── frontend/                    # Taro前端
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── student/         # 学员端页面
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── booking/
│   │   │   │   │   ├── tournament/
│   │   │   │   │   └── profile/
│   │   │   │   ├── coach/           # 教练端页面
│   │   │   │   │   ├── home/
│   │   │   │   │   ├── schedule/
│   │   │   │   │   ├── students/
│   │   │   │   │   └── profile/
│   │   │   │   ├── admin/           # 管理员端页面
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   ├── students/
│   │   │   │   │   ├── coaches/
│   │   │   │   │   ├── courses/
│   │   │   │   │   ├── tournaments/
│   │   │   │   │   ├── ntrp/
│   │   │   │   │   ├── finance/
│   │   │   │   │   └── settings/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── components/          # 公共组件
│   │   │   ├── services/            # API调用层
│   │   │   ├── stores/              # 状态管理（Zustand）
│   │   │   ├── hooks/               # 自定义hooks
│   │   │   └── utils/              # 工具函数
│   │   ├── project.config.json      # Taro配置
│   │   └── package.json
│   └── backend/                     # Hono后端
│       ├── src/
│       │   ├── routes/              # API路由
│       │   │   ├── auth.ts
│       │   │   ├── users.ts
│       │   │   ├── bookings.ts
│       │   │   ├── courses.ts
│       │   │   ├── packages.ts
│       │   │   ├── ntrp.ts
│       │   │   ├── tournaments.ts
│       │   │   ├── notifications.ts
│       │   │   ├── config.ts
│       │   │   └── upload.ts
│       │   ├── middleware/          # 中间件
│       │   │   ├── auth.ts          # JWT验证
│       │   │   └── role.ts          # 角色权限
│       │   ├── services/            # 业务逻辑层
│       │   ├── lib/
│       │   │   ├── prisma.ts        # Prisma client单例
│       │   │   ├── jwt.ts           # JWT工具
│       │   │   └── r2.ts            # Cloudflare R2上传
│       │   └── index.ts             # 入口文件
│       ├── prisma/
│       │   ├── schema.prisma
│       │   └── seed.ts              # 初始管理员账号
│       └── package.json
└── packages/
    └── shared/                      # 前后端共享类型
        └── types.ts
```

---

## 三、数据库设计

### 3.1 完整 Schema

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ─── 账号与角色 ───────────────────────────────

enum Role {
  STUDENT
  COACH
  ADMIN
}

enum AccountStatus {
  PENDING    // 待审批
  ACTIVE     // 已激活
  DISABLED   // 已禁用
}

model User {
  id          String        @id @default(cuid())
  name        String
  phone       String        @unique
  password    String        // bcrypt hash
  role        Role
  status      AccountStatus @default(PENDING)
  remark      String?
  avatarUrl   String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // 教练专属
  coachProfile     CoachProfile?

  // 学员关联
  ntrpRecords      NtrpRecord[]
  ntrpApplications NtrpApplication[]   @relation("StudentApplications")
  studentPackages  StudentPackage[]
  privateBookings  Booking[]           @relation("StudentBookings")
  groupEnrollments GroupEnrollment[]
  tournamentEntries TournamentEntry[]
  trainingNotes    TrainingNote[]      @relation("StudentNotes")
  monthlyReports   MonthlyReport[]     @relation("StudentReports")
  notifications    Notification[]

  // 教练关联
  coachBookings    Booking[]           @relation("CoachBookings")
  groupClasses     GroupClass[]
  ntrpReviews      NtrpRecord[]        @relation("CoachRecords")
  reviewedApplications NtrpApplication[] @relation("ReviewedBy")
  coachNotes       TrainingNote[]      @relation("CoachNotes")
  coachReports     MonthlyReport[]     @relation("CoachReports")
}

model CoachProfile {
  id          String  @id @default(cuid())
  userId      String  @unique
  user        User    @relation(fields: [userId], references: [id])
  specialty   String?  // 擅长方向
  bio         String?  // 个人简介
  yearsExp    Int?
  privateRate Float   @default(0)  // 私教课时费单价（元/节）
  groupRate   Float   @default(0)  // 团课课时费单价（元/节）
  bonusThreshold Float @default(80) // 触发留存奖金的续费率阈值（%）
  bonusPerPoint  Float @default(0)  // 每超1%的奖励金额（元）
}

// ─── 段位体系 ─────────────────────────────────

// 段位枚举，按升序排列
enum NtrpLevel {
  LEVEL_2_5B
  LEVEL_2_5A
  LEVEL_3_0B
  LEVEL_3_0A
  LEVEL_3_5B
  LEVEL_3_5A
  LEVEL_4_0B
  LEVEL_4_0A
}

model NtrpRecord {
  id             String    @id @default(cuid())
  studentId      String
  student        User      @relation(fields: [studentId], references: [id])
  coachId        String
  coach          User      @relation("CoachRecords", fields: [coachId], references: [id])
  // 五维评分（1-5分）
  forehand       Int
  backhand       Int
  serve          Int
  movement       Int
  tactics        Int
  matchMindset   Int?      // 青少年附加项：比赛心理
  remark         String?
  applyPromotion Boolean   @default(false)
  createdAt      DateTime  @default(now())

  application    NtrpApplication?
}

enum ApplicationStatus {
  PENDING
  APPROVED
  REJECTED
}

model NtrpApplication {
  id           String            @id @default(cuid())
  studentId    String
  student      User              @relation("StudentApplications", fields: [studentId], references: [id])
  recordId     String            @unique
  record       NtrpRecord        @relation(fields: [recordId], references: [id])
  fromLevel    NtrpLevel
  toLevel      NtrpLevel
  status       ApplicationStatus @default(PENDING)
  reviewerId   String?
  reviewer     User?             @relation("ReviewedBy", fields: [reviewerId], references: [id])
  reviewRemark String?
  createdAt    DateTime          @default(now())
  reviewedAt   DateTime?
}

// ─── 课程套餐 ─────────────────────────────────

enum CourseType {
  PRIVATE  // 私教课
  GROUP    // 团课
}

// 套餐模板（管理员定义）
model CoursePackageTemplate {
  id           String     @id @default(cuid())
  name         String     // 如"私教10节卡"
  type         CourseType
  totalLessons Int
  price        Float
  validDays    Int        // 有效期天数
  imageUrl     String?    // 套餐介绍图
  isActive     Boolean    @default(true)
  createdAt    DateTime   @default(now())

  studentPackages StudentPackage[]
}

// 学员已购套餐
model StudentPackage {
  id           String               @id @default(cuid())
  studentId    String
  student      User                 @relation(fields: [studentId], references: [id])
  templateId   String
  template     CoursePackageTemplate @relation(fields: [templateId], references: [id])
  type         CourseType
  totalLessons Int
  usedLessons  Int                  @default(0)
  startDate    DateTime
  endDate      DateTime
  remark       String?
  createdAt    DateTime             @default(now())

  consumptions LessonConsumption[]
}

// 课时核销记录
model LessonConsumption {
  id          String         @id @default(cuid())
  packageId   String
  package     StudentPackage @relation(fields: [packageId], references: [id])
  bookingId   String?        // 关联私教预约
  booking     Booking?       @relation(fields: [bookingId], references: [id])
  sessionId   String?        // 关联团课课次
  session     GroupSession?  @relation(fields: [sessionId], references: [id])
  operatorId  String         // 操作人（教练ID或管理员ID）
  remark      String?
  createdAt   DateTime       @default(now())
}

// ─── 私教预约 ─────────────────────────────────

enum BookingStatus {
  PENDING    // 待确认
  CONFIRMED  // 已确认
  COMPLETED  // 已完成
  CANCELLED  // 已取消
}

// 教练开放时段
model CoachSchedule {
  id          String   @id @default(cuid())
  coachId     String
  coach       User     @relation(fields: [coachId], references: [id])
  startTime   DateTime
  endTime     DateTime
  isRecurring Boolean  @default(false) // 每周重复
  createdAt   DateTime @default(now())
}

// 私教预约
model Booking {
  id           String        @id @default(cuid())
  studentId    String
  student      User          @relation("StudentBookings", fields: [studentId], references: [id])
  coachId      String
  coach        User          @relation("CoachBookings", fields: [coachId], references: [id])
  startTime    DateTime
  endTime      DateTime
  venue        String?       // 场地（教练确认时填写）
  status       BookingStatus @default(PENDING)
  remark       String?       // 学员备注
  rejectReason String?       // 拒绝原因
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  consumptions LessonConsumption[]
  trainingNote TrainingNote?
}

// ─── 团课班级 ─────────────────────────────────

enum GroupClassType {
  RECURRING  // 长期循环班
  FIXED      // 限期班（如寒暑假）
}

enum GroupClassStatus {
  ACTIVE
  INACTIVE
}

// 团课班级
model GroupClass {
  id              String          @id @default(cuid())
  name            String          // 如"3.0进阶班-周三"
  coachId         String
  coach           User            @relation(fields: [coachId], references: [id])
  classType       GroupClassType
  venue           String?
  ntrpRange       String?         // 适用段位，如"3.0-3.5"
  capacity        Int
  lessonsPerSession Int           @default(1)  // 每次课消耗课时数
  description     String?
  status          GroupClassStatus @default(ACTIVE)
  // 循环班字段
  weekday         Int?            // 0=周日 ... 6=周六
  startTimeStr    String?         // "19:00"
  endTimeStr      String?         // "20:30"
  effectiveFrom   DateTime?
  createdAt       DateTime        @default(now())

  sessions        GroupSession[]
  enrollments     GroupEnrollment[]
}

// 团课课次
model GroupSession {
  id          String     @id @default(cuid())
  classId     String
  class       GroupClass @relation(fields: [classId], references: [id])
  startTime   DateTime
  endTime     DateTime
  venue       String?
  isCompleted Boolean    @default(false)
  createdAt   DateTime   @default(now())

  attendances GroupAttendance[]
  consumptions LessonConsumption[]
}

// 学员报名团课
model GroupEnrollment {
  id          String        @id @default(cuid())
  classId     String
  class       GroupClass    @relation(fields: [classId], references: [id])
  studentId   String
  student     User          @relation(fields: [studentId], references: [id])
  packageId   String?       // 关联的团课套餐
  status      BookingStatus @default(PENDING)
  createdAt   DateTime      @default(now())

  @@unique([classId, studentId])
}

// 团课出勤记录
model GroupAttendance {
  id          String       @id @default(cuid())
  sessionId   String
  session     GroupSession @relation(fields: [sessionId], references: [id])
  studentId   String
  attended    Boolean      // true=出勤 false=缺课
  operatorId  String       // 操作人（教练或管理员）
  createdAt   DateTime     @default(now())

  @@unique([sessionId, studentId])
}

// ─── 训练记录与月度反馈 ───────────────────────

model TrainingNote {
  id          String   @id @default(cuid())
  studentId   String
  student     User     @relation("StudentNotes", fields: [studentId], references: [id])
  coachId     String
  coach       User     @relation("CoachNotes", fields: [coachId], references: [id])
  bookingId   String?  @unique
  booking     Booking? @relation(fields: [bookingId], references: [id])
  content     String
  improvement String?
  createdAt   DateTime @default(now())
}

model MonthlyReport {
  id          String   @id @default(cuid())
  studentId   String
  student     User     @relation("StudentReports", fields: [studentId], references: [id])
  coachId     String
  coach       User     @relation("CoachReports", fields: [coachId], references: [id])
  month       String   // "2025-06"
  goodPoints  String
  improvement String
  suggestion  String
  createdAt   DateTime @default(now())

  @@unique([studentId, coachId, month])
}

// ─── 赛事 ────────────────────────────────────

enum TournamentStatus {
  DRAFT
  PUBLISHED
  CLOSED     // 报名截止
  FINISHED
}

model Tournament {
  id                   String          @id @default(cuid())
  name                 String
  eventDate            DateTime
  registrationDeadline DateTime
  capacity             Int
  rules                String          // 赛制说明（富文本）
  grouping             String?         // 分组说明
  coverUrl             String?
  status               TournamentStatus @default(DRAFT)
  createdAt            DateTime        @default(now())

  entries   TournamentEntry[]
  awards    TournamentAward[]
}

model TournamentEntry {
  id           String          @id @default(cuid())
  tournamentId String
  tournament   Tournament      @relation(fields: [tournamentId], references: [id])
  studentId    String
  student      User            @relation(fields: [studentId], references: [id])
  ntrpSnapshot String          // 报名时的段位快照
  ranking      Int?            // 最终名次
  createdAt    DateTime        @default(now())

  awards        TournamentEntryAward[]
  diagnosisCard DiagnosisCard?

  @@unique([tournamentId, studentId])
}

model TournamentAward {
  id           String   @id @default(cuid())
  tournamentId String
  tournament   Tournament @relation(fields: [tournamentId], references: [id])
  name         String   // 奖项名称，如"最佳进步奖"

  entries TournamentEntryAward[]
}

model TournamentEntryAward {
  entryId String
  entry   TournamentEntry @relation(fields: [entryId], references: [id])
  awardId String
  award   TournamentAward @relation(fields: [awardId], references: [id])

  @@id([entryId, awardId])
}

model DiagnosisCard {
  id          String          @id @default(cuid())
  entryId     String          @unique
  entry       TournamentEntry @relation(fields: [entryId], references: [id])
  goodPoint1  String
  goodPoint2  String
  improvement String
  suggestion  String
  sentAt      DateTime?       // null=未发送
  createdAt   DateTime        @default(now())
}

// ─── 通知 ────────────────────────────────────

enum NotificationType {
  BOOKING     // 预约被拒绝
  NTRP        // 段位相关
  TOURNAMENT  // 赛事相关
  FEEDBACK    // 月度反馈
  SYSTEM      // 系统通知
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id])
  type      NotificationType
  title     String
  content   String
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
}

// ─── 机构配置 ────────────────────────────────

// 键值对配置，如机构名称、简介等
model SiteConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
}

// Banner轮播图
model Banner {
  id        String   @id @default(cuid())
  imageUrl  String
  sortOrder Int      @default(0)
  createdAt DateTime @default(now())
}
```

---

## 四、API接口规范

### 4.1 通用约定

- 基础路径：`/api/v1`
- 认证：请求头 `Authorization: Bearer <token>`，后端通过JWT验证
- 响应格式：
  ```json
  { "success": true, "data": {} }
  { "success": false, "error": "错误信息", "code": "ERROR_CODE" }
  ```
- 权限控制：每个接口在handler开头校验角色，未授权返回403
- 分页：列表接口统一使用 `?page=1&pageSize=20`，响应包含 `total`

### 4.2 认证接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| POST | `/auth/register` | 自助注册 | 访客 |
| POST | `/auth/login` | 登录 | 访客 |
| GET | `/auth/me` | 获取当前用户信息 | 已登录 |

### 4.3 用户接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| PATCH | `/users/me` | 修改个人信息/密码 | 已登录 |
| GET | `/users/coaches` | 获取教练列表（含简介） | 访客 |
| GET | `/users/coaches/:id` | 教练详情 | 访客 |
| GET | `/users/students` | 学员列表 | ADMIN |
| POST | `/users/students` | 管理员新建学员 | ADMIN |
| GET | `/users/students/:id` | 学员详情 | ADMIN / COACH（仅负责学员） |
| PATCH | `/users/:id` | 编辑用户信息 | ADMIN |
| PATCH | `/users/:id/status` | 激活/禁用/审批 | ADMIN |
| POST | `/users/:id/reset-password` | 重置密码 | ADMIN |
| GET | `/users/coaches/:id/students` | 教练负责的学员列表 | ADMIN / COACH（本人） |
| POST | `/users/coaches/:id/students` | 给教练分配学员 | ADMIN |
| DELETE | `/users/coaches/:id/students/:studentId` | 移除教练的学员 | ADMIN |

### 4.4 段位接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/ntrp/records/:studentId` | 学员评估历史 | ADMIN / COACH / 本人 |
| POST | `/ntrp/records` | 提交新评估（含晋级申请） | COACH |
| GET | `/ntrp/applications` | 晋级申请列表 | ADMIN |
| PATCH | `/ntrp/applications/:id` | 审批/驳回晋级申请 | ADMIN |
| GET | `/ntrp/config` | 段位标准说明 | 已登录 |
| PUT | `/ntrp/config` | 更新段位标准说明 | ADMIN |

### 4.5 套餐接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/packages/templates` | 套餐模板列表（只返回上架） | 访客 |
| POST | `/packages/templates` | 新建套餐模板 | ADMIN |
| PATCH | `/packages/templates/:id` | 编辑/上下架 | ADMIN |
| GET | `/packages/student/:studentId` | 学员已购套餐 | ADMIN / 本人 |
| POST | `/packages/student` | 为学员发放套餐 | ADMIN |
| POST | `/packages/consume` | 手动核销课时（管理员补录） | ADMIN |

### 4.6 私教预约接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/bookings` | 预约列表（按角色过滤） | 已登录 |
| POST | `/bookings` | 学员提交预约 | STUDENT |
| PATCH | `/bookings/:id/confirm` | 教练确认（含场地信息） | COACH |
| PATCH | `/bookings/:id/reject` | 教练拒绝（含原因） | COACH |
| PATCH | `/bookings/:id/cancel` | 学员取消（待确认状态） | STUDENT |
| PATCH | `/bookings/:id/complete` | 标记完成并核销课时 | COACH / ADMIN |
| GET | `/bookings/coach-schedule/:coachId` | 教练开放时段 | 已登录 |
| POST | `/bookings/coach-schedule` | 添加开放时段 | COACH / ADMIN |
| DELETE | `/bookings/coach-schedule/:id` | 删除开放时段 | COACH / ADMIN |

### 4.7 团课接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/group-classes` | 班级列表（只返回上架） | 访客 |
| POST | `/group-classes` | 新建班级 | ADMIN |
| PATCH | `/group-classes/:id` | 编辑班级 | ADMIN |
| GET | `/group-classes/:id/sessions` | 班级课次列表 | 已登录 |
| POST | `/group-classes/:id/enroll` | 学员报名加入班级 | STUDENT |
| POST | `/group-classes/:id/sessions` | 新增课次（限期班手动添加） | ADMIN |
| POST | `/group-sessions/:id/attendance` | 提交出勤核销 | COACH / ADMIN |
| DELETE | `/group-sessions/:id/attendance/:studentId` | 撤销出勤记录 | ADMIN |

### 4.8 训练记录与月度反馈接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/training-notes/:studentId` | 学员训练记录 | COACH / ADMIN / 本人 |
| POST | `/training-notes` | 添加训练记录 | COACH |
| GET | `/monthly-reports/:studentId` | 学员月度反馈 | COACH / ADMIN / 本人 |
| POST | `/monthly-reports` | 发布月度反馈 | COACH |

### 4.9 赛事接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/tournaments` | 赛事列表 | 访客 |
| POST | `/tournaments` | 新建赛事 | ADMIN |
| PATCH | `/tournaments/:id` | 编辑赛事 | ADMIN |
| GET | `/tournaments/:id/entries` | 报名名单 | ADMIN |
| POST | `/tournaments/:id/entries` | 学员报名 | STUDENT |
| DELETE | `/tournaments/:id/entries/:entryId` | 取消报名 | ADMIN |
| PATCH | `/tournaments/:id/entries/:entryId/result` | 录入成绩 | ADMIN |
| POST | `/tournaments/:id/diagnosis` | 填写/更新诊断卡 | ADMIN |
| POST | `/tournaments/:id/diagnosis/send` | 发送诊断卡（触发站内通知） | ADMIN |

### 4.10 通知接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/notifications` | 我的通知列表 | 已登录 |
| PATCH | `/notifications/:id/read` | 标记已读 | 已登录（本人） |
| PATCH | `/notifications/read-all` | 全部已读 | 已登录 |
| GET | `/notifications/unread-count` | 未读数量 | 已登录 |

### 4.11 配置与上传接口

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/config/site` | 机构配置（名称/简介/联系方式） | 访客 |
| PUT | `/config/site` | 更新机构配置 | ADMIN |
| GET | `/config/banners` | Banner列表 | 访客 |
| POST | `/config/banners` | 上传Banner | ADMIN |
| DELETE | `/config/banners/:id` | 删除Banner | ADMIN |
| PATCH | `/config/banners/sort` | 调整Banner排序 | ADMIN |
| POST | `/upload/image` | 上传图片到R2 | ADMIN / COACH |

---

## 五、关键业务逻辑

### 5.1 课时核销流程

**私教课完成：**
```
PATCH /bookings/:id/complete
  → booking.status = COMPLETED
  → 查找学员有效私教套餐（按 endDate 最近优先）
  → StudentPackage.usedLessons += 1
  → 创建 LessonConsumption 记录
```

**团课出勤核销：**
```
POST /group-sessions/:id/attendance
  → 遍历提交的出勤列表
  → attended=true：创建 GroupAttendance + LessonConsumption，套餐 usedLessons += 1
  → attended=false：创建 GroupAttendance（attended=false），不扣课时
  → GroupSession.isCompleted = true
```

**核销撤销（仅管理员）：**
```
DELETE /group-sessions/:id/attendance/:studentId
  → 删除 GroupAttendance 记录
  → 删除对应 LessonConsumption 记录
  → StudentPackage.usedLessons -= 1
  → 若本课次还有其他出勤记录则保持 isCompleted=true，否则改回 false
```

### 5.2 晋级审批流程

```
教练提交评估（含申请晋级）：
  POST /ntrp/records { applyPromotion: true }
    → 创建 NtrpRecord
    → 检查是否已有 PENDING 的 NtrpApplication（有则返回错误）
    → 创建 NtrpApplication { fromLevel, toLevel, status: PENDING }
    → 发站内通知给 ADMIN

管理员审批通过：
  PATCH /ntrp/applications/:id { status: "APPROVED" }
    → NtrpApplication.status = APPROVED
    → User.ntrpLevel（前端通过最新 APPROVED 记录推导段位）
    → 发站内通知给学员和教练

管理员驳回：
  PATCH /ntrp/applications/:id { status: "REJECTED", reviewRemark: "..." }
    → NtrpApplication.status = REJECTED
    → 发站内通知给教练
```

> 注：User表不直接存ntrpLevel字段，当前段位通过最新的APPROVED申请记录中的toLevel字段推导，避免数据不一致。

### 5.3 循环班课次自动生成

创建长期循环班时，系统向后自动生成12周的GroupSession：

```typescript
// 创建循环班时自动生成
const sessions = []
for (let i = 0; i < 12; i++) {
  const date = getNextWeekday(effectiveFrom, weekday, i)
  sessions.push({
    classId,
    startTime: combineDateTime(date, startTimeStr),
    endTime: combineDateTime(date, endTimeStr)
  })
}
// 每周检查：若剩余课次 < 4周，自动续生成
```

### 5.4 课时有效期清零

通过 Zeabur 定时任务或后端定时检查，每天凌晨2点执行：

```
查询所有 endDate < now 且 usedLessons < totalLessons 的 StudentPackage
  → 记录将被自动过期（不删除记录，只标记状态）
  → 发站内通知给学员（系统通知：课时包已过期）
```

### 5.5 通知触发规则

| 触发事件 | 通知接收方 | 类型 |
|---------|-----------|------|
| 教练拒绝私教预约 | 学员 | BOOKING |
| 教练提交晋级申请 | 管理员 | NTRP |
| 管理员审批晋级通过 | 学员 + 教练 | NTRP |
| 管理员驳回晋级申请 | 教练 | NTRP |
| 教练发布月度反馈 | 学员 | FEEDBACK |
| 赛事报名成功 | 学员 | TOURNAMENT |
| 诊断卡发送 | 学员 | TOURNAMENT |
| 新账号注册 | 管理员 | SYSTEM |
| 管理员激活账号 | 学员/教练 | SYSTEM |
| 课时包过期 | 学员 | SYSTEM |

---

## 六、认证与权限设计

### JWT Token 结构

```typescript
// Token payload
{
  userId: string
  role: "STUDENT" | "COACH" | "ADMIN"
  status: "PENDING" | "ACTIVE" | "DISABLED"
  iat: number
  exp: number  // 7天过期
}
```

### 前端路由保护

```
/student/* → 需要 STUDENT 角色，未登录跳转 /login
/coach/*   → 需要 COACH 角色，未登录跳转 /login
/admin/*   → 需要 ADMIN 角色，未登录跳转 /login
/login, /register → 已登录则跳转对应端首页
```

### Token存储策略

- H5阶段：存储在 `localStorage`
- 迁移小程序后：改为 `wx.setStorageSync`（改一个工具函数即可）

---

## 七、图片存储方案（Cloudflare R2）

### 使用场景

| 场景 | 路径前缀 |
|------|---------|
| 用户头像 | `avatars/` |
| Banner图片 | `banners/` |
| 套餐介绍图 | `packages/` |
| 赛事封面图 | `tournaments/` |

### 上传流程

```
前端 → POST /api/v1/upload/image（携带文件）
后端 → 验证文件类型和大小（最大5MB，仅jpg/png/webp）
后端 → 生成唯一文件名（cuid + 原始扩展名）
后端 → 上传到R2
后端 → 返回公开访问URL
```

---

## 八、部署配置（Zeabur）

### 环境变量

```env
# 后端服务
DATABASE_URL=postgresql://...        # Zeabur PostgreSQL连接串
JWT_SECRET=...                       # 随机32位字符串
R2_ACCOUNT_ID=...                    # Cloudflare账号ID
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=tennis-app
R2_PUBLIC_URL=https://...            # R2公开访问域名

# 前端环境变量
TARO_APP_API_URL=https://your-backend.zeabur.app
```

### Zeabur项目结构

```
Zeabur项目
├── 后端服务（Node.js）    → apps/backend/
├── 前端服务（静态文件）   → apps/frontend/dist/h5/
└── PostgreSQL数据库       → Zeabur托管数据库
```

### 初始化步骤

1. `npx prisma migrate deploy` — 建表
2. `npx prisma db seed` — 创建初始管理员账号
3. Zeabur环境变量配置完成后自动部署

---

## 九、开发顺序

### 阶段一：基础设施（第1-2天）
- 初始化Monorepo结构
- 配置Taro + NutUI-React
- 配置Hono + Prisma + PostgreSQL
- 实现JWT认证中间件
- 完成注册/登录/角色路由保护

### 阶段二：管理员端（第3-6天）
> 优先做，因为需要先录入数据才能让其他端正常使用

- 学员管理（增删改查 + 课时包发放）
- 教练管理（增删改查 + 薪酬配置）
- 课程管理（套餐管理 + 团课班级管理 + 时段配置）
- 段位管理（晋级审批）
- 机构设置（Banner + 机构信息）

### 阶段三：教练端（第7-9天）
- 课表（日视图/周视图）
- 约课处理（确认/拒绝 + 填写场地）
- 学员管理（段位评估 + 训练记录 + 月度反馈）
- 团课出勤核销

### 阶段四：学员端（第10-13天）
- 首页（登录前/后差异化展示）
- 约课（私教 + 团课）
- 赛事（列表 + 报名 + 诊断卡查看）
- 我的（段位中心 + 课时包 + 通知）

### 阶段五：收尾（第14天）
- 赛事管理（成绩录入 + 诊断卡发送）
- 财务模块
- 端到端测试
- 部署上线

---

## 十、本文档范围外（第二期）

- 穿线服务与装备模块
- 微信推送通知（需服务号+营业执照）
- 在线支付（需营业执照）
- 外部参赛人员管理
- 数据导出（CSV/Excel）
- AI教练助手（基于段位和训练历史的个性化建议）
