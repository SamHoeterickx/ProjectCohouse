import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UserService } from "../../../modules/user/user.service.js";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private readonly userService: UserService,
    ){
        const accessSecret = config.get<string>('JWT_ACCESS_SECRET');

        if(!accessSecret){
            throw new InternalServerErrorException('JWT_ACCESS_SECRET is not set');
        }

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: accessSecret
        });
    }

    async validate(payload: { sub: string; email: string }) {
        const user = await this.userService.findUserByUuid(
            payload.sub,
            undefined,
            { houseUser: { house: true } },
        );

        if(!user){
            throw new UnauthorizedException('Invalid token');
        }

        return user;
    }
}