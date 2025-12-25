/**
 * サイトAPI - 個別取得・更新・削除
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { SiteType1, SiteType2, EditMethod, Importance, SeoImpact, SiteCategory } from "@/types/prisma"

/**
 * サイト詳細を取得
 * GET /api/sites/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params

    const site = await prisma.site.findUnique({
      where: { id },
      include: {
        clinicSites: {
          include: {
            clinic: {
              select: {
                id: true,
                name: true,
                phone: true,
                prefecture: true,
                city: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    })

    if (!site) {
      return NextResponse.json(
        { error: "サイトが見つかりません" },
        { status: 404 }
      )
    }

    // 統計情報を計算
    const totalClinics = site.clinicSites.length
    const matchedClinics = site.clinicSites.filter(
      (cs) => cs.status === "matched"
    ).length
    const mismatchedClinics = site.clinicSites.filter(
      (cs) => cs.status === "mismatched"
    ).length

    return NextResponse.json({
      ...site,
      stats: {
        totalClinics,
        matchedClinics,
        mismatchedClinics,
      },
    })
  } catch (error) {
    console.error("サイト詳細取得エラー:", error)
    return NextResponse.json(
      { error: "サイト詳細の取得に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * サイトを更新
 * PUT /api/sites/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      url,
      registerUrl,
      editUrl,
      type1,
      type2,
      editMethod,
      importance,
      seoImpact,
      template,
      comment,
      siteType,
      isActive,
    } = body

    // サイトの存在確認
    const existingSite = await prisma.site.findUnique({
      where: { id },
    })

    if (!existingSite) {
      return NextResponse.json(
        { error: "サイトが見つかりません" },
        { status: 404 }
      )
    }

    // URLの重複チェック（自分以外）
    if (url && url !== existingSite.url) {
      const duplicateSite = await prisma.site.findFirst({
        where: {
          url,
          id: { not: id },
        },
      })

      if (duplicateSite) {
        return NextResponse.json(
          { error: "このURLは既に登録されています" },
          { status: 400 }
        )
      }
    }

    // 更新
    const site = await prisma.site.update({
      where: { id },
      data: {
        name,
        url,
        registerUrl,
        editUrl,
        type1: type1 as SiteType1,
        type2: type2 as SiteType2,
        editMethod: editMethod as EditMethod,
        importance: importance as Importance,
        seoImpact: seoImpact as SeoImpact,
        template,
        comment,
        siteType: siteType as SiteCategory,
        isActive,
      },
    })

    return NextResponse.json(site)
  } catch (error) {
    console.error("サイト更新エラー:", error)
    return NextResponse.json(
      { error: "サイトの更新に失敗しました" },
      { status: 500 }
    )
  }
}

/**
 * サイトを削除
 * DELETE /api/sites/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      )
    }

    const { id } = await params

    // サイトの存在確認
    const existingSite = await prisma.site.findUnique({
      where: { id },
    })

    if (!existingSite) {
      return NextResponse.json(
        { error: "サイトが見つかりません" },
        { status: 404 }
      )
    }

    // 削除（関連データはカスケード削除される）
    await prisma.site.delete({
      where: { id },
    })

    return NextResponse.json({ message: "サイトを削除しました" })
  } catch (error) {
    console.error("サイト削除エラー:", error)
    return NextResponse.json(
      { error: "サイトの削除に失敗しました" },
      { status: 500 }
    )
  }
}
