import { BadRequestException } from '@nestjs/common';

// ___UTILS___
import { allocateByWeights, splitByItems } from '../../shared/utils/split/split.util.js';

// ___CONST___
import { E_SPLIT_TYPE } from '../../shared/const/enum.js';

export interface ISplitParticipant {
    user_uuid: string;
    shares?: number;
    amount_in_cents?: number;
}

export interface ISplitItem {
    price: number;
    assigned_to: string[];
}

export interface IComputedSplit {
    user_uuid: string;
    amount_in_cents: number;
    shares: number | null;
}

/**
 * Computes who carries what.
 * `originalTotal` is the amount in the expense currency (used to validate EXACT splits),
 * `houseTotal` is the converted amount the splits must add up to.
 */
export function buildSplits(
    splitType: E_SPLIT_TYPE,
    originalTotal: number,
    houseTotal: number,
    participants: ISplitParticipant[] = [],
    items: ISplitItem[] = [],
): IComputedSplit[] {
    try {
        if (splitType === E_SPLIT_TYPE.ITEMS) {
            if (items.length === 0) {
                throw new Error('Items are required for the items split type');
            }

            const result = splitByItems(houseTotal, items.map((item) => ({
                price: item.price,
                userUuids: item.assigned_to,
            })));

            return [...result].map(([user_uuid, amount_in_cents]) => ({ user_uuid, amount_in_cents, shares: null }));
        }

        const unique = new Map(participants.map((participant) => [participant.user_uuid, participant]));
        if (unique.size !== participants.length) {
            throw new Error('Participants must be unique');
        }

        const sorted = [...unique.values()].sort((a, b) => a.user_uuid.localeCompare(b.user_uuid));
        if (sorted.length === 0) {
            throw new Error('At least one participant is required');
        }

        let weights: number[];

        switch (splitType) {
            case E_SPLIT_TYPE.EQUAL:
                weights = sorted.map(() => 1);
                break;
            case E_SPLIT_TYPE.SHARES:
                if (sorted.some((participant) => participant.shares === undefined)) {
                    throw new Error('Every participant needs shares for the shares split type');
                }
                weights = sorted.map((participant) => participant.shares!);
                break;
            case E_SPLIT_TYPE.EXACT: {
                if (sorted.some((participant) => participant.amount_in_cents === undefined)) {
                    throw new Error('Every participant needs amount_in_cents for the exact split type');
                }
                const sum = sorted.reduce((total, participant) => total + participant.amount_in_cents!, 0);
                if (sum !== originalTotal) {
                    throw new Error(`Exact amounts add up to ${sum}, expected ${originalTotal}`);
                }
                if (originalTotal === houseTotal) {
                    return sorted.map((participant) => ({
                        user_uuid: participant.user_uuid,
                        amount_in_cents: participant.amount_in_cents!,
                        shares: null,
                    }));
                }
                weights = sorted.map((participant) => participant.amount_in_cents!);
                break;
            }
            default:
                throw new Error(`Unknown split type: ${splitType}`);
        }

        const amounts = houseTotal === 0 ? sorted.map(() => 0) : allocateByWeights(houseTotal, weights);

        return sorted.map((participant, index) => ({
            user_uuid: participant.user_uuid,
            amount_in_cents: amounts[index],
            shares: splitType === E_SPLIT_TYPE.SHARES ? participant.shares! : null,
        }));
    } catch (error) {
        throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
}
