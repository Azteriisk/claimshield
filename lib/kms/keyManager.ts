import crypto from "crypto";

export interface IKeyManager {
  readonly provider: "LOCAL_HSM" | "AWS_KMS" | "GCP_KMS";
  readonly keyId: string;
  computeDeterministicBlindIndex(normalizedPii: string): Promise<string>;
  signAuditToken(payload: object): Promise<string>;
  verifyAuditToken(token: string): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }>;
}

export interface LocalHsmConfig {
  keyId?: string;
  hardwareMasterSeedHex?: string;
  hardwareSaltHex?: string;
}

export interface CloudKmsConfig {
  provider: "AWS_KMS" | "GCP_KMS";
  keyId: string;
  region?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    clientEmail?: string;
    privateKey?: string;
  };
  mockEnclaveSecret?: string;
}

/**
 * Local Hardware Security Module (HSM) Adapter
 * Simulates a tamper-resistant hardware enclave utilizing HKDF SHA-256 (RFC 5869).
 * Enforces cryptographic isolation: subkeys for blind indexing and audit signing
 * are derived with independent info labels and cannot be swapped.
 */
export class LocalHsmAdapter implements IKeyManager {
  public readonly provider = "LOCAL_HSM" as const;
  public readonly keyId: string;
  private readonly masterSecret: Buffer;
  private readonly hardwareSalt: Buffer;
  private readonly blindIndexSubkey: Buffer;
  private readonly auditSigningSubkey: Buffer;

  constructor(config?: LocalHsmConfig) {
    this.keyId = config?.keyId || "hsm-slot-0-claimshield-root";

    // 256-bit simulated secure enclave master secret
    if (config?.hardwareMasterSeedHex) {
      this.masterSecret = Buffer.from(config.hardwareMasterSeedHex, "hex");
    } else {
      this.masterSecret = crypto.createHash("sha256").update("claimshield_secure_enclave_master_root_2026").digest();
    }

    // Hardware salt burned into simulated silicon
    if (config?.hardwareSaltHex) {
      this.hardwareSalt = Buffer.from(config.hardwareSaltHex, "hex");
    } else {
      this.hardwareSalt = crypto.createHash("sha256").update("claimshield_hardware_silicon_salt_isolated").digest();
    }

    // Cryptographic isolation via HKDF-Expand with distinct domain info tags
    this.blindIndexSubkey = Buffer.from(
      crypto.hkdfSync(
        "sha256",
        this.masterSecret,
        this.hardwareSalt,
        Buffer.from("claimshield-local-hsm-blind-index-isolation-v1"),
        32
      )
    );

    this.auditSigningSubkey = Buffer.from(
      crypto.hkdfSync(
        "sha256",
        this.masterSecret,
        this.hardwareSalt,
        Buffer.from("claimshield-local-hsm-audit-token-isolation-v1"),
        32
      )
    );
  }

  /**
   * Computes a deterministic blind index hash over normalized PII.
   * Produces a 64-character SHA-256 HMAC utilizing the dedicated blind index subkey.
   */
  public async computeDeterministicBlindIndex(normalizedPii: string): Promise<string> {
    if (!normalizedPii || normalizedPii.trim() === "") {
      throw new Error("Normalized PII cannot be empty for blind index computation");
    }

    const normalized = normalizedPii.trim().toLowerCase();
    return crypto
      .createHmac("sha256", this.blindIndexSubkey)
      .update(normalized)
      .digest("hex");
  }

  /**
   * Signs an audit record using the isolated audit signing subkey.
   * Returns a tamper-evident compact audit token (Header.Payload.Signature).
   */
  public async signAuditToken(payload: object): Promise<string> {
    const header = {
      alg: "HS256",
      typ: "CLAIMSHIELD-AUDIT-TOKEN",
      kid: this.keyId,
      provider: this.provider,
      issuedAt: new Date().toISOString()
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac("sha256", this.auditSigningSubkey)
      .update(message)
      .digest("base64url");

    return `${message}.${signature}`;
  }

  /**
   * Verifies the authenticity of an audit token.
   */
  public async verifyAuditToken(
    token: string
  ): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed audit token structure" };
    }

    const [encodedHeader, encodedPayload, receivedSig] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const expectedSig = crypto
      .createHmac("sha256", this.auditSigningSubkey)
      .update(message)
      .digest("base64url");

    try {
      const match = crypto.timingSafeEqual(
        Buffer.from(receivedSig, "base64url"),
        Buffer.from(expectedSig, "base64url")
      );
      if (!match) {
        return { valid: false, error: "Audit token signature verification failed" };
      }

      const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf-8");
      const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
      return { valid: true, payload: parsed };
    } catch {
      return { valid: false, error: "Audit token signature validation threw exception" };
    }
  }

  /**
   * Exposes subkey isolation verification for cryptographic auditing.
   */
  public verifyKeyIsolation(): boolean {
    return !this.blindIndexSubkey.equals(this.auditSigningSubkey);
  }
}

/**
 * Cloud Key Management Service (KMS) Adapter
 * Supports AWS KMS and Google Cloud KMS envelope encryption.
 * Enforces cryptographic context isolation (AAD) between blind indexing and audit signing.
 */
export class CloudKmsAdapter implements IKeyManager {
  public readonly provider: "AWS_KMS" | "GCP_KMS";
  public readonly keyId: string;
  public readonly region: string;
  private readonly envelopeRootKey: Buffer;
  private readonly blindIndexContextKey: Buffer;
  private readonly auditContextKey: Buffer;

  constructor(config: CloudKmsConfig) {
    this.provider = config.provider;
    this.keyId = config.keyId;
    this.region = config.region || (config.provider === "AWS_KMS" ? "us-east-1" : "global");

    // Root key for envelope encryption simulation
    const seed = config.mockEnclaveSecret || `cloud-kms-${this.provider}-${this.keyId}`;
    this.envelopeRootKey = crypto.createHash("sha256").update(seed).digest();

    // Authenticated Additional Data (AAD) / Cryptographic Context Isolation
    // AWS KMS Encryption Context or GCP KMS Additional Authenticated Data
    const blindIndexContext = JSON.stringify({
      provider: this.provider,
      keyId: this.keyId,
      purpose: "blind-index-generation",
      domain: "claimshield.identity"
    });

    const auditContext = JSON.stringify({
      provider: this.provider,
      keyId: this.keyId,
      purpose: "audit-token-signing",
      domain: "claimshield.audit"
    });

    // Derive context-bound data keys (DEKs)
    this.blindIndexContextKey = crypto
      .createHmac("sha256", this.envelopeRootKey)
      .update(blindIndexContext)
      .digest();

    this.auditContextKey = crypto
      .createHmac("sha256", this.envelopeRootKey)
      .update(auditContext)
      .digest();
  }

  /**
   * Computes deterministic blind index through envelope-derived context key.
   */
  public async computeDeterministicBlindIndex(normalizedPii: string): Promise<string> {
    if (!normalizedPii || normalizedPii.trim() === "") {
      throw new Error("Normalized PII cannot be empty for KMS blind indexing");
    }

    const normalized = normalizedPii.trim().toLowerCase();
    return crypto
      .createHmac("sha256", this.blindIndexContextKey)
      .update(normalized)
      .digest("hex");
  }

  /**
   * Signs an audit token using the context-bound envelope signing key.
   */
  public async signAuditToken(payload: object): Promise<string> {
    const header = {
      alg: "HS256",
      typ: "CLAIMSHIELD-AUDIT-TOKEN",
      kid: this.keyId,
      provider: this.provider,
      region: this.region,
      envelopeEncrypted: true,
      issuedAt: new Date().toISOString()
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac("sha256", this.auditContextKey)
      .update(message)
      .digest("base64url");

    return `${message}.${signature}`;
  }

  /**
   * Verifies an envelope-signed audit token.
   */
  public async verifyAuditToken(
    token: string
  ): Promise<{ valid: boolean; payload?: Record<string, unknown>; error?: string }> {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return { valid: false, error: "Malformed audit token structure" };
    }

    const [encodedHeader, encodedPayload, receivedSig] = parts;
    const message = `${encodedHeader}.${encodedPayload}`;

    const expectedSig = crypto
      .createHmac("sha256", this.auditContextKey)
      .update(message)
      .digest("base64url");

    try {
      const match = crypto.timingSafeEqual(
        Buffer.from(receivedSig, "base64url"),
        Buffer.from(expectedSig, "base64url")
      );
      if (!match) {
        return { valid: false, error: "Cloud KMS audit signature verification failed" };
      }

      const payloadJson = Buffer.from(encodedPayload, "base64url").toString("utf-8");
      const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
      return { valid: true, payload: parsed };
    } catch {
      return { valid: false, error: "Cloud KMS signature validation threw exception" };
    }
  }

  public verifyContextIsolation(): boolean {
    return !this.blindIndexContextKey.equals(this.auditContextKey);
  }
}
