import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CompleteQuizDto {
	@ApiProperty({ description: 'ID del usuario (ignorado — se usa el del token JWT)', required: false })
	@IsOptional()
	@IsInt({ message: 'userId debe ser un número entero' })
	@Min(1, { message: 'userId debe ser mayor a 0' })
	userId?: number;

	@ApiProperty({ description: 'Total de preguntas en el quiz', minimum: 1 })
	@IsInt({ message: 'totalQuestions debe ser un número entero' })
	@Min(1, { message: 'totalQuestions debe ser al menos 1' })
	totalQuestions: number;

	@ApiProperty({ description: 'Respuestas correctas', minimum: 0 })
	@IsInt({ message: 'correctAnswers debe ser un número entero' })
	@Min(0, { message: 'correctAnswers no puede ser negativo' })
	correctAnswers: number;

	@ApiProperty({ description: 'ID del deck (opcional)', required: false })
	@IsOptional()
	@IsInt({ message: 'deckId debe ser un número entero' })
	@Min(1, { message: 'deckId debe ser mayor a 0' })
	deckId?: number;

	@ApiProperty({ description: 'Fecha de finalización en formato ISO (opcional)', required: false, example: '2024-11-15T21:30:00.000Z' })
	@IsOptional()
	@IsString({ message: 'finishedAt debe ser una cadena de texto' })
	finishedAt?: string;

	@ApiProperty({ description: 'Desplazamiento de zona horaria en minutos (opcional)', required: false })
	@IsOptional()
	@IsInt({ message: 'timezoneOffsetMinutes debe ser un número entero' })
	timezoneOffsetMinutes?: number;

	@ApiProperty({ description: 'Tiempo en segundos invertido en el quiz (opcional)', required: false })
	@IsOptional()
	@IsInt({ message: 'timeSpentSeconds debe ser un número entero' })
	@Min(0, { message: 'timeSpentSeconds no puede ser negativo' })
	timeSpentSeconds?: number;
}