import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';
import { z, ZodError } from 'zod';

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.json({ ok: true, message: 'Bem-vindo à API de Catálogo de Livros!' });
});

app.get('/api/books', async (_req: Request, res: Response) => {
    try {
        const books = await prisma.book.findMany();
        return res.status(200).json(books);
    } catch (error) {
        //console.error('GET /api/books error:', error);
        return res.status(500).json({ error: 'Erro ao buscar os livros' });
    }
});

app.get('/api/books/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if(!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        const book = await prisma.book.findUnique({ where: { id } });

        if(!book) {
            return res.status(404).json({ error: 'Livro não encontrado' });
        }

        return res.status(200).json(book);

    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar livro' });
    }
});

export const createBookSchema = z.object({
    title: z.string().min(3, 'O título deve ter pelo menos 2 caracteres'),
    author: z.string().min(10, 'O author deve ter pelo menos 5 caracteres')
});

app.post('/api/books', async (req: Request, res: Response) => {
    try {
        const data = createBookSchema.parse(req.body);
        const newBook = await prisma.book.create({ data });
        return res.status(201).json(newBook);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Payload inválido',
                issues: error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        console.error('POST /api/books error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor ao criar livro' });
    }
});

const updateBookSchema = createBookSchema.partial(); // Todos os campos são opcionais para atualização

app.put('/api/books/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if(!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try{
        const data = updateBookSchema.parse(req.body);
        const updated = await prisma.book.update({ where: { id }, data });
        return res.status(200).json(updated);
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                error: 'Payload inválido',
                issues: error.issues.map((e) => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Livro não encontrado' });
        }
        console.error('PUT /api/book/${req.params.id} error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor ao atualizar livro' });
    }
});

app.delete('/api/books/:id', async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    if(!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID inválido' });
    }

    try {
        await prisma.book.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
            return res.status(404).json({ error: 'Livro não encontrado' });
        }
        console.error('DELETE /api/book/${req.params.id} error:', error);
        return res.status(500).json({ error: 'Erro interno no servidor ao deletar livro' });
    }
});

const PORT = 3001;

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});