// Transform our internal data models into PMS-ready payloads.
// For Opera OWS, this would map to XML elements.
export function mapPreferencesToPMSRequest(prefs: {
    floor_preference?: string;
    bed_type?: string;
    amenities?: string[];
}) {
    // Example: Opera expects <RoomPreferences><Floor>...</Floor>...
    return {
        FloorRequested: prefs.floor_preference || '',
        BedTypeRequested: prefs.bed_type || '',
        Amenities: prefs.amenities || [],
    };
}