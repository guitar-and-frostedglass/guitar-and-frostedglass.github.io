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

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "用户昵称"
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
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

### 登录

```
POST /api/auth/login
```

**请求体：**

```json
{
  "email": "user@example.com",
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
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## 便签接口

所有便签接口都需要认证。

### 获取所有便签

```
GET /api/notes
```

**响应：**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "便签内容",
      "color": "yellow",
      "positionX": 100,
      "positionY": 200,
      "userId": "user-uuid",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建便签

```
POST /api/notes
```

**请求体：**

```json
{
  "content": "便签内容",
  "color": "yellow",
  "positionX": 100,
  "positionY": 200
}
```

所有字段都是可选的，默认值：
- `content`: `""`
- `color`: `"yellow"`
- `positionX`: `50`
- `positionY`: `50`

**可选颜色值：** `yellow`, `pink`, `blue`, `green`, `purple`, `orange`

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "便签内容",
    "color": "yellow",
    "positionX": 100,
    "positionY": 200,
    "userId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 更新便签

```
PUT /api/notes/:id
```

**请求体：**

```json
{
  "content": "新内容",
  "color": "pink",
  "positionX": 150,
  "positionY": 250
}
```

所有字段都是可选的，只更新提供的字段。

**响应：**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "新内容",
    "color": "pink",
    "positionX": 150,
    "positionY": 250,
    "userId": "user-uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 删除便签

```
DELETE /api/notes/:id
```

**响应：**

```json
{
  "success": true,
  "data": null
}
```

---

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 请求参数错误 |
| 401 | 未认证或认证失败 |
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

