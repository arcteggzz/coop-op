# Term Definition

## 1. NIP Inflow

- This is used to refer to the action where money enters a wallet FROM an external bank account.
- If money enters a wallet from GTBANK, OPAY or any account that is NOT a Coop Op wallet/account, then it is a NIP Inflow.
- And when there is NIP Inflow action, Embedly sends a webhook to our service, notifying us of this action. It happens outside our system.

## 2. Payout

- This is used to refer to the action where money leaves a wallet to an external bank account.
- If money leaves a wallet and is sent to GTBANK, OPAY or any accout that is not a Coop Op wallet/Account, then it is a payout.
- And when there is a payout, Embedly sends a webhook to our service, notifying us of this action. We initiate it, but the action occurs outside our system.
