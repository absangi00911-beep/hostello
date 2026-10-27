export interface HostelDetailPhoto {
  src: string;
  alt: string;
}

export function getHostelGalleryPhotos(
  hostelName: string,
  coverImage: string | null,
  images: string[],
  rooms: readonly { name: string; images: string[] }[],
): HostelDetailPhoto[] {
  const photos: HostelDetailPhoto[] = [];
  const seen = new Set<string>();
  let listingPhotoNumber = 0;

  function addPhoto(src: string | null | undefined, alt: string) {
    const trimmedSrc = src?.trim();
    if (!trimmedSrc || seen.has(trimmedSrc)) return;

    seen.add(trimmedSrc);
    photos.push({ src: trimmedSrc, alt });
  }

  for (const image of [coverImage, ...images]) {
    const trimmedImage = image?.trim();
    if (!trimmedImage || seen.has(trimmedImage)) continue;

    listingPhotoNumber += 1;
    addPhoto(trimmedImage, `${hostelName} photo ${listingPhotoNumber}`);
  }

  for (const room of rooms) {
    for (const image of room.images) {
      addPhoto(image, `${room.name} room photo for ${hostelName}`);
    }
  }

  return photos;
}
