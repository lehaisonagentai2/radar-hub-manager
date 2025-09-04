import Login from "../components/Login";

export function meta() {
  return [
    { title: "Đăng nhập - Radar Hub Manager" },
    { name: "description", content: "Đăng nhập vào hệ thống quản lý trạm radar" },
  ];
}

export default function LoginPage() {
  return <Login />;
}
