import type { Route } from "./+types/home";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../lib/store";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Radar Hub Manager" },
    { name: "description", content: "Hệ thống quản lý trạm radar quân sự" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
}
