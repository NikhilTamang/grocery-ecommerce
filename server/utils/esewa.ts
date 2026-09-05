import crypto from "crypto";

export interface EsewaPaymentParams {
  amount: number;
  tax_amount: number;
  product_delivery_charge: number;
  product_service_charge: number;
  total_amount: number;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
  success_url: string;
  failure_url: string;
  payment_url: string;
}

export interface EsewaResponsePayload {
  transaction_code: string;
  status: string;
  total_amount: string | number;
  transaction_uuid: string;
  product_code: string;
  signed_field_names: string;
  signature: string;
  ref_id?: string;
  [key: string]: any;
}

const getSecretKey = (): string => {
  return process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
};

const getProductCode = (): string => {
  return process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
};

const getGatewayUrl = (): string => {
  return (
    process.env.ESEWA_PAYMENT_URL ||
    process.env.ESEWA_GATEWAY_URL ||
    "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
  );
};

const getStatusUrl = (): string => {
  const url =
    process.env.ESEWA_STATUS_URL ||
    "https://rc.esewa.com.np/api/epay/transaction/status";
  return url.replace(/\/+$/, "");
};

/**
 * Generate HMAC SHA-256 signature for eSewa v2 form request
 */
export const generateEsewaSignature = (
  total_amount: string | number,
  transaction_uuid: string,
  product_code: string = getProductCode()
): string => {
  const secretKey = getSecretKey();
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto.createHmac("sha256", secretKey).update(data).digest("base64");
};

/**
 * Prepare full eSewa payment form data
 */
export const buildEsewaPaymentData = ({
  amount,
  taxAmount = 0,
  deliveryCharge = 0,
  serviceCharge = 0,
  totalAmount,
  transactionUuid,
  successUrl,
  failureUrl,
}: {
  amount: number;
  taxAmount?: number;
  deliveryCharge?: number;
  serviceCharge?: number;
  totalAmount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}): EsewaPaymentParams => {
  const productCode = getProductCode();
  const signedFieldNames = "total_amount,transaction_uuid,product_code";
  const signature = generateEsewaSignature(
    totalAmount,
    transactionUuid,
    productCode
  );

  return {
    amount,
    tax_amount: taxAmount,
    product_delivery_charge: deliveryCharge,
    product_service_charge: serviceCharge,
    total_amount: totalAmount,
    transaction_uuid: transactionUuid,
    product_code: productCode,
    signed_field_names: signedFieldNames,
    signature,
    success_url: successUrl,
    failure_url: failureUrl,
    payment_url: getGatewayUrl(),
  };
};

/**
 * Decode base64 encoded response from eSewa redirect
 */
export const decodeEsewaResponse = (encodedData: string): EsewaResponsePayload => {
  const decodedString = Buffer.from(encodedData, "base64").toString("utf-8");
  return JSON.parse(decodedString) as EsewaResponsePayload;
};

/**
 * Verify response signature using signed_field_names returned by eSewa
 */
export const verifyEsewaResponseSignature = (
  response: EsewaResponsePayload
): boolean => {
  if (!response.signature || !response.signed_field_names) {
    return false;
  }

  const secretKey = getSecretKey();
  const fieldList = response.signed_field_names.split(",");
  const dataString = fieldList
    .map((field) => `${field}=${response[field]}`)
    .join(",");

  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(dataString)
    .digest("base64");

  return expectedSignature === response.signature;
};

/**
 * Query eSewa Status Check API for transaction verification
 */
export const checkEsewaTransactionStatus = async ({
  productCode = getProductCode(),
  totalAmount,
  transactionUuid,
}: {
  productCode?: string;
  totalAmount: string | number;
  transactionUuid: string;
}): Promise<{
  product_code: string;
  transaction_uuid: string;
  total_amount: number;
  status: string;
  ref_id: string | null;
}> => {
  const statusBaseUrl = getStatusUrl();
  const url = `${statusBaseUrl}/?product_code=${encodeURIComponent(
    productCode
  )}&total_amount=${encodeURIComponent(
    totalAmount
  )}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`eSewa status check failed with HTTP ${res.status}`);
  }
  const json = await res.json();
  return json;
};
