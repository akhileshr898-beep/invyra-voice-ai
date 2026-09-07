import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Invyra Voice AI – AI-Powered Medical Appointment Booking & Voice Personal Assistant",
  description: "Automated missed-call handling and customer follow-up assistant for clinics, cake shops, logistics, and small businesses with Deepgram voice, Gemini tool calling, and Google Calendar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
