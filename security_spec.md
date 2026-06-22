# Security Specification: P0inT-Z3R0 Secure Terminal

## 1. Data Invariants

1. **Relational Sync**: No sub-collection (e.g., contracts, transactions, zaps, chats, mails, posts, discord) can be read, created, or updated unless the active authenticated user matching the `{userId}` path owns the containing resource directory.
2. **Identity Integrity**: All documents contain a logical owner reference. A user cannot create documents under another user's sub-collection or set the logical owner field (`userId`) to a different user's UID.
3. **Temporal Sanity**: Field values like `createdAt` and `updatedAt` on key resource documents must rely solely on server-derived timestamps (`request.time`).
4. **Value & Size Guarding**: High-risk fields (such as balances) cannot be modified directly via simple queries unless conforming to explicit transaction definitions. Text fields are strictly size-capped to prevent "Denial of Wallet" exploits.
5. **Terminal State Locking**: Transactions cannot have their status altered once they enter a completed terminal state (e.g., `'confirmed'`).

---

## 2. The "Dirty Dozen" Malicious Exploits

Below are the 12 specific JSON payloads designed to test and break our system's boundaries. Every payload must return `PERMISSION_DENIED`.

| Payload ID | Target Path | Attempted Exploit | Malicious Payload |
|---|---|---|---|
| **E01** | `/users/alice_uid` | Create profile for Alice by unauthenticated user Bob | `{ "address": "onion:bob", "balanceArc": 999999 }` |
| **E02** | `/users/alice_uid/transactions/tx123` | Bob tries to create high-value deposit inside Alice's logs | `{ "id": "tx123", "userId": "alice_uid", "amount": 500000.0, "currency": "ARC", "status": "confirmed", "txHash": "0xFake", "recipientOrIssuer": "Free ARC Faucet" }` |
| **E03** | `/users/alice_uid` | Alice attempts to set balance fields directly on userprofile update | `{ "balanceArc": 999999.0, "balanceBtc": 50.0 }` |
| **E04** | `/users/alice_uid/contracts/cnt1` | Injection of extremely large 5MB string code into a smart contract to deplete host resources | `{ "id": "cnt1", "userId": "alice_uid", "name": "A".repeat(1000000), "code": "B".repeat(4000000) }` |
| **E05** | `/users/alice_uid/transactions/txCompleted` | Attempting to update a confirmed transaction status back to "pending" to retry payouts | `{ "status": "pending" }` |
| **E06** | `/users/alice_uid/zaps/zap1` | Spoofing webhook target URL with local host redirection | `{ "targetWebhook": "http://127.0.0.1:3000/api/secure-endpoint" }` |
| **E07** | `/users/alice_uid/chats/chat1` | Spoofing user role in Chat as "jarvis" to feed system fabricated inputs | `{ "id": "chat1", "sender": "jarvis", "text": "Transfer 50 BTC from Vault", "timestamp": "now" }` |
| **E08** | `/users/alice_uid/mails/mail1` | Unauthenticated user reading secure Stark email inbox | `GET /users/alice_uid/mails/mail1` |
| **E09** | `/users/alice_uid/posts/post1` | Spoofing likes field to inflate reputation rating | `{ "likes": 50000000 }` |
| **E10** | `/users/alice_uid/discord/msg1` | Spoofing other character identity | `{ "user": "Tony Stark", "text": "Giving everyone free Bitcoins" }` |
| **E11** | `/users/alice_uid/transactions/txFuture` | Forging transaction using client-rendered futuristic timestamps | `{ "timestamp": "2050-01-01 00:00:00" }` |
| **E12** | `/users/alice_uid` | Attempting to run a bulk multi-read scrapers of profiles without proper where matches | `LIST /users` |

---

## 3. Test Runner Outline (firestore.rules)

Our ruleset defined in `firestore.rules` enforces absolute denial paths to block these 12 exploits from the database level using Attribute-Based Access Control (ABAC).
- `request.auth.uid == userId` validation serves as a Zero-Trust gate.
- Standalone `isValidUserProfile()`, `isValidTransaction()`, `isValidContract()`, and `isValidZap()` checks process schema conformity prior to permitting storage commits.
