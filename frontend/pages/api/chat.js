export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const token = req.headers.authorization?.split(" ")[1]; // Extract Bearer Token

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { message } = req.body;
    const response = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch response from backend");
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error in chat API:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}