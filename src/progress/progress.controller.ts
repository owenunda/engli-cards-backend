// src/progress/progress.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CompleteQuizDto } from './interfaces/progress.interface';
import { CompleteQuizResponseEntity } from './entities/complete-quiz-response.entity';
import { TotalsEntity } from './entities/stats.entity';
import { QuizSessionEntity } from './entities/quiz-session.entity';

@ApiTags('Progress')
@Controller()
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    @Post('progress/quiz-complete')
    @ApiOperation({ summary: 'Registrar la finalización de un quiz y actualizar progreso' })
    @ApiResponse({ status: 201, type: CompleteQuizResponseEntity })
    async completeQuiz(
        // @Req() req: any,
        @Body() body: CompleteQuizDto,
    ) {
        // userId viene validado desde el DTO (temporal hasta implementar auth guard)
        return this.progressService.completeQuiz(body.userId, body);
    }

    // @UseGuards(JwtAuthGuard)
    @Get('users/:id/stats')
    @ApiOperation({ summary: 'Obtener estadísticas acumuladas del usuario' })
    @ApiResponse({ status: 200, type: TotalsEntity })
    getStats(@Param('id') id: string) {
        return this.progressService.getStats(Number(id));
    }

    // @UseGuards(JwtAuthGuard)
    @Get('users/:id/quiz-sessions')
    @ApiOperation({ summary: 'Obtener sesiones de quiz recientes del usuario' })
    @ApiResponse({ status: 200, type: [QuizSessionEntity] })
    getSessions(@Param('id') id: string, @Query('days') days?: string) {
        return this.progressService.getQuizSessions(Number(id), days ? Number(days) : undefined);
    }

    @Get('users/:id/achievements')
    @ApiOperation({ summary: 'Obtener el progreso y logros del usuario' })
    getAchievements(@Param('id') id: string) {
        return this.progressService.getAchievements(Number(id));
    }
}