// Form Components
export { FormInput } from "./form-input";
export type { FormInputProps } from "./form-input";

export { FormTextarea } from "./form-textarea";
export type { FormTextareaProps } from "./form-textarea";

export { FormSelect } from "./form-select";
export type { FormSelectProps } from "./form-select";

export { FormGroup, FormGrid, FormSection } from "./form-group";
export type {
  FormGroupProps,
  FormGridProps,
  FormSectionProps,
} from "./form-group";

export { FormError, FormSuccess } from "./form-error";
export type { FormErrorProps, FormSuccessProps } from "./form-error";

// Layout Components
export { PageSection } from "./page-section";
export type { PageSectionProps } from "./page-section";

// Loading Components
export { Skeleton, SkeletonText, SkeletonCard, SkeletonImage, SkeletonGrid } from "./skeleton";
export type { } from "./skeleton";

export {
  Spinner,
  SpinnerAlt,
  LoadingOverlay,
  LoadingPage,
  LoadingSection,
  LoadingPulse,
  LoadingState,
  LoadingButton,
  LoadingDots,
} from "./loading";
export type { } from "./loading";

// Re-export design system constants
export { FORM_INPUT, FORM_TEXTAREA, FORM_SELECT } from "@/lib/form-constants";
