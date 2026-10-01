import { User } from '../../modules/user/entity/user.entity.js';

export interface IPublicUser {
    uuid: string;
    name: string;
}

export function toPublicUser(user: User | null | undefined): IPublicUser | null {
    if (!user) {
        return null;
    }

    return { uuid: user.uuid, name: user.name };
}
