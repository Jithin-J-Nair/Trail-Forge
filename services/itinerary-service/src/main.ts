/**
 * Itinerary Service scaffold.
 * Orchestrates: request -> discovery -> routing -> AI generation -> verification -> audit.
 */
export interface GenerateItineraryCommand {
  query: string;
  locale: string;
  userId?: string;
}

export async function generateItinerary(command: GenerateItineraryCommand) {
  return {
    itineraryId: crypto.randomUUID(),
    status: 'pending',
    query: command.query,
  };
}
