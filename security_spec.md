# Kusina & Co. — Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Strict Ownership & Verified Identity**: Only authenticated users with verified emails (`request.auth.token.email_verified == true`) may read or write under `/users/{userId}`. Cross-user access is strictly denied.
2. **Master Gate**: Subcollection documents (`savedRecipes`, `mealPlans`, `groceryItems`) cannot be created unless the parent `/users/{userId}` profile document exists and `ownerId == request.auth.uid`.
3. **Immutable Ownership & Creation Timestamps**: `uid`, `ownerId`, and `createdAt` are immutable after document creation. Both `createdAt` (on create) and `updatedAt` (on create & update) must equal `request.time`.
4. **No Shadow Fields or Oversized Payloads**: Every write enforces `keys().hasAll(...)` and `keys().hasOnly(...)` on create, `affectedKeys().hasOnly(...)` on update, strict string `.size()` bounds, numeric range bounds, and `isValidId()` regex (`^[a-zA-Z0-9_\-]+$`) on document IDs.
5. **PII Isolation & Zero Blanket Listing**: `/users/{userId}` disallows `list` completely. Subcollection `list` rules enforce `resource.data.ownerId == request.auth.uid` directly without `get()`/`exists()` lookups.

## 2. "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Unauthenticated Profile Read/Write**: `GET /users/userA` with `auth == null`.
2. **Unverified Email Write**: `CREATE /users/userA` with `auth.uid == 'userA'`, `email_verified == false`.
3. **Cross-User Spoofing**: `CREATE /users/userB` with `auth.uid == 'userA'` and `uid: 'userB'`.
4. **UID Injection in Payload**: `CREATE /users/userA` with `auth.uid == 'userA'` and `uid: 'userB'`.
5. **Shadow Field / Privilege Escalation**: `CREATE /users/userA` including ghost field `isAdmin: true` or `role: 'admin'`.
6. **Client-Spoofed Timestamp**: `CREATE /users/userA/groceryItems/item1` with `createdAt` set to a past client timestamp instead of `request.time`.
7. **Immutable Field Mutation**: `UPDATE /users/userA/mealPlans/2026-11-23_dinner` attempting to change `ownerId` or `createdAt`.
8. **ID Poisoning (1.5KB Document ID)**: `CREATE /users/userA/savedRecipes/<1500-char-id>` violating `isValidId()`.
9. **Type / Value Poisoning on Update**: `UPDATE /users/userA/groceryItems/item1` setting `checked: "yes"` or `amount: -50` or `aisle: "Electronics"`.
10. **Unbounded Array / Resource Exhaustion**: `UPDATE /users/userA` setting `dietaryDefaults` to a 25-element array.
11. **Orphaned Subcollection Write**: `CREATE /users/userA/mealPlans/2026-11-23_lunch` when `/users/userA` does not exist.
12. **Blanket User Collection List**: `LIST /users` by any signed-in user.
