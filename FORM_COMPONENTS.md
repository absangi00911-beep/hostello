# Form Component Library

Complete form component library built on the HostelLo design system. All components are accessible, composable, and integrate seamlessly with React Hook Form.

## Quick Start

Import components from `@/components/ui`:

```tsx
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormGroup,
  FormGrid,
  FormSection,
  FormError,
  FormSuccess,
} from "@/components/ui";
```

## Components

### FormInput

Reusable input field with built-in label, error handling, and icon support.

**Props:**
- `label?: string` - Field label
- `error?: string` - Error message (red styling)
- `helperText?: string` - Helper text below field
- `required?: boolean` - Shows red asterisk
- `icon?: React.ReactNode` - Icon to display left of input
- `disabled?: boolean` - Disabled state
- All standard HTML input attributes

**Basic Example:**
```tsx
<FormInput
  type="email"
  label="Email"
  placeholder="you@example.com"
  required
/>
```

**With Error:**
```tsx
<FormInput
  type="text"
  label="Username"
  error="Username is already taken"
  required
/>
```

**With Icon:**
```tsx
import { Mail } from "lucide-react";

<FormInput
  type="email"
  label="Email"
  icon={<Mail className="w-4 h-4" />}
  placeholder="you@example.com"
/>
```

**With React Hook Form:**
```tsx
import { useForm } from "react-hook-form";
import { FormInput } from "@/components/ui";

const { register, formState: { errors } } = useForm();

<FormInput
  {...register("email")}
  type="email"
  label="Email"
  error={errors.email?.message}
  required
/>
```

### FormTextarea

Reusable textarea field with character limit support.

**Props:**
- `label?: string` - Field label
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `required?: boolean` - Shows red asterisk
- `charLimit?: number` - Character limit (shows counter)
- `disabled?: boolean` - Disabled state
- All standard HTML textarea attributes

**Basic Example:**
```tsx
<FormTextarea
  label="Message"
  placeholder="Write your message..."
  rows={5}
/>
```

**With Character Limit:**
```tsx
<FormTextarea
  label="Review"
  placeholder="Share your experience..."
  charLimit={500}
  required
/>
```

**With React Hook Form:**
```tsx
<FormTextarea
  {...register("message")}
  label="Message"
  error={errors.message?.message}
  charLimit={1000}
  required
/>
```

### FormSelect

Reusable select field with dropdown styling.

**Props:**
- `label?: string` - Field label
- `error?: string` - Error message
- `helperText?: string` - Helper text
- `required?: boolean` - Shows red asterisk
- `options?: Array<{ value: string; label: string }>` - Options array
- `placeholder?: string` - Placeholder text
- `disabled?: boolean` - Disabled state
- All standard HTML select attributes

**Basic Example:**
```tsx
<FormSelect
  label="City"
  placeholder="Select a city"
  options={[
    { value: "karachi", label: "Karachi" },
    { value: "lahore", label: "Lahore" },
    { value: "islamabad", label: "Islamabad" },
  ]}
  required
/>
```

**With Children:**
```tsx
<FormSelect
  label="Gender"
  placeholder="Select gender"
>
  <option value="male">Male</option>
  <option value="female">Female</option>
  <option value="mixed">Mixed</option>
</FormSelect>
```

**With React Hook Form:**
```tsx
<FormSelect
  {...register("city")}
  label="City"
  placeholder="Select a city"
  options={cities}
  error={errors.city?.message}
  required
/>
```

### FormGroup

Wrapper for form fields (automatically full width).

```tsx
<FormGroup>
  <FormInput label="First Name" />
</FormGroup>

// Or with custom spacing
<FormGroup className="space-y-3">
  <FormInput label="Email" />
  <FormInput label="Password" type="password" />
</FormGroup>
```

### FormGrid

Responsive grid layout for multiple form fields.

**Props:**
- `columns?: 1 | 2 | 3 | 4` - Number of columns (responsive)
- `gap?: "sm" | "md" | "lg"` - Spacing between fields
- `children` - Form fields

**Example:**
```tsx
<FormGrid columns={2} gap="md">
  <FormInput label="First Name" />
  <FormInput label="Last Name" />
  <FormInput label="Email" type="email" colSpan={2} />
</FormGrid>
```

**Responsive Columns:**
```tsx
// 1 column on mobile, 2 on tablet, 3 on desktop
<FormGrid columns={3} gap="md">
  <FormInput label="Field 1" />
  <FormInput label="Field 2" />
  <FormInput label="Field 3" />
</FormGrid>
```

### FormSection

Section container with optional title and description.

**Props:**
- `title?: string` - Section heading
- `description?: string` - Section description
- `children` - Form fields

**Example:**
```tsx
<FormSection
  title="Personal Information"
  description="Please provide your basic details"
>
  <FormGrid columns={2} gap="md">
    <FormInput label="First Name" required />
    <FormInput label="Last Name" required />
  </FormGrid>
  <FormInput label="Email" type="email" required />
</FormSection>
```

### FormError / FormSuccess

Alert components for form-level messages.

**Example:**
```tsx
import { FormError, FormSuccess } from "@/components/ui";

<FormError message="Something went wrong. Please try again." />
<FormSuccess message="Profile updated successfully!" />
```

## Complete Example: Contact Form

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  FormInput,
  FormTextarea,
  FormSelect,
  FormGrid,
  FormSection,
  FormError,
  FormSuccess,
} from "@/components/ui";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  subject: z.enum(["support", "feedback", "partnership"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type FormData = z.infer<typeof schema>;

export function ContactForm() {
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const { register, formState: { errors, isSubmitting }, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      // API call
      setSubmitStatus("success");
    } catch {
      setSubmitStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <FormSection
        title="Contact Us"
        description="We'd love to hear from you"
      >
        <FormGrid columns={2} gap="md">
          <FormInput
            {...register("name")}
            label="Full Name"
            placeholder="John Doe"
            error={errors.name?.message}
            required
          />
          <FormInput
            {...register("email")}
            type="email"
            label="Email"
            placeholder="you@example.com"
            error={errors.email?.message}
            required
          />
        </FormGrid>

        <FormSelect
          {...register("subject")}
          label="Subject"
          placeholder="Select a subject"
          options={[
            { value: "support", label: "Support" },
            { value: "feedback", label: "Feedback" },
            { value: "partnership", label: "Partnership" },
          ]}
          error={errors.subject?.message}
          required
        />

        <FormTextarea
          {...register("message")}
          label="Message"
          placeholder="Your message..."
          charLimit={1000}
          error={errors.message?.message}
          required
        />
      </FormSection>

      {submitStatus === "error" && (
        <FormError message="Failed to send message. Please try again." />
      )}
      {submitStatus === "success" && (
        <FormSuccess message="Message sent successfully!" />
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-11 bg-[var(--color-brand-500)] text-white rounded-lg font-semibold hover:bg-[var(--color-brand-600)] transition-colors"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
```

## Design System Integration

All components automatically use the HostelLo design system:

- **Colors:** CSS custom properties (`--color-brand-500`, `--color-ink`, etc.)
- **Typography:** Figtree font family (body), proper sizing and weights
- **Spacing:** 8px base scale for consistent spacing
- **Focus States:** Ring focus indicators with 2px width
- **Disabled States:** Reduced opacity with not-allowed cursor
- **Error States:** Red 500 color (#EF4444)
- **Accessibility:** Proper labels, ARIA attributes, semantic HTML

## Styling Integration

### With Tailwind Classes

All components accept `className` prop for custom styling:

```tsx
<FormInput
  label="Username"
  className="mt-4 mb-2"
/>
```

### Responsive Design

Components are fully responsive by default:

```tsx
// FormGrid automatically adjusts columns based on screen size
<FormGrid columns={3} gap="md">
  {/* 1 col mobile, 2 col tablet, 3 col desktop */}
</FormGrid>
```

## Accessibility Features

✅ Proper label associations with `<label>` elements  
✅ Error messages with semantic role  
✅ Focus indicators with 2px ring  
✅ Disabled state styling and cursor  
✅ ARIA labels for icons and helper text  
✅ Semantic HTML structure  
✅ Keyboard navigation support  
✅ Screen reader friendly

## Migration Guide

### Old Pattern (Direct Input)
```tsx
import { FORM_INPUT } from "@/lib/form-constants";

<input
  className={FORM_INPUT}
  placeholder="Email"
  type="email"
/>
```

### New Pattern (Using FormInput Component)
```tsx
import { FormInput } from "@/components/ui";

<FormInput
  type="email"
  label="Email"
  placeholder="Email"
  required
/>
```

**Benefits:**
- Built-in label support
- Automatic error handling
- Icon support
- Consistent spacing
- Better accessibility
- Less boilerplate code
