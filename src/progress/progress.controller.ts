// src/progress/progress.controller.ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { CompleteQuizDto } from './interfaces/progress.interface';
import { CompleteQuizResponseEntity } from './entities/complete-quiz-response.entity';
import { TotalsEntity } from './entities/stats.entity';
import { QuizSessionEntity } from './entities/quiz-session.entity';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('Progress')
@Controller()
@UseGuards(JwtAuthGuard)
export class ProgressController {
    constructor(private readonly progressService: ProgressService) {}

    @Post('progress/quiz-complete')
    @ApiOperation({ summary: 'Registrar la finalización de un quiz y actualizar progreso' })
    @ApiResponse({ status: 201, type: CompleteQuizResponseEntity })
    async completeQuiz(
        @Req() req: any,
        @Body() body: CompleteQuizDto,
    ) {
        const userId = Number(req.user?.sub);
        return this.progressService.completeQuiz(userId, body);
    }

    @Get('users/:id/stats')
    @ApiOperation({ summary: 'Obtener estadísticas acumuladas del usuario' })
    @ApiResponse({ status: 200, type: TotalsEntity })
    getStats(@Req() req: any) {
        const userId = Number(req.user?.sub);
        return this.progressService.getStats(userId);
    }

    @Get('users/:id/quiz-sessions')
    @ApiOperation({ summary: 'Obtener sesiones de quiz recientes del usuario (paginado)' })
    @ApiResponse({ status: 200, type: [QuizSessionEntity] })
    getSessions(
        @Req() req: any,
        @Query('days') days?: string,
        @Query('limit') limit?: string,
    ) {
        const userId = Number(req.user?.sub);
        return this.progressService.getQuizSessions(
            userId,
            days ? Number(days) : undefined,
            limit ? Math.min(Number(limit), 100) : undefined,
        );
    }

    @Get('users/:id/achievements')
    @ApiOperation({ summary: 'Obtener el progreso y logros del usuario' })
    getAchievements(@Req() req: any) {
        const userId = Number(req.user?.sub);
        return this.progressService.getAchievements(userId);
    }
}
