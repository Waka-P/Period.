import { type NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", req.nextUrl.pathname);

  if (!session) {
    // 未ログインならログインページへリダイレクト
    if (req.nextUrl.pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  const currUser = session?.user;
  // ログイン後のプロフィール設定が完了していなければリダイレクト
  if (!currUser?.profileCompleted) {
    if (
      req.nextUrl.pathname !== "/onboarding" &&
      req.nextUrl.pathname !== "/login"
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  } else {
    // プロフィール設定が完了しているのに/onboardingにアクセスしようとした場合はホームへリダイレクト
    if (req.nextUrl.pathname === "/onboarding") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|images|favicon.ico|.*\\..*|login).*)",
  ],
};
