import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.error('REDIS_URL not found in environment variables');
      return;
    }

    this.client = new Redis(redisUrl);
    
    this.client.on('connect', () => {
      this.logger.log('Connected to Redis successfully');
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis connection error:', err);
    });
  }

  onModuleDestroy() {
    this.client.disconnect();
  }

  async setOtp(email: string, otp: string, ttlSeconds: number = 300) {
    const key = `otp:reset:${email}`;
    await this.client.set(key, otp, 'EX', ttlSeconds);
  }

  async getOtp(email: string): Promise<string | null> {
    const key = `otp:reset:${email}`;
    return this.client.get(key);
  }

  async deleteOtp(email: string) {
    const key = `otp:reset:${email}`;
    await this.client.del(key);
  }

  async incrementAttempts(email: string, ttlSeconds: number = 300): Promise<number> {
    const key = `otp:attempts:${email}`;
    const attempts = await this.client.incr(key);
    if (attempts === 1) {
      await this.client.expire(key, ttlSeconds);
    }
    return attempts;
  }

  async getAttempts(email: string): Promise<number> {
    const key = `otp:attempts:${email}`;
    const attempts = await this.client.get(key);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  async resetAttempts(email: string) {
    const key = `otp:attempts:${email}`;
    await this.client.del(key);
  }
}
