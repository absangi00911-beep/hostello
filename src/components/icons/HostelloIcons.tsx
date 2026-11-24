import type { ComponentType } from "react";
import type { JiggiconProps } from "jiggicons-react";
import * as Jiggicons from "jiggicons-react";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BellRing,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Compass,
  GraduationCap,
  ImagePlus,
  Minus,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  Utensils,
  Wifi,
  X,
  Zap,
  DollarSign,
  Droplets,
  BarChart3,
  Wallet,
  CalendarCheck,
  CreditCard,
  CalendarDays,
  MessageCircle,
  CheckCircle2,
  CircleDollarSign,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

export type HostelloIcon = ComponentType<
  LucideProps & {
    animate?: JiggiconProps["animate"];
    title?: string;
  }
>;

function adaptJiggicon(
  Icon: ComponentType<JiggiconProps>,
  defaultAnimate: JiggiconProps["animate"] = "click",
): HostelloIcon {
  const Adapter = (({
    animate,
    size,
    strokeWidth: _strokeWidth,
    title,
    onPlay: _onPlay,
    ...props
  }: LucideProps & {
    animate?: JiggiconProps["animate"];
    title?: string;
  }) => (
    <Icon
      {...props}
      animate={animate ?? defaultAnimate}
      size={typeof size === "number" ? size : size ? String(size) : 24}
      sound={false}
      title={title}
      variant="outline"
    />
  )) as unknown as HostelloIcon;
  Adapter.displayName = "HostelloJiggicon";
  return Adapter;
}

export const Bell = adaptJiggicon(Jiggicons.Bell);
export const Bed = adaptJiggicon(Jiggicons.Bed);
export const Book = adaptJiggicon(Jiggicons.Book);
export const Bookmark = adaptJiggicon(Jiggicons.Bookmark);
export const Building = adaptJiggicon(Jiggicons.Building);
export const Calendar = adaptJiggicon(Jiggicons.Calendar);
export const Camera = adaptJiggicon(Jiggicons.Camera);
export const Clock = adaptJiggicon(Jiggicons.Clock);
export const Download = adaptJiggicon(Jiggicons.Download);
export const Eye = adaptJiggicon(Jiggicons.Eye);
export const Heart = adaptJiggicon(Jiggicons.Heart);
export const Home = adaptJiggicon(Jiggicons.Home);
export const Lightbulb = adaptJiggicon(Jiggicons.Lightbulb);
export const Lock = adaptJiggicon(Jiggicons.Lock);
export const Mail = adaptJiggicon(Jiggicons.Mail);
export const MapPin = adaptJiggicon(Jiggicons.Map);
export const Map = adaptJiggicon(Jiggicons.Map);
export const Message = adaptJiggicon(Jiggicons.Message);
export const Money = adaptJiggicon(Jiggicons.Money);
export const Phone = adaptJiggicon(Jiggicons.Phone);
export const Receipt = adaptJiggicon(Jiggicons.Receipt);
export const Saved = adaptJiggicon(Jiggicons.Saved);
export const Send = adaptJiggicon(Jiggicons.Send);
export const Star = adaptJiggicon(Jiggicons.Star);
export const Upload = adaptJiggicon(Jiggicons.Upload);

export {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BellRing,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Compass,
  GraduationCap,
  ImagePlus,
  Minus,
  Plus,
  Search,
  Settings,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  Utensils,
  Wifi,
  X,
  Zap,
  DollarSign,
  Droplets,
  BarChart3,
  Wallet,
  CalendarCheck,
  CreditCard,
  CalendarDays,
  MessageCircle,
  CheckCircle2,
  CircleDollarSign,
  type LucideIcon,
};
