An exercise in experimenting, learning and remembering basic app building techniques

The code used in my article.

E2E, Functional, Acceptance, Integration

## POST /employees
- transforms the employee data to the legacy format
  - turns name to fullname
  - turns jobTitle to occupation
- adds metadata
  - adds the caller's email
  - adds the current time as YYYY-MM-DDTHH:MM:SS
  -
- saves it to the database
- saves a copy for history
  - adds a link to the main document
  - uses different id from the original
- returns the non transformed employee

BDD: subject predicate

## transforms the employee data to the legacy format
- startDate => startTime