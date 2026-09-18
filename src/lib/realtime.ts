import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;
const adminIds = new Set<string>();

export function setIO(server: SocketIOServer) {
  io = server;
}

export function registerAdmin(userId: string, isAdmin: boolean) {
  if (isAdmin) adminIds.add(userId);
  else adminIds.delete(userId);
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  io?.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown) {
  for (const id of adminIds) {
    io?.to(`user:${id}`).emit(event, payload);
  }
  io?.to("role:ADMIN").emit(event, payload);
}

export function getIO() {
  return io;
}
