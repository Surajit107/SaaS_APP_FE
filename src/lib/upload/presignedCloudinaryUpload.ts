export interface PresignedCloudinarySignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  resourceType: string;
}

export interface CloudinaryDirectUploadResult {
  publicId: string;
  secureUrl: string;
  resourceType: string;
  format?: string;
  bytes?: number;
}

export type CloudinaryUploadProgressOptions = {
  onUploadProgress?: (percentLoaded: number) => void;
};

type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  error?: {
    message?: string;
  };
};

const isCloudinaryUploadResponse = (
  value: unknown,
): value is CloudinaryUploadResponse => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.public_id === 'string' &&
    typeof candidate.secure_url === 'string' &&
    typeof candidate.resource_type === 'string'
  );
};

function getCloudinaryFailureMessage(rawResponse: unknown): string {
  const responseRecord =
    typeof rawResponse === 'object' && rawResponse !== null
      ? (rawResponse as Record<string, unknown>)
      : null;
  const errorRecord =
    responseRecord !== null &&
    typeof responseRecord.error === 'object' &&
    responseRecord.error !== null
      ? (responseRecord.error as Record<string, unknown>)
      : null;
  const errorMessage =
    errorRecord !== null && typeof errorRecord.message === 'string'
      ? errorRecord.message.trim()
      : '';
  return errorMessage.length > 0 ? errorMessage : 'Cloudinary direct upload failed';
}

function parseSuccessfulUpload(rawResponse: unknown): CloudinaryDirectUploadResult {
  if (!isCloudinaryUploadResponse(rawResponse)) {
    throw new Error(getCloudinaryFailureMessage(rawResponse));
  }
  return {
    publicId: rawResponse.public_id,
    secureUrl: rawResponse.secure_url,
    resourceType: rawResponse.resource_type,
    format: rawResponse.format,
    bytes: rawResponse.bytes,
  };
}

function parseJsonResponse(responseText: string): unknown {
  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return undefined;
  }
}

export async function uploadToCloudinaryWithPresignedData(
  file: File,
  signature: PresignedCloudinarySignature,
  options?: CloudinaryUploadProgressOptions,
): Promise<CloudinaryDirectUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.apiKey);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('public_id', signature.publicId);

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signature.cloudName}/${signature.resourceType}/upload`;

  return await new Promise<CloudinaryDirectUploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', uploadUrl);

    xhr.upload.onprogress = (event: ProgressEvent): void => {
      if (!options?.onUploadProgress) {
        return;
      }
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(100, Math.round((event.loaded / event.total) * 100));
        options.onUploadProgress(pct);
      }
    };

    xhr.onload = (): void => {
      const rawResponse = parseJsonResponse(xhr.responseText);
      if (xhr.status < 200 || xhr.status >= 300 || rawResponse === undefined) {
        reject(new Error(getCloudinaryFailureMessage(rawResponse ?? {})));
        return;
      }
      try {
        options?.onUploadProgress?.(100);
        resolve(parseSuccessfulUpload(rawResponse));
      } catch (error: unknown) {
        reject(error instanceof Error ? error : new Error('Cloudinary direct upload failed'));
      }
    };

    xhr.onerror = (): void => {
      reject(new Error('Network error'));
    };

    xhr.send(formData);
  });
}
