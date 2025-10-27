import Layout from '../components/Layout';
import { 
  CodeBracketIcon, 
  UsersIcon, 
  ShieldCheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

export function meta() {
  return [
    { title: "Giới thiệu - Radar Hub Manager" },
    { name: "description", content: "Thông tin về phần mềm quản lý trạm radar quân sự" },
  ];
}

export default function About() {
  const techStack = [
    { name: 'Frontend', tech: 'React 19 + TypeScript + Tailwind CSS' },
    { name: 'Backend', tech: 'Go 1.22 + Gin Framework + LevelDB' },
    { name: 'Real-time', tech: 'Native WebSocket Connection' },
    { name: 'Authentication', tech: 'JWT Token Based Security' },
    { name: 'Deployment', tech: 'Docker + nginx + systemd' }
  ];

  const teamMembers = [
    { name: 'Nguyễn Văn A', role: 'Lead Developer', specialty: 'Senior Software Engineer' },
    { name: 'Trần Thị B', role: 'Frontend Developer', specialty: 'React/TypeScript Specialist' },
    { name: 'Lê Văn C', role: 'Backend Developer', specialty: 'Go/Systems Engineer' },
    { name: 'Phạm Thị D', role: 'UI/UX Designer', specialty: 'Interface Design Specialist' },
    { name: 'Hoàng Văn E', role: 'DevOps Engineer', specialty: 'Infrastructure & Deployment' }
  ];

  const features = [
    'Quản lý trạm radar với thông tin chi tiết vị trí và trạng thái',
    'Hệ thống phân quyền theo vai trò (ADMIN, HQ, OPERATOR)',
    'Quản lý lịch trực 24/7 với lưới thời gian chi tiết',
    'Hệ thống cảnh báo thời gian thực qua WebSocket',
    'Giao diện responsive cho mọi thiết bị',
    'Bảo mật cấp quân sự với mã hóa end-to-end',
    'Hoạt động trong mạng đóng (air-gapped network)',
    'Ghi log và giám sát hoạt động hệ thống'
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-blue-100 rounded-full">
                <CpuChipIcon className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Hệ Thống Quản Lý Trạm Radar Quân Sự
            </h1>
            <p className="text-xl text-gray-600 mb-2">Radar Hub Manager v1.0.0</p>
            <p className="text-lg text-gray-500">
              Phát triển bởi <span className="font-semibold text-blue-600">Radar Dev Team</span>
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* About Software */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <CodeBracketIcon className="h-6 w-6 text-blue-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Về Phần Mềm</h2>
              </div>
              <p className="text-gray-700 mb-4">
                Radar Hub Manager là hệ thống quản lý trạm radar quân sự hiện đại, được thiết kế 
                để đáp ứng các yêu cầu nghiêm ngặt về bảo mật và hiệu suất trong môi trường quân sự.
              </p>
              <p className="text-gray-700 mb-6">
                Hệ thống cung cấp khả năng quản lý toàn diện các trạm radar, lịch trực, 
                nhân sự và cảnh báo thời gian thực với giao diện thân thiện và bảo mật cao.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tính Năng Chính:</h3>
              <ul className="space-y-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <span className="flex-shrink-0 h-2 w-2 bg-blue-600 rounded-full mt-2 mr-3"></span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technical Stack */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <CpuChipIcon className="h-6 w-6 text-green-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Công Nghệ Sử Dụng</h2>
              </div>
              <div className="space-y-4">
                {techStack.map((item, index) => (
                  <div key={index} className="border-l-4 border-green-500 pl-4">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <p className="text-gray-600">{item.tech}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Đặc Điểm Kỹ Thuật:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Hiệu suất cao với Go backend</li>
                  <li>• Giao diện hiện đại với React 19</li>
                  <li>• Bảo mật JWT và middleware</li>
                  <li>• Database nhúng LevelDB</li>
                  <li>• WebSocket cho real-time updates</li>
                </ul>
              </div>
            </div>

            {/* Development Team */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <UsersIcon className="h-6 w-6 text-purple-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Đội Ngũ Phát Triển</h2>
              </div>
              <div className="space-y-4">
                {teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">
                        {member.name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-gray-900">{member.name}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <p className="text-xs text-gray-500">{member.specialty}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact & Support */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <ShieldCheckIcon className="h-6 w-6 text-red-600 mr-2" />
                <h2 className="text-2xl font-bold text-gray-900">Thông Tin Liên Hệ</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Hỗ Trợ</p>
                    <p className="text-sm text-gray-600">support@radardev.mil.vn</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Điện Thoại Khẩn Cấp</p>
                    <p className="text-sm text-gray-600">+84 (24) 3xxx-xxxx</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Địa Chỉ</p>
                    <p className="text-sm text-gray-600">
                      Trung Tâm Công Nghệ Quân Sự<br />
                      Hà Nội, Việt Nam
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Bảo Mật & Tuân Thủ:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Mã hóa cấp quân sự</li>
                  <li>• Hoạt động mạng đóng</li>
                  <li>• Phân quyền nhiều cấp độ</li>
                  <li>• Ghi log và giám sát</li>
                  <li>• Tuân thủ tiêu chuẩn an ninh</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center">
            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-500">
                © 2025 Radar Development Team. Phát triển cho Lực Lượng Vũ Trang Nhân Dân Việt Nam.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Phần mềm này được bảo vệ bởi luật sở hữu trí tuệ và chỉ được sử dụng cho mục đích quân sự.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}