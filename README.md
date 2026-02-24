# Gestor de Opiniones — 2021211

Backend REST API para gestión de opiniones (publicaciones y comentarios) con autenticación JWT, verificación de email y subida de imágenes a Cloudinary.

---

## Requisitos

- Node.js 18+
- pnpm
- Docker Desktop

---

## Configuración

Crear un archivo `.env` en la raíz del proyecto:

```env
# Server
NODE_ENV=development
PORT=3010

# MongoDB
MONGODB_URI=mongodb://localhost:27018/gestor_opiniones

# JWT Configuration
JWT_SECRET=MyVerySecretKeyForJWTTokenAuthenticationWith256Bits!
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=Gestor de Opiniones
JWT_AUDIENCE=Gestor de Opiniones Users

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_ENABLE_SSL=true
SMTP_USERNAME=tu_correo@gmail.com
SMTP_PASSWORD=tu_app_password
EMAIL_FROM=tu_correo@gmail.com
EMAIL_FROM_NAME=Gestor de Opiniones 2021211

# Cloudinary (upload de perfiles)
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_BASE_URL=https://res.cloudinary.com/tu_cloud_name/image/upload/
CLOUDINARY_FOLDER=home/gestor_de_opiniones_perfiles
CLOUDINARY_DEFAULT_AVATAR_FILENAME=https://res.cloudinary.com/tu_cloud_name/image/upload/v.../nombre_imagen.png

# File Upload
UPLOAD_PATH=./uploads

# App Name
APP_NAME=Gestor de Opiniones 2021211

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Security
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
ADMIN_ALLOWED_ORIGINS=http://localhost:5173

# Verification Tokens (en horas)
VERIFICATION_EMAIL_EXPIRY_HOURS=24
PASSWORD_RESET_EXPIRY_HOURS=2
```

---

## Ejecución

```bash
# 1. Levantar MongoDB con Docker
docker compose up -d

# 2. Instalar dependencias
pnpm install

# 3. Iniciar servidor en modo desarrollo
pnpm run dev
```

El servidor estará disponible en: `http://localhost:3010/api/v1`

---

## Health Check

```
GET /api/v1/health
```

**Respuesta (200):**
```json
{
  "status": "OK",
  "timestamp": "2026-02-24T10:00:00.000Z",
  "service": "Gestor de Opiniones"
}
```

---

## Endpoints — Referencia Completa

### Autenticación

#### POST /api/v1/auth/register

Registra un nuevo usuario. La foto de perfil es opcional.  
**Nota:** El usuario queda inactivo hasta verificar el email.

```bash
curl -X POST http://localhost:3010/api/v1/auth/register \
  -F "name=Angel" \
  -F "surname=Lucero" \
  -F "username=angel1234" \
  -F "email=angel@example.com" \
  -F "password=Password123!" \
  -F "phone=55551234" \
  -F "profilePicture=@/ruta/imagen.jpg"
```

**Validaciones:**
- `name`, `surname`: requeridos
- `username`: único, sin espacios
- `email`: formato válido, único
- `password`: mínimo 8 caracteres, al menos una mayúscula, un número y un carácter especial
- `phone`: 8 dígitos
- `profilePicture`: opcional, imagen (jpg, png, webp), máx 5MB

**Respuesta (201):**
```json
{
  "success": true,
  "user": {
    "id": "699d75e3a79164b50cde4586",
    "name": "Angel",
    "surname": "Lucero",
    "username": "angel1234",
    "email": "angel@example.com",
    "phone": "55551234",
    "profilePicture": "https://res.cloudinary.com/...",
    "role": "USER_ROLE",
    "status": false,
    "isEmailVerified": false,
    "createdAt": "2026-02-24T10:00:00.000Z",
    "updatedAt": "2026-02-24T10:00:00.000Z"
  },
  "message": "Usuario registrado exitosamente. Por favor, verifica tu email para activar la cuenta.",
  "emailVerificationRequired": true
}
```

---

#### POST /api/v1/auth/verify-email

Verifica el email del usuario con el token enviado por correo.  
**Nota:** El token llega en el link del correo. Copia el valor del parámetro `token` de la URL y úsalo aquí.

```bash
curl -X POST http://localhost:3010/api/v1/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DEL_EMAIL"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Email verificado exitosamente. Tu cuenta está activa."
}
```

**Errores:**
- `400`: Token inválido o expirado

---

#### POST /api/v1/auth/resend-verification

Reenvía el email de verificación.

```bash
curl -X POST http://localhost:3010/api/v1/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "angel@example.com"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Email de verificación reenviado exitosamente"
}
```

---

#### POST /api/v1/auth/login

Autentica un usuario. Devuelve el JWT en el header `x-token`.

```bash
curl -X POST http://localhost:3010/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "angel1234",
    "password": "Password123!"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Login exitoso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "699d75e3a79164b50cde4586",
    "name": "Angel",
    "username": "angel1234",
    "email": "angel@example.com",
    "role": "USER_ROLE",
    "status": true,
    "isEmailVerified": true
  }
}
```

**Errores:**
- `401`: Credenciales incorrectas
- `403`: Email no verificado o cuenta inactiva

---

#### POST /api/v1/auth/forgot-password

Envía un email con el token para restablecer contraseña.

```bash
curl -X POST http://localhost:3010/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "angel@example.com"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Instrucciones de recuperación enviadas al email"
}
```

---

#### POST /api/v1/auth/reset-password

Cambia la contraseña usando el token de recuperación.

```bash
curl -X POST http://localhost:3010/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "TOKEN_DEL_EMAIL",
    "newPassword": "NuevaPassword123!"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Contraseña actualizada exitosamente"
}
```

**Errores:**
- `400`: Token inválido o expirado

---

#### GET /api/v1/auth/profile

Obtiene el perfil del usuario autenticado.  
**Requiere:** `x-token` o `Authorization: Bearer <token>`

```bash
curl http://localhost:3010/api/v1/auth/profile \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Perfil obtenido exitosamente",
  "data": {
    "id": "699d75e3a79164b50cde4586",
    "name": "Angel",
    "surname": "Lucero",
    "username": "angel1234",
    "email": "angel@example.com",
    "phone": "55551234",
    "profilePicture": "https://res.cloudinary.com/...",
    "role": "USER_ROLE",
    "status": true,
    "isEmailVerified": true,
    "createdAt": "2026-02-24T10:00:00.000Z",
    "updatedAt": "2026-02-24T10:00:00.000Z"
  }
}
```

---

#### PUT /api/v1/auth/profile

Actualiza el perfil del usuario autenticado. Todos los campos son opcionales.  
**Requiere:** `x-token` o `Authorization: Bearer <token>`

```bash
curl -X PUT http://localhost:3010/api/v1/auth/profile \
  -H "x-token: TU_JWT" \
  -F "name=Angel" \
  -F "phone=55559999" \
  -F "profilePicture=@/ruta/nueva_imagen.jpg"
```

Para cambiar contraseña incluir también:
```bash
  -F "currentPassword=Password123!" \
  -F "newPassword=NuevaPassword456!"
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "data": { "...perfil actualizado..." }
}
```

---

#### POST /api/v1/auth/profile/by-id

Obtiene el perfil de un usuario por su ID.

```bash
curl -X POST http://localhost:3010/api/v1/auth/profile/by-id \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "699d75e3a79164b50cde4586"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "id": "699d75e3a79164b50cde4586",
    "name": "Angel",
    "username": "angel1234",
    "profilePicture": "https://res.cloudinary.com/..."
  }
}
```

---

### Publicaciones (Posts)

> Todos los endpoints de posts requieren autenticación: `x-token: TU_JWT`

---

#### GET /api/v1/posts

Obtiene todas las publicaciones con paginación y filtro por categoría.

```bash
# Sin filtros
curl http://localhost:3010/api/v1/posts \
  -H "x-token: TU_JWT"

# Con paginación
curl "http://localhost:3010/api/v1/posts?page=1&limit=10" \
  -H "x-token: TU_JWT"

# Filtrar por categoría
curl "http://localhost:3010/api/v1/posts?category=Tecnología" \
  -H "x-token: TU_JWT"
```

**Parámetros Query:**
- `page`: Número de página (default: 1)
- `limit`: Posts por página (default: 10)
- `category`: Ver categorías al final

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "699d80fc9a4fd2502f4abec6",
      "title": "Mi opinión sobre Node.js",
      "category": "Tecnología",
      "content": "Node.js es excelente...",
      "author": {
        "_id": "699d75e3a79164b50cde4586",
        "username": "angel1234",
        "name": "Angel",
        "surname": "Lucero",
        "profilePicture": "https://res.cloudinary.com/..."
      },
      "createdAt": "2026-02-24T10:00:00.000Z",
      "updatedAt": "2026-02-24T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

---

#### GET /api/v1/posts/user/:userId

Obtiene todas las publicaciones de un usuario específico.

```bash
curl http://localhost:3010/api/v1/posts/user/699d75e3a79164b50cde4586 \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [ { "...posts del usuario..." } ],
  "total": 3
}
```

---

#### GET /api/v1/posts/:id

Obtiene una publicación específica por su ID.

```bash
curl http://localhost:3010/api/v1/posts/699d80fc9a4fd2502f4abec6 \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": {
    "_id": "699d80fc9a4fd2502f4abec6",
    "title": "Mi opinión sobre Node.js",
    "category": "Tecnología",
    "content": "Node.js es excelente...",
    "author": { "...datos del autor..." },
    "createdAt": "2026-02-24T10:00:00.000Z"
  }
}
```

**Errores:**
- `404`: Publicación no encontrada

---

#### POST /api/v1/posts

Crea una nueva publicación.  
**Requiere:** `x-token: TU_JWT`

```bash
curl -X POST http://localhost:3010/api/v1/posts \
  -H "x-token: TU_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi opinión sobre Node.js",
    "category": "Tecnología",
    "content": "Node.js es excelente para crear aplicaciones backend escalables."
  }'
```

**Validaciones:**
- `title`: requerido, máx 200 caracteres
- `category`: requerido, debe ser una de las categorías válidas
- `content`: requerido, máx 5000 caracteres

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Publicación creada exitosamente",
  "data": {
    "_id": "699d80fc9a4fd2502f4abec6",
    "title": "Mi opinión sobre Node.js",
    "category": "Tecnología",
    "content": "Node.js es excelente...",
    "author": { "...datos del autor..." },
    "createdAt": "2026-02-24T10:00:00.000Z"
  }
}
```

---

#### PUT /api/v1/posts/:id

Edita una publicación. Solo el autor puede editarla.  
**Requiere:** `x-token: TU_JWT`

```bash
curl -X PUT http://localhost:3010/api/v1/posts/699d80fc9a4fd2502f4abec6 \
  -H "x-token: TU_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Título actualizado",
    "category": "Educación",
    "content": "Contenido actualizado..."
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicación actualizada exitosamente",
  "data": { "...publicación actualizada..." }
}
```

**Errores:**
- `403`: No eres el autor de esta publicación
- `404`: Publicación no encontrada

---

#### DELETE /api/v1/posts/:id

Elimina una publicación y todos sus comentarios. Solo el autor puede eliminarla.  
**Requiere:** `x-token: TU_JWT`

```bash
curl -X DELETE http://localhost:3010/api/v1/posts/699d80fc9a4fd2502f4abec6 \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Publicación eliminada exitosamente"
}
```

**Errores:**
- `403`: No eres el autor de esta publicación

---

### Comentarios (Comments)

> Todos los endpoints de comentarios requieren autenticación: `x-token: TU_JWT`

---

#### GET /api/v1/comments/user/:userId

Obtiene todos los comentarios de un usuario específico.

```bash
curl http://localhost:3010/api/v1/comments/user/699d75e3a79164b50cde4586 \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "699d81ab...",
      "content": "Excelente punto de vista",
      "author": { "username": "angel1234", "...": "..." },
      "post": { "title": "Mi opinión sobre Node.js", "category": "Tecnología" },
      "createdAt": "2026-02-24T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

#### POST /api/v1/comments/:postId

Crea un comentario en una publicación.  
**Requiere:** `x-token: TU_JWT`

```bash
curl -X POST http://localhost:3010/api/v1/comments/699d80fc9a4fd2502f4abec6 \
  -H "x-token: TU_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Excelente punto de vista, totalmente de acuerdo"
  }'
```

**Validaciones:**
- `content`: requerido, máx 500 caracteres

**Respuesta (201):**
```json
{
  "success": true,
  "message": "Comentario creado exitosamente",
  "data": {
    "_id": "699d81ab...",
    "content": "Excelente punto de vista, totalmente de acuerdo",
    "author": { "...datos del autor..." },
    "post": "699d80fc9a4fd2502f4abec6",
    "createdAt": "2026-02-24T10:00:00.000Z"
  }
}
```

**Errores:**
- `404`: Publicación no encontrada

---

#### GET /api/v1/comments/:postId

Obtiene todos los comentarios de una publicación.

```bash
curl http://localhost:3010/api/v1/comments/699d80fc9a4fd2502f4abec6 \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "699d81ab...",
      "content": "Excelente punto de vista",
      "author": {
        "username": "angel1234",
        "name": "Angel",
        "profilePicture": "https://res.cloudinary.com/..."
      },
      "createdAt": "2026-02-24T10:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

#### PUT /api/v1/comments/:id

Edita un comentario. Solo el autor puede editarlo.  
**Requiere:** `x-token: TU_JWT`

```bash
curl -X PUT http://localhost:3010/api/v1/comments/699d81ab... \
  -H "x-token: TU_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Comentario editado"
  }'
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Comentario actualizado exitosamente",
  "data": { "...comentario actualizado..." }
}
```

**Errores:**
- `403`: No eres el autor de este comentario

---

#### DELETE /api/v1/comments/:id

Elimina un comentario. Solo el autor puede eliminarlo.  
**Requiere:** `x-token: TU_JWT`

```bash
curl -X DELETE http://localhost:3010/api/v1/comments/699d81ab... \
  -H "x-token: TU_JWT"
```

**Respuesta (200):**
```json
{
  "success": true,
  "message": "Comentario eliminado exitosamente"
}
```

**Errores:**
- `403`: No eres el autor de este comentario

---

## Categorías de Publicaciones

| Valor | Descripción |
|-------|-------------|
| `Tecnología` | Temas de tecnología y software |
| `Deportes` | Tema deportivo |
| `Política` | Temas políticos |
| `Entretenimiento` | Cine, música, series, etc. |
| `Educación` | Temas educativos |
| `Salud` | Salud y bienestar |
| `General` | Cualquier otro tema |

---

## Autenticación

El token JWT se envía en el header de cada request protegido:

```
x-token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O alternativamente:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token expira en **30 minutos**. Al expirar, vuelve a hacer login.

---

## Estructura del Proyecto

```
├── configs/
│   ├── app.js          # Express app y middlewares globales
│   ├── config.js       # Variables de entorno centralizadas
│   └── db.js           # Conexión a MongoDB
├── helpers/
│   ├── auth-operations.js
│   ├── cloudinary-service.js
│   ├── email-service.js
│   ├── file-upload.js
│   ├── generate-jwt.js
│   ├── profile-operations.js
│   └── user-db.js
├── middlewares/
│   ├── request-limit.js
│   ├── validate-JWT.js
│   └── validation.js
├── src/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   └── auth.routes.js
│   ├── comments/
│   │   ├── comment.controller.js
│   │   ├── comment.model.js
│   │   └── comment.routes.js
│   ├── posts/
│   │   ├── post.controller.js
│   │   ├── post.model.js
│   │   └── post.routes.js
│   └── users/
│       └── user.model.js
├── utils/
│   ├── password-utils.js
│   └── user-helpers.js
├── docker-compose.yml
├── index.js
└── .env
```
