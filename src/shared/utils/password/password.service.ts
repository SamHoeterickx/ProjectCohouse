import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {

    private BCYRPT_SALT_ROUNDS: number;
    private BCRYPT_PEPPER: string;

    constructor(
        private readonly config: ConfigService
    ){
        const bcryptSaltRounds = Number(this.config.get('BCRYPT_SALT_ROUNDS', 10));
        const bcryptPepper = this.config.get<string>('BCRYPT_PEPPER');

        if(!bcryptSaltRounds){
            throw new InternalServerErrorException('BCRYPT_SALT_ROUNDS is not set')
        }
        
        if(!bcryptPepper){
            throw new InternalServerErrorException('BCRYPT_PEPPER is not set')
        }

        this.BCYRPT_SALT_ROUNDS = bcryptSaltRounds;
        this.BCRYPT_PEPPER = bcryptPepper;

    }

    public async hash(plain: string) {
        const rounds = this.BCYRPT_SALT_ROUNDS;
        const pepper = this.BCRYPT_PEPPER;
        return bcrypt.hash(plain + pepper, rounds);
    }

    public async compare(plain: string, hashed: string) {
        const pepper = this.BCRYPT_PEPPER;
        return bcrypt.compare(plain + pepper, hashed);
    }
}
