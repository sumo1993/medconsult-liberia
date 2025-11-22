# Assignment Request Workflow - Complete Guide

## Overview
Complete workflow system for clients to request assignment help, doctors to review and price, negotiate payments, upload receipts, and verify payments.

## Workflow Steps

### 1. Client Submits Request
**Status**: `pending_review`
- Client fills form with:
  - Title
  - Description
  - Subject (optional)
  - Deadline (optional)
  - Attachment (optional)
- Submits to system
- Doctor receives notification

### 2. Doctor Reviews Request
**Status**: `under_review` → `price_proposed`
- Doctor reviews request details
- Downloads attachment if provided
- Decides if can solve it
- If YES: Proposes price and notes
- If NO: Can reject or ignore

### 3. Client Reviews Price
**Status**: `price_proposed`
Client has 3 options:

#### Option A: Accept Price
**Status**: `price_proposed` → `payment_pending`
- Client accepts the proposed price
- Moves to payment step
- Shows payment methods

#### Option B: Request Reduction
**Status**: `price_proposed` → `negotiating`
- Client requests lower price
- Can propose counter-offer
- Adds negotiation message
- Doctor receives notification
- Doctor can update price
- Returns to step 3

#### Option C: Reject
**Status**: `price_proposed` → `rejected`
- Client rejects the price
- Provides rejection reason
- Request is closed/disabled
- No further action possible

### 4. Payment Process
**Status**: `payment_pending` → `payment_uploaded`

#### Available Payment Methods:
1. **Mobile Money** (Primary)
2. **Bank Transfer**
3. **Cash**
4. **Other**

#### For Mobile Money:
- Client makes payment via mobile money
- Client uploads payment receipt (screenshot/photo)
- Receipt stored in database
- Doctor receives notification

### 5. Doctor Verifies Payment
**Status**: `payment_uploaded` → `payment_verified`
- Doctor views uploaded receipt
- Downloads receipt to verify
- If valid: Verifies payment
- If invalid: Can request re-upload
- Once verified: Work begins

### 6. Work Progress
**Status**: `payment_verified` → `in_progress` → `completed`
- Doctor starts work
- Client can track progress
- Doctor completes and delivers
- Request marked as completed

## Database Schema

### assignment_requests Table
```sql
- id: Primary key
- client_id: Who submitted
- doctor_id: Who is handling
- title, description, subject, deadline
- attachment_filename, attachment_data, attachment_size
- status: Current workflow status
- proposed_price, negotiated_price, final_price, currency
- payment_method, payment_receipt_*
- doctor_notes, client_response, rejection_reason, negotiation_message
- Timestamps for each stage
```

### assignment_messages Table
```sql
- id: Primary key
- assignment_request_id: Which request
- sender_id: Who sent message
- message: Message content
- message_type: Type of message
- created_at: When sent
```

## Status Flow

```
pending_review
    ↓
under_review
    ↓
price_proposed ←──────┐
    ↓                  │
    ├→ accepted → payment_pending
    ├→ negotiating ────┘
    └→ rejected (END)
    
payment_pending
    ↓
payment_uploaded
    ↓
payment_verified
    ↓
in_progress
    ↓
completed
```

## API Endpoints

### GET /api/assignment-requests
- Fetch all requests (filtered by role)
- Client: sees their requests
- Doctor: sees pending + assigned requests

### POST /api/assignment-requests
- Client submits new request
- Uploads attachment (optional)

### GET /api/assignment-requests/[id]
- Fetch single request details
- Authorization checked

### PUT /api/assignment-requests/[id]
Actions:
- `propose_price`: Doctor sets price
- `accept_price`: Client accepts
- `reject_price`: Client rejects
- `request_reduction`: Client negotiates
- `update_price`: Doctor adjusts price
- `upload_payment`: Client uploads receipt
- `verify_payment`: Doctor confirms payment

### GET /api/assignment-requests/[id]/attachment
- Download request attachment

### GET /api/assignment-requests/[id]/receipt
- Download payment receipt

### GET /api/assignment-requests/[id]/messages
- Fetch negotiation messages

## Features

### For Clients:
✅ Submit assignment requests with attachments
✅ View proposed prices
✅ Accept, reject, or negotiate prices
✅ Choose payment method
✅ Upload payment receipts
✅ Track request status
✅ View message history

### For Doctors:
✅ View pending requests
✅ Review request details and attachments
✅ Propose prices with notes
✅ Respond to negotiation requests
✅ Update prices during negotiation
✅ View uploaded payment receipts
✅ Verify payments
✅ Track all assigned requests

### Security:
✅ Authentication required for all actions
✅ Role-based authorization
✅ Clients can only access their requests
✅ Doctors can only price/verify assigned requests
✅ File uploads validated and secured
✅ BLOB storage for attachments and receipts

## Payment Methods

### Mobile Money (Recommended)
- Most common in Liberia
- MTN, Orange, Lonestar Cell
- Client pays, screenshots receipt
- Uploads screenshot
- Doctor verifies transaction ID

### Bank Transfer
- Traditional bank transfer
- Client uploads bank receipt
- Doctor verifies

### Cash
- In-person payment
- Receipt photo uploaded
- Doctor confirms

### Other
- Alternative methods
- Flexible for special cases

## Negotiation Process

1. **Doctor proposes**: $50
2. **Client counters**: "Can you do $40?"
3. **Doctor responds**: Updates to $45
4. **Client decides**: Accept or continue negotiating
5. **Agreement reached**: Proceed to payment

## Error Handling

- Invalid file uploads rejected
- Status transitions validated
- Unauthorized actions blocked
- Missing data handled gracefully
- Database errors logged
- User-friendly error messages

## Next Steps

1. Build client request submission UI
2. Build doctor review and pricing UI
3. Build client payment acceptance UI
4. Build payment upload interface
5. Build doctor verification UI
6. Test complete workflow
7. Add email notifications
8. Add real-time updates

This system ensures transparent, secure, and efficient assignment help with proper payment handling!
