# Test Coverage Gap Analysis Report

**Generated**: 2026-03-13 18:30:42

## Summary Across All Test Types

| Type               | Expected Paths | Actual Paths | Path Coverage | Tests (Active/Total) | Test Coverage | Missing | Extra |
|--------------------|----------------|--------------|---------------|----------------------|---------------|---------|-------|
| Integration UI 🟢  | 1              | 8            | **100%**      | 142/144              | 98.6%         | 0       | 8     |
| Integration API 🟢 | 1              | 6            | **100%**      | 43/44                | 97.7%         | 0       | 6     |
| E2E UI 🟢          | 1              | 1            | **100%**      | 5/5                  | 100%          | 0       | 1     |

---

# Test Coverage Gap Analysis Report

**Generated**: 2026-03-13 18:30:42  
**Type**: Integration UI

## Summary

| Metric         | Value                    |
|----------------|--------------------------|
| Total Expected | 1                        |
| Total Actual   | 8                        |
| Total Tests    | 144                      |
| Active Tests   | 142                      |
| Skipped Tests  | 2                        |
| Path Coverage  | **100%**                 |
| Test Coverage  | **98.6%** (active/total) |
| Missing        | 0                        |
| Extra          | 8                        |

**Status**: 🟢 Excellent coverage!

## Missing Coverage

✅ **No missing coverage!** All expected paths are covered.

## Extra Coverage (8 paths)

These paths exist in actual tests but are not in the expected structure:

- ⚠️ `CartPage.STANDARD`
- ⚠️ `Footer.STANDARD`
- ⚠️ `Header.STANDARD`
- ⚠️ `InventoryPage.STANDARD`
- ⚠️ `InventoryPage.Footer.STANDARD`
- ⚠️ `InventoryPage.Card.STANDARD`
- ⚠️ `InventoryPage.Header.STANDARD`
- ⚠️ `LoginPage.STANDARD`

## Coverage by Component

| Component     | Expected Paths | Actual Paths | Path Coverage | Tests (Active/Total) | Test Coverage | Status   |
|---------------|----------------|--------------|---------------|----------------------|---------------|----------|
| CartPage      | 0              | 1            | N/A           | 21/21                | 100%          | ⚠️ Extra |
| Footer        | 0              | 1            | N/A           | 9/9                  | 100%          | ⚠️ Extra |
| Header        | 0              | 1            | N/A           | 27/27                | 100%          | ⚠️ Extra |
| InventoryPage | 0              | 4            | N/A           | 47/49                | 95.9%         | ⚠️ Extra |
| LoginPage     | 0              | 1            | N/A           | 38/38                | 100%          | ⚠️ Extra |

## Recommendations

✅ Coverage is complete! Consider:

1. Maintaining this coverage level as features evolve
2. Reviewing and updating expected structure for new features
3. Ensuring test quality matches coverage quantity

---

# Test Coverage Gap Analysis Report

**Generated**: 2026-03-13 18:30:42  
**Type**: Integration API

## Summary

| Metric         | Value                    |
|----------------|--------------------------|
| Total Expected | 1                        |
| Total Actual   | 6                        |
| Total Tests    | 44                       |
| Active Tests   | 43                       |
| Skipped Tests  | 1                        |
| Path Coverage  | **100%**                 |
| Test Coverage  | **97.7%** (active/total) |
| Missing        | 0                        |
| Extra          | 6                        |

**Status**: 🟢 Excellent coverage!

## Missing Coverage

✅ **No missing coverage!** All expected paths are covered.

## Extra Coverage (6 paths)

These paths exist in actual tests but are not in the expected structure:

- ⚠️ `RestfulBooker.Auth.GET`
- ⚠️ `RestfulBooker.Booking.Create.POST`
- ⚠️ `RestfulBooker.Booking.Retrieve.GET`
- ⚠️ `RestfulBooker.Booking.Update.PUT`
- ⚠️ `RestfulBooker.Booking.PartialUpdate.PATCH`
- ⚠️ `RestfulBooker.Booking.Delete.DELETE`

## Coverage by Component

| Component     | Expected Paths | Actual Paths | Path Coverage | Tests (Active/Total) | Test Coverage | Status   |
|---------------|----------------|--------------|---------------|----------------------|---------------|----------|
| RestfulBooker | 0              | 6            | N/A           | 43/44                | 97.7%         | ⚠️ Extra |

## Recommendations

✅ Coverage is complete! Consider:

1. Maintaining this coverage level as features evolve
2. Reviewing and updating expected structure for new features
3. Ensuring test quality matches coverage quantity

---

# Test Coverage Gap Analysis Report

**Generated**: 2026-03-13 18:30:42  
**Type**: E2E UI

## Summary

| Metric         | Value                   |
|----------------|-------------------------|
| Total Expected | 1                       |
| Total Actual   | 1                       |
| Total Tests    | 5                       |
| Active Tests   | 5                       |
| Skipped Tests  | 0                       |
| Path Coverage  | **100%**                |
| Test Coverage  | **100%** (active/total) |
| Missing        | 0                       |
| Extra          | 1                       |

**Status**: 🟢 Excellent coverage!

## Missing Coverage

✅ **No missing coverage!** All expected paths are covered.

## Extra Coverage (1 paths)

These paths exist in actual tests but are not in the expected structure:

- ⚠️ `CompletePurchase.STANDARD`

## Coverage by Component

| Component        | Expected Paths | Actual Paths | Path Coverage | Tests (Active/Total) | Test Coverage | Status   |
|------------------|----------------|--------------|---------------|----------------------|---------------|----------|
| CompletePurchase | 0              | 1            | N/A           | 5/5                  | 100%          | ⚠️ Extra |

## Recommendations

✅ Coverage is complete! Consider:

1. Maintaining this coverage level as features evolve
2. Reviewing and updating expected structure for new features
3. Ensuring test quality matches coverage quantity

---

