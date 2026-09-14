import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from 'bcrypt';

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
            { sub: uuid, email },
            { secret: this.JWT_REFRESH_SECRET, expiresIn: '7d' },
        );
    }

    public async verifyRefreshToken(token: string) {
        return this.jwtService.verifyAsync(token, {
            secret: this.JWT_REFRESH_SECRET,
        });
    }

    public async hashToken(token: string) {
        return bcrypt.hash(token, 10);
    }

    public async compareToken(token: string, hashed: string) {
        return bcrypt.compare(token, hashed);
    }
}