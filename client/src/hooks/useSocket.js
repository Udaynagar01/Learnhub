import { useEffect } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useSocket(onEvent) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !onEvent) return;

    const token = localStorage.getItem("accessToken");

    const socket = io(SOCKET_URL, {
      auth: {
        token,
      },

      withCredentials: true,

      // Render compatible
      transports: ["polling", "websocket"],

      // Auto reconnect
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on("connect", () => {
      console.log("✅ Socket Connected:", socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Socket Disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("🚨 Socket Connection Error:", err.message);
    });

    Object.entries(onEvent).forEach(([event, handler]) => {
      if (typeof handler === "function") {
        socket.on(event, handler);
      }
    });

    return () => {
      Object.entries(onEvent).forEach(([event, handler]) => {
        if (typeof handler === "function") {
          socket.off(event, handler);
        }
      });

      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [user, onEvent]);
}