export enum E_USER_ROLES {
    ADMIN = 'admin',
    MEMBER = 'member'
}

export enum E_SPLIT_TYPE {
    EQUAL = 'equal',
    SHARES = 'shares',
    EXACT = 'exact',
    ITEMS = 'items'
}

export enum E_EXPENSE_CATEGORY {
    GROCERIES = 'groceries',
    RENT = 'rent',
    UTILITIES = 'utilities',
    SUBSCRIPTIONS = 'subscriptions',
    HOUSEHOLD = 'household',
    RESTAURANT = 'restaurant',
    TRANSPORT = 'transport',
    ENTERTAINMENT = 'entertainment',
    OTHER = 'other'
}

export enum E_RECURRING_INTERVAL {
    WEEKLY = 'weekly',
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

export enum E_ACTIVITY_ACTION {
    HOUSE_CREATED = 'house_created',
    HOUSE_UPDATED = 'house_updated',
    MEMBER_JOINED = 'member_joined',
    MEMBER_LEFT = 'member_left',
    MEMBER_REMOVED = 'member_removed',
    MEMBER_ROLE_CHANGED = 'member_role_changed',
    EXPENSE_CREATED = 'expense_created',
    EXPENSE_UPDATED = 'expense_updated',
    EXPENSE_DELETED = 'expense_deleted',
    SETTLEMENT_CREATED = 'settlement_created',
    SETTLEMENT_DELETED = 'settlement_deleted',
    RECURRING_CREATED = 'recurring_created',
    RECURRING_UPDATED = 'recurring_updated',
    RECURRING_DELETED = 'recurring_deleted'
}
