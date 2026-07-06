class ValidationError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'ValidationError'
        this.code = 'VALIDATION_ERROR'
    }
}
class DuplicateEmailError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'DuplicateEmailError'
        this.code = 'DUPLICATE_EMAIL_ERROR'
    }
}
class PersistenceError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'PersistenceError'
        this.code = 'PERSISTENCE_ERROR'
    }
}
class NotificationError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'NotificationError'
        this.code = 'NOTIFICATION_ERROR'
    }
}
class RegistrationError extends Error {
    constructor(message, cause) {
        super(message, { cause });
        this.name = 'RegistrationError'
        this.code = 'REGISTRATION_ERROR'
    }
}

export { ValidationError, DuplicateEmailError, RegistrationError, PersistenceError, NotificationError }