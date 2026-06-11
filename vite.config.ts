import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

type ViteProcess = {
  env: Record<string, string | undefined>;
};

declare const process: ViteProcess;

export default defineConfig(({ mode }) => {
  const env = { ...process.env, ...loadEnv(mode, ".", "") };
  const webPort = Number(env.WEB_PORT ?? env.VITE_WEB_PORT ?? 5173);
  const apiPort = Number(env.API_PORT ?? 4000);
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET ?? `http://localhost:${apiPort}`;
  const appDomain = env.VITE_APP_DOMAIN ?? env.PUBLIC_APP_DOMAIN ?? "veltrixio.local";
  const adminHost = env.VITE_ADMIN_HOST ?? `admin.${appDomain}`;
  const localAdminHost = env.VITE_LOCAL_ADMIN_HOST ?? "admin.localhost";
  const envAllowedHosts =
    env.VITE_DEV_ALLOWED_HOSTS?.split(",")
      .map((host: string) => host.trim())
      .filter(Boolean) ?? [];
  const allowedHosts = Array.from(
    new Set([
      appDomain,
      `.${appDomain}`,
      adminHost,
      "veltrixio.local",
      ".veltrixio.local",
      "admin.veltrixio.local",
      ".localhost",
      localAdminHost,
      "localhost",
      "127.0.0.1",
      ...envAllowedHosts
    ])
  );

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: webPort,
      allowedHosts,
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    }
  };
});
