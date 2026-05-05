'use client';

import { FormEvent, useState, useRef } from 'react';
import { Upload, Trash2, Star, ArrowBack, ArrowForward } from 'lucide-react';

interface UploadedPhoto {
  id: string;
  src: string;
  name: string;
  isCover?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
}

interface AddListingPhotosResponsiveProps {
  currentStep?: number;
  totalSteps?: number;
  initialPhotos?: UploadedPhoto[];
  onBack?: () => void;
  onNext?: (photos: UploadedPhoto[]) => void;
  onExit?: () => void;
}

export function AddListingPhotosResponsive({
  currentStep = 4,
  totalSteps = 5,
  initialPhotos = [
    {
      id: '1',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCSKGDQFb5DHAHwggRpyK1p5CHuUC4ApU2f3AW0GIhLI9DKkLslpPsPrHVKBCUE0qQ8S1I0WQ8T6UbROYpL2Vnjv-3TKF8Y1XYUoNh3WGqfL1vSFGIIv1WuGmgy5I73MsempYbM41kVUADlgw3e5uwgkw19lp4l2HWM5lxU1WJFqm3YTtv7Q8BYwf2Tv8BIGWo8Hc3S09Fi2yuGazSUuQmaVqL_ypLymu6OaBUghoMDmjGhvv5aPRIXEX6x6DOrKttLU-yfQpM4UtLh',
      name: 'Common Room',
      isCover: true,
    },
    {
      id: '2',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAONXknyqNIcOnZRrn9wGdLwOLKkBUYtG5GdAPqCIfA35lF26-cBrE4hHNBoUcA5ReJgl2jFbt-cQI7aU1wxLhklYGnGgb6S-v2mJELlH-zY55BCHW4QjqRvGTOsvciJupFBdpOHRIFKXIKqbUxoZvTieUyu_oCuHaJ4Ci2sExrPSEFYCiVQFkeA96YlONLE4v9d19u5eitezNyH0LmF_1pOTlSvRxkB2ZoRuad8aBs9s_X2bFwA_MOBAvcjfQ1YGeHZZJNVxsDOt6D',
      name: 'Dorm Room',
      isCover: false,
    },
    {
      id: '3',
      src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAa-zmWDNMOwOamfV_CSQg0bqmE1i8x96-4GWduEa2pHtPElLLPJ_PKR1ESE46TFDL3flbqSWuGP9v2f7ONltmP_mD4ZFWJDeGGAFwTdTtUzLf0iGJAYV-b0mGj_sodf0A1tAi-kO_NwkHqrurdA-la5Wp4okuwPaRxmPUIXJvgTXGUiuj6OI7MUu55W0Z7mq8i3PFzhne10xePHN2pEyzUbr_Thw456zhzXXog4Voc4L-W-x3aST-AiJb8sIYmd3FVFW1yG30-pooX',
      name: 'Exterior',
      isCover: false,
    },
  ],
  onBack,
  onNext,
  onExit,
}: AddListingPhotosResponsiveProps) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(initialPhotos);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: UploadedPhoto = {
            id: Date.now().toString() + index,
            src: e.target?.result as string,
            name: file.name,
            isCover: photos.length === 0, // First photo is cover
            isUploading: true,
            uploadProgress: 0,
          };

          setPhotos((prev) => [...prev, newPhoto]);

          // Simulate upload progress
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              setPhotos((prev) =>
                prev.map((p) =>
                  p.id === newPhoto.id ? { ...p, isUploading: false, uploadProgress: 100 } : p
                )
              );
            } else {
              setPhotos((prev) =>
                prev.map((p) => (p.id === newPhoto.id ? { ...p, uploadProgress: Math.min(progress, 99) } : p))
              );
            }
          }, 500);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleDeletePhoto = (id: string) => {
    const newPhotos = photos.filter((p) => p.id !== id);
    // If deleted photo was cover, make first remaining photo the cover
    if (photos.find((p) => p.id === id)?.isCover && newPhotos.length > 0) {
      newPhotos[0].isCover = true;
    }
    setPhotos(newPhotos);
  };

  const handleSetCover = (id: string) => {
    setPhotos(photos.map((p) => ({ ...p, isCover: p.id === id })));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const uploadedPhotos = photos.filter((p) => !p.isUploading);
    if (uploadedPhotos.length < 5) {
      alert('Please upload at least 5 photos');
      return;
    }

    setLoading(true);
    try {
      if (onNext) {
        await onNext(uploadedPhotos);
      }
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="bg-bg-page text-text-body font-body-default antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="bg-bg-card border-b border-stone-200 shadow-sm shadow-amber-900/5 h-16 flex justify-between items-center px-space-6 w-full z-40">
        <div className="flex items-center gap-space-4">
          <a className="text-xl font-bold tracking-tight text-stone-900 font-h3 text-sm font-medium" href="#">
            HostelLo
          </a>
          <span className="text-stone-300 mx-space-2 font-light">|</span>
          <span className="font-label text-label text-text-muted">Add New Hostel</span>
        </div>
        <button
          onClick={onExit}
          className="text-stone-600 hover:bg-amber-50 transition-colors scale-95 active:opacity-80 transition-transform duration-150 p-space-2 rounded-DEFAULT flex items-center gap-space-2 font-label text-label"
        >
          Save & Exit
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-space-4 md:px-space-8 py-space-8 md:py-space-12 flex flex-col items-center">
        {/* Progress Indicator */}
        <div className="w-full max-w-3xl mb-space-8">
          <div className="flex justify-between items-center mb-space-2">
            <span className="font-label text-label text-text-muted uppercase tracking-wider">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="font-label text-label text-primary-dark font-semibold">Photos</span>
          </div>
          <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden flex">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 ${i < currentStep ? 'bg-success' : i === currentStep - 1 ? 'bg-primary-container' : 'bg-transparent'} ${i < totalSteps - 1 ? 'border-r border-surface-container-lowest' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-3xl bg-bg-card rounded-xl shadow-[0_2px_8px_rgba(194,139,26,0.06)] border border-border-default overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="p-space-6 md:p-space-8 border-b border-border-default">
              <h1 className="font-h2 text-h2 text-text-heading mb-space-2">Hostel Photos</h1>
              <p className="text-text-muted font-body-default">
                High-quality photos increase bookings. Upload at least 5 photos showing the exterior, common areas,
                and rooms.
              </p>
            </div>

            {/* Content */}
            <div className="p-space-6 md:p-space-8 space-y-space-8">
              {/* Upload Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-space-8 text-center cursor-pointer flex flex-col items-center justify-center min-h-[240px] transition-colors ${
                  dragActive
                    ? 'border-primary-container bg-primary-faint'
                    : 'border-primary-light bg-primary-faint hover:bg-[#FDF6E3]'
                }`}
              >
                <div className="w-16 h-16 rounded-full bg-primary-light/30 flex items-center justify-center mb-space-4 group-hover:scale-105 transition-transform">
                  <Upload className="w-8 h-8 text-primary-deep" />
                </div>
                <h3 className="font-h3 text-h3 text-primary-deep mb-space-2">Click or drag to upload hostel photos</h3>
                <p className="text-text-muted font-label text-label">JPG, PNG or WEBP. Max size 10MB per image.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {/* Uploaded Images Grid */}
              {photos.length > 0 && (
                <div>
                  <h4 className="font-label text-label text-text-heading mb-space-4 font-semibold uppercase tracking-wider">
                    Uploaded Photos ({photos.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-space-4">
                    {photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group rounded-lg overflow-hidden aspect-[4/3] bg-surface-container border border-border-default shadow-sm"
                      >
                        {/* Image or Skeleton */}
                        {photo.isUploading ? (
                          <div className="w-full h-full bg-gradient-to-r from-primary-light via-primary-faint to-primary-light bg-[length:200%_100%] animate-pulse flex flex-col items-center justify-center">
                            <Upload className="w-8 h-8 text-primary-light mb-space-2" />
                            <span className="font-overline text-overline text-primary-deep/60">
                              Uploading... {photo.uploadProgress || 0}%
                            </span>
                            {/* Progress Bar */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-surface-container-high">
                              <div
                                className="h-full bg-primary-container transition-all duration-300"
                                style={{ width: `${photo.uploadProgress || 0}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <>
                            <img
                              src={photo.src}
                              alt={photo.name}
                              className="w-full h-full object-cover"
                            />

                            {/* Cover Badge */}
                            {photo.isCover && (
                              <div className="absolute top-space-2 left-space-2 bg-primary text-on-primary font-overline text-overline px-space-2 py-space-1 rounded-DEFAULT shadow-sm flex items-center gap-space-1">
                                <Star className="w-3.5 h-3.5" />
                                Cover Image
                              </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-space-2 backdrop-blur-[2px]">
                              {!photo.isCover && (
                                <button
                                  type="button"
                                  onClick={() => handleSetCover(photo.id)}
                                  title="Set as Cover"
                                  className="w-10 h-10 rounded-full bg-surface-container-lowest text-text-heading flex items-center justify-center hover:scale-105 transition-transform shadow-md"
                                >
                                  <Star className="w-5 h-5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo.id)}
                                title="Remove"
                                className="w-10 h-10 rounded-full bg-surface-container-lowest text-error flex items-center justify-center hover:scale-105 transition-transform shadow-md"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-space-6 md:p-space-8 border-t border-border-default bg-bg-raised flex justify-between items-center">
              <button
                type="button"
                onClick={onBack}
                className="px-space-6 py-space-3 rounded-DEFAULT border border-border-default text-text-heading font-label text-label hover:bg-surface-container-lowest transition-colors flex items-center gap-space-2 focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2"
              >
                <ArrowBack className="w-4.5 h-4.5" />
                Back
              </button>
              <button
                type="submit"
                disabled={loading || photos.some((p) => p.isUploading)}
                className="px-space-8 py-space-3 rounded-DEFAULT bg-action text-on-primary font-label text-label hover:bg-action-pressed transition-colors flex items-center gap-space-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-light focus:ring-offset-2 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next Step
                <ArrowForward className="w-4.5 h-4.5" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
