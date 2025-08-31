import * as React from "react"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast as baseToast } from "@/hooks/use-toast"

// Toast migliorato con icone e animazioni
import { ToastAction } from '@/components/ui/toast';

interface EnhancedToastProps {
  title: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  // action will be rendered as a ToastAction element
  action?: {
    text: string;
    onClick: () => void;
  };
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2
};

const toastColors = {
  success: "border-green-200 bg-green-50 text-green-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  loading: "border-gray-200 bg-gray-50 text-gray-900"
};

const iconColors = {
  success: "text-green-600",
  error: "text-red-600",
  warning: "text-yellow-600",
  info: "text-blue-600",
  loading: "text-gray-600"
};

export function enhancedToast({
  title,
  description,
  type = 'info',
  duration = 4000,
  action
}: EnhancedToastProps) {
  const Icon = toastIcons[type];
  
  // baseToast expects a plain title string in its API, so keep title as string
  // and render the richer UI inside the description to avoid typing mismatch.
  const titleStr = title || '';
  const richDescription = (
    <div className="flex items-center gap-2">
      <Icon
        className={cn(
          "h-4 w-4",
          iconColors[type],
          type === 'loading' && "animate-spin"
        )}
      />
      <div>
        <div className="font-medium">{titleStr}</div>
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
    </div>
  );

  return baseToast({
    title: titleStr,
    description: richDescription,
    duration,
    action: action ? (
      <ToastAction altText={action.text} onClick={action.onClick}>{action.text}</ToastAction>
    ) : undefined,
    className: cn(
      "border-l-4 transition-all duration-300 ease-in-out",
      toastColors[type],
      "shadow-lg hover:shadow-xl"
    )
  });
}

// Hook personalizzato per toast migliorati
export function useEnhancedToast() {
  return {
    success: (title: string, description?: string, action?: EnhancedToastProps['action']) =>
      enhancedToast({ title, description, type: 'success', action }),
    
    error: (title: string, description?: string, action?: EnhancedToastProps['action']) =>
      enhancedToast({ title, description, type: 'error', duration: 6000, action }),
    
    warning: (title: string, description?: string, action?: EnhancedToastProps['action']) =>
      enhancedToast({ title, description, type: 'warning', duration: 5000, action }),
    
    info: (title: string, description?: string, action?: EnhancedToastProps['action']) =>
      enhancedToast({ title, description, type: 'info', action }),
    
    loading: (title: string, description?: string) =>
      enhancedToast({ title, description, type: 'loading', duration: 10000 }),
    
    custom: enhancedToast
  };
}