import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OnboardingService } from './onboarding.service';
import { SelectCategoriesDto } from './dto/select-categories.dto';

@Controller('onboarding')
export class OnboardingController {
    constructor(private readonly onboardingService: OnboardingService) {}

    @Get('categories')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Obtener todas las categorías de onboarding disponibles' })
    @ApiResponse({ status: 200, description: 'Categorías obtenidas exitosamente.' })
    async getCategories() {
        return this.onboardingService.getCategories();
    }

    @Post('complete')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Completar onboarding: crear mazos predeterminados para el usuario' })
    @ApiResponse({ status: 201, description: 'Onboarding completado y mazos creados.' })
    async completeOnboarding(
        @Body() dto: SelectCategoriesDto,
        @Req() req: any,
    ) {
        const userId = Number(req.user?.sub);
        return this.onboardingService.completeOnboarding(userId, dto.categoryKeys);
    }
}
