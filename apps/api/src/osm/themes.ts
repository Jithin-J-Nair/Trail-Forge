import type { Theme } from '@trailforge/shared';

/** Overpass tag filters per tour theme — nwr + out center on the caller. */
export const THEME_OVERPASS: Record<Theme, string> = {
  culture: `(
  nwr["tourism"~"^(museum|attraction|artwork)$"](around:{radius},{lat},{lon});
  nwr["historic"](around:{radius},{lat},{lon});
  nwr["amenity"="place_of_worship"](around:{radius},{lat},{lon});
);`,
  food: `(
  nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten)$"](around:{radius},{lat},{lon});
  nwr["amenity"="marketplace"](around:{radius},{lat},{lon});
);`,
  nature: `(
  nwr["leisure"~"^(park|garden|nature_reserve)$"](around:{radius},{lat},{lon});
  nwr["natural"~"^(wood|water|peak)$"](around:{radius},{lat},{lon});
);`,
  shopping: `(
  nwr["shop"](around:{radius},{lat},{lon});
  nwr["tourism"](around:{radius},{lat},{lon});
  nwr["amenity"="marketplace"](around:{radius},{lat},{lon});
);`,
  nightlife: `(
  nwr["amenity"~"^(bar|pub|nightclub|biergarten)$"](around:{radius},{lat},{lon});
  nwr["tourism"="hostel"](around:{radius},{lat},{lon});
);`,
};

export const WALKABLE_HIGHWAYS =
  'motorway|trunk|primary|secondary|tertiary|residential|living_street|pedestrian|footway|path|cycleway|service';
