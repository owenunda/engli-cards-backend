import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { envConfig } from '../config/envConfig';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;

    constructor() {
        const env = envConfig();

        // Configuración del pool usando solo las variables disponibles en envConfig
        const poolConfig = {
            host: env.DB_HOST,
            port: Number(env.DB_PORT),
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            connectionTimeoutMillis: 5000,
        };

        this.pool = new Pool(poolConfig);
    }

    async onModuleInit() {
        try {
            console.log('🔌 Conectando a la base de datos... - database.service.ts:27');
            // Intento de conexión para validar credenciales
            const client = await this.pool.connect();
            client.release();
            console.log('✅ Conexión a DB exitosa - database.service.ts:31');

            await this.ensureStudyTimeColumns();
            await this.ensureOnboardingTables();
        } catch (error) {
            console.error('❌ Error al conectar con PostgreSQL: - database.service.ts:33', error);
            throw error;
        }

        // 🔁 Keep alive cada 60 s
        setInterval(async () => {
            try {
                const client = await this.pool.connect();
                await client.query('SELECT 1');
                client.release();
            } catch (e) {
                console.error('❌ Error en keepalive de PostgreSQL: - database.service.ts:44', e);
            }
        }, 60000);
    }

    async onModuleDestroy() {
        if (this.pool) {
            await this.pool.end();
            console.log('🔌 Conexión a PostgreSQL cerrada - database.service.ts:52');
        }
    }

    async getClient(): Promise<PoolClient> {
        return await this.pool.connect();
    }

    async query(text: string, params?: any[]): Promise<any> {
        const client = await this.getClient();
        try {
            const result = await client.query(text, params);
            return result;
        } finally {
            client.release();
        }
    }

    async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    private async ensureStudyTimeColumns() {
        const alterUsers = `
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS study_time_total_seconds INTEGER DEFAULT 0;
        `;

        const alterSessions = `
            ALTER TABLE IF EXISTS user_quiz_sessions
            ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
        `;

        await this.query(alterUsers);
        await this.query(alterSessions);
    }

    private async ensureOnboardingTables() {
        await this.query(`
            ALTER TABLE IF EXISTS users
            ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE
        `);

        await this.query(`
            CREATE TABLE IF NOT EXISTS preset_categories (
                id SERIAL PRIMARY KEY,
                key VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                emoji VARCHAR(20) NOT NULL,
                description TEXT,
                color VARCHAR(20)
            )
        `);

        await this.query(`
            CREATE TABLE IF NOT EXISTS preset_decks (
                id SERIAL PRIMARY KEY,
                category_key VARCHAR(50) NOT NULL REFERENCES preset_categories(key),
                name VARCHAR(100) NOT NULL
            )
        `);

        await this.query(`
            CREATE TABLE IF NOT EXISTS preset_flashcards (
                id SERIAL PRIMARY KEY,
                deck_id INTEGER NOT NULL REFERENCES preset_decks(id),
                word VARCHAR(200) NOT NULL,
                translation VARCHAR(200) NOT NULL
            )
        `);

        const existing = await this.query(`SELECT COUNT(*) AS count FROM preset_categories`);
        if (parseInt(existing.rows[0].count) > 0) return;

        const categories = [
            { key: 'saludos',  name: 'Saludos',  emoji: '👋', description: 'Frases básicas del día a día',    color: '#4CAF50' },
            { key: 'viajes',   name: 'Viajes',   emoji: '✈️', description: 'Vocabulario para explorar el mundo', color: '#2196F3' },
            { key: 'trabajo',  name: 'Trabajo',  emoji: '💼', description: 'Inglés profesional y de oficina',  color: '#FF9800' },
            { key: 'familia',  name: 'Familia',  emoji: '👨‍👩‍👧', description: 'Miembros de la familia',         color: '#E91E63' },
            { key: 'escuela',  name: 'Escuela',  emoji: '📚', description: 'Vocabulario académico',            color: '#9C27B0' },
            { key: 'frutas',   name: 'Frutas',   emoji: '🍎', description: 'Frutas y alimentos naturales',     color: '#F44336' },
            { key: 'comida',   name: 'Comida',   emoji: '🍽️', description: 'Comidas y bebidas del día',        color: '#795548' },
            { key: 'colores',  name: 'Colores',  emoji: '🎨', description: 'Los colores del arcoíris',         color: '#607D8B' },
        ];

        const presetData: Record<string, { deckName: string; flashcards: { word: string; translation: string }[] }> = {
            saludos: {
                deckName: 'Saludos básicos',
                flashcards: [
                    { word: 'Hello',          translation: 'Hola' },
                    { word: 'Good morning',   translation: 'Buenos días' },
                    { word: 'Good afternoon', translation: 'Buenas tardes' },
                    { word: 'Good night',     translation: 'Buenas noches' },
                    { word: 'Thank you',      translation: 'Gracias' },
                    { word: 'Please',         translation: 'Por favor' },
                    { word: 'Goodbye',        translation: 'Adiós' },
                    { word: 'How are you?',   translation: '¿Cómo estás?' },
                    { word: "You're welcome", translation: 'De nada' },
                    { word: 'Excuse me',      translation: 'Disculpe' },
                ],
            },
            viajes: {
                deckName: 'Vocabulario de viajes',
                flashcards: [
                    { word: 'Airport',       translation: 'Aeropuerto' },
                    { word: 'Ticket',        translation: 'Boleto' },
                    { word: 'Passport',      translation: 'Pasaporte' },
                    { word: 'Luggage',       translation: 'Equipaje' },
                    { word: 'Reservation',   translation: 'Reservación' },
                    { word: 'Map',           translation: 'Mapa' },
                    { word: 'Hotel',         translation: 'Hotel' },
                    { word: 'Train station', translation: 'Estación de tren' },
                    { word: 'Museum',        translation: 'Museo' },
                    { word: 'Beach',         translation: 'Playa' },
                ],
            },
            trabajo: {
                deckName: 'Inglés de oficina',
                flashcards: [
                    { word: 'Meeting',      translation: 'Reunión' },
                    { word: 'Deadline',     translation: 'Fecha límite' },
                    { word: 'Project',      translation: 'Proyecto' },
                    { word: 'Manager',      translation: 'Gerente' },
                    { word: 'Report',       translation: 'Informe' },
                    { word: 'Office',       translation: 'Oficina' },
                    { word: 'Presentation', translation: 'Presentación' },
                    { word: 'Contract',     translation: 'Contrato' },
                    { word: 'Employee',     translation: 'Empleado' },
                    { word: 'Schedule',     translation: 'Horario' },
                ],
            },
            familia: {
                deckName: 'Miembros de la familia',
                flashcards: [
                    { word: 'Father',      translation: 'Padre' },
                    { word: 'Mother',      translation: 'Madre' },
                    { word: 'Brother',     translation: 'Hermano' },
                    { word: 'Sister',      translation: 'Hermana' },
                    { word: 'Son',         translation: 'Hijo' },
                    { word: 'Daughter',    translation: 'Hija' },
                    { word: 'Grandfather', translation: 'Abuelo' },
                    { word: 'Grandmother', translation: 'Abuela' },
                    { word: 'Uncle',       translation: 'Tío' },
                    { word: 'Aunt',        translation: 'Tía' },
                ],
            },
            escuela: {
                deckName: 'Vocabulario escolar',
                flashcards: [
                    { word: 'Teacher',    translation: 'Maestro' },
                    { word: 'Student',    translation: 'Estudiante' },
                    { word: 'Homework',   translation: 'Tarea' },
                    { word: 'Exam',       translation: 'Examen' },
                    { word: 'Pencil',     translation: 'Lápiz' },
                    { word: 'Notebook',   translation: 'Cuaderno' },
                    { word: 'Library',    translation: 'Biblioteca' },
                    { word: 'Classroom',  translation: 'Salón de clases' },
                    { word: 'Grade',      translation: 'Calificación' },
                    { word: 'Recess',     translation: 'Recreo' },
                ],
            },
            frutas: {
                deckName: 'Frutas en inglés',
                flashcards: [
                    { word: 'Apple',      translation: 'Manzana' },
                    { word: 'Banana',     translation: 'Plátano' },
                    { word: 'Orange',     translation: 'Naranja' },
                    { word: 'Strawberry', translation: 'Fresa' },
                    { word: 'Watermelon', translation: 'Sandía' },
                    { word: 'Grape',      translation: 'Uva' },
                    { word: 'Pineapple',  translation: 'Piña' },
                    { word: 'Mango',      translation: 'Mango' },
                    { word: 'Lemon',      translation: 'Limón' },
                    { word: 'Peach',      translation: 'Durazno' },
                ],
            },
            comida: {
                deckName: 'Comidas y bebidas',
                flashcards: [
                    { word: 'Bread',     translation: 'Pan' },
                    { word: 'Rice',      translation: 'Arroz' },
                    { word: 'Chicken',   translation: 'Pollo' },
                    { word: 'Soup',      translation: 'Sopa' },
                    { word: 'Salad',     translation: 'Ensalada' },
                    { word: 'Dessert',   translation: 'Postre' },
                    { word: 'Breakfast', translation: 'Desayuno' },
                    { word: 'Lunch',     translation: 'Almuerzo' },
                    { word: 'Dinner',    translation: 'Cena' },
                    { word: 'Drink',     translation: 'Bebida' },
                ],
            },
            colores: {
                deckName: 'Los colores',
                flashcards: [
                    { word: 'Red',    translation: 'Rojo' },
                    { word: 'Blue',   translation: 'Azul' },
                    { word: 'Green',  translation: 'Verde' },
                    { word: 'Yellow', translation: 'Amarillo' },
                    { word: 'Purple', translation: 'Morado' },
                    { word: 'Orange', translation: 'Naranja' },
                    { word: 'Pink',   translation: 'Rosa' },
                    { word: 'Black',  translation: 'Negro' },
                    { word: 'White',  translation: 'Blanco' },
                    { word: 'Brown',  translation: 'Café' },
                ],
            },
        };

        for (const cat of categories) {
            await this.query(
                `INSERT INTO preset_categories (key, name, emoji, description, color) VALUES ($1, $2, $3, $4, $5)`,
                [cat.key, cat.name, cat.emoji, cat.description, cat.color],
            );

            const data = presetData[cat.key];
            const deckResult = await this.query(
                `INSERT INTO preset_decks (category_key, name) VALUES ($1, $2) RETURNING id`,
                [cat.key, data.deckName],
            );
            const deckId = deckResult.rows[0].id;

            for (const fc of data.flashcards) {
                await this.query(
                    `INSERT INTO preset_flashcards (deck_id, word, translation) VALUES ($1, $2, $3)`,
                    [deckId, fc.word, fc.translation],
                );
            }
        }

        console.log('✅ Tablas y datos de onboarding inicializados - database.service.ts');
    }
}
