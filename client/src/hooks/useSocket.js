import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export function useSocket(events = {}) {
  const { user } = useAuth();

  const socketRef = useRef(null);
  const eventsRef = useRef(events);

  // Always keep latest events
  useEffect(() => {
    eventsRef.current = events;
  }, [events]);


  useEffect(() => {
    if (!user) return;


    const token = localStorage.getItem("accessToken");

    if (!token) return;


    // Prevent duplicate socket
    if (socketRef.current) {
      return;
    }


    const socket = io(SOCKET_URL, {

      auth: {
        token,
      },

      withCredentials: true,

      transports: [
        "polling",
        "websocket"
      ],

      reconnection: true,

      reconnectionAttempts: Infinity,

      reconnectionDelay: 1000,

      timeout: 20000,
    });


    socketRef.current = socket;


    socket.on("connect", () => {
      console.log(
        "✅ Socket Connected:",
        socket.id
      );
    });


    socket.on("disconnect", (reason) => {
      console.log(
        "❌ Socket Disconnected:",
        reason
      );
    });


    socket.on("connect_error", (error) => {
      console.log(
        "🚨 Socket Error:",
        error.message
      );
    });


    return () => {

      socket.removeAllListeners();

      socket.disconnect();

      socketRef.current = null;

    };


  }, [user]);


  // Register events separately
  useEffect(() => {

    const socket = socketRef.current;

    if (!socket) return;


    Object.entries(eventsRef.current).forEach(
      ([event, handler]) => {

        if(typeof handler === "function"){

          socket.on(
            event,
            handler
          );

        }

      }
    );


    return () => {

      Object.entries(eventsRef.current).forEach(
        ([event, handler]) => {

          if(typeof handler === "function"){

            socket.off(
              event,
              handler
            );

          }

        }
      );

    };


  }, [events]);

}