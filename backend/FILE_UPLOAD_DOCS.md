# File Upload and Document Management API

The Radar Hub Manager API now includes comprehensive file upload and document management capabilities.

## Features Added

### 1. File Upload API
- **Endpoint**: `POST /v1/api/radar-hub-manager/files/upload`
- **Authentication**: Required (JWT token)
- **Content-Type**: `multipart/form-data`
- **Max File Size**: 50MB
- **Allowed File Types**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, RTF, CSV, JPG, JPEG, PNG, GIF, BMP, TIFF, ZIP, RAR, 7Z, MP4, AVI, MOV, WMV, FLV, MP3, WAV, FLAC, AAC

#### Request Example
```bash
curl -X POST "http://localhost:8998/v1/api/radar-hub-manager/files/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/your/file.pdf"
```

#### Response Example
```json
{
  "message": "File uploaded successfully",
  "data": {
    "file_url": "http://localhost:8998/uploads/document_a1b2c3d4.pdf",
    "file_name": "document.pdf",
    "file_size": 1024768,
    "file_type": "application/pdf"
  }
}
```

### 2. Document Management API

#### Create Document
- **Endpoint**: `POST /v1/api/radar-hub-manager/documents`
- **Authentication**: Required (JWT token)

```bash
curl -X POST "http://localhost:8998/v1/api/radar-hub-manager/documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Important Document",
    "description": "This is an important document for the system",
    "file_url": "http://localhost:8998/uploads/document_a1b2c3d4.pdf",
    "file_name": "document.pdf",
    "file_size": 1024768,
    "file_type": "application/pdf"
  }'
```

#### List Documents
- **Endpoint**: `GET /v1/api/radar-hub-manager/documents`
- **Authentication**: Required (JWT token)

```bash
curl -X GET "http://localhost:8998/v1/api/radar-hub-manager/documents" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Document by ID
- **Endpoint**: `GET /v1/api/radar-hub-manager/documents/{id}`
- **Authentication**: Required (JWT token)

```bash
curl -X GET "http://localhost:8998/v1/api/radar-hub-manager/documents/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Document
- **Endpoint**: `PUT /v1/api/radar-hub-manager/documents/{id}`
- **Authentication**: Required (JWT token)

```bash
curl -X PUT "http://localhost:8998/v1/api/radar-hub-manager/documents/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Document Title",
    "description": "Updated description"
  }'
```

#### Delete Document
- **Endpoint**: `DELETE /v1/api/radar-hub-manager/documents/{id}`
- **Authentication**: Required (JWT token)
- **Note**: This will also attempt to delete the associated file from the server

```bash
curl -X DELETE "http://localhost:8998/v1/api/radar-hub-manager/documents/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Static File Access
Uploaded files are accessible via static URLs:
- **URL Pattern**: `http://localhost:8998/uploads/{filename}`
- **Authentication**: Not required for file access
- **CORS**: Enabled for all domains

## Database Schema

### Document Model
```go
type Document struct {
    ID          uint   `json:"id"`
    Title       string `json:"title"`
    Description string `json:"description,omitempty"`
    FileUrl     string `json:"file_url"`     // URL to access the file
    FileName    string `json:"file_name"`    // Original filename
    FileSize    int64  `json:"file_size"`    // File size in bytes
    FileType    string `json:"file_type"`    // MIME type
    UploadedBy  int    `json:"uploaded_by"`  // User ID who uploaded
    CreatedAt   int64  `json:"created_at"`
    UpdatedAt   int64  `json:"updated_at"`
}
```

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **File Type Validation**: Only allowed file types can be uploaded
3. **File Size Limits**: Maximum 50MB per file
4. **Unique Filenames**: Prevents filename conflicts and overwrites
5. **CORS Support**: Cross-origin requests are supported

## File Storage

- **Directory**: `./uploads/` (relative to server executable)
- **Naming**: Original filename + unique hash to prevent conflicts
- **Organization**: Flat structure (all files in uploads directory)

## Integration with Existing System

The document management system integrates seamlessly with the existing radar hub manager:

1. **Role-based Access**: All existing roles (ADMIN, OPERATOR, HQ) can upload and manage documents
2. **User Tracking**: Each document records who uploaded it
3. **Audit Trail**: Created and updated timestamps are maintained
4. **Consistent API**: Follows the same patterns as other endpoints

## Example Workflow

1. **Login** to get JWT token
2. **Upload file** using `/files/upload` endpoint
3. **Create document record** with the returned file URL
4. **Access file** via the static URL
5. **Manage documents** using CRUD operations
6. **Delete document** when no longer needed

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request`: Invalid request data or file type
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Document or file not found
- `413 Payload Too Large`: File exceeds size limit
- `500 Internal Server Error`: Server-side errors

All error responses include descriptive messages to help with debugging.