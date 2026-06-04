# Bug tracking

## Dual-approach system

| Channel      | Discovery                         | Location               | Test adaptation                          |
|--------------|-----------------------------------|------------------------|------------------------------------------|
| AI-automated | During test development           | `bug-log/bug-log.json` | `req.bugs` metadata in specs             |
| Manual       | During manual/exploratory testing | Issue tracker          | `req.bugs` metadata (issue tracker link) |

## AI-automated bug logging

### Triggers

- Incorrect HTTP status codes
- Missing or improper error messages
- Unexpected response formats
- Inconsistent behavior vs documentation
- Security or validation issues
- UI rendering problems
- Broken user flows

### Bug entry structure

```json
{
  "id": "BUG-[MODULE]-XXX",
  "module": "ModuleName",
  "submodule": "SubmoduleName",
  "severity": "High|Medium|Low",
  "status": "Open|Resolved|Closed",
  "description": "Clear description",
  "expectedBehavior": "What should happen",
  "actualBehavior": "What actually happens",
  "endpoint": "METHOD /path",
  "reproducible": true,
  "dateReported": "YYYY-MM-DD",
  "affectedFields": [
    "field1"
  ],
  "notes": "Additional context"
}
```

### Bug ID format

| Test type | Pattern                         | Example            |
|-----------|---------------------------------|--------------------|
| API       | `BUG-[MODULE]-[NUMBER]`         | `BUG-BOOKING-002`  |
| UI        | `BUG-[PAGE/COMPONENT]-[NUMBER]` | `BUG-LOGIN-001`    |
| E2E       | `BUG-[WORKFLOW]-[NUMBER]`       | `BUG-CHECKOUT-003` |

### Test adaptation

When a bug is logged, the spec references it via `req.bugs` metadata:

```javascript
it('Module.Op.METHOD: Then return 500 status code', {
  req: { p: 'P1', bugs: ['BUG-BOOKING-002'] }
}, () => {
  cy.module__create__POST(payload, { failOnStatusCode: false }).then((res) => {
    expect(res.status).to.eq(500);
  });
});
```

Tests assert **actual** (current) behavior and pass. Expected behavior is documented in `bug-log.json`.

### Status lifecycle

| Status   | Description               |
|----------|---------------------------|
| Open     | Logged, pending review    |
| Resolved | Fixed in codebase         |
| Closed   | Verified and test updated |

### Review process

1. Review `bug-log/bug-log.json` weekly
2. Validate logged issues are legitimate bugs
3. Create issues in tracking system
4. Update `bug-log.json` notes with tracker URL

## Manual bug reporting

### When to report manually

- Bugs found during manual or exploratory testing
- Issues discovered during UI review or code review
- Stakeholder or end-user reports

### Linking to tests

Reference the issue tracker URL in `req.bugs` on the affected `it` block. Do not add inline
`// TODO:` comments — bug references belong in `req` metadata.

```javascript
it.skip(
  'CartPage.STANDARD: Then Checkout button is displayed and enabled',
  { req: { bugs: ['https://github.com/org/repo/issues/123'] } },
  () => {
    // ...
  },
);
```

When the bug affects every `it` in a suite (e.g. a shared workaround in `before`), declare
`req.bugs` on the `describe` config object instead:

```javascript
describe(
  'CartPage: Given user is authenticated',
  { testIsolation: false, req: { bugs: ['https://github.com/org/repo/issues/123'] } },
  () => {
    // ...
  },
);
```

### Severity classification

| Severity | Criteria                                                          |
|----------|-------------------------------------------------------------------|
| Critical | App crashes, data loss, security issues, complete feature failure |
| High     | Major feature broken, significant UX impact, no workaround        |
| Medium   | Feature works with issues, workaround available                   |
| Low      | Cosmetic issues, minor inconveniences, edge cases                 |

## Best practices

- Validate bugs are not test code issues
- Update tests when bugs are fixed (remove bug ref, assert correct behavior)
- Preserve original bug entries — never delete, only update status

## Related

- [Requirements examples approach](requirements-examples-approach.md)
- [Test writing guideline](test-writing-guideline.md)
- [ESLint custom rules](eslint-custom-rules.md) — `verify-req-config` rule
