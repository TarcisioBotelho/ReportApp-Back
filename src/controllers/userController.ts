import { Request, Response } from "express";
import { user } from "@prisma/client";
import prisma from "../instances/pg";
import JWT from 'jsonwebtoken';
import { tokenVerify } from "../helpers/functions/tokenVerify";
import { catchError } from "../helpers/functions/catchError";

//      User routes. ↓↓↓

export const register = async (req: Request, res: Response) => {
    console.log('Request Body:', req.body);

    const { name, email, password } = req.body;
    const hasUser = await prisma.user.findFirst({ where: { email } });

    if (!name || !email || !password) {
        return res.status(401).json({ message: 'Por favor, prencha todos os campos.' });
    }

    if (hasUser) {
        return res.status(401).json({ message: 'Email já cadastrado.' });
    }

    try {
        const newUser = await prisma.user.create({ data: { name, email, password } }); 
        const token = JWT.sign(
            { id: newUser.id, isAdmin: newUser.isAdmin },
            process.env.JWT_SECRET_KEY as string,
            { expiresIn: process.env.TOKEN_EXPIRES_IN as string }
        )

        return res.status(201).json({ message: 'Usuário criado com sucesso!', token })
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: error });
    }
}

export const login = async (req: Request, res: Response) => {
    let { email, password }: user = req.body;
    let user = await prisma.user.findFirst({ where: { email, password } });

    if (!email || !password) {
        return res.status(401).json({ message: 'Por favor, preencha todos os campos.' })
    }

    if (!user) {
        return res.status(401).json({ message: 'Email ou password inválido. Por favor tente novamente.'})
    }

    try {
        const token = JWT.sign(
            { id: user.id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET_KEY as string,
            {  expiresIn: process.env.TOKEN_EXPIRES_IN as string }
        );

        return res.status(200).json({ status: true, token });

    } catch (error) {
        console.error('Error:', error)
        return res.status(401).json({ status: false });
    }
}

export const updateUserInfo = async (req: Request, res: Response) => {
    try {
        const { name, email, password, currentPassword } = req.body;
        const token = tokenVerify(req);

        let user = await prisma.user.findFirst({ where: {id: token.id } });
        
        if (!token) {
            return res.status(400).json({ message: 'Token JWT é obrigatório.' });
        }

        if (user?.password != currentPassword) {
            return res.status(401).json({ message: 'password de verificação incorreta.'})
        }

        await prisma.user.update({
            where: { id: token.id },
            data: { name, email, password }
        });

        return res.status(200).json({ message: 'Informações do usuário atualizadas com sucesso.' });
    } catch (error) {
        console.error('Erro ao atualizar informações do usuário:', error);
        return res.status(401).json({ message: 'Token JWT inválido.' });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { currentPassword } = req.body;
        const token = tokenVerify(req);
        const user = await prisma.user.findFirst({ where: { id: token.id } });

        if (!currentPassword) {
            return res.status(400).json({ message: 'Por favor, preencha a password de verificação.' });
        }

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        if (user.password !== currentPassword) {
            return res.status(401).json({ message: 'password de verificação incorreta.' });
        }

        await prisma.user.delete({ where: { id: user.id } });

        return res.status(204).json({ message: 'Usuário excluído com sucesso.' });

    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        return res.status(500).json({ message: 'Erro interno do servidor.' });
    }
};

export const myProfile = async (req: Request, res: Response) => {
    try {
        const token = tokenVerify(req);
        const user = await prisma.user.findUnique({ where: { id: token.id } });

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        return res.status(200).json({ user });

    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};


//      User 'reports' routes. ↓↓↓

export const typeList = async (req: Request, res: Response) => {
    try {
        const type = await prisma.type.findMany();

        if (type.length === 0) {
            return res.status(200).json({ message: 'Nenhum type cadastrado.' });
        }

        return res.status(200).json({ type });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Erro interno do servidor.' })
    }
}

export const myReports = async (req: Request, res: Response) => {
    try {
        const token = tokenVerify(req);
        const reports = await prisma.report.findMany({
            where: { id_user: token.id },
            include: {
                status: true, // Incluir a relação com a tabela status
                type: true    // Incluir a relação com a tabela type
            }
        });

        if (reports.length === 0) {
            return res.status(200).json({ message: 'Nenhum report encontrado.' });
        }

        return res.status(200).json(reports);
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

// userController.ts
export const myReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: { type: true } // Incluindo a relação com a tabela type
    });

    if (!report) {
      return res.status(404).json({ message: 'Report não encontrado.' });
    }

    return res.status(200).json(report);
  } catch (error) {
    if (error instanceof Error) {
      catchError(res, error);
    }
  }
};


export const addReport = async (req: Request, res: Response) => {
    try {
        const token = tokenVerify(req);

        const { title, type, description, image, location } = req.body;

        if(!title || !type || !description || !location) {
            return res.status(400).json({ message: 'Por favor, preencha todos os campos.' });
        }

        const status = await prisma.status.findFirst({
            where: {
                name: {
                    contains: "Enviado",
                    mode: "insensitive"
                }
            }
        });

        if (!status) {
            return res.status(404).json({ message: 'Status "Enviado" não encontrado.' });
        }

        await prisma.report.create({
            data: {
                title: title,
                type_id: parseInt(type),
                description: description,
                image: image || null,
                location: location,
                status_id: status.id,
                id_user: token.id
            }
        });

        return res.status(201).json({ message: 'Reporte criado com sucesso.'});
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const updateReport = async (req: Request, res: Response) => {
    try {
        const token = tokenVerify(req);
        const { report_id, title, type, description, image, location } = req.body;

        await prisma.report.update({
            where: { id: report_id, id_user: token.id },
            data: {
                title: title,
                type_id: parseInt(type),
                description: description,
                image: image || null,
                location: location,
                status_id: 1,
            }
        });

        return res.status(200).json({ message: 'Reporte atualizado com sucesso.'});
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};

export const deleteReport = async (req: Request, res: Response) => {
    try {
        const token = tokenVerify(req);
        const { report_id } = req.body;

        await prisma.report.delete({
            where: { id: report_id, id_user: token.id }
        });

        return res.status(204).json({ message: 'Reporte apagado com sucesso.' });
    } catch (error) {
        if (error instanceof Error) {
            catchError(res, error);
        }
    }
};