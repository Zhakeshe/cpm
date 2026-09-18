import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { jwtVerify } from "jose";
import { setIO, subscribeRealtime } from "./lib/realtime";
import { prisma } from "./lib/db";

const dev = process.env.NODE_ENV !== "production";
const port = Number(process.env.PORT || 3000);
const app = next({ dev });
const handle = app.getRequestHandler();

async function main() {
  await app.prepare();
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new SocketIOServer(server, {
    path: "/ws",
    cors: { origin: process.env.APP_URL || true, credentials: true },
  });
  setIO(io);
  subscribeRealtime();

  io.use(async (socket, nextMw) => {
    try {
      const cookie = socket.handshake.headers.cookie || "";
      const match = cookie.split(";").map((s) => s.trim()).find((s) => s.startsWith("crm_session="));
      const token = match?.split("=")[1];
      if (!token) return nextMw(new Error("auth"));
      const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);
      const { payload } = await jwtVerify(token, secret);
      socket.data.user = payload;
      nextMw();
    } catch {
      nextMw(new Error("auth"));
    }
  });

  io.on("connection", async (socket) => {
    const user = socket.data.user as { id: string; role: string };
    socket.join(`user:${user.id}`);
    socket.join(`role:${user.role}`);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });
    socket.on("presence", async () => {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });
    });
  });

  server.listen(port, () => {
    console.log(`crm listening on :${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
