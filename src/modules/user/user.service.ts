import { FindOptionsRelations, FindOptionsSelect, Repository } from 'typeorm';
import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

// ___ENTITY___
import { User } from './entity/user.entity.js';

// ___SERVICE___
import { PasswordService } from '../../shared/utils/password/password.service.js';

// ___DTO___
import { UpdateUserDto } from './dto/update-user.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class UserService {

    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        private readonly passwordService: PasswordService,
    ){}

    public async findUserByEmail(email: string, select?: FindOptionsSelect<User>, relations?: FindOptionsRelations<User>) {
        return this.userRepository.findOne({
            where: { email: email.toLowerCase() },
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

    /** Includes the (normally unselected) refresh token hash. */
    public async findUserWithRefreshToken(uuid: string) {
        return this.userRepository.findOne({
            where: { uuid },
            select: { uuid: true, email: true, hashedRefreshToken: true },
        });
    }

    public async createUser(data: { name: string; email: string; password: string }) {
        const user = this.userRepository.create({ ...data, email: data.email.toLowerCase() });
        
        return this.userRepository.save(user);
    }

    public async setRefreshToken(uuid: string, hashedRefreshToken: string | null) {
        await this.userRepository.update(uuid, { hashedRefreshToken });
    }

    public async getMe(uuid: string) {
        const user = await this.findUserByUuid(uuid, undefined, { houseUser: { house: true } });

        if (!user) {
            throw new NotFoundException(`No user found with uuid: ${uuid}`);
        }

        return {
            message: 'User retrieved successfully',
            data: {
                uuid: user.uuid,
                name: user.name,
                email: user.email,
                houses: user.houseUser.map((membership) => ({
                    uuid: membership.house.uuid,
                    name: membership.house.name,
                    role: membership.role,
                })),
                created_at: user.created_at,
            },
        };
    }

    public async updateMe(uuid: string, dto: UpdateUserDto) {
        if (dto.email) {
            const existing = await this.findUserByEmail(dto.email, { uuid: true });
            if (existing && existing.uuid !== uuid) {
                throw new ConflictException('Email already in use');
            }
        }

        await this.userRepository.update(uuid, {
            ...(dto.name !== undefined ? { name: dto.name } : {}),
            ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        });

        return this.getMe(uuid);
    }

    public async changePassword(uuid: string, dto: ChangePasswordDto) {
        if (dto.newPassword !== dto.repeatPassword) {
            throw new ConflictException('Passwords dont match');
        }

        const user = await this.findUserByUuid(uuid, { uuid: true, password: true });
        if (!user || !(await this.passwordService.compare(dto.currentPassword, user.password))) {
            throw new UnauthorizedException('Current password is incorrect');
        }

        // Invalidate refresh tokens so other devices have to log in again.
        await this.userRepository.update(uuid, {
            password: await this.passwordService.hash(dto.newPassword),
            hashedRefreshToken: null,
        });

        return {
            message: 'Password changed successfully',
        };
    }

}
