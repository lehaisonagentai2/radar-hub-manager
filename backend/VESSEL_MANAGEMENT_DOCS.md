# Vessel Management API Documentation

The Radar Hub Manager API now includes comprehensive vessel management capabilities with advanced search functionality by MMSI and name.

## Features Added

### 1. Vessel Data Model
The vessel model includes comprehensive maritime vessel information:

```go
type Vessel struct {
    ID          uint   `json:"id"`
    Name        string `json:"name"`        // Tên tàu
    MMSI        string `json:"mmsi"`        // Maritime Mobile Service Identity
    Kind        string `json:"kind"`        // Loại tàu: "TC (Tàu chiến), DS (Dân sự)"
    Size        string `json:"size"`        // Kích cỡ tàu: "width x height x depth"
    Weight      string `json:"weight"`      // Trọng tải tàu
    Class       string `json:"class"`       // Lớp tàu: "Lớp A, Lớp B, Lớp C, Lớp D"
    Specs       string `json:"specs"`       // Thông số kỹ thuật
    MaxSpeed    string `json:"max_speed"`   // Tốc độ tối đa
    Description string `json:"description"` // Mô tả thêm về tàu
    CreatedAt   int64  `json:"created_at"`
    UpdatedAt   int64  `json:"updated_at"`
}
```

### 2. CRUD Operations

#### Create Vessel
- **Endpoint**: `POST /v1/api/radar-hub-manager/vessels`
- **Authentication**: Required (JWT token)
- **Validation**: Name and MMSI are required, MMSI must be unique

```bash
curl -X POST "http://localhost:8998/v1/api/radar-hub-manager/vessels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "USS Enterprise",
    "mmsi": "123456789",
    "kind": "TC",
    "size": "342m x 78m x 76m",
    "weight": "100000 tons",
    "class": "Lớp A",
    "specs": "Nuclear powered aircraft carrier",
    "max_speed": "30+ knots",
    "description": "Nuclear-powered supercarrier of the United States Navy"
  }'
```

#### List Vessels
- **Endpoint**: `GET /v1/api/radar-hub-manager/vessels`
- **Authentication**: Required (JWT token)
- **Query Parameters**: `name` (optional) - search by vessel name (partial match)

```bash
# List all vessels
curl -X GET "http://localhost:8998/v1/api/radar-hub-manager/vessels" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Search by name (partial match, case-insensitive)
curl -X GET "http://localhost:8998/v1/api/radar-hub-manager/vessels?name=Enterprise" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Vessel by ID
- **Endpoint**: `GET /v1/api/radar-hub-manager/vessels/{id}`
- **Authentication**: Required (JWT token)

```bash
curl -X GET "http://localhost:8998/v1/api/radar-hub-manager/vessels/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Get Vessel by MMSI
- **Endpoint**: `GET /v1/api/radar-hub-manager/vessels/mmsi/{mmsi}`
- **Authentication**: Required (JWT token)
- **Note**: MMSI-based lookup for maritime identification

```bash
curl -X GET "http://localhost:8998/v1/api/radar-hub-manager/vessels/mmsi/123456789" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### Update Vessel
- **Endpoint**: `PUT /v1/api/radar-hub-manager/vessels/{id}`
- **Authentication**: Required (JWT token)
- **Note**: Partial updates supported, MMSI uniqueness validated

```bash
curl -X PUT "http://localhost:8998/v1/api/radar-hub-manager/vessels/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "max_speed": "35+ knots"
  }'
```

#### Delete Vessel
- **Endpoint**: `DELETE /v1/api/radar-hub-manager/vessels/{id}`
- **Authentication**: Required (JWT token)
- **Note**: Removes vessel and all associated indexes

```bash
curl -X DELETE "http://localhost:8998/v1/api/radar-hub-manager/vessels/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Advanced Search and Indexing

#### MMSI Index
- **Purpose**: Fast lookup by Maritime Mobile Service Identity
- **Implementation**: Dedicated index `vessel_mmsi:{mmsi}` → vessel_id
- **Features**: 
  - Unique constraint enforcement
  - O(1) lookup performance
  - Automatic index maintenance on updates/deletes

#### Name Search Index
- **Purpose**: Case-insensitive partial name search
- **Implementation**: Index `vessel_name:{lowercase_name}` → vessel_id
- **Features**:
  - Case-insensitive search (using lowercase normalization)
  - Partial matching support
  - Automatic index maintenance

#### Search Examples

```bash
# Find all vessels with "Enterprise" in the name
GET /vessels?name=Enterprise

# Find vessels with "uss" in the name (case-insensitive)
GET /vessels?name=uss

# Exact MMSI lookup
GET /vessels/mmsi/123456789
```

### 4. Data Validation and Business Rules

#### Required Fields
- `name`: Vessel name (must not be empty)
- `mmsi`: Maritime Mobile Service Identity (must not be empty and unique)

#### Unique Constraints
- **MMSI**: Each vessel must have a unique MMSI
- **Validation**: Enforced on create and update operations
- **Error Response**: Returns 400 Bad Request with descriptive message

#### Index Consistency
- **Automatic Management**: Indexes are automatically created, updated, and cleaned up
- **Transactional Safety**: Index operations are coordinated with data operations
- **Error Recovery**: Graceful handling of index inconsistencies

### 5. Integration with Existing System

#### Authentication & Authorization
- **JWT Required**: All endpoints require valid JWT token
- **Role Support**: Works with existing ADMIN, OPERATOR, HQ roles
- **Permissions**: All authenticated users can manage vessels

#### Database Integration
- **Storage**: Uses existing LevelDB with consistent patterns
- **Key Format**: `vessel:{id}`, `vessel_mmsi:{mmsi}`, `vessel_name:{lowercase_name}`
- **Counters**: Automatic ID generation using `vessel_counter`

### 6. API Response Format

#### Success Response
```json
{
  "message": "Vessel created successfully",
  "data": {
    "id": 1,
    "name": "USS Enterprise",
    "mmsi": "123456789",
    "kind": "TC",
    "size": "342m x 78m x 76m",
    "weight": "100000 tons",
    "class": "Lớp A",
    "specs": "Nuclear powered aircraft carrier",
    "max_speed": "30+ knots",
    "description": "Nuclear-powered supercarrier of the United States Navy",
    "created_at": 1729971234,
    "updated_at": 1729971234
  }
}
```

#### Error Response
```json
{
  "error": "Bad Request",
  "message": "vessel with this MMSI already exists"
}
```

### 7. Performance Characteristics

#### Time Complexity
- **Create**: O(1) - Direct key insertion with index creation
- **Get by ID**: O(1) - Direct key lookup
- **Get by MMSI**: O(1) - Index lookup followed by direct key access
- **Search by Name**: O(n) - Prefix iteration (where n = number of vessels)
- **Update**: O(1) - Direct key update with index maintenance
- **Delete**: O(1) - Direct key deletion with index cleanup

#### Space Complexity
- **Storage**: O(n) vessels + O(n) MMSI indexes + O(n) name indexes
- **Memory**: Minimal overhead with LevelDB's efficient storage

### 8. Testing and Validation

#### Test Coverage
- ✅ Create vessel with all fields
- ✅ MMSI uniqueness constraint
- ✅ Name and MMSI requirement validation
- ✅ List all vessels
- ✅ Search by name (partial, case-insensitive)
- ✅ Get by ID
- ✅ Get by MMSI
- ✅ Update vessel (partial updates)
- ✅ Delete vessel with index cleanup
- ✅ Authentication requirement
- ✅ Error handling and response codes

#### Sample Test Data
```json
{
  "name": "USS Enterprise",
  "mmsi": "123456789",
  "kind": "TC",
  "size": "342m x 78m x 76m",
  "weight": "100000 tons",
  "class": "Lớp A",
  "specs": "Nuclear powered aircraft carrier",
  "max_speed": "30+ knots",
  "description": "Nuclear-powered supercarrier of the United States Navy"
}
```

### 9. Error Handling

#### Common Error Codes
- `400 Bad Request`: Invalid input, missing required fields, MMSI conflicts
- `401 Unauthorized`: Missing or invalid JWT token
- `404 Not Found`: Vessel not found
- `500 Internal Server Error`: Database or server errors

#### Error Messages
- "vessel name is required"
- "vessel MMSI is required"
- "vessel with this MMSI already exists"
- "vessel not found"
- "Invalid vessel ID"

### 10. Future Enhancements

#### Potential Improvements
1. **Pagination**: Add pagination support for large vessel lists
2. **Advanced Search**: Multi-field search combinations
3. **Sorting**: Sort results by various fields
4. **Bulk Operations**: Batch create/update/delete operations
5. **Audit Trail**: Track vessel modification history
6. **Geolocation**: Add vessel position tracking
7. **Categories**: Enhanced vessel categorization and filtering
8. **Export**: Export vessel data in various formats

#### Scalability Considerations
- Index optimization for large datasets
- Query performance monitoring
- Database sharding strategies
- Caching layer implementation

## Summary

The vessel management system provides:

🚢 **Complete CRUD Operations** - Create, Read, Update, Delete vessels  
🔍 **Advanced Search** - By name (partial match) and MMSI (exact match)  
⚡ **High Performance** - O(1) lookups with efficient indexing  
🔒 **Data Integrity** - MMSI uniqueness and validation  
🛡️ **Security** - JWT authentication and role-based access  
📚 **Comprehensive API** - RESTful endpoints with Swagger documentation  
🧪 **Well Tested** - Complete test coverage with sample data  

The system is ready for production use and can handle maritime vessel management requirements efficiently.