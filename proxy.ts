import type { NextRequest } from "next/server";
import { createClient } from "./utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return await createClient(request);
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Public image/font files
     */
    "/((?!_next/static|_next/image|favicon|robots|sitemap|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf)$).*)",
  ],
};
