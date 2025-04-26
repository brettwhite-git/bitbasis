// Type definitions for Deno runtime
declare namespace Deno {
  interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }

  const env: Env;

  function serve(handler: (request: Request) => Response | Promise<Response>): void;
} 