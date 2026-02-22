"use client";

import { useState, useEffect } from "react";

interface EmployeeAvatarProps {
  profilePicture?: string | null;
  firstName?: string;
  lastName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EmployeeAvatar({
  profilePicture,
  firstName = "",
  lastName = "",
  size = "md",
  className = "",
}: EmployeeAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Reset error state when profilePicture changes
  useEffect(() => {
    setImageError(false);
  }, [profilePicture]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  // Construct the full URL for the profile picture
  // profilePicture is stored as /uploads/profile-pictures/filename.jpg
  // Backend serves static files from /uploads route
  const baseUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:3001')
    : 'http://localhost:3001';
  
  let profilePictureUrl: string | null = null;
  
  if (profilePicture && typeof profilePicture === 'string' && profilePicture.trim() !== '') {
    if (profilePicture.startsWith('http://') || profilePicture.startsWith('https://')) {
      profilePictureUrl = profilePicture;
    } else {
      // Ensure the path starts with /uploads
      const normalizedPath = profilePicture.startsWith('/') ? profilePicture : `/${profilePicture}`;
      profilePictureUrl = `${baseUrl}${normalizedPath}`;
    }
  }
  
  // Debug logging (can be removed in production)
  if (typeof window !== 'undefined' && profilePicture) {
    console.debug('EmployeeAvatar - profilePicture:', profilePicture, 'URL:', profilePictureUrl);
  }

  const initials = `${firstName?.[0] || ""}${lastName?.[0] || ""}`.trim() || "?";

  // Determine size classes - if className has width/height, use those, otherwise use size prop
  const hasCustomSize = className.includes('w-') || className.includes('h-');
  const sizeClass = hasCustomSize ? '' : sizeClasses[size];
  
  // Base classes for image
  const imageBaseClasses = "rounded-full object-cover border border-gray-200 flex-shrink-0";
  const imageClassName = `${sizeClass} ${imageBaseClasses} ${className}`.trim().replace(/\s+/g, ' ');
  
  // Base classes for fallback div
  const divBaseClasses = "rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0";
  const divClassName = `${sizeClass} ${divBaseClasses} ${className}`.trim().replace(/\s+/g, ' ');

  if (profilePictureUrl && !imageError) {
    return (
      <img
        src={profilePictureUrl}
        alt={`${firstName} ${lastName}`}
        className={imageClassName}
        onError={() => {
          console.error('Failed to load profile picture:', profilePictureUrl);
          setImageError(true);
        }}
        onLoad={() => {
          // Reset error state if image loads successfully after a previous error
          if (imageError) setImageError(false);
        }}
      />
    );
  }

  return (
    <div className={divClassName}>
      <span className={hasCustomSize ? "text-lg sm:text-xl" : ""}>
        {initials}
      </span>
    </div>
  );
}
