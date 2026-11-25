import type { Theme } from '@trailforge/shared';

/** Overpass tag filters per tour theme. */
export const THEME_OVERPASS: Record<Theme, string> = {
  culture: `(
  node["tourism"~"^(museum|attraction|artwork)$"](around:{radius},{lat},{lon});
  way["tourism"~"^(museum|attraction|artwork)$"](around:{radius},{lat},{lon});
  node["historic"](around:{radius},{lat},{lon});
  way["historic"](around:{radius},{lat},{lon});
  node["amenity"="place_of_worship"](around:{radius},{lat},{lon});
  way["amenity"="place_of_worship"](around:{radius},{lat},{lon});
);`,
  food: `(
  node["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten)$"](around:{radius},{lat},{lon});
  way["amenity"~"^(restaurant|cafe|fast_food|bar|pub|biergarten)$"](around:{radius},{lat},{lon});
  node["amenity"="marketplace"](around:{radius},{lat},{lon});
);`,
  nature: `(
  node["leisure"~"^(park|garden|nature_reserve)$"](around:{radius},{lat},{lon});
  way["leisure"~"^(park|garden|nature_reserve)$"](around:{radius},{lat},{lon});
  node["natural"~"^(wood|water|peak)$"](around:{radius},{lat},{lon});
  way["natural"~"^(wood|water)$"](around:{radius},{lat},{lon});
);`,
  shopping: `(
  node["shop"](around:{radius},{lat},{lon});
  way["shop"](around:{radius},{lat},{lon});
  node["amenity"="marketplace"](around:{radius},{lat},{lon});
);`,
  nightlife: `(
  node["amenity"~"^(bar|pub|nightclub|biergarten)$"](around:{radius},{lat},{lon});
  way["amenity"~"^(bar|pub|nightclub|biergarten)$"](around:{radius},{lat},{lon});
  node["tourism"="hostel"](around:{radius},{lat},{lon});
);`,
};

export const WALKABLE_HIGHWAYS =
  'motorway|trunk|primary|secondary|tertiary|residential|living_street|pedestrian|footway|path|cycleway|service';
