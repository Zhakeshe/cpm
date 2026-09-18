import type { Server as SocketIOServer } from "socket.io";
import Redis from "ioredis";

const CHANNEL = "crm:realtime";

type Target = { kind: "user"; id: string } | { kind: "admins" };
type Envelope = { target: Target; event: string; payload: unknown };

let io: SocketIOServer | null = null;
let publisher: Redis | null = null;
let subscriber: Redis | null = null;

export function setIO(server: SocketIOServer) {
  io = server;
}

function getPublisher(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!publisher) {
    publisher = new Redis(url, { maxRetriesPerRequest: null });
    publisher.on("error", (err) => console.error("realtime_publisher_error", err.message));
  }
  return publisher;
}

/**
 * Webhooks are processed in the worker process while browsers are connected to
 * the web process, so events travel over Redis and are fanned out by whichever
 * process owns the sockets. Without Redis we fall back to local delivery.
 */
function dispatch(envelope: Envelope) {
  const pub = getPublisher();
  if (pub) {
    pub.publish(CHANNEL, JSON.stringify(envelope)).catch((err) => {
      console.error("realtime_publish_failed", (err as Error).message);
      deliver(envelope);
    });
    return;
  }
  deliver(envelope);
}

function deliver(envelope: Envelope) {
  if (!io) return;
  if (envelope.target.kind === "user") {
    io.to(`user:${envelope.target.id}`).emit(envelope.event, envelope.payload);
    return;
  }
  io.to("role:ADMIN").emit(envelope.event, envelope.payload);
  io.to("role:SUPERVISOR").emit(envelope.event, envelope.payload);
}

export function subscribeRealtime() {
  const url = process.env.REDIS_URL;
  if (!url || subscriber) return;
  subscriber = new Redis(url, { maxRetriesPerRequest: null });
  subscriber.on("error", (err) => console.error("realtime_subscriber_error", err.message));
  subscriber.subscribe(CHANNEL).catch((err) => console.error("realtime_subscribe_failed", err.message));
  subscriber.on("message", (_channel, raw) => {
    try {
      deliver(JSON.parse(raw) as Envelope);
    } catch (err) {
      console.error("realtime_bad_envelope", (err as Error).message);
    }
  });
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  dispatch({ target: { kind: "user", id: userId }, event, payload });
}

export function emitToAdmins(event: string, payload: unknown) {
  dispatch({ target: { kind: "admins" }, event, payload });
}

export function getIO() {
  return io;
}
