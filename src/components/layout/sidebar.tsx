"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Building2,
  Globe,
  Wrench,
  FileEdit,
  Settings,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"

const navigation = [
  {
    name: "ダッシュボード",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "ワークスペース",
    href: "/workspace",
    icon: Wrench,
  },
  {
    name: "医院管理",
    href: "/clinics",
    icon: Building2,
  },
  {
    name: "サイト管理",
    href: "/sites",
    icon: Globe,
  },
  {
    name: "修正依頼",
    href: "/requests",
    icon: FileEdit,
  },
  {
    name: "設定",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      {/* ロゴ */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-lg font-bold text-white">
          デンタルNAP<br />
          <span className="text-sm font-normal text-gray-400">マネージャー</span>
        </h1>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* ログアウト */}
      <div className="border-t border-gray-800 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          ログアウト
        </button>
      </div>
    </div>
  )
}
