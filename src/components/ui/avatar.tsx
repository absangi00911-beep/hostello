"use client"

// Path: src/components/ui/avatar.tsx

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

/**
 * Circular avatar, Airbnb-style. Unsized by default (like shadcn's usual
 * pattern) — set h-/w- via className at each call site: h-8 w-8 for a
 * message-thread row, h-10 w-10 for the account menu trigger, h-20 w-20
 * for an owner's profile card.
 */
const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-full)]",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn("aspect-square h-full w-full object-cover", className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

/**
 * Shown while the image loads and whenever there isn't one — pass initials
 * (see getInitials in @/lib/utils) as children. Accent-tinted rather than
 * plain gray, so a photo-less avatar still reads as "this person," not as
 * a broken image — same treatment StudentBadge already uses successfully.
 */
const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-[var(--radius-full)] bg-[var(--color-primary-faint)] text-[color:var(--color-primary-deep)] text-[length:var(--text-caption)] font-[600] uppercase",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }