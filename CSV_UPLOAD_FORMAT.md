# CSV Upload Format for Completed Cases

## Required Columns

Your CSV file must have the following columns (in any order):

1. **Date of Procedure** (required)
   - Format: MM/DD/YYYY or YYYY-MM-DD
   - Example: `3/31/2025` or `2025-03-31`

2. **Patient Name** (required)
   - Example: `John Doe`

## Optional Columns

The following columns are optional but will be imported if present:

3. **In-patient Number**
   - Example: `24019462`

4. **Patient Age**
   - Can be a number or text like "2 years 3 months"
   - Example: `47` or `2 years 3 months`

5. **Amount**
   - Should be a number without commas
   - Example: `50000` (not `50,000`)

6. **Payment Status**
   - Values: `Pending`, `Paid`, `Partially Paid`, `Pro Bono`, `Cancelled`
   - Example: `Paid`

7. **Additional Notes**
   - Any additional comments or notes
   - Example: `The case was very difficult`

## Example CSV

```csv
Date of Procedure,Patient Name,In-patient Number,Patient Age,Amount,Payment Status,Additional Notes
3/31/2025,John Doe,24019462,47,50000,Paid,The case was very difficult
4/1/2025,Jane Smith,22002286,63,100000,Pending,
4/2/2025,Bob Johnson,,55,75000,Paid,
```

## Notes

- The first row must contain column headers
- Date of Procedure and Patient Name are required - rows without these will be skipped
- All cases uploaded via CSV will be marked as **Completed** status
- Cases are automatically assigned to the selected user
- Duplicate cases (same patient name and date) will be skipped

