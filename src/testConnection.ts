import "dotenv/config";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    console.log("Conectando ao banco de dados...");

    const books = await prisma.book.findMany();

    console.log("Lista de livros encontrados:");
    books.forEach((book) => {
        console.log(`${book.title} - Autor: ${book.author}`);
    });
}

test()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });