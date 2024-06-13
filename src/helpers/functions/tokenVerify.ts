import JWT from 'jsonwebtoken';
import { Request } from "express";

export function tokenVerify(req: Request) {
    if (!req.headers.authorization) {
        throw new Error('Authorization is required.');
    }

    const [authType, token] = req.headers.authorization.split(' ');

    if (authType !== 'Bearer') {
        throw new Error('authType inválido.');
    }

    return JWT.verify(token, process.env.JWT_SECRET_KEY as string) as { id: number, isAdmin: boolean };
}