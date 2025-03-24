import { SignInForm } from "@/components/auth/sign-in-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - BitBasis",
  description: "Sign in to your BitBasis account to track your Bitcoin portfolio.",
}

export default function SignInPage() {
  return <SignInForm />
} 