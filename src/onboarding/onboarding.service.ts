import { Injectable } from '@nestjs/common';
import { OnboardingRepository } from './onboarding.repository';

@Injectable()
export class OnboardingService {
    constructor(private readonly onboardingRepository: OnboardingRepository) {}

    async getCategories() {
        return this.onboardingRepository.getCategories();
    }

    async completeOnboarding(userId: number, categoryKeys: string[]) {
        await this.onboardingRepository.completeOnboarding(userId, categoryKeys);
        return { message: 'Onboarding completado exitosamente' };
    }
}
