## Problem
Create a Validator class that validates objects against a schema definition

## API
const validator = new Validator(schema)
const res = validator.validate()

expected shape:
{ valid: true, errors: [] }
{ valid: false, errors: [...] }


## Invariants
- The return value of validate() is always {valid: boolean, errors: Array}
errors is always an array. So it should never be null, undefined or a single obj
- A field produces only valid error codes from the allowed set
- A field with required: true must produce a REQUIRED error if missing or undefined
- A field is validated only if it exists, unless it is required
- Validation of one field must not stop validation of others (no early exit)
- Each error always includes:
    * field
    * message
    * code


## Edge cases
- validate(null) → must return { valid: false, errors: [...] }
- validate(undefined) → same as above
- validate(primitive) (string, number, boolean) → invalid input object
- validate({}) → only required fields fail
- Extra fields not defined in schema → ignored (do not error)

## Design choices
- validateString()
- validateNumber()
- validateArray()
- validateBoolean()