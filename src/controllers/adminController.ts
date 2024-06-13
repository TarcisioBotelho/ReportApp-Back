import { Request, Response } from "express"
import prisma from "../instances/pg";
import JWT from 'jsonwebtoken';
import { tokenVerify } from "../helpers/functions/tokenVerify";
import { catchError } from "../helpers/functions/catchError";

export const getAllStatuses = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const statuses = await prisma.status.findMany();

        return res.status(200).json(statuses);
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const adminLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findFirst({ where: { email } });

        if (!email || !password) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Email ou password inválidos. Por favor tente novamente.' });
        }

        if (user.isAdmin === false) {
            return res.status(401).json({ message: 'Você não é um administrador. Por favor, logue como usuário.' });
        }

        const token = JWT.sign(
            { id: user.id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET_KEY as string,
            { expiresIn: process.env.TOKEN_EXPIRES_IN as string }
        );

        return res.status(200).json({ token, status: true });
    } catch (error) {
        console.error('Error:', error)
        return res.status(500).json({ message: error});
    }
};


//      User 'reports' routes. ↓↓↓

export const getFilteredReports = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        const { status, type, user_id } = req.query;

        const filters: any = {};

        if (status) {
            filters.status_id = parseInt(status as string);
        }

        if (type) {
            filters.type_id = parseInt(type as string);
        }

        if (user_id) {
            filters.id_user = parseInt(user_id as string);
        }

        const reports = await prisma.report.findMany({
            where: filters,
            include: {
                user: true,  // Inclui informações do usuário associado ao reporte
                type: true,  // Inclui informações do tipo do reporte
                status: true // Inclui informações do status do reporte
            }
        });

        if (reports.length === 0) {
            return res.status(200).json({ message: 'Nenhum reporte encontrado.' });
        }

        return res.status(200).json(reports);
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const addtype = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { newType } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json('Acesso negado.');
        }

        await prisma.type.create({
            data: { name: newType }
        })

        return res.status(201).json({ message: 'Tipo criado com sucesso.' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const updatetype = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { type_id, newtype } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        await prisma.type.update({
            where: { id: parseInt(type_id) },
            data: { name: newtype }
        });

        return res.status(200).json({ message: 'Tipo atualizado com sucesso.' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const deletetype = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { type_id } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso neagado' });
        }

        await prisma.type.delete({
            where: { id: parseInt(type_id) }
        });

        return res.status(204).json({ message: 'Type deletado com sucesso' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const addStatus = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { newStatus } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        await prisma.status.create({
            data: { name: newStatus }
        });

        return res.status(201).json({ message: 'Status criado com sucesso.' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const updateStatus = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { reportId, statusId } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        if (!reportId || !statusId) {
            return res.status(400).json({ message: 'Parâmetros inválidos.' });
        }

        const report = await prisma.report.update({
            where: { id: reportId },
            data: { status_id: statusId },
            include: { status: true } // Inclui o status atualizado na resposta
        });

        return res.status(200).json(report);
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const deleteStatus = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { status_id } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        await prisma.status.delete({
            where: { id: status_id }
        });

        return res.status(204).json({ message: 'Status deletado com sucesso.' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error)
        }
    }
};

export const changeReportStatus = async (req: Request, res: Response) => {
    try {
        const adminToken = tokenVerify(req);
        const { report_id, status_id } = req.body;

        if (!adminToken.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado.' });
        }

        if (!report_id || !status_id) {
            return res.status(404).json({ message: `'reportId' ou 'statusId' não encontrado(s).`})
        }

        await prisma.report.update({
            where: { id: parseInt(report_id) },
            data: { status_id: parseInt(status_id) }
        })

        return res.status(200).json({ message: 'Status do reporte alterado com sucesso.' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error)
        }
    }
};