
import api from "@/lib/api";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  className?: string;
  alt: string;
}

export function SafeImage({ src, className, alt, ...props }: SafeImageProps) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;

    // If it's a public URL (http/https) and NOT our API media endpoint, just use it
    if (!src.includes("/media/") && (src.startsWith("http") || src.startsWith("blob"))) {
        setObjectUrl(src);
        setLoading(false);
        return;
    }

    const fetchImage = async () => {
      try {
        setLoading(true);
        const response = await api.get(src, { responseType: "blob" });
        const url = URL.createObjectURL(response.data);
        setObjectUrl(url);
      } catch (err) {
        console.error("Failed to load image", src, err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchImage();

    return () => {
      if (objectUrl && objectUrl.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (loading) {
    return <Skeleton className={className} />;
  }

  if (error || !objectUrl) {
     // Fallback placeholder or broken image icon
    return <div className={`bg-muted flex items-center justify-center ${className} text-xs text-muted-foreground`}>Msg Err</div>;
  }

  return <img src={objectUrl} alt={alt} className={className} {...props} />;
}
