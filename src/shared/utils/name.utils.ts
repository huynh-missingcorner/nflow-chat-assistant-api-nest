export function generateUniqueNameWithTimestamp(baseName: string): string {
  const timestamp = Date.now();
  return `${baseName}_${timestamp}`;
}

export function generateUniqueNameWithRandom(baseName: string, randomLength = 6): string {
  const randomNumber = Math.floor(Math.random() * Math.pow(10, randomLength));
  const paddedNumber = randomNumber.toString().padStart(randomLength, '0');
  return `${baseName}_${paddedNumber}`;
}

export function sanitizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

export function generateUniqueObjectName(displayName: string, useTimestamp = true): string {
  const sanitizedName = sanitizeName(displayName);

  if (useTimestamp) {
    return generateUniqueNameWithTimestamp(sanitizedName);
  } else {
    return generateUniqueNameWithRandom(sanitizedName);
  }
}

export function generateUniqueFieldName(fieldName: string, useTimestamp = true): string {
  const sanitizedName = sanitizeName(fieldName);

  if (useTimestamp) {
    return generateUniqueNameWithTimestamp(sanitizedName);
  } else {
    return generateUniqueNameWithRandom(sanitizedName);
  }
}
