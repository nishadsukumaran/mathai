# MathAI API Standards

## Response Format
All endpoints return `ApiSuccess<T>` or `ApiError` (from `types/index.ts`).

```json
// Success
{ "success": true, "data": { ... }, "meta": { ... } }

// Error
{ "success": false, "error": { "code": "NOT_FOUND", "message": "Topic not found" } }
```

## Error Codes
| Code | HTTP | When |
|------|------|------|
| VALIDATION_ERROR | 400 | Zod schema failure |
| UNAUTHORIZED | 401 | No/invalid token |
| FORBIDDEN | 403 | Authenticated but not allowed |
| NOT_FOUND | 404 | Resource missing |
| AI_ERROR | 503 | AI model call failed |
| INTERNAL_ERROR | 500 | Unexpected |

## Versioning
Current version: v1 (unversioned URLs are v1 by convention).
When breaking changes are needed: add `/api/v2/` prefix for new version.

## Pagination
Use cursor-based pagination for lists: `?cursor=<lastId>&limit=20`
Never use offset pagination for large datasets.

## Rate Limiting
- AI endpoints (`/practice/hint`, `/practice/explanation`): 10 req/min per student
- Other endpoints: 100 req/min per student
- Implemented in `api/middlewares/rateLimit.middleware.ts`
