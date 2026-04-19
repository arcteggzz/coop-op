# Wallet Provider Details

Coop op works using the Embedly wallet system. See API documentation below
https://developer.embedly.ng/home/introduction

## Setup and Configuration

- Register on Embedly wallet system
- Get staging and production API key
- Set up webhook for wallet events (to be submitted on the embedly dashboard)
- Get base url for staging and production environment

## Endpoint List

- Create Customer
  apiDocLink: https://developer.embedly.ng/api-reference/playground/customer/individual/profile_customer
  apiUrl: https://waas-staging.embedly.ng/api/v1/customers/add
  purpose: used to create a customer profile in the Embedly wallet system. Must be called before a wallet is created
  Method: POST
  sample request Payload:

  ```json
  {
    "firstName": "Excel Stealth",
    "lastName": "Academy",
    "dob": "<from env: EMBEDLY_CUSTOMER_DATE_OF_BIRTH>",
    "customerTypeId": "<from env: EMBEDLY_CUSTOMER_TYPE_ID>",
    "alias": "Coop-op-{{SchoolName}}", //I want to use this to identyfy the different customers on EMbedly by their school name from Coop-op
    "countryId": "<from env: EMBEDLY_COUNTRY_ID>",
    "city": "<from env: EMBEDLY_CUSTOMER_CITY>",
    "address": "<from env: EMBEDLY_CUSTOMER_ADDRESS>"
  }
  ```

  sample response Payload:

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Created Successfully",
    "data": {
      "id": "80f165b2-1f1e-11f1-97df-02789e000022",
      "organizationId": "033ec377-72c0-11f0-a7cf-0274f77d4a81",
      "firstName": "Patricia",
      "lastName": "Highschool",
      "middleName": "",
      "dob": "2000-01-01T00:00:00",
      "customerTypeId": "f671da57-e281-4b40-965f-a96f4205405e",
      "customerTierId": 0,
      "alias": null,
      "countryId": "c15ad9ae-c4d7-4342-b70f-de5508627e3b",
      "city": "Lagos",
      "address": "20 Marina",
      "mobileNumber": "",
      "emailAddress": "",
      "dateCreated": null,
      "isCorporateVerified": ""
    }
  }
  ```

- Get Customer by ID
  apiDocLink: https://developer.embedly.ng/api-reference/playground/customer/individual/Get_Id
  apiUrl: https://waas-staging.embedly.ng/api/v1/customers/get/id/{customerId}
  purpose: used to create a customer profile in the Embedly wallet system.
  Method: GET

- Create Wallet
  apiDocLink: https://developer.embedly.ng/api-reference/playground/Wallet/Add_Wallet
  apiUrl: https://waas-staging.embedly.ng/api/v1/wallets/add
  purpose: used to create a wallet for a particular customer
  Method: POST
  sample request Payload:

  ```json
  {
    "customerId": "CustomerId returend from Create Customer",
    "currencyId": "<from env: EMBEDLY_CURRENCY_ID>",
    "name": "FULL NAME"
  }
  ```

  sample response Payload:

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Created Successfully",
    "data": {
      "id": "822268b7-1f1e-11f1-97df-02789e000022",
      "walletGroupId": null,
      "customerId": "80f165b2-1f1e-11f1-97df-02789e000022",
      "availableBalance": 0,
      "ledgerBalance": 0,
      "walletRestrictionId": null,
      "walletClassificationId": "4f734eea-b0d8-4c6c-8738-a5e13668c32f",
      "currencyId": "fd5e474d-bb42-4db1-ab74-e8d2a01047e9",
      "isInternal": false,
      "isDefault": true,
      "name": "Patricia Highschool",
      "overdraft": null,
      "virtualAccount": {
        "accountNumber": "9710024855",
        "bankCode": "232",
        "bankName": "Sterling Bank"
      },
      "mobNum": null,
      "customerTypeId": "f671da57-e281-4b40-965f-a96f4205405e"
    }
  }
  ```

- Get Wallet by Account Number
  apiDocLink: https://developer.embedly.ng/api-reference/playground/Wallet/Get_Wallet_by_Account
  apiUrl: https://waas-staging.embedly.ng/api/v1/wallets/get/wallet/account/{accountNumber}
  purpose: used to get wallet details for a particular account number.
  Method: GET
  sample response payload

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Retrieved Successfully",
    "data": {
      "id": "df6bdff0-1ec2-11f1-97df-02789e000022",
      "walletGroupId": null,
      "customerId": "4369e2cb-10c2-11f1-97df-02789e000022",
      "availableBalance": 0.0,
      "ledgerBalance": 0.0,
      "walletRestrictionId": null,
      "walletClassificationId": "4f734eea-b0d8-4c6c-8738-a5e13668c32f",
      "currencyId": "fd5e474d-bb42-4db1-ab74-e8d2a01047e9",
      "isInternal": false,
      "isDefault": true,
      "name": "Jesam ofem",
      "overdraft": null,
      "virtualAccount": {
        "accountNumber": "9710024766",
        "bankCode": "232",
        "bankName": "Sterling Bank"
      },
      "mobNum": null,
      "customerTypeId": "f671da57-e281-4b40-965f-a96f4205405e"
    }
  }
  ```

- Get Wallet list by CustomerId
  apiDocLink: N/A
  apiUrl: https://waas-staging.embedly.ng/WaasCore/api/v1/wallets/get/list/:customerId
  purpose: used to get wallets list for a particular customer Id.
  Method: GET
  sample response payload

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Retrieved Successfully",
    "data": [
      {
        "id": "d1d3fdb4-27cb-11f1-97df-02789e000022",
        "walletGroupId": null,
        "customerId": "d134aca4-27cb-11f1-97df-02789e000022",
        "availableBalance": 0,
        "ledgerBalance": 0,
        "walletRestrictionId": null,
        "walletClassificationId": "4f734eea-b0d8-4c6c-8738-a5e13668c32f",
        "currencyId": "fd5e474d-bb42-4db1-ab74-e8d2a01047e9",
        "isInternal": false,
        "isDefault": true,
        "name": "Fatima Abdullahi",
        "overdraft": null,
        "virtualAccount": {
          "accountNumber": "9710026452",
          "bankCode": "232",
          "bankName": "Sterling Bank"
        },
        "mobNum": null,
        "customerTypeId": "00000000-0000-0000-0000-000000000000"
      }
    ]
  }
  ```

- Get Wallet History by Account Number
  apiDocLink: https://developer.embedly.ng/api-reference/playground/Wallet/Get_Wallet_History
  apiUrl: https://waas-staging.embedly.ng/api/v1/wallets/account-number/history
  purpose: used to get the wallet history (paginated) for a particular account number
  params: AccountNumber //string, From //date(in YYYY-MM-DD), To //date(in YYYY-MM-DD), PageNumber //string, PageSize //string
  sample url: https://waas-staging.embedly.ng/api/v1/wallets/account-number/history?AccountNumber=9710067201&From=2025-12-01&To=2026-02-24&PageNumber=1&PageSize=20
  Method: GET
  sample request Payload:

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Fetched Successfully",
    "data": {
      "walletHistories": [
        {
          "id": "3084ff82-f7b0-11f0-86fd-7e79517010a5",
          "walletId": "ed2876a2-3a17-11f0-97d7-7c1e52753c35",
          "productId": "d1916e2e-3a39-11f0-97d7-7c1e52753c35",
          "remarks": "Payment for love",
          "amount": 20.0,
          "debitCreditIndicator": "D",
          "balance": 869.0,
          "transactionReference": "NEO-SMART-TESTS-TRNX-20488",
          "transactionId": "NEO-SMART-TESTS-TRNX-20488",
          "isActive": true,
          "dateCreated": "2026-01-22T16:34:14.880328",
          "mobileNumber": "07088478400",
          "accountNumber": "9710067201",
          "name": null,
          "beneficiaryAccountName": "Neosmart Consulting's Wallet",
          "beneficiaryAccountNumber": "9710066907",
          "beneficiaryBank": "STERLING BANK",
          "originatorAccountNumber": "",
          "originatorAccountName": ""
        },
        {
          "id": "656fcfc1-cf01-11f0-8d44-4af84d9ff6f1",
          "walletId": "ed2876a2-3a17-11f0-97d7-7c1e52753c35",
          "productId": "2a544fbe-c477-11f0-8d44-4af84d9ff6f1",
          "remarks": "Cashback for transaction: NEO-SMART-TESTS-TRNX-1234843ffd5 from 9710169921 to 9710067201",
          "amount": 20.0,
          "debitCreditIndicator": "C",
          "balance": 1089.0,
          "transactionReference": "CSHBK-NEO-SMART-TESTS-TRNX-1234843ffd5",
          "transactionId": "CSHBK-NEO-SMART-TESTS-TRNX-1234843ffd5",
          "isActive": true,
          "dateCreated": "2025-12-01T22:02:15.22126",
          "mobileNumber": "07088478400",
          "accountNumber": "9710067201",
          "name": null,
          "beneficiaryAccountName": "",
          "beneficiaryAccountNumber": "",
          "beneficiaryBank": "",
          "originatorAccountNumber": "",
          "originatorAccountName": ""
        }
      ],
      "totalCount": 6,
      "totalPages": 1,
      "currentPage": 1,
      "pageSize": 50
    }
  }
  ```

- Wallet to Wallet Transfer
  apiDocLink: https://developer.embedly.ng/api-reference/playground/Wallet/Wallet_to_Wallet
  apiUrl: https://waas-staging.embedly.ng/api/v1/wallets/wallet/transaction/v2/wallet-to-wallet
  purpose: used to send money between 2 wallets
  Method: PUT
  sample request Payload:

  ```json
  {
    "fromAccount": "9710066907", //the sender account
    "toAccount": "9710169921", //the receiver account
    "amount": 50,
    "transactionReference": "ACDFY-{{some random 16 characters}}", //generate a transaction ref. random part can only contain letters and numbers. mix upper and lower case
    "remarks": "suitable remark"
  }
  ```

  sample response Payload

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Transfer processed successfully",
    "data": 0
  }
  ```

- Simmulate Inflow
  apiDocLink: https://developer.embedly.ng/api-reference/playground/Wallet/Inflow#simulate-inflow-staging
  apiUrl: https://waas-staging.embedly.ng/WaasCore/api/v1/nip/inflow/simulate-inflow
  purpose: used to simulate inflow to an account
  Method: POST
  sample request Payload:

  ```json
  {
    "BeneficiaryAccountName": "Coop-op Wallet", // please hard code this as it doesn't matter to Embedly
    "BeneficiaryAccountNumber": "9710024944", // the passed account number
    "Narration": "Coop-op Inflow", // please hard code this as it doesn't matter to Embedly
    "Amount": "48340" // the passed amount
  }
  ```

  sample response Payload

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Funded successfully",
    "data": null
  }
  ```

- Get Bank List
  apiDocLink: https://developer.embedly.ng/api-reference/playground/payout/get_banks
  apiUrl: https://payout-staging.embedly.ng/api/Payout/banks
  purpose: used to get bank list and bank code and bank name.
  Method: GET
  sample response payload

  ```json
  {
    "data": [
        {
            "bankName": "Access Bank",
            "bankCode": "000014"
        },
        {
            "bankName": "Citi Bank",
            "bankCode": "000009"
        },
        {
            "bankName": "Ecobank Bank",
            "bankCode": "000010"
        }, ...
    ],
    "statusCode": 200,
    "code": null,
    "message": "Successfully retrieved bank list",
    "succeeded": true
  }
  ```

- Initiate Payout
  apiDocLink: https://developer.embedly.ng/api-reference/playground/payout/interbank_transfer
  apiUrl: https://payout-staging.embedly.ng/api/Payout/inter-bank-transfer
  purpose: used to send money from embedly wallet to external bank account.
  Method: PSOT
  sample request Payload:

  ```json
  {
    "amount": 600,
    "destinationBankCode": "100004",
    "destinationAccountName": "John Doe",
    "destinationAccountNumber": "7088478400",
    "sourceAccountName": "Inigo Martinez 01",
    "sourceAccountNumber": "9710005082",
    "remarks": "funnnnn",
    "currencyId": "fd5e474d-bb42-4db1-ab74-e8d2a01047e9",
    "customerTransactionReference": "MART-09-VDSO-VDSTEST-1",
    "stagingStatus": "success" //only used in staging enviroment to indicate the type of transaction you want. can be success or failed.
  }
  ```

  sample response Payload

  ```json
  {
    "data": "EMBa56d53d0bf5e4822af4bb35e2bdf8683",
    "statusCode": 200,
    "code": "00",
    "message": "Request is being processed.",
    "succeeded": true
  }
  ```

- Health Check
  apiDocLink: NIL (not available)
  apiUrl: https://waas-staging.embedly.ng/WaasCore/Health/ready
  purpose: used to check if embedly service is up.
  Method: GET

  sample response Payload

  ```json
  {
    "code": "00",
    "success": true,
    "message": "Service is ready",
    "data": {
      "status": "Healthy",
      "component": "Service",
      "duration": 33.6118,
      "timestamp": "2026-04-10T20:40:10.4177055Z",
      "environment": "Staging",
      "version": "1.0.0.0",
      "checks": [
        {
          "name": "database",
          "status": "Healthy",
          "description": "Database connection is healthy",
          "duration": 29.3677
        }
      ]
    }
  }
  ```

## Webhook Incoming Payloads

- NIP Event
  sample payload

  ```json
  {
    "event": "nip",
    "data": {
      "accountNumber": "9710024944",
      "accountName": null,
      "bankCode": "000001",
      "reference": "8ebceaed-603a-40d5-aa47-06882c9b7450",
      "amount": 50000,
      "fee": 0,
      "senderName": "string",
      "senderBank": "STERLING BANK",
      "senderBankCode": "000001",
      "dateOfTransaction": "2026-03-18T11:21:00.2361313Z",
      "description": "Part paymetn for Booker",
      "senderAccountNumber": "string"
    }
  }
  ```

- Payout Success
  sample payload

  ```json
  {
    "event": "payout",
    "data": {
      "sessionId": null,
      "debitAccountNumber": "9710005082",
      "creditAccountNumber": "7088478400",
      "debitAccountName": "Inigo Martinez 01",
      "creditAccountName": "John Doe",
      "creditBankCode": "100004",
      "debitBankCode": "000001",
      "debitBankName": "Sterling Bank",
      "creditBankName": "OPAY",
      "amount": 200.0,
      "currency": "NGN",
      "status": "success",
      "paymentReference": "MART-09-VDSO-VDSTEST",
      "deliveryStatusMessage": null,
      "deliveryStatusCode": null,
      "dateOfTransaction": "2026-03-20T11:16:36.3916109+00:00",
      "description": "martinez holiday test"
    }
  }
  ```

- Payout Failed
  sample payload
  ```json
  {
    "event": "payout",
    "data": {
      "sessionId": null,
      "debitAccountNumber": "9710005082",
      "creditAccountNumber": "7088478400",
      "debitAccountName": "Inigo Martinez 01",
      "creditAccountName": "John Doe",
      "creditBankCode": "100004",
      "debitBankCode": "000001",
      "debitBankName": "Sterling Bank",
      "creditBankName": "OPAY",
      "amount": 200.0,
      "currency": "NGN",
      "status": "failed",
      "paymentReference": "MART-09-VDSO-VDSTEST-1",
      "deliveryStatusMessage": null,
      "deliveryStatusCode": null,
      "dateOfTransaction": "2026-03-20T11:16:59.5017307+00:00",
      "description": "martinez holiday test"
    }
  }
  ```

```

```
