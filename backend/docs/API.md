# Premium Check Generator API

## Base URL
`https://api.checkgenerator.com/v1`

## Authentication
Most endpoints require JWT authentication.

### Headers
Authorization: Bearer <jwt_token>
Content-Type: application/json

text

## Endpoints

### Templates

#### GET `/templates`
List all available templates.

**Query Parameters:**
- `category`: Filter by category
- `premium`: Filter premium templates
- `limit`: Results per page
- `page`: Page number

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "premium-1",
      "name": "Premium Corporate",
      "category": "premium",
      "thumbnail": "https://...",
      "price": 9.99,
      "rating": 4.8,
      "downloads": 1234
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5,
    "limit": 10
  }
}
POST /generate
Generate a check PDF.

Request Body:

json
{
  "templateId": "premium-1",
  "checkData": {
    "payeeName": "John Doe",
    "amount": 1234.56,
    "amountWords": "One thousand two hundred thirty-four and 56/100",
    "date": "2024-01-15",
    "checkNumber": "1001",
    "memo": "Invoice #1234",
    "signature": "Jane Smith",
    "bankName": "Premium Bank",
    "bankAddress": "123 Main St",
    "accountNumber": "987654321",
    "routingNumber": "123456789"
  },
  "options": {
    "quality": "print",
    "encryption": {
      "enabled": true,
      "password": "secure123"
    },
    "sampleMode": false,
    "includeInstructions": true
  }
}
Response: PDF file with appropriate headers.

POST /templates/custom
Save a custom template.

Request Body:

json
{
  "name": "My Custom Check",
  "category": "business",
  "fields": [...],
  "background": "base64_or_url",
  "security": {
    "watermark": true,
    "pattern": "geometric"
  }
}
Users
POST /auth/register
Register a new user.

POST /auth/login
Login user and get JWT token.

GET /users/profile
Get current user profile.

PUT /users/subscription
Update subscription plan.

Payments
POST /payments/create-checkout
Create Stripe checkout session.

POST /payments/webhook
Stripe webhook handler.

WebSocket Events
Real-time template updates and collaboration.

Events:
template:update - Template was modified

check:generated - New check generated

collaboration:join - User joined collaboration session

Rate Limiting
100 requests per 15 minutes per IP

Premium users: 500 requests per 15 minutes

Enterprise: Unlimited
