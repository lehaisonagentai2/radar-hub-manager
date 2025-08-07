package models

//========================
// Authorization & Accounts
//========================

type RoleName string

const (
	RoleAdmin    RoleName = "ADMIN"    // Quản trị hệ thống
	RoleOperator RoleName = "OPERATOR" // Nhân viên vận hành trạm
	RoleHQ       RoleName = "HQ"       // Cán bộ Sở chỉ huy
)

type Role struct {
	ID          uint     `json:"id"`
	Name        RoleName `json:"name"`
	Description string   `json:"description,omitempty"`
	CreatedAt   int64    `json:"created_at"`
	UpdatedAt   int64    `json:"updated_at"`
}

// Người dùng hệ thống

type User struct {
	ID       int      `json:"id"` // UUID dưới dạng chuỗi
	Username string   `json:"username"`
	Password string   `json:"password,omitempty"` // Chỉ dùng khi tạo mới, không trả về
	FullName string   `json:"full_name"`
	RoleID   RoleName `json:"role_id"`

	// Nếu là OPERATOR: trạm mà người dùng trực thuộc
	StationID *uint    `json:"station_id,omitempty"`
	Station   *Station `json:"station,omitempty"`

	LastLogin *int64 `json:"last_login,omitempty"`
	CreatedAt int64  `json:"created_at"`
	UpdatedAt int64  `json:"updated_at"`
}

//========================
// Radar Stations – mỗi trạm có ghi chú
//========================

type Station struct {
	ID              uint    `json:"id"`
	Name            string  `json:"name"`
	Latitude        float64 `json:"latitude"`
	Longitude       float64 `json:"longitude"`
	Elevation       float64 `json:"elevation"`         // mét so với mực nước biển
	DistanceToCoast float64 `json:"distance_to_coast"` // km
	Status          string  `json:"status"`            // "ACTIVE" / "INACTIVE" (tính từ lịch)

	Note string `json:"note,omitempty"` // ghi chú tự do

	CreatedAt int64 `json:"created_at"`
	UpdatedAt int64 `json:"updated_at"`
}

//========================
// Station Schedule – khung giờ bật máy + thông tin kíp trực
//========================
// Mỗi bản ghi đại diện cho một khoảng HH:MM hằng ngày.
// Ví dụ: 01:30–03:30 => StartHHMM="0130", EndHHMM="0330".
// Trạm khai báo người trực ngay trên lịch để HQ xem một bảng duy nhất.

type Schedule struct {
	ID        uint `json:"id"`
	StationID uint `json:"station_id"`

	StartHHMM string `json:"start_hhmm"` // "0130"
	EndHHMM   string `json:"end_hhmm"`   // "0330"

	// ====== Thông tin kíp trực cho khung giờ này ======
	Commander string `json:"commander"` // Trực chỉ huy
	Crew      string `json:"crew"`      // Danh sách kíp trực
	Phone     string `json:"phone"`     // Số liên lạc

	CreatedAt int64 `json:"created_at"`
	UpdatedAt int64 `json:"updated_at"`
}

//========================
// Command Flow (HQ → Station)
//========================
// HQ gửi lệnh xuống trạm; trạm bấm Xác nhận → AcknowledgedAt

type Command struct {
	ID             uint   `json:"id"`
	ToStationID    uint   `json:"to_station_id"`
	Content        string `json:"content"`
	FromUserID     string `json:"from_user_id"` // UUID dưới dạng chuỗi
	SentAt         int64  `json:"sent_at"`
	AcknowledgedAt *int64 `json:"acknowledged_at,omitempty"`
	CreatedAt      int64  `json:"created_at"`
}
