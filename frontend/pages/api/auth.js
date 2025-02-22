export default async function handler(req, res) {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }
  
    const token = req.headers.authorization?.split(" ")[1];
  
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${token}`
      );
      const data = await response.json();
  
      if (!data.email) {
        return res.status(401).json({ error: "Invalid token" });
      }
  
      res.status(200).json({ email: data.email, name: data.name });
    } catch (error) {
      console.error("Error in auth API:", error);
      res.status(500).json({ error: "Authentication Failed" });
    }
  }