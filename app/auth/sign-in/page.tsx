import { MagicLinkForm } from "@/components/auth/magic-link-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - BitBasis",
  description: "Sign in to your BitBasis account to track your Bitcoin portfolio.",
}

export default function SignInPage() {
  return <MagicLinkForm />
} 