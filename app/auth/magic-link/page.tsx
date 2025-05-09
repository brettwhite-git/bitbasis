import { MagicLinkForm } from "@/components/auth/magic-link-form"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In with Magic Link - BitBasis",
  description: "Sign in to BitBasis with a secure passwordless link sent to your email.",
}

export default function MagicLinkPage() {
  return <MagicLinkForm />
} 