export const GEMINI_OUTPUT_SCHEMA = {
    type: 'object',
    properties: {
        store_name: {
            type: 'string',
            description: 'VERPLICHT VELD. Naam van de winkel (bijv. Colruyt, Lidl). Als onleesbaar of ontbrekend, retourneer ALTIJD exact de string "Onbekende Winkel". Mag NOOIT null zijn.'
        },
        date: {
            type: 'string',
            description: 'VERPLICHT VELD. Datum op het ticket (DD/MM/YYYY). Als onleesbaar, retourneer "01/01/2000". Mag NOOIT null zijn.'
        },
        total_price: {
            type: 'integer',
            description: 'Total price of the receipt in CENTS.'
        },
        items: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Name of the item'
                    },
                    amount: {
                        type: 'integer',
                        description: 'Amount as a whole number. If the item is weighed (e.g., 0.345 kg), set amount to 1 (representing 1 package).'
                    },
                    price_per_unit: {
                        type: 'integer',
                        description: 'Original price for 1 of this item in CENTS. If weighed, this is the total original price of the package.'
                    },
                    discount_in_cents: {
                        type: 'integer',
                        description: 'The absolute discount value applied to this item in CENTS (0 if no discount).'
                    },
                    price: {
                        type: 'integer',
                        description: 'Final total price for this item in CENTS (calculated as: (amount * price_per_unit) - discount_in_cents).'
                    }
                },
                required: ['name', 'amount', 'price_per_unit', 'price']
            }
        }
    },
    required: ['store_name', 'date', 'total_price', 'items']
};

export const PROMPT = `
    Je bent een uiterst nauwkeurige data-extractie AI die gespecialiseerd is in Belgische kastickets (zoals Colruyt en Lidl).
    Extraheer alle boodschappen in het gevraagde JSON-formaat. 

    Let uiterst goed op de volgende strikte REGELS en EDGE CASES:

    0. GEEN NULL WAARDEN TOEGESTAAN (CRUCIAAL):
    Het doelsysteem crasht als het 'null' of lege velden ontvangt. Je mag NOOIT 'null' of 'undefined' retourneren voor de winkelnaam of de datum.
    - Kan je de winkel niet lezen of ontbreekt deze? Gebruik ALTIJD de fallback string: "Onbekende Winkel".
    - Kan je de datum niet lezen? Gebruik ALTIJD de fallback string: "01/01/2000".

    1. PRIJZEN IN CENTEN (INTEGERS):
    De backend accepteert enkel integers. Alle bedragen (total_price, price, price_per_unit) MOETEN worden omgezet naar CENTEN.
    - Voorbeeld: €22,87 wordt 2287.

    2. AANTALLEN ZIJN ALTIJD GEHELE GETALLEN:
    Het veld 'amount' mag geen kommagetal zijn. 
    - Als een product per gewicht wordt verkocht (bijv. "0,345 kg" chipolata of "0,555 kg" varkenshaasje), behandel dit dan als 1 verpakking ('amount': 1).

    3. KORTINGEN ZIJN GEKOPPELD AAN HET PRODUCT ERBOVEN:
    Kortingen staan op deze tickets vrijwel altijd op de regel DIRECT ONDER het product.
    - Koppel deze korting aan het artikel erboven. Plaats de absolute waarde in 'discount_in_cents'.
    - Trek deze korting af van de uiteindelijke 'price'.

    4. LEEGGOED/STATIEGELD:
    Als een artikel leeggoed/statiegeld heeft (aparte kolom of vermelding naast het artikel), tel dat bedrag op bij de 'price' van dat artikel (in CENTEN). Leeggoed hoort bij de kost van dat artikel, wordt niet apart bijgehouden.

    Lees het ticket zorgvuldig regel voor regel af.
`;