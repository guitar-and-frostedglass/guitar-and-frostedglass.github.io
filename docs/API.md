# API 文档

Guitar & Frosted Glass 后端 API 文档。

## 基础信息

- 基础 URL: `http://localhost:4000/api` (开发环境)
- 所有请求和响应使用 JSON 格式
- 需要认证的接口需要在 Header 中携带 `Authorization: Bearer <token>`

## 响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

---

## 认证接口

### 注册

```
POST /api/auth/register
```

注册需要有效的邀请码。邀请码由管理员生成，有效期 15 分钟，每个码只能使用一次。

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "用户昵称",
  "inviteCode": "A1B2C3D4"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "用户昵称",
      "avatar": null,
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

**可能的错误：**
- `400` 邀请码无效 / 邀请码已被使用 / 邀请码已过期 / 该邮箱已被注册

### 登录

```
POST /api/auth/login
```

支持用邮箱或昵称登录。系统根据输入是否包含 `@` 自动判断。

**请求体：**

```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

或者用昵称：

```json
{
  "identifier": "用户昵称",
  "password": "password123"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "用户昵称",
      "avatar": null,
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

### 获取当前用户

```
GET /api/auth/me
```

**需要认证**

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "displayName": "用户昵称",
    "avatar": "data:image/png;base64,...",
    "role": "USER",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 上传头像

```
PUT /api/auth/avatar
```

**需要认证**

上传裁剪后的头像图片（base64 data URI 格式）。前端裁剪为 128x128 PNG 后上传。

**请求体：**

```json
{
  "avatar": "data:image/png;base64,iVBORw0KGgo..."
}
```

- 必须以 `data:image/` 开头
- 最大 500KB

**响应：** 返回更新后的完整用户对象（同获取当前用户）

### 修改密码

```
PUT /api/auth/password
```

**需要认证**

**请求体：**

```json
{
  "currentPassword": "旧密码",
  "newPassword": "新密码（至少6位）"
}
```

**响应：**

```json
{
  "success": true,
  "data": null
}
```

**可能的错误：**
- `400` 当前密码错误 / 新密码长度至少为6位

---

## 便签接口

所有便签接口都需要认证。登录后所有用户可以看到所有人创建的便签。

### 获取所有便签

```
GET /api/notes
```

返回所有用户的便签（按创建时间倒序），包含作者信息和回复计数。

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "话题标题",
      "content": "便签内容",
      "color": "yellow",
      "positionX": 50,
      "positionY": 50,
      "userId": "user-uuid",
      "user": {
        "id": "user-uuid",
        "displayName": "用户昵称",
        "avatar": "data:image/png;base64,..."
      },
      "_count": {
        "replies": 5
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 获取单个便签（含回复）

```
GET /api/notes/:id
```

返回便签详情，包含所有回复（按时间正序）。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "话题标题",
    "content": "便签内容",
    "color": "yellow",
    "positionX": 50,
    "positionY": 50,
    "userId": "user-uuid",
    "user": {
      "id": "user-uuid",
      "displayName": "作者昵称",
      "avatar": null
    },
    "replies": [
      {
        "id": "reply-uuid",
        "content": "回复内容",
        "noteId": "uuid",
        "userId": "replier-uuid",
        "user": {
          "id": "replier-uuid",
          "displayName": "回复者昵称",
          "avatar": null
        },
        "createdAt": "2024-01-01T00:01:00.000Z",
        "updatedAt": "2024-01-01T00:01:00.000Z"
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 创建便签

```
POST /api/notes
```

**请求体：**

```json
{
  "title": "话题标题",
  "content": "便签内容",
  "color": "yellow"
}
```

- `title`: 可选，最长 100 字符
- `content`: 可选，默认 `""`
- `color`: 可选，默认 `"yellow"`

**可选颜色值：** `yellow`, `pink`, `blue`, `green`, `purple`, `orange`

**响应：** 同获取所有便签中的单条格式（含 `user` 和 `_count`）

### 更新便签

```
PUT /api/notes/:id
```

只能更新自己创建的便签。

**请求体：**

```json
{
  "title": "新标题",
  "content": "新内容",
  "color": "pink"
}
```

所有字段都是可选的，只更新提供的字段。

### 删除便签

```
DELETE /api/notes/:id
```

只能删除自己创建的便签。删除便签会级联删除所有回复。

**响应：**

```json
{
  "success": true,
  "data": null
}
```

### 回复便签

```
POST /api/notes/:id/replies
```

任何已登录用户都可以回复任何便签。

**请求体：**

```json
{
  "content": "回复内容"
}
```

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "reply-uuid",
    "content": "回复内容",
    "noteId": "note-uuid",
    "userId": "user-uuid",
    "user": {
      "id": "user-uuid",
      "displayName": "回复者昵称",
      "avatar": null
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 删除回复

```
DELETE /api/notes/:id/replies/:replyId
```

删除指定回复。用户只能删除自己的回复，管理员可以删除任何人的回复。删除后回复内容会被记录到删除日志中，管理员可在后台查看。

**响应：**

```json
{
  "success": true,
  "data": null
}
```

**可能的错误：**
- `400` 回复不属于该便签
- `403` 无权删除该回复
- `404` 回复不存在

---

## 管理接口

所有管理接口需要认证 + 管理员权限（`role: ADMIN`）。非管理员访问返回 `403`。

### 获取所有用户

```
GET /api/admin/users
```

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "用户昵称",
      "avatar": null,
      "role": "USER",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "notes": 3,
        "replies": 12
      }
    }
  ]
}
```

### 删除用户

```
DELETE /api/admin/users/:id
```

不能删除自己。删除用户会级联删除其所有便签和回复。

### 修改用户角色

```
PUT /api/admin/users/:id/role
```

不能修改自己的角色。

**请求体：**

```json
{
  "role": "ADMIN"
}
```

`role` 值: `USER` 或 `ADMIN`

### 生成邀请码

```
POST /api/admin/invite-codes
```

生成一个 8 位十六进制邀请码，有效期 15 分钟，只能使用一次。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "A1B2C3D4",
    "expiresAt": "2024-01-01T00:15:00.000Z",
    "used": false,
    "usedBy": null,
    "creatorId": "admin-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 获取邀请码列表

```
GET /api/admin/invite-codes
```

返回最近 50 条邀请码记录（含已使用和已过期的）。

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "A1B2C3D4",
      "expiresAt": "2024-01-01T00:15:00.000Z",
      "used": true,
      "usedBy": "user-uuid",
      "creatorId": "admin-uuid",
      "creator": {
        "displayName": "Admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 获取删除回复记录

```
GET /api/admin/deleted-replies
```

返回最近 100 条已删除的回复记录。每条记录包含原始回复内容、回复作者、所属便签、删除者等信息。

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "originalReplyId": "original-reply-uuid",
      "content": "被删除的回复内容",
      "noteId": "note-uuid",
      "noteTitle": "便签标题",
      "replyUserId": "reply-author-uuid",
      "replyUserName": "回复者昵称",
      "deletedById": "deleter-uuid",
      "deletedByName": "删除者昵称",
      "replyCreatedAt": "2024-01-01T00:01:00.000Z",
      "deletedAt": "2024-01-02T10:30:00.000Z"
    }
  ]
}
```

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误 / 邀请码无效 |
| 401 | 未认证或认证失败 |
| 403 | 无管理员权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 健康检查

```
GET /health
```

**响应：**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```
