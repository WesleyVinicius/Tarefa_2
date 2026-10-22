import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import { z, ZodError } from 'zod';

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT) || 3001;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';

// CORS: só a origem do front-end, com os métodos e headers que a API realmente usa
app.use(
    cors({
        origin: ALLOWED_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type']
    })
);
app.use(express.json());

export const createBookSchema = z.object({
    title: z.string().min(3, 'O título deve ter pelo menos 3 caracteres'),
    author: z.string().min(3, 'O autor deve ter pelo menos 3 caracteres')
});

// Todos os campos são opcionais na atualização
const updateBookSchema = createBookSchema.partial();

function parseId(raw: string): number | null {
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}

function zodResponse(res: Response, error: ZodError) {
    return res.status(400).json({
        error: 'Payload inválido',
        issues: error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message
        }))
    });
}

app.get('/', (_req: Request, res: Response) => {
    res.json({ ok: true, message: 'Bem-vindo à API de Catálogo de Livros!' });
});

app.get('/api/books', async (_req: Request, res: Response) => {
    try {
        const books = await prisma.book.findMany();
        return res.status(200).json(books);
    } catch (error) {
        console.error('GET /api/books error:', error);
        return res.status(500).json({ error: 'Erro ao buscar os livros' });
    }
});

app.get('/api/books/:id', async (req: Request, res: Response) => {
    const id = parseId(String(req.params.id));
    if (id === null) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const book = await prisma.book.findUnique({ where: { id } });

        if (!book) {
            return res.status(404).json({ error: 'Livro não encontrado' });
        }

        return res.status(200).json(book);
    } catch (error) {
        console.error(`GET /api/books/${id} error:`, error);
        return res.status(500).json({ error: 'Erro ao buscar livro' });
    }
});

app.post('/api/books', async (req: Request, res: Response) => {
    try {
        const data = createBookSchema.parse(req.body);
        const newBook = await prisma.book.create({ data });
        return res.status(201).json(newBook);
    } catch (error) {
        if (error instanceof ZodError) {
            return zodResponse(res, error);
        }
        console.error('POST /api/books error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor ao criar livro' });
    }
});

app.put('/api/books/:id', async (req: Request, res: Response) => {
    const id = parseId(String(req.params.id));
    if (id === null) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const data = updateBookSchema.parse(req.body);
        const updated = await prisma.book.update({ where: { id }, data });
        return res.status(200).json(updated);
    } catch (error) {
        if (error instanceof ZodError) {
            return zodResponse(res, error);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Livro não encontrado' });
        }
        console.error(`PUT /api/books/${id} error:`, error);
        return res.status(500).json({ error: 'Erro interno no servidor ao atualizar livro' });
    }
});

app.delete('/api/books/:id', async (req: Request, res: Response) => {
    const id = parseId(String(req.params.id));
    if (id === null) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        await prisma.book.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Livro não encontrado' });
        }
        console.error(`DELETE /api/books/${id} error:`, error);
        return res.status(500).json({ error: 'Erro interno no servidor ao deletar livro' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});