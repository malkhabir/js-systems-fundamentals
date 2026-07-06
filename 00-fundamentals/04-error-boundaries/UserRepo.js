class UserRepo {
    constructor(users) {
        // users = [user1, user2, ...]
        // user: { id: 868, email: dfddfdf, password: dfdfdfdf, displayName: dfdfd}
        // Simple array ds to simulate a db
        this.db = [...users]
    }

    async create(user) {
        this.db.push(user)
        return {
            id: Math.random() * 1000, // Not serious. Exo is about errors :)
            ...user
        }
    }

    has(email) {
        return this.db.findIndex(user => user.email == email) !== -1
    }
}

export { UserRepo }