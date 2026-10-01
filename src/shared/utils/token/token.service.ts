import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { createHash, randomUUID, timingSafeEqual } from 'crypto';

@Injectable()
export class TokenService {

    private JWT_ACCESS_SECRET: string;
    private JWT_REFRESH_SECRET: string;

    constructor(
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
    ) {
        const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET');
        const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET');

        if(!accessSecret){
            throw new InternalServerErrorException('JWT_ACCESS_SECRET is not set')
        }

        if(!refreshSecret){
            throw new InternalServerErrorException('JWT_REFRESH_SECRET is not set')
        }

        this.JWT_ACCESS_SECRET = accessSecret;
        this.JWT_REFRESH_SECRET = refreshSecret;
    }

    public async generateAccessToken(uuid: string, email: string) {
        return this.jwtService.signAsync(
            { sub: uuid, email },
            { secret: this.JWT_ACCESS_SECRET, expiresIn: '15m' },
        );
    }

    public async generateRefreshToken(uuid: string, email: string) {
        return this.jwtService.signAsync(
            { sub: uuid, email, jti: randomUUID() },
            { secret: this.JWT_REFRESH_SECRET, expiresIn: '7d' },
        );
    }

    public async verifyRefreshToken(token: string) {
        return this.jwtService.verifyAsync(token, {
            secret: this.JWT_REFRESH_SECRET,
        });
    }

    // SHA-256 instead of bcrypt: bcrypt only looks at the first 72 bytes, which for a JWT is
    // the shared header + user id, so every refresh token of a user would match.
    public async hashToken(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }

    public async compareToken(token: string, hashed: string) {
        const candidate = Buffer.from(await this.hashToken(token), 'hex');
        const stored = Buffer.from(hashed, 'hex');

        return candidate.length === stored.length && timingSafeEqual(candidate, stored);
    }
}