import { Response } from "express";

export function catchError(res: Response, error: Error) {
    if (error.message === 'Authorization is required.' || error.message === 'authType inválido.') {
        return res.status(401).json({ message: error.message });
    }

    console.error('Error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor.' });
}