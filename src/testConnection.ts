import "dotenv/config";
import { PrismaClient } from './generated/prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log("Conectando ao banco de dados...")

    const books = await prisma.books.findMany()

    console.log("Lista de livros encontrados:")
    books.forEach(books => {
        console.log(`${books.title} - Autor: ${books.author}`);
    });
}

test();