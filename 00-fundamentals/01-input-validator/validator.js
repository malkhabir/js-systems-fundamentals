// Take a validator
// parse the schema
// use the schema to validate data
// if error, then return error obj


// We collect all errors instead of failing fast.
// This allows the user to fix multiple fields then submit.
class Validator {
  constructor(schema) {
    if (!this.isValid(schema)) {
      throw Error("Wrong schema provided");
    }
    this.schema = schema;
  }

  isValid (schema) {
    return typeof schema == "object" && 
    schema !== null && 
    !Array.isArray(schema);
  }

  getFieldValidator (type) {
    switch(type) {
      case "string":
        return (r, v) => {
          if (r.required && (v === undefined || v == null))
            return "REQUIRED"

          if (!r.required && (v === undefined || v == null))
            return;

          if (r.type !== typeof v)
            return "INVALID_TYPE";

          if (r.minLength > v.length)
            return "MIN_LENGTH";

          if (r.maxLength < v.length)
            return "MAX_LENGTH"
          
          if (r.pattern && !r.pattern?.test(v))
            return "PATTERN_MISMATCH";
        }

      case "number":
        return (r, v) => {
          if (r.required && (v === undefined || v == null))
            return "REQUIRED";
          
          if (!r.required && (v === undefined || v == null))
            return;

          if (r.type !== typeof v)
            return "INVALID_TYPE";

          if (typeof r.min == "number" && r.min > v) 
            return "MIN_VALUE";

          if (typeof r.max == "number" && r.max < v)
            return "MAX_VALUE";
        }

      case "array": 
        return (r, v) => {
          if (r.required && (v === undefined || v == null))
            return "REQUIRED";
          
          if (!r.required && (v === undefined || v == null))
            return;
          
          if (!Array.isArray(v))
            return "INVALID_TYPE";

          if (Array.isArray(v) && r.minItems > v.length)
            return "MIN_ITEMS";

          if (Array.isArray(v) && r.maxItems < v.length)
            return "MAX_ITEMS"

          if (v.some(item => typeof item !== r.itemType))
            return "INVALID_ITEM_TYPE"
        }
      
      case "boolean":
        return (r, v) => {
          if (r.required && (v === undefined || v == null))
            return "REQUIRED";

          if (!r.required && (v === undefined || v == null))
            return;

          if (r.type !== typeof v)
            return "INVALID_TYPE"
        }
    }
  }

  getErrorMessages (code) {
    switch (code) {
      case "REQUIRED":
        return "field is required but missing"
        break;
      case "INVALID_TYPE":
        return "Wrong type provided"
        break;
      case "MIN_LENGTH":
        return "String too short"
        break;
      case "MAX_LENGTH":
        return "String too long"
        break;
      case "PATTERN_MISMATCH":
        return "Doesn't match regex"
        break;
      case "MIN_VALUE":
        return "Number too small"
        break;
      case "MAX_VALUE":
        return "Number too large"
        break;
      case "MIN_ITEMS":
        return "Array has too few items"
        break;
      case "MAX_ITEMS":
        return "Array has too many items"
        break;
      case "INVALID_ITEM_TYPE":
        return "Array item has wrong type"
        break;
    
      default:
        return;
        break;
    }
  }
  
  validate(input) { 
    const errorList = [];

    if (!this.isValid(input)) {
      const errorCode = "INVALID_TYPE"
      const errorMessage = this.getErrorMessages(errorCode)
      const error = {
        field: "ALL",
        code: errorCode,
        message: errorMessage
      }

      return {
        valid: false,
        errors: [ error ]
      }
    }

    for (const [field, rule] of Object.entries(this.schema)) {
      if (rule == null || rule.type == null || rule.type == undefined)
        continue; // No need to apply the rule if the schema does not define one
      
      const value = input[field]
      const fieldValidator = this.getFieldValidator(rule.type);
      if (fieldValidator === undefined) {
        errorList.push({ 
          field, 
          code: "INVALID_TYPE", 
          message: `Could not find the validator associated with '${field}'`})
        continue
      }

      const errorCode = fieldValidator(rule, value);
      if (errorCode !== undefined) {
        const errorMessage = this.getErrorMessages(errorCode);

        errorList.push({ 
          field: field, 
          code: errorCode,
          message: errorMessage
        });
      }
      
    }

    return {
      valid: errorList.length == 0,
      errors: errorList
    }
  }


}

export default Validator;