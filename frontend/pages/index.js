import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.body.appendChild(script);

    window.handleCredentialResponse = (response) => {
      localStorage.setItem("token", response.credential);
      router.push("/chatbot"); // Redirect to chatbot page
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f8ff]">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Login to Chatbot</h1>
        <p className="text-gray-600 mb-6">Sign in with Google to continue</p>
        <div
          id="g_id_onload"
          data-client_id="860274569373-66po3v4vviid9fq5gef5dlfkk6kpjkmf.apps.googleusercontent.com"
          data-callback="handleCredentialResponse"
        ></div>
        <div
          className="g_id_signin"
          data-type="standard"
          data-size="large"
          data-theme="filled_blue"
          data-text="sign_in_with"
          data-shape="rectangular"
          data-logo_alignment="left"
        ></div>
      </div>
    </div>
  );
}