import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { ApiError, isApiError } from "@/lib/api-errors";

interface HandlerOptions {
  requireAuth?: boolean;
}

interface HandlerContext {
  userId: string | null;
}

type Handler<TParams extends Record<string, unknown> = Record<string, never>> = (
  request: NextRequest,
  context: HandlerContext & TParams
) => Promise<NextResponse>;

export const withApiHandler = <TParams extends Record<string, unknown> = Record<string, never>>(
  handler: Handler<TParams>,
  options: HandlerOptions = { requireAuth: true }
) => {
  return async (request: NextRequest, routeContext?: TParams) => {
    const start = Date.now();

    try {
      const { userId } = await auth();

      if (options.requireAuth !== false && !userId) {
        throw new ApiError(401, "Unauthorized");
      }

      const response = await handler(request, {
        userId: userId ?? null,
        ...(routeContext || ({} as TParams)),
      });

      console.info(
        `[api] ${request.method} ${request.nextUrl.pathname} ${response.status} ${Date.now() - start}ms`
      );

      return response;
    } catch (error) {
      const status = isApiError(error) ? error.status : 500;
      const message =
        isApiError(error) || error instanceof Error
          ? error.message
          : "Internal server error";

      console.error(
        `[api] ${request.method} ${request.nextUrl.pathname} ${status} ${Date.now() - start}ms`,
        error
      );

      return NextResponse.json({ error: message }, { status });
    }
  };
};
