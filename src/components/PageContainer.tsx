import { cn } from "@/lib/utils";

export type PageContainerSize = "content" | "form" | "wide" | "chat";

const sizeClasses: Record<PageContainerSize, string> = {
  content: "w-full max-w-6xl mx-auto px-4 sm:px-6",
  form: "w-full max-w-xl sm:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6",
  wide: "w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  chat: "w-full max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 sm:px-6",
};

interface PageContainerProps {
  children: React.ReactNode;
  size?: PageContainerSize;
  className?: string;
  as?: "div" | "main" | "section";
}

export function PageContainer({
  children,
  size = "content",
  className,
  as: Tag = "div",
}: PageContainerProps) {
  return <Tag className={cn(sizeClasses[size], className)}>{children}</Tag>;
}
