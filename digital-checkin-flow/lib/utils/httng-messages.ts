// HTNG Guest Self-Service message types (simplified)
export interface HTNGCustomerInfo {
    GivenName: string;
    Surname: string;
    Email?: string;
    Phone?: string;
}

export interface HTNGIdentityDocument {
    DocumentType: string; // 'Passport', 'DriversLicense'
    DocumentNumber: string;
    IssuingCountry: string;
    ExpirationDate?: string;
    ImageURL?: string;
}

export function createGuestCheckInRequest(
    reservationId: string,
    customer: HTNGCustomerInfo,
    documents: HTNGIdentityDocument[]
) {
    return {
        CorrelationID: reservationId,
        Customer: customer,
        IdentityDocuments: documents,
    };
}