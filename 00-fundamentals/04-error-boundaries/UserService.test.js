import { describe, it, expect } from "vitest"
import {
    ValidationError,
    DuplicateEmailError,
    RegistrationError
} from "./Errors";

import { UserRepo } from "./UserRepo"
import { Logger } from "./Logger"
import { EmailGateway } from "./EmailGateway"
import { UserService } from "./UserService"

describe('ErrorBoundaries', () => {
    it('Passes', async () => {
        const users = [
            {
                email: "mo@gmail.com",
                password: "dfddffdf",
                displayName: "Mo Gmail"
            },
        ]

        let repo = new UserRepo(users)
        let gateway = new EmailGateway()
        let logger = new Logger("UserService")

        let service = new UserService(repo, gateway, logger)

        const result = await service.registerUser({
            email: 'dev@example.com',
            password: 'strongpass',
            displayName: 'Dev'
        });
        expect(result.user.email).toBe('dev@example.com');
        expect(result.user.id !== undefined).toBe(true);
        console.log(result.user)

    });

    it('Fails on invalid input (Short password)', async () => {
        const users = [
            {
                email: "mo@gmail.com",
                password: "dfddffdf",
                displayName: "Mo Gmail"
            },
        ]

        let repo = new UserRepo(users)
        let gateway = new EmailGateway()
        let logger = new Logger("UserService")

        let service = new UserService(repo, gateway, logger)

        await expect(service.registerUser({
            email: 'dev@example.com',
            password: '13',
            displayName: 'MoIsHere again'
        })).rejects.toThrow(ValidationError)
    });

    it('Fails on invalid input (Missing displayName)', async () => {
        const users = [
            {
                email: "mo@gmail.com",
                password: "dfddffdf",
                displayName: "Mo Gmail"
            },
        ]

        let repo = new UserRepo(users)
        let gateway = new EmailGateway()
        let logger = new Logger("UserService")

        let service = new UserService(repo, gateway, logger)

        await expect(service.registerUser({
            email: 'dev@example.com',
            password: 'gcdgftfyghhf',
            displayName: ''
        })).rejects.toThrow(ValidationError)
    });

    it('Fails on duplicate email', async () => {
        const users = [
            {
                email: "mo@gmail.com",
                password: "dfddffdf",
                displayName: "Mo Gmail"
            },
        ]

        let repo = new UserRepo(users)
        let gateway = new EmailGateway()
        let logger = new Logger("UserService")

        let service = new UserService(repo, gateway, logger)

        await expect(service.registerUser({
            email: 'mo@gmail.com',
            password: 'gcdgftfyghhf',
            displayName: 'Mo is here'
        })).rejects.toThrow(DuplicateEmailError)
    });

    it('Repo failure is translated', async () => {
        const users = [
            {
                email: "mo@gmail.com",
                password: "dfddffdf",
                displayName: "Mo Gmail"
            },
        ]

        let repo = new UserRepo(users)
        repo.create = async () => {
            throw new Error('ECONNRESET from primary database')
        }

        let gateway = new EmailGateway()
        let logger = new Logger("UserService")

        let service = new UserService(repo, gateway, logger)

        await expect(service.registerUser({
            email: 'mo@outlook.com',
            password: 'gcdgftfyghhf',
            displayName: 'Mo is here'
        })).rejects.toThrow(RegistrationError)
    });

    it('Notification fails but user created and warning returned', async () => {
        const users = [
            {
                email: "mo@gmail.com",
                password: "dfddffdf",
                displayName: "Mo Gmail"
            },
        ]

        let repo = new UserRepo(users)
        let gateway = new EmailGateway()
        gateway.sendWelcomeEmail = async () => {
            throw new Error('SMTP timeout');
        };

        let logger = new Logger("UserService")

        let service = new UserService(repo, gateway, logger)

        const res = await service.registerUser({
            email: 'mo@outlook.com',
            password: 'gcdgftfyghhf',
            displayName: 'Mo is here'
        })

        expect(res.warning).toBe("User created but welcome email failed")
        expect(res.user !== undefined).toBe(true)

    });
})