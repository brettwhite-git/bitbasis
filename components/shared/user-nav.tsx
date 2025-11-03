"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, User, FolderOpen, HelpCircle } from "lucide-react"
import { useAuth } from "@/providers/supabase-auth-provider"
import { useDisplayName } from "@/lib/hooks/use-display-name"
import Link from "next/link"

function getInitials(name: string | undefined | null, email: string | undefined | null): string {
  // If display name exists, use it for initials
  if (name && name.trim()) {
    const nameParts = name.trim().split(' ')
    if (nameParts.length >= 2 && nameParts[0] && nameParts[1]) {
      return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }
  
  // Fallback to email-based initials
  if (!email) return ''
  
  const [localPart] = email.split('@')
  if (!localPart) return ''
  
  const initials = localPart
    .split('.')
    .map(part => part.charAt(0))
    .join('')
  
  return initials.toUpperCase()
}

export function UserNav() {
  const { user, signOut } = useAuth()
  const { displayName } = useDisplayName()
  
  if (!user?.email) return null

  const initials = getInitials(displayName, user.email)
  if (!initials) return null

  const displayText = displayName && displayName.trim() ? displayName : user.email

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-bitcoin-orange text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayText}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/settings">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/settings?section=files">
            <DropdownMenuItem>
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Manage Files</span>
            </DropdownMenuItem>
          </Link>
          <DropdownMenuItem asChild>
            <a
              href="https://github.com/brettwhite-git/bitbasis-public"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

