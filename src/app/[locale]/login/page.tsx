import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
