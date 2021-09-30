The code used in my article.

E2E, Functional, Acceptance, Integration
## POST /employees
- transforms the employee data to the legacy format
- adds metadata
- saves it to the database
- saves a copy for history
- returns the non transformed employee

## transforms the employee data to the legacy format
- startDate => startTime