class EmailGateway {
    constructor() {
        // Note sure what is needed here.
        // Should be fine left empty as this is not the goal of exo
    }

    sendEmail(msg) {
        // Make sure msg is valid
        // Normally this function would be touching the email sending client directly so some error translation might occur here?
        let sentEmail;
        if (msg == null || msg == undefined || msg == "") {
            const errorMsg = "The message has not been sent because '" + msg + "' is undefined or empty."
            throw new Error(errorMsg)
        }

        return sentEmail;
    }

    sendWelcomeEmail(user) {
        const welcomeMsg = "Hey welcome here!" + user.displayName
        return this.sendEmail(welcomeMsg)
    }

}

export { EmailGateway }