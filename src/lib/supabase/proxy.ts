import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

function stripLocale(pathname: string) {
  const match = pathname.match(/^\/([a-z]{2})(\/.*)?$/);
  if (match && routing.locales.includes(match[1] as (typeof routing.locales)[number])) {
    return { locale: match[1], rest: match[2] ?? "/" };
  }
  return { locale: routing.defaultLocale, rest: pathname };
}

// Runs after next-intl's own middleware has resolved the locale; `response`
// is the response it produced (rewrite/redirect for locale prefixing), which
// we layer the Supabase session cookies onto rather than replacing.
export async function updateSession(request: NextRequest, response: NextResponse) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshes the auth token if needed. Required so Server Components
  // downstream see a valid session instead of a stale/expired cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { locale, rest } = stripLocale(request.nextUrl.pathname);
  const isAdminRoute = rest.startsWith("/admin");
  const isAdminLoginRoute = rest === "/admin/login";
  const isAccountRoute = rest.startsWith("/account");

  if (isAdminRoute && !isAdminLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/admin/login`;
    return NextResponse.redirect(url);
  }

  if (isAccountRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("next", rest);
    return NextResponse.redirect(url);
  }

  return response;
}
