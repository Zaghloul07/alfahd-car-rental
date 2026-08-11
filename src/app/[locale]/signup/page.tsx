import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SignupForm from "./SignupForm";

export default function SignupPage() {
  return (
    <>
      <Navbar />
      <main className="flex flex-1 items-center justify-center bg-background px-4 py-16">
        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
