/**
 * Prisma シードスクリプト
 *
 * マスタサイトと初期管理者アカウントを作成します。
 */

import { hash } from "bcryptjs"
import { prisma } from "../src/lib/prisma"

// マスタサイトデータ（検索テンプレート付き）
const masterSites = [
  {
    name: "Google ビジネスプロフィール",
    url: "https://business.google.com",
    registerUrl: "https://business.google.com/create",
    editUrl: "https://business.google.com",
    type1: "free" as const,
    type2: "portal" as const,
    editMethod: "form" as const,
    importance: "high" as const,
    seoImpact: "large" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} {prefecture} site:google.com/maps",
  },
  {
    name: "Yahoo!プレイス",
    url: "https://loco.yahoo.co.jp",
    registerUrl: "https://business-id.yahoo.co.jp/",
    editUrl: "https://loco.yahoo.co.jp",
    type1: "free" as const,
    type2: "portal" as const,
    editMethod: "form" as const,
    importance: "high" as const,
    seoImpact: "large" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} {prefecture} site:loco.yahoo.co.jp",
  },
  {
    name: "EPARK歯科",
    url: "https://haisha-yoyaku.jp",
    registerUrl: "https://haisha-yoyaku.jp/owner",
    editUrl: "https://haisha-yoyaku.jp",
    type1: "paid" as const,
    type2: "portal" as const,
    editMethod: "form" as const,
    importance: "high" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} site:haisha-yoyaku.jp",
  },
  {
    name: "デンターネット",
    url: "https://www.denternet.jp",
    registerUrl: "https://www.denternet.jp/clinic/entry.aspx",
    editUrl: "https://www.denternet.jp",
    type1: "free" as const,
    type2: "portal" as const,
    editMethod: "email" as const,
    importance: "medium" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} site:denternet.jp",
  },
  {
    name: "歯科タウン",
    url: "https://www.shikatown.com",
    registerUrl: "https://www.shikatown.com/entry",
    editUrl: "https://www.shikatown.com",
    type1: "free" as const,
    type2: "portal" as const,
    editMethod: "email" as const,
    importance: "medium" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} site:shikatown.com",
  },
  {
    name: "デンタルブック",
    url: "https://www.dentalbook.jp",
    registerUrl: "https://www.dentalbook.jp",
    type1: "free" as const,
    type2: "portal" as const,
    editMethod: "email" as const,
    importance: "low" as const,
    seoImpact: "small" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} site:dentalbook.jp",
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com",
    registerUrl: "https://www.facebook.com/pages/create",
    editUrl: "https://www.facebook.com",
    type1: "free" as const,
    type2: "sns" as const,
    editMethod: "form" as const,
    importance: "medium" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} {prefecture} 歯科 site:facebook.com",
  },
  {
    name: "Instagram",
    url: "https://www.instagram.com",
    registerUrl: "https://www.instagram.com/accounts/emailsignup/",
    editUrl: "https://www.instagram.com",
    type1: "free" as const,
    type2: "sns" as const,
    editMethod: "form" as const,
    importance: "medium" as const,
    seoImpact: "small" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} 歯科 site:instagram.com",
  },
  {
    name: "LINE公式アカウント",
    url: "https://www.linebiz.com/jp/",
    registerUrl: "https://entry.line.biz/",
    editUrl: "https://manager.line.biz/",
    type1: "free" as const,
    type2: "sns" as const,
    editMethod: "form" as const,
    importance: "medium" as const,
    seoImpact: "small" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} 歯科 LINE公式アカウント",
  },
  {
    name: "Twitter/X",
    url: "https://x.com",
    registerUrl: "https://x.com/i/flow/signup",
    editUrl: "https://x.com/settings/profile",
    type1: "free" as const,
    type2: "sns" as const,
    editMethod: "form" as const,
    importance: "low" as const,
    seoImpact: "small" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} 歯科 site:x.com",
  },
  {
    name: "Indeed",
    url: "https://jp.indeed.com",
    registerUrl: "https://employers.indeed.com/",
    editUrl: "https://employers.indeed.com/",
    type1: "paid" as const,
    type2: "job" as const,
    editMethod: "form" as const,
    importance: "low" as const,
    seoImpact: "small" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} 歯科 site:jp.indeed.com",
  },
  {
    name: "ジョブメドレー",
    url: "https://job-medley.com",
    registerUrl: "https://job-medley.com/recruitment/",
    type1: "paid" as const,
    type2: "job" as const,
    editMethod: "form" as const,
    importance: "low" as const,
    seoImpact: "small" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} site:job-medley.com",
  },
  {
    name: "病院なび",
    url: "https://byoinnavi.jp",
    registerUrl: "https://byoinnavi.jp/entry",
    type1: "free" as const,
    type2: "portal" as const,
    editMethod: "email" as const,
    importance: "medium" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} {prefecture} site:byoinnavi.jp",
  },
  {
    name: "caloo",
    url: "https://caloo.jp",
    registerUrl: "https://caloo.jp/owners/",
    type1: "approval" as const,
    type2: "portal" as const,
    editMethod: "email" as const,
    importance: "medium" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} {prefecture} site:caloo.jp",
  },
  {
    name: "ドクターズファイル",
    url: "https://doctorsfile.jp",
    registerUrl: "https://doctorsfile.jp/owner/",
    type1: "paid" as const,
    type2: "portal" as const,
    editMethod: "phone" as const,
    importance: "medium" as const,
    seoImpact: "medium" as const,
    siteType: "master" as const,
    searchUrlTemplate: "{clinicName} {prefecture} site:doctorsfile.jp",
  },
]

// デフォルトメールテンプレート
const defaultEmailTemplate = {
  name: "デフォルト修正依頼テンプレート",
  subject: "【NAP情報修正依頼】{clinic_name}の情報修正のお願い",
  body: `お世話になっております。
{clinic_name}の情報管理担当です。

貴サイトに掲載されている当院の情報について、
以下の通り修正をお願いいたします。

■ 現在の掲載情報
医院名: {current_name}
住所: {current_address}
電話番号: {current_phone}

■ 正しい情報
医院名: {correct_name}
住所: {correct_address}
電話番号: {correct_phone}

お手数をおかけしますが、
ご対応のほどよろしくお願いいたします。`,
  isDefault: true,
}

async function main() {
  console.log("シードデータの作成を開始します...")

  // 管理者アカウントの作成
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: "admin@example.com" },
  })

  if (!existingAdmin) {
    const passwordHash = await hash("password123", 12)
    await prisma.admin.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        name: "管理者",
        notificationSettings: {
          create: {
            newMismatch: true,
            weeklySummary: true,
            followUpReminder: true,
            accessError: false,
            reminderDays: 7,
          },
        },
      },
    })
    console.log("管理者アカウントを作成しました (email: admin@example.com, password: password123)")
  } else {
    console.log("管理者アカウントは既に存在します")
  }

  // マスタサイトの作成
  for (const site of masterSites) {
    const existingSite = await prisma.site.findFirst({
      where: { url: site.url },
    })

    if (!existingSite) {
      await prisma.site.create({
        data: site,
      })
      console.log(`マスタサイトを作成: ${site.name}`)
    } else {
      console.log(`マスタサイトは既に存在: ${site.name}`)
    }
  }

  // デフォルトメールテンプレートの作成
  const existingTemplate = await prisma.emailTemplate.findFirst({
    where: { isDefault: true },
  })

  if (!existingTemplate) {
    await prisma.emailTemplate.create({
      data: defaultEmailTemplate,
    })
    console.log("デフォルトメールテンプレートを作成しました")
  } else {
    console.log("デフォルトメールテンプレートは既に存在します")
  }

  console.log("シードデータの作成が完了しました")
}

main()
  .catch((e) => {
    console.error("シードエラー:", e)
    process.exit(1)
  })
