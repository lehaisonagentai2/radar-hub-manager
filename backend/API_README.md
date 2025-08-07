# Radar Hub Manager API

This is the backend API server for the Radar Hub Manager system, built with Go, Gin, and JWT authentication.

## Features

- 🔐 JWT-based authentication
- 📚 Swagger API documentation
- 🗄️ LevelDB for data storage
- 🌐 RESTful API endpoints

## Quick Start

### Prerequisites

- Go 1.23+ installed
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd radar-hub-manager/backend
```

2. Install dependencies:
```bash
go mod tidy
```

3. Generate Swagger documentation:
```bash
./gen-swag.sh
```

4. Create a test user:
```bash
go run cmd/create_user/main.go
```

5. Start the server:
```bash
go run cmd/server/main.go
```

The server will start on `http://localhost:8080`

## API Endpoints

### Base URL
`http://localhost:8080/v1/api/radar-hub-manager`

### Authentication Endpoints

#### POST /auth/login
Login with username and password to get a JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "id": 753000,
    "username": "admin",
    "full_name": "Administrator",
    "role_id": "ADMIN",
    "created_at": 1691234567,
    "updated_at": 1691234567
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/me
Get current user information (requires Bearer token).

**Headers:**
```
Authorization: Bearer <your-jwt-token>
```

**Response:**
```json
{
  "id": 753000,
  "username": "admin",
  "full_name": "Administrator",
  "role_id": "ADMIN",
  "created_at": 1691234567,
  "updated_at": 1691234567
}
```

### User Management Endpoints (Admin Only)

All user management endpoints require:
1. Valid JWT token in Authorization header
2. User must have `ADMIN` role

#### POST /users
Create a new user.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request:**
```json
{
  "username": "newuser",
  "password": "password123",
  "full_name": "New User",
  "role_id": "OPERATOR",
  "station_id": 1
}
```

**Response:**
```json
{
  "id": 842000,
  "username": "newuser",
  "full_name": "New User",
  "role_id": "OPERATOR",
  "station_id": 1,
  "created_at": 1691234567,
  "updated_at": 1691234567
}
```

#### GET /users
List all users.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
[
  {
    "id": 753000,
    "username": "admin",
    "full_name": "Administrator",
    "role_id": "ADMIN",
    "created_at": 1691234567,
    "updated_at": 1691234567
  },
  {
    "id": 672000,
    "username": "operator",
    "full_name": "Station Operator",
    "role_id": "OPERATOR",
    "created_at": 1691234567,
    "updated_at": 1691234567
  }
]
```

#### GET /users/{username}
Get a specific user by username.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "id": 842000,
  "username": "user123",
  "full_name": "User Name",
  "role_id": "OPERATOR",
  "created_at": 1691234567,
  "updated_at": 1691234567
}
```

#### PUT /users/{username}
Update a user by username (partial updates supported).

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

**Request:**
```json
{
  "full_name": "Updated Name",
  "role_id": "HQ",
  "password": "newpassword123"
}
```

**Response:**
```json
{
  "id": 842000,
  "username": "user123",
  "full_name": "Updated Name",
  "role_id": "HQ",
  "created_at": 1691234567,
  "updated_at": 1691234568
}
```

#### DELETE /users/{username}
Delete a user by username.

**Headers:**
```
Authorization: Bearer <admin-jwt-token>
```

**Response:**
```json
{
  "message": "User deleted successfully"
}
```

### Other Endpoints

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Radar Hub Manager API is running"
}
```

## Swagger Documentation

Interactive API documentation is available at:
`http://localhost:8080/v1/api/radar-hub-manager/swagger/index.html`

## Development

### Generate Swagger Docs

Run the generation script:
```bash
./gen-swag.sh
```

### Build the Server

```bash
go build -o server cmd/server/main.go
```

### Run the Server

```bash
./server
```

### Create Test Users

```bash
go run cmd/create_user/main.go
```

## Testing the API

### Using curl

1. Login:
```bash
curl -X POST http://localhost:8080/v1/api/radar-hub-manager/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

2. Get user info (replace TOKEN with the actual token from login):
```bash
curl -X GET http://localhost:8080/v1/api/radar-hub-manager/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### Using the Swagger UI

1. Start the server
2. Go to `http://localhost:8080/v1/api/radar-hub-manager/swagger/index.html`
3. Use the interactive interface to test the endpoints

## Project Structure

```
backend/
├── cmd/
│   ├── server/           # Main server application
│   └── create_user/      # User creation utility
├── internal/
│   ├── config/           # Configuration
│   ├── handlers/         # HTTP handlers
│   ├── middleware/       # HTTP middleware
│   ├── models/          # Data models
│   └── services/        # Business logic
├── docs/                # Generated Swagger docs
├── gen-swag.sh         # Swagger generation script
├── go.mod
├── go.sum
└── README.md
```

## Authentication Flow

1. User sends login credentials to `/auth/login`
2. Server validates credentials and returns JWT token
3. Client includes token in `Authorization: Bearer <token>` header for protected endpoints
4. Server validates token and extracts user information for each request

## Security Notes

- JWT tokens expire after 24 hours
- Passwords are currently stored as plaintext (for demo purposes)
- In production, implement proper password hashing (bcrypt, etc.)
- Use environment variables for JWT secret keys
- Implement rate limiting and other security measures
