import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ChatBot from "../components/ChatBot";

export default function Chatbot() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/"); // Redirect to login page if no token
      return;
    }

    fetch("/api/auth", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to authenticate");
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => router.push("/"));
  }, []);

  return user ? <ChatBot /> : <p>Loading...</p>;
}