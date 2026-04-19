# Cooperative Management Application => Coop-op

## Introduction

Coop is a cooperative app used by cooperatives to manage their activities. It has wallets built directly into it.

## Application Backing

The strongest opportunities are cooperatives. Cooperatives have a trust and transparency problem that a wallet solves cleanly — and they're underserved by fintech right now.
Cooperatives are essentially a financial operating system for a group of people — and right now, most of them are running that OS on paper, Excel sheets, and WhatsApp messages. That's my opening.
Think of it like this: a cooperative is a mini-bank that its members both own and borrow from. Your wallet becomes the account ledger for that mini-bank.
Here's what a cooperative actually does day-to-day, and where the wallet touches every single one:
Image here ![My Image](/project/cooperative_wallet_flows.svg).

Every arrow in that diagram is currently a manual process for most Nigerian cooperatives. Paper receipts, cash handovers, a treasurer writing in a ledger. Here's what your wallet wrapper actually replaces:
\_Dues collection — the most painful problem. The treasurer chases 50+ members every month. With your wallet, dues are auto-debited on a set date. Member gets a notification. Treasurer sees a dashboard. No chasing.
\_Loan management — a cooperative's core product. Right now it's manual approvals, cash handouts, and informal repayment. With a wallet: disbursement goes straight to the member's wallet, repayments are deducted on schedule, and interest accrues automatically. The treasurer doesn't touch cash at all.
\_Thrift/savings sweeps — many cooperatives run a "thrift" scheme where a portion of every member's contribution is locked away. Your wallet can have a sub-wallet (a "vault") that auto-sweeps on due date, earns a notional return, and is only accessible at year-end or on exit.
Levies and fines — absent from a meeting? ₦500 fine. Late dues? 5% penalty. These are real rules most cooperatives have but enforce inconsistently. A wallet enforces them automatically with zero awkwardness.
\_Year-end dividend — cooperatives share surplus at year-end. Currently this means the treasurer calculating shares per member and doing 50 individual bank transfers. With your wallet it's one batch operation.

## Product Actors

### Back Office Admins

- Manages Entire platform
- Views Cooperatives
- Views Members
- Views Admins

### Cooperative AdminS (managers)

- Manages Cooperatives
- Invites other Cooperative Managers
- Invites other Cooperative Members

### Members

- Joins Cooperatives
- Funds wallets
- Tracks and views Coperative activities
