import { FindOptionsRelations, FindOptionsSelect, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ___ENTITY___
import { User } from './entity/user.entity.js';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>
    ){}

    public async findUserByEmail(email: string, select?: FindOptionsSelect<User>, relations?: FindOptionsRelations<User>) {
        return this.userRepository.findOne({
            where: { email },
            select,
            relations,
        });
    }

    public async findUserByUuid(uuid: string, select?: FindOptionsSelect<User>, relations?: FindOptionsRelations<User>) {
        return this.userRepository.findOne({
            where: { uuid },
            select,
            relations,
        });
    }

    public async createUser(data: { name: string; email: string; password: string }) {
        const user = this.userRepository.create(data);
        
        return this.userRepository.save(user);
    }

}
