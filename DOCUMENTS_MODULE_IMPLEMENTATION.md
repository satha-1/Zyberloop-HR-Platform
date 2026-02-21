# Documents & Templates Module Implementation

## Overview

A comprehensive Templates & Documents module (DocHub-like) has been implemented for the HR Management Platform. This module provides template management, document generation, PDF creation, secure storage, and e-sign integration hooks.

## Backend Implementation

### ✅ Completed Components

#### 1. **MongoDB Models**
- **Template Model** (`template.model.ts`): Versioned, localized templates with lifecycle management
- **Document Model** (`document.model.ts`): Document instances with artefact tracking
- **DocumentJob Model** (`documentJob.model.ts`): Async job tracking for bulk operations
- **DocumentSignature Model** (`documentSignature.model.ts`): E-signature tracking and webhook events

#### 2. **Services**
- **StorageService** (`storage.service.ts`): S3-compatible storage with local fallback, presigned URLs
- **TemplateService** (`template.service.ts`): Template CRUD, lifecycle (DRAFT → IN_REVIEW → PUBLISHED → DEPRECATED), versioning
- **MergeContextResolver** (`mergeContextResolver.service.ts`): Builds template context from employee/payroll data
- **DocumentRenderService** (`documentRender.service.ts`): Handlebars HTML rendering + Puppeteer PDF generation
- **DocumentService** (`document.service.ts`): Document CRUD, RBAC enforcement, presigned URL generation
- **SigningService** (`signing.service.ts`): E-sign integration hooks (stub implementation, ready for provider integration)

#### 3. **Workers (BullMQ)**
- **Document Worker**: Async single document generation
- **Bulk Document Worker**: Batch payslip generation with progress tracking and error reporting

#### 4. **REST API Endpoints**

**Templates:**
- `POST /api/v1/documents/templates` - Create template
- `GET /api/v1/documents/templates` - List templates (with filters)
- `GET /api/v1/documents/templates/:id` - Get template by ID
- `PATCH /api/v1/documents/templates/:id` - Update template
- `POST /api/v1/documents/templates/:id/submit-review` - Submit for review
- `POST /api/v1/documents/templates/:id/approve` - Approve template
- `POST /api/v1/documents/templates/:id/publish` - Publish template
- `POST /api/v1/documents/templates/:id/deprecate` - Deprecate template

**Documents:**
- `POST /api/v1/documents/documents/preview` - Preview document (HTML/PDF)
- `POST /api/v1/documents/documents` - Generate single document
- `GET /api/v1/documents/documents` - List documents (with filters)
- `GET /api/v1/documents/documents/:id` - Get document by ID
- `POST /api/v1/documents/documents/:id/download` - Get presigned download URL
- `POST /api/v1/documents/documents/bulk` - Bulk generate (e.g., payslips)
- `GET /api/v1/documents/document-jobs/:jobId` - Get job status

**Signing:**
- `POST /api/v1/documents/documents/:id/sign-request` - Request e-signature
- `POST /api/v1/documents/signing/webhook/:provider` - Webhook handler

### 🔧 Configuration

Added to `backend/src/config/index.ts`:
- S3 storage configuration
- Redis/BullMQ configuration
- Document generation settings (presigned URL TTL, batch sizes)
- Signing provider placeholders

### 📦 Dependencies Added

```json
{
  "@aws-sdk/client-s3": "^3.490.0",
  "@aws-sdk/s3-request-presigner": "^3.490.0",
  "bullmq": "^5.3.0",
  "handlebars": "^4.7.8",
  "ioredis": "^5.3.2",
  "puppeteer": "^21.6.1"
}
```

### 🔐 Security Features

- **RBAC Enforcement**: Employees can only access their own documents; Admin/HR/Finance have broader access
- **Presigned URLs**: Short-lived (15 min default) download links, never raw S3 URLs
- **Audit Logging**: All template/document actions are logged
- **Context Hashing**: SHA-256 hashing of input context for integrity verification

### 📋 Document Types Supported

- `OFFER_LETTER`
- `APPOINTMENT_LETTER`
- `PAYSLIP`
- `FINAL_SETTLEMENT`
- `EXPERIENCE_CERT`

### 🎯 Template Features

- **Versioning**: Automatic version increments on content changes
- **Localization**: Support for multiple locales (en, si-LK, ta-LK) with fallback
- **Lifecycle**: DRAFT → IN_REVIEW → PUBLISHED → DEPRECATED
- **Effective Dates**: Templates can have effectiveFrom/effectiveTo dates
- **Approval Workflow**: Multi-approver support
- **Variable Schema**: JSON schema validation for template variables

## Frontend Integration (TODO)

The following frontend pages need to be created:

1. **Admin Templates Management** (`/admin/templates`)
   - List view with filters (docType, status, locale)
   - Template editor with Handlebars syntax highlighting
   - Variable palette sidebar
   - Preview functionality
   - Review/Approve/Publish actions

2. **Admin Documents Management** (`/admin/documents`)
   - Document list with filters
   - Document detail page
   - Download buttons (calls presigned URL endpoint)
   - Signing request UI

3. **Employee Self-Service** (`/me/documents`)
   - My documents list (payslips, letters, certificates)
   - Secure download buttons

## Environment Variables

Add to `.env`:

```bash
# S3 Storage (optional - falls back to local storage if not configured)
AWS_REGION=us-east-1
S3_BUCKET=zyberhr-documents
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_ENDPOINT=
S3_FORCE_PATH_STYLE=false

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Document Settings
DOCUMENT_PRESIGNED_URL_TTL=900
PDF_GENERATION_TIMEOUT=30000
DOCUMENT_BULK_BATCH_SIZE=250

# Enable Workers (set to 'true' to start workers)
ENABLE_DOCUMENT_WORKERS=false

# Signing Providers (placeholders)
DOCUSIGN_ENABLED=false
DOCUSIGN_CLIENT_ID=
DOCUSIGN_CLIENT_SECRET=
DOCUSIGN_ACCOUNT_ID=
DOCUSIGN_BASE_URL=https://demo.docusign.net
```

## Usage Examples

### Creating a Template

```typescript
POST /api/v1/documents/templates
{
  "docType": "OFFER_LETTER",
  "name": "Standard Offer Letter",
  "locale": "en",
  "engine": "HANDLEBARS_HTML",
  "content": "<h1>Offer Letter</h1><p>Dear {{employee.fullName}},</p>...",
  "variablesSchema": {
    "employee": {
      "type": "object",
      "properties": {
        "fullName": { "type": "string" },
        "salary": { "type": "number" }
      }
    }
  }
}
```

### Generating a Document

```typescript
POST /api/v1/documents/documents
{
  "docType": "PAYSLIP",
  "subjectType": "EMPLOYEE",
  "subjectId": "employee_id_here",
  "effectiveOn": "2024-01-31"
}
```

### Bulk Payslip Generation

```typescript
POST /api/v1/documents/documents/bulk
{
  "docType": "PAYSLIP",
  "payrollRunId": "payroll_run_id_here"
}
```

## Next Steps

1. **Install Dependencies**: Run `npm install` in the backend directory
2. **Set Up Redis**: Install and start Redis (or use Docker)
3. **Configure Storage**: Set up S3 or use local storage (default)
4. **Start Workers**: Set `ENABLE_DOCUMENT_WORKERS=true` or run workers separately
5. **Frontend Integration**: Create admin and employee UI pages
6. **E-Sign Integration**: Implement actual provider integrations (DocuSign, PandaDoc, etc.)

## Notes

- **Local Storage Fallback**: If S3 is not configured, the system falls back to local file storage in `uploads/documents/`
- **Worker Separation**: Workers can be run in a separate process for better scalability
- **Template Engine**: Currently supports Handlebars; Liquid support can be added
- **PDF Generation**: Uses Puppeteer with headless Chrome for high-quality PDFs
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Audit Trail**: All actions are logged for compliance

## Testing

To test the implementation:

1. Create a template via API
2. Submit for review and approve
3. Publish the template
4. Generate a document using the template
5. Download the generated document
6. Test bulk generation for payroll runs

## Architecture Decisions

- **Separation of Concerns**: Services are separated by responsibility
- **Async Processing**: Heavy operations (PDF generation) are queued
- **Storage Abstraction**: StorageService abstracts S3/local storage
- **RBAC**: Fine-grained access control at the service level
- **Versioning**: Templates are immutable once published (new versions created)
- **Context Resolution**: Centralized context building from various data sources
