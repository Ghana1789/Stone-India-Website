import crypto from 'crypto';

const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Decode a Base32 string to Buffer
function base32Decode(base32) {
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = base32chars.indexOf(clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  const buffer = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    buffer.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(buffer);
}

// Generate a random Base32 secret for TOTP setup
export function generateSecret(length = 20) {
  const bytes = crypto.randomBytes(length);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += base32chars[bytes[i] % 32];
  }
  return secret;
}

// Generate HOTP (RFC 4226)
function generateHOTP(secretBuffer, counter) {
  const buf = Buffer.alloc(8);
  const high = Math.floor(counter / 0x100000000);
  const low = counter % 0x100000000;
  buf.writeUInt32BE(high, 0);
  buf.writeUInt32BE(low, 4);

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buf);
  const hmacResult = hmac.digest();

  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const binCode = ((hmacResult[offset] & 0x7f) << 24) |
                  ((hmacResult[offset + 1] & 0xff) << 16) |
                  ((hmacResult[offset + 2] & 0xff) << 8) |
                  (hmacResult[offset + 3] & 0xff);

  const otp = binCode % 1000000;
  return otp.toString().padStart(6, '0');
}

// Verify TOTP (RFC 6238)
export function verifyTOTP(secret, code, window = 1) {
  try {
    if (!secret || !code) return false;
    const secretBuffer = base32Decode(secret);
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / 30);

    for (let i = -window; i <= window; i++) {
      if (generateHOTP(secretBuffer, counter + i) === code) {
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('TOTP verification error:', err);
    return false;
  }
}

// Generate 8 backup recovery codes (each 8-character hex string)
export function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    codes.push(crypto.randomBytes(4).toString('hex')); // 8 chars
  }
  return codes;
}

// AES-256-GCM Encryption Key derived from JWT_SECRET
const getEncryptionKey = () => {
  const secret = process.env.JWT_SECRET || 'stone_india_default_secret_key_backup_32_bytes_long';
  return crypto.scryptSync(secret, 'salt-totp-storage', 32);
};

// Encrypt the TOTP secret before saving to DB
export function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(secret, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

// Decrypt the TOTP secret retrieved from DB
export function decryptSecret(encryptedSecret) {
  try {
    if (!encryptedSecret || !encryptedSecret.includes(':')) return '';
    const [ivHex, encrypted, authTagHex] = encryptedSecret.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt TOTP secret:', err);
    return '';
  }
}
