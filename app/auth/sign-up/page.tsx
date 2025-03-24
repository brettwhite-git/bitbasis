import { SignUpForm } from "@/components/auth/sign-up-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up - BitBasis",
  description: "Create your BitBasis account to start tracking your Bitcoin portfolio.",
}

export default function SignUpPage() {
  return <SignUpForm />
} 