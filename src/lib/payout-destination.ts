import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export interface PayoutDestinationSnapshot {
  bankAccountTitle: string;
  bankAccountNumber: string;
  bankName: string;
}

const ENCRYPTION_KEY_ENV = "PAYOUT_DESTINATION_ENCRYPTION_KEY";
const PAYLOAD_VERSION = "v1";
const AUTHENTICATED_DATA = Buffer.from("hostello:payout-destination:v1", "utf8");

function getEncryptionKey(): Buffer {
  const encodedKey = process.env[ENCRYPTION_KEY_ENV]?.trim();
  if (!encodedKey) {
    throw new Error(`${ENCRYPTION_KEY_ENV} is not configured.`);
  }

  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32 || key.toString("base64") !== encodedKey) {
    throw new Error(`${ENCRYPTION_KEY_ENV} must be a canonical base64-encoded 32-byte key.`);
  }

  return key;
}

function isPayoutDestinationSnapshot(value: unknown): value is PayoutDestinationSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as Record<string, unknown>;
  return typeof snapshot.bankAccountTitle === "string" &&
    typeof snapshot.bankAccountNumber === "string" &&
    typeof snapshot.bankName === "string";
}

/** Encrypt payout destination details with AES-256-GCM before database storage. */
export function encryptPayoutDestinationSnapshot(snapshot: PayoutDestinationSnapshot): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(AUTHENTICATED_DATA);

  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(snapshot), "utf8"),
    cipher.final(),
  ]);

  return [
    PAYLOAD_VERSION,
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

/** Decrypt a stored payout destination snapshot. Never log the snapshot or key. */
export function decryptPayoutDestinationSnapshot(envelope: string): PayoutDestinationSnapshot {
  const [version, encodedIv, encodedTag, encodedCiphertext, extra] = envelope.split(".");
  if (version !== PAYLOAD_VERSION || !encodedIv || !encodedTag || !encodedCiphertext || extra) {
    throw new Error("Stored payout destination snapshot has an unsupported format.");
  }

  const iv = Buffer.from(encodedIv, "base64url");
  const authTag = Buffer.from(encodedTag, "base64url");
  const ciphertext = Buffer.from(encodedCiphertext, "base64url");
  if (iv.length !== 12 || authTag.length !== 16 || ciphertext.length === 0) {
    throw new Error("Stored payout destination snapshot is malformed.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAAD(AUTHENTICATED_DATA);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  const snapshot: unknown = JSON.parse(plaintext);
  if (!isPayoutDestinationSnapshot(snapshot)) {
    throw new Error("Stored payout destination snapshot is malformed.");
  }

  return snapshot;
}
