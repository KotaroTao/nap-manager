/**
 * 修正依頼一覧ページ
 *
 * 修正依頼の一覧とステータス管理を行います。
 */

import Link from "next/link"
import { FileEdit, Clock, CheckCircle, AlertCircle, XCircle, Pause } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

// 仮のデータ
const requests = [
  {
    id: "1",
    clinicName: "山田歯科クリニック",
    siteName: "Google ビジネスプロフィール",
    status: "requested",
    requestMethod: "form",
    requestedAt: "2024-12-20",
    daysElapsed: 5,
  },
  {
    id: "2",
    clinicName: "山田歯科クリニック",
    siteName: "EPARK歯科",
    status: "pending",
    requestMethod: null,
    requestedAt: null,
    daysElapsed: null,
  },
  {
    id: "3",
    clinicName: "鈴木デンタルオフィス",
    siteName: "Google ビジネスプロフィール",
    status: "inProgress",
    requestMethod: "email",
    requestedAt: "2024-12-10",
    daysElapsed: 15,
  },
  {
    id: "4",
    clinicName: "田中歯科医院",
    siteName: "歯科タウン",
    status: "completed",
    requestMethod: "form",
    requestedAt: "2024-12-05",
    daysElapsed: null,
  },
  {
    id: "5",
    clinicName: "鈴木デンタルオフィス",
    siteName: "Facebook",
    status: "requested",
    requestMethod: "email",
    requestedAt: "2024-12-13",
    daysElapsed: 12,
  },
]

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "未対応",
    color: "bg-gray-100 text-gray-800",
    icon: <Clock className="h-3 w-3" />,
  },
  requested: {
    label: "依頼済み",
    color: "bg-blue-100 text-blue-800",
    icon: <FileEdit className="h-3 w-3" />,
  },
  inProgress: {
    label: "対応中",
    color: "bg-yellow-100 text-yellow-800",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  completed: {
    label: "完了",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="h-3 w-3" />,
  },
  impossible: {
    label: "対応不可",
    color: "bg-red-100 text-red-800",
    icon: <XCircle className="h-3 w-3" />,
  },
  onHold: {
    label: "保留",
    color: "bg-gray-200 text-gray-700",
    icon: <Pause className="h-3 w-3" />,
  },
}

const methodLabels: Record<string, string> = {
  form: "フォーム",
  email: "メール",
  phone: "電話",
  other: "その他",
}

export default function RequestsPage() {
  const pendingCount = requests.filter((r) => r.status === "pending").length
  const requestedCount = requests.filter((r) => r.status === "requested").length
  const inProgressCount = requests.filter((r) => r.status === "inProgress").length
  const completedCount = requests.filter((r) => r.status === "completed").length

  const needsFollowUp = requests.filter(
    (r) =>
      r.status === "requested" && r.daysElapsed && r.daysElapsed >= 7
  )

  const RequestTable = ({ data }: { data: typeof requests }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>医院名</TableHead>
          <TableHead>サイト名</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>依頼方法</TableHead>
          <TableHead>依頼日</TableHead>
          <TableHead>経過日数</TableHead>
          <TableHead className="w-[100px]">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              <div className="flex flex-col items-center gap-2 text-gray-500">
                <FileEdit className="h-8 w-8" />
                <p>修正依頼がありません</p>
              </div>
            </TableCell>
          </TableRow>
        ) : (
          data.map((request) => (
            <TableRow key={request.id}>
              <TableCell className="font-medium">{request.clinicName}</TableCell>
              <TableCell>{request.siteName}</TableCell>
              <TableCell>
                <Badge
                  className={`${statusConfig[request.status].color} gap-1`}
                >
                  {statusConfig[request.status].icon}
                  {statusConfig[request.status].label}
                </Badge>
              </TableCell>
              <TableCell>
                {request.requestMethod
                  ? methodLabels[request.requestMethod]
                  : "-"}
              </TableCell>
              <TableCell>{request.requestedAt || "-"}</TableCell>
              <TableCell>
                {request.daysElapsed !== null ? (
                  <span
                    className={
                      request.daysElapsed >= 7
                        ? "text-red-600 font-medium"
                        : ""
                    }
                  >
                    {request.daysElapsed}日
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Link href={`/requests/${request.id}`}>
                  <Button variant="ghost" size="sm">
                    詳細
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">修正依頼管理</h2>
        <p className="text-gray-500 mt-1">
          修正依頼の送信状況と対応状況を管理します
        </p>
      </div>

      {/* フォローアップ必要なもの */}
      {needsFollowUp.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">
              要フォローアップ（依頼から7日以上経過）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsFollowUp.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-2 bg-white rounded-md"
                >
                  <div>
                    <span className="font-medium">{request.clinicName}</span>
                    <span className="text-gray-500"> × </span>
                    <span>{request.siteName}</span>
                    <span className="text-red-600 ml-2">
                      ({request.daysElapsed}日経過)
                    </span>
                  </div>
                  <Link href={`/requests/${request.id}`}>
                    <Button variant="outline" size="sm">
                      確認
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              未対応
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {pendingCount}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              依頼済み
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {requestedCount}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              対応中
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {inProgressCount}件
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              完了
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {completedCount}件
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルタ */}
      <div className="flex items-center gap-4">
        <Input placeholder="医院名・サイト名で検索..." className="max-w-sm" />
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="ステータス" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="pending">未対応</SelectItem>
            <SelectItem value="requested">依頼済み</SelectItem>
            <SelectItem value="inProgress">対応中</SelectItem>
            <SelectItem value="completed">完了</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* タブ */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">すべて ({requests.length})</TabsTrigger>
          <TabsTrigger value="pending">未対応 ({pendingCount})</TabsTrigger>
          <TabsTrigger value="active">
            対応中 ({requestedCount + inProgressCount})
          </TabsTrigger>
          <TabsTrigger value="completed">完了 ({completedCount})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="p-0">
              <RequestTable data={requests} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardContent className="p-0">
              <RequestTable
                data={requests.filter((r) => r.status === "pending")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardContent className="p-0">
              <RequestTable
                data={requests.filter(
                  (r) =>
                    r.status === "requested" || r.status === "inProgress"
                )}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardContent className="p-0">
              <RequestTable
                data={requests.filter((r) => r.status === "completed")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
