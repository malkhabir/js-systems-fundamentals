import Validator from "../01-input-validator/validator";
import { ValidationError, DuplicateEmailError, 
    PersistenceError, NotificationError, RegistrationError } from "./Errors";

class UserService {
    constructor(repo, gateway, logger) {
        this.repo = repo
        this.gateway = gateway
        this.logger = logger

        this.validator = new Validator(this.schema) // Would have been better to have this passed in instead of creating it here
    }

    schema = {
        email: {
            type: 'string',
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        password: {
            type: 'string',
            required: true,
            minLength: 8,
            maxLength: 50
        },
        displayName: {
            type: 'string',
            required: true,
            minLength: 2,
            maxLength: 10
        }
    }

    isInputValid(input) {
        // { valid: true, errors: [] }
        let results = this.validator.validate(input)

        if (results.errors.length > 0) {
            const errorMsg = "A validation error occured during the validation of user input"
            const errors = results.errors
            throw new ValidationError(errorMsg, errors)
        }

        return true;
    }

    isEmailAvailable(email) {
        const exists = this.repo.has(email)
        if (exists) throw new DuplicateEmailError("Email not available", { cause: {} })
        return true
    }

    async createUser(user) {
        let createdUser;
        try {
            createdUser = await this.repo.create(user)
        } catch (error) {
            const errorMsg = "The repo failed to create the user"
            throw new PersistenceError(errorMsg, { cause: error })
        }
        return createdUser;
    }

    async sendWelcomeEmail(user) {
        let sentEmail;
        try {
            sentEmail = await this.gateway.sendWelcomeEmail(user)
        } catch (error) {
            const errorMsg = "The gateway failed to send the email"
            throw new NotificationError(errorMsg, { cause: error })
        }

        return sentEmail;
    }

    async registerUser(input) {
        const start = Date.now()
        try {
            if (!input) throw new Error("Invalid input provided: " + input)

            const isValid = this.isInputValid(input)
            const isEmailAvailable = this.isEmailAvailable(input.email)
            let createdUser;

            try {
                createdUser = await this.createUser(input)
            } catch (error) {
                const errorMsg = "An error occured during registration: " + error.message
                throw new RegistrationError(errorMsg, error)
            }

            try {
                const sentNotification = await this.sendWelcomeEmail(createdUser)
            } catch (error) {
                return {
                    user: createdUser,
                    warning: 'User created but welcome email failed'
                }
            }

            return {
                user: createdUser
            }

        } finally {
            const duration = Date.now() - start
            this.logger.log("register user took: " + duration + "ms")
        }
    }
}

export { UserService }