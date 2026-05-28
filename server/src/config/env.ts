import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const env = {
  port: parseInt(process.env.PORT || "5000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  logLevel: process.env.LOG_LEVEL || "info",
  appUrl: process.env.APP_URL || "http://localhost:5000",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",

  jwt: {
    secret: process.env.JWT_SECRET || "",
    expirationDays: parseInt(
      process.env.JWT_EXPIRATION_DURATION_IN_DAYS || "7",
      10,
    ),
  },

  db: {
    host: process.env.DB_HOST || "",
    port: parseInt(process.env.DB_PORT || "3306", 10),
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "",
  },

  embedly: {
    apiKey: process.env.EMBEDLY_API_KEY || "",
    apiUrl: process.env.EMBEDLY_API_URL || "",
    payoutBaseUrl: process.env.EMBEDLY_PAYOUT_BASE_URL || "",
    bankName: process.env.EMBEDLY_BANK_NAME || "Sterling Bank",
    customerTypeId: process.env.EMBEDLY_CUSTOMER_TYPE_ID || "",
    countryId: process.env.EMBEDLY_COUNTRY_ID || "",
    customerAddress: process.env.EMBEDLY_CUSTOMER_ADDRESS || "",
    customerDateOfBirth:
      process.env.EMBEDLY_CUSTOMER_DATE_OF_BIRTH || "2000-01-01",
    customerCity: process.env.EMBEDLY_CUSTOMER_CITY || "",
    currencyId: process.env.EMBEDLY_CURRENCY_ID || "",
    organizationId: process.env.EMBEDLY_ORGANIZATION_ID || "",
    coopOpWalletAccountNumber: process.env.COOP_OP_WALLET_ACCOUNT_NUMBER || "",
    coopOpWalletAccountName: process.env.COOP_OP_WALLET_ACCOUNT_NAME || "",
    healthCheckUrl:
      process.env.EMBEDLY_HEALTH_CHECK_URL ||
      "https://waas-staging.embedly.ng/WaasCore/Health/ready",
    urls: {
      createCustomer: process.env.EMBEDLY_CREATE_CUSTOMER_URL || "",
      createWallet: process.env.EMBEDLY_CREATE_WALLET_URL || "",
      getCustomerById: process.env.EMBEDLY_GET_CUSTOMER_BY_ID_URL || "",
      getWalletByWalletId:
        process.env.EMBEDLY_GET_WALLET_BY_WALLET_ID_URL || "",
      getWalletListByCustomerId:
        process.env.EMBEDLY_GET_WALLET_LIST_BY_CUSTOMER_ID_URL || "",
      getWalletByAccountNumber:
        process.env.EMBEDLY_GET_WALLET_BY_ACCOUNT_NUMBER_URL || "",
      getWalletHistory:
        process.env.EMBEDLY_GET_WALLET_HISTORY_BY_ACCOUNT_NUMBER_URL || "",
      walletToWallet: process.env.EMBEDLY_WALLET_TO_WALLET_URL || "",
      simmulateInflow: process.env.EMBEDLY_SIMMULATE_INFLOW_URL || "",
      payoutBankList: process.env.EMBEDLY_PAYOUT_BANK_LIST_URL || "",
      payout: process.env.EMBEDLY_PAYOUT_URL || "",
    },
  },

  email: {
    host: process.env.EMAIL_HOST || "",
    port: parseInt(process.env.EMAIL_PORT || "587", 10),
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER || "",
    password: process.env.EMAIL_PASSWORD || "",
    subjects: {
      adminInvite: process.env.EMAIL_SUBJECT_ADMIN_INVITE || "",
      adminOtp: process.env.EMAIL_SUBJECT_ADMIN_OTP || "",
      memberInvite: process.env.EMAIL_SUBJECT_MEMBER_INVITE || "",
      memberWalletCreated:
        process.env.EMAIL_SUBJECT_MEMBER_WALLET_CREATED ||
        "Your Coop-op Wallet is Ready",
      cooperativeWalletCreated:
        process.env.EMAIL_SUBJECT_COOPERATIVE_WALLET_CREATED ||
        "Your Cooperative Wallet is Ready",
    },
  },

  auth: {
    defaultPassword: process.env.DEFAULT_PASSWORD || "",
  },

  cooperative: {
    maxWallets: parseInt(process.env.MAX_COOPERATIVE_WALLETS || "5", 10),
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || "",
  },
};

export function validateEnv(): void {
  const required: [string, string][] = [
    ["JWT_SECRET", env.jwt.secret],
    ["DB_HOST", env.db.host],
    ["DB_USER", env.db.user],
    ["DB_PASSWORD", env.db.password],
    ["DB_NAME", env.db.name],
    ["EMBEDLY_API_KEY", env.embedly.apiKey],
    ["EMBEDLY_API_URL", env.embedly.apiUrl],
    ["EMBEDLY_PAYOUT_BASE_URL", env.embedly.payoutBaseUrl],
    ["EMBEDLY_CUSTOMER_TYPE_ID", env.embedly.customerTypeId],
    ["EMBEDLY_COUNTRY_ID", env.embedly.countryId],
    ["EMBEDLY_CUSTOMER_ADDRESS", env.embedly.customerAddress],
    ["EMBEDLY_CUSTOMER_CITY", env.embedly.customerCity],
    ["EMBEDLY_CURRENCY_ID", env.embedly.currencyId],
    ["EMBEDLY_ORGANIZATION_ID", env.embedly.organizationId],
    ["COOP_OP_WALLET_ACCOUNT_NUMBER", env.embedly.coopOpWalletAccountNumber],
    ["COOP_OP_WALLET_ACCOUNT_NAME", env.embedly.coopOpWalletAccountName],
    ["EMBEDLY_CREATE_CUSTOMER_URL", env.embedly.urls.createCustomer],
    ["EMBEDLY_CREATE_WALLET_URL", env.embedly.urls.createWallet],
    ["EMBEDLY_GET_CUSTOMER_BY_ID_URL", env.embedly.urls.getCustomerById],
    [
      "EMBEDLY_GET_WALLET_LIST_BY_CUSTOMER_ID_URL",
      env.embedly.urls.getWalletListByCustomerId,
    ],
    [
      "EMBEDLY_GET_WALLET_BY_WALLET_ID_URL",
      env.embedly.urls.getWalletByWalletId,
    ],
    [
      "EMBEDLY_GET_WALLET_BY_ACCOUNT_NUMBER_URL",
      env.embedly.urls.getWalletByAccountNumber,
    ],
    [
      "EMBEDLY_GET_WALLET_HISTORY_BY_ACCOUNT_NUMBER_URL",
      env.embedly.urls.getWalletHistory,
    ],
    ["EMBEDLY_WALLET_TO_WALLET_URL", env.embedly.urls.walletToWallet],
    ["EMBEDLY_SIMMULATE_INFLOW_URL", env.embedly.urls.simmulateInflow],
    ["EMBEDLY_PAYOUT_BANK_LIST_URL", env.embedly.urls.payoutBankList],
    ["EMBEDLY_PAYOUT_URL", env.embedly.urls.payout],
    ["EMAIL_HOST", env.email.host],
    ["EMAIL_USER", env.email.user],
    ["EMAIL_PASSWORD", env.email.password],
    ["EMAIL_SUBJECT_ADMIN_INVITE", env.email.subjects.adminInvite],
    ["EMAIL_SUBJECT_ADMIN_OTP", env.email.subjects.adminOtp],
    [
      "EMAIL_SUBJECT_COOPERATIVE_WALLET_CREATED",
      env.email.subjects.cooperativeWalletCreated,
    ],
    ["DEFAULT_PASSWORD", env.auth.defaultPassword],
    ["RABBITMQ_URL", env.rabbitmq.url],
  ];

  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}`,
    );
  }
}
